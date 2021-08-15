/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ExternalIdP } from 'pToken';
import { toSToken } from 'sToken';
import { DocTypeStartPToken } from 'token';

import { makeDocTypeStart } from 'token-test';

import { ValidateState } from '../../common/validateState';
import { docTypeStartUpdateState } from '../docTypeStartUpdateState';

describe('docTypeStartUpdateState (unit)', () => {
   let state: ValidateState;

   beforeEach(async () => {
      state = new ValidateState({});
   });

   it('adds the docType name to the state', () => {
      const start = makeDocTypeStart();

      const newState = docTypeStartUpdateState(start, state);

      expect(newState).toEqual({
         ...state,
         docType: 'root',
         dtdContext: {
            enclosingStack: [start],
            inExternalMarkupContext: false,
            inExternalSubset: false,
         },
         hasExternalSubset: false,
      });
   });

   it('adds whether there is an external subset to the state', () => {
      const start = new DocTypeStartPToken({
         declType: toSToken('DOCTYPE'),
         externalId: new ExternalIdP({}),
         name: toSToken('root'),
         open: toSToken('<!'),
         openSubset: toSToken('['),
      });

      const newState = docTypeStartUpdateState(start, state);

      expect(newState.hasExternalSubset).toEqual(true);
   });
});
