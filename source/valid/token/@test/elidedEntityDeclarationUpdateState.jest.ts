/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ParameterEntityDeclarationPToken } from 'pToken';
import { toSToken } from 'sToken';
import { makeParameterEntityDeclaration } from 'token-test';

import { ElidedEntityDeclarationPToken } from 'token';

import { ValidateState } from '../../common/validateState';
import { elidedEntityDeclarationUpdateState } from '../elidedEntityDeclarationUpdateState';
import { parameterEntityDeclarationUpdateState } from '../parameterEntityDeclarationUpdateState';

describe('elidedEntityDeclarationUpdateState (unit)', () => {
   let state: ValidateState;
   let paramDecl: ParameterEntityDeclarationPToken;
   // new ParameterEntityDeclarationPToken({ open: toSToken('<!') })

   beforeEach(async () => {
      paramDecl = makeParameterEntityDeclaration();
      state = new ValidateState();
   });

   it('adds an elided token to the state', () => {
      const elided = new ElidedEntityDeclarationPToken(paramDecl, paramDecl.value); // typehack
      const nextState = parameterEntityDeclarationUpdateState(paramDecl, state);

      const result = elidedEntityDeclarationUpdateState(elided, nextState);

      expect(result).toEqual(
         new ValidateState({
            parameterEntities: {
               entityName: {
                  isExternalMarkupDeclaration: false,
                  isInternalValue: true,
                  replacementText: paramDecl.value,
                  token: paramDecl,
               },
            },
         }),
      );
   });

   it('adds an elided token to the state for an external parameter entity', () => {
      const other = new ParameterEntityDeclarationPToken({
         externalId: {},
         name: toSToken('entityName'),
         open: toSToken('<!'),
      });
      const elided = new ElidedEntityDeclarationPToken(other, other.value);
      const nextState = parameterEntityDeclarationUpdateState(other, state);

      const result = elidedEntityDeclarationUpdateState(elided, nextState);

      expect(result).toEqual(
         new ValidateState({
            parameterEntities: {
               entityName: {
                  isExternalMarkupDeclaration: false,
                  isInternalValue: false,
                  replacementText: other.value,
                  token: other,
               },
            },
         }),
      );
   });
});
