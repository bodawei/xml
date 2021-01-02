/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ParameterEntityDeclarationPToken } from 'pToken';
import { toSToken } from 'sToken';
import { makeParameterEntityDeclaration } from 'token-test';

import { ElidedEntityDeclarationPToken } from 'token';

import { ValidateState } from '../../validateState';
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

   it('adds a elided token to the state', () => {
      const elided = new ElidedEntityDeclarationPToken(paramDecl, paramDecl.value as any); // typehack
      const nextState = parameterEntityDeclarationUpdateState(paramDecl, state);

      const result = elidedEntityDeclarationUpdateState(elided, nextState);

      expect(result).toEqual(
         new ValidateState({
            parameterEntities: {
               entityName: {
                  isInternal: true,
                  token: paramDecl,
                  replacementText: elided,
               },
            },
         }),
      );
   });

   it('adds a elided token to the state', () => {
      const other = new ParameterEntityDeclarationPToken({
         open: toSToken('<!'),
         name: toSToken('entityName'),
         externalId: {},
      });
      const elided = new ElidedEntityDeclarationPToken(other, paramDecl.value as any); // typehack
      const nextState = parameterEntityDeclarationUpdateState(paramDecl, state);

      const result = elidedEntityDeclarationUpdateState(elided, nextState);

      expect(result).toEqual(
         new ValidateState({
            parameterEntities: {
               entityName: {
                  isInternal: true,
                  token: paramDecl,
                  replacementText: new ElidedEntityDeclarationPToken(
                     paramDecl,
                     paramDecl.value as any,
                  ), // typehack,
               },
            },
         }),
      );
   });
});
