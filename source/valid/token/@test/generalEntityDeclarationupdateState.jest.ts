/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { GeneralEntityDeclarationPToken } from 'pToken';
import { makeGeneralEntityDeclaration } from 'token-test';

import { ValidateState } from '../../validateState';
import { generalEntityDeclarationUpdateState } from '../generalEntityDeclarationUpdateState';

describe('generalEntityDeclarationUpdateState (unit)', () => {
   let state: ValidateState;

   beforeEach(async () => {
      state = new ValidateState();
   });

   it('adds a declaration to the state', () => {
      const decl = makeGeneralEntityDeclaration();

      const result = generalEntityDeclarationUpdateState(decl, state);

      expect(result).toEqual(
         new ValidateState({
            generalEntities: {
               geDecl: {
                  isExternalMarkupDeclaration: false,
                  isInternalValue: true,
                  token: decl,
               },
            },
         }),
      );
   });

   it('marks a declaration as isExternalMarkupDeclaration when the state is in external markup', () => {
      const decl = makeGeneralEntityDeclaration();
      state = new ValidateState({
         dtdContext: {
            enclosingStack: [],
            inExternalMarkupContext: true,
         },
      });

      const result = generalEntityDeclarationUpdateState(decl, state);

      expect(result).toEqual(
         new ValidateState({
            dtdContext: {
               enclosingStack: [],
               inExternalMarkupContext: true,
            },
            generalEntities: {
               geDecl: {
                  isExternalMarkupDeclaration: true,
                  isInternalValue: true,
                  token: decl,
               },
            },
         }),
      );
   });

   it('marks a declaration as external if it has an ExternalId', () => {
      const decl = new GeneralEntityDeclarationPToken(makeGeneralEntityDeclaration(), {
         externalId: {},
      });

      const result = generalEntityDeclarationUpdateState(decl, state);

      expect(result).toEqual(
         new ValidateState({
            generalEntities: {
               geDecl: {
                  isExternalMarkupDeclaration: false,
                  isInternalValue: false,
                  token: decl,
               },
            },
         }),
      );
   });

   it('ignores subsequent additions', () => {
      const decl = makeGeneralEntityDeclaration();
      const decl2 = new GeneralEntityDeclarationPToken(decl, {
         externalId: {},
      });

      const state1 = generalEntityDeclarationUpdateState(decl, state);
      const result = generalEntityDeclarationUpdateState(decl2, state1);

      expect(result).toEqual(
         new ValidateState({
            generalEntities: {
               geDecl: {
                  isExternalMarkupDeclaration: false,
                  isInternalValue: true,
                  token: decl,
               },
            },
         }),
      );
   });
});
