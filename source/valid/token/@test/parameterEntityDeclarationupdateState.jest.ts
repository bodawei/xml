/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ParameterEntityDeclarationPToken } from 'pToken';
import { makeParameterEntityDeclaration } from 'token-test';

import { ValidityState } from '../../common/validityState';
import { parameterEntityDeclarationUpdateState } from '../parameterEntityDeclarationUpdateState';

describe('parameterEntityDeclarationUpdateState (unit)', () => {
   let state: ValidityState;

   beforeEach(() => {
      state = new ValidityState();
   });

   it('adds a declaration to the state', () => {
      const decl = makeParameterEntityDeclaration();

      const result = parameterEntityDeclarationUpdateState(decl, state);

      expect(result).toEqual(
         new ValidityState({
            parameterEntities: {
               entityName: {
                  isExternalMarkupDeclaration: false,
                  isInternalValue: true,
                  replacementText: decl.value, // typehack
                  token: decl,
               },
            },
         }),
      );
   });

   it('marks a declaration as external if it has an ExternalId', () => {
      const decl = new ParameterEntityDeclarationPToken(makeParameterEntityDeclaration(), {
         externalId: {},
      });

      const result = parameterEntityDeclarationUpdateState(decl, state);

      expect(result).toEqual(
         new ValidityState({
            parameterEntities: {
               entityName: {
                  isExternalMarkupDeclaration: false,
                  isInternalValue: false,
                  replacementText: decl.value,
                  token: decl,
               },
            },
         }),
      );
   });

   it('marks a declaration as external an external markup declaration if this is currently in external markup', () => {
      const decl = makeParameterEntityDeclaration();
      state = new ValidityState({
         dtdContext: {
            enclosingStack: [],
            inExternalMarkupContext: true,
            inExternalSubset: false,
         },
      });

      const result = parameterEntityDeclarationUpdateState(decl, state);

      expect(result).toEqual(
         new ValidityState({
            dtdContext: {
               enclosingStack: [],
               inExternalMarkupContext: true,
               inExternalSubset: false,
            },
            parameterEntities: {
               entityName: {
                  isExternalMarkupDeclaration: true,
                  isInternalValue: true,
                  replacementText: decl.value,
                  token: decl,
               },
            },
         }),
      );
   });

   it('ignores subsequent additions', () => {
      const decl = makeParameterEntityDeclaration();
      const decl2 = new ParameterEntityDeclarationPToken(decl, {
         externalId: {},
      });

      const state1 = parameterEntityDeclarationUpdateState(decl, state);
      const result = parameterEntityDeclarationUpdateState(decl2, state1);

      expect(result).toEqual(
         new ValidityState({
            parameterEntities: {
               entityName: {
                  isExternalMarkupDeclaration: false,
                  isInternalValue: true,
                  replacementText: decl.value, // typehack
                  token: decl,
               },
            },
         }),
      );
   });
});
