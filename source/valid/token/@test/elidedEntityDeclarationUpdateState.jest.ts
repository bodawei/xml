/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ParameterEntityDeclarationPToken } from 'pToken';
import { toSToken } from 'sToken';
import { ElidedEntityDeclarationPToken } from 'token';
import { makeParameterEntityDeclaration } from 'token-test';

import { ValidityState } from '../../common/validityState';
import { elidedEntityDeclarationUpdateState } from '../elidedEntityDeclarationUpdateState';
import { parameterEntityDeclarationUpdateState } from '../parameterEntityDeclarationUpdateState';

describe('elidedEntityDeclarationUpdateState (unit)', () => {
   let state: ValidityState;
   let paramDecl: ParameterEntityDeclarationPToken;

   beforeEach(() => {
      paramDecl = makeParameterEntityDeclaration();
      state = new ValidityState();
   });

   it('adds an elided token to the state', () => {
      const elided = new ElidedEntityDeclarationPToken(paramDecl, paramDecl.value);
      const nextState = parameterEntityDeclarationUpdateState(paramDecl, state);

      const result = elidedEntityDeclarationUpdateState(elided, nextState);

      expect(result).toEqual(
         new ValidityState({
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

   it('does not add the elided entity if there was not a previous parameter entity declaration there to update', () => {
      const elided = new ElidedEntityDeclarationPToken(paramDecl, paramDecl.value);

      const result = elidedEntityDeclarationUpdateState(elided, state);

      expect(result).toEqual(new ValidityState());
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
         new ValidityState({
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
