/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { AttListDeclarationPToken } from 'pToken';
import { toSToken } from 'sToken';
import { makeAttListDeclaration } from 'token-test';

import { ValidateState } from '../../validateState';
import { attListDeclarationUpdateState } from '../attListDeclarationUpdateState';

describe('attListDeclarationUpdateState (unit)', () => {
   let state: ValidateState;

   beforeEach(async () => {
      state = new ValidateState();
   });

   it('adds attributes from the ATTLIST declaration into the state', () => {
      const attListDecl = makeAttListDeclaration();

      const newState = attListDeclarationUpdateState(attListDecl, state);

      expect(newState).toEqual({
         ...state,
         attributeDefs: {
            elStart: {
               att1: {
                  def: attListDecl.attDefs[0],
                  isExternal: false,
               },
            },
         },
      });
   });

   it('adds multiple attributes from the ATTLIST declaration into the state', () => {
      const def1 = { name: toSToken('foo'), value: [] };
      const def2 = { name: toSToken('bar'), value: [] };
      const base = makeAttListDeclaration();
      const attListDecl = new AttListDeclarationPToken(base, {
         attDefs: [def1, def2],
      });

      const newState = attListDeclarationUpdateState(attListDecl, state);

      expect(newState).toEqual({
         ...state,
         attributeDefs: {
            elStart: {
               foo: {
                  def: def1,
                  isExternal: false,
               },
               bar: {
                  def: def2,
                  isExternal: false,
               },
            },
         },
      });
   });

   it('ignores second occurrences of an attribute with the same name', () => {
      const def1a = { name: toSToken('foo'), value: [] };
      const def1b = { name: toSToken('foo'), nameSpace: toSToken(' '), value: [] };
      const def2 = { name: toSToken('bar'), value: [] };
      const base = makeAttListDeclaration();
      const attListDecl = new AttListDeclarationPToken(base, {
         attDefs: [def1a],
      });
      const second = makeAttListDeclaration();
      const attListDeclTwo = new AttListDeclarationPToken(second, {
         attDefs: [def1b, def2],
      });

      const firstState = attListDeclarationUpdateState(attListDecl, state);
      const newState = attListDeclarationUpdateState(attListDeclTwo, firstState);

      expect(newState).toEqual({
         ...state,
         attributeDefs: {
            elStart: {
               foo: {
                  def: def1a,
                  isExternal: false,
               },
               bar: {
                  def: def2,
                  isExternal: false,
               },
            },
         },
      });
   });

   it('marks attributes that are added while in the external subset as such in the state', () => {
      const def1a = { name: toSToken('foo'), value: [] };
      const def1b = { name: toSToken('foo'), nameSpace: toSToken(' '), value: [] };
      const def2 = { name: toSToken('bar'), value: [] };
      const base = makeAttListDeclaration();
      const attListDecl = new AttListDeclarationPToken(base, {
         attDefs: [def1a],
      });
      const second = makeAttListDeclaration();
      const attListDeclTwo = new AttListDeclarationPToken(second, {
         attDefs: [def1b, def2],
      });
      const firstState = new ValidateState({ ...state, inExternalSubset: true });
      const secondState = attListDeclarationUpdateState(attListDecl, firstState);
      const thirdState = new ValidateState({ ...secondState, inExternalSubset: false });

      const newState = attListDeclarationUpdateState(attListDeclTwo, thirdState);

      expect(newState).toEqual({
         ...state,
         attributeDefs: {
            elStart: {
               foo: {
                  def: attListDecl.attDefs[0],
                  isExternal: true, // <-- here
               },
               bar: {
                  def: attListDeclTwo.attDefs[1],
                  isExternal: false,
               },
            },
         },
      });
   });
});
