/* Copyright ® 2021-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { ExternalIdP } from 'pToken';
import { DocTypeStartPToken } from 'token';
import { makeDocTypeStart } from 'token-test';
import { describe, expect, it } from 'vitest';

import { ValidityState } from '../../common/validityState';
import { docTypeStartUpdateState } from '../docTypeStartUpdateState';

describe('docTypeStartUpdateState (unit)', () => {
   it('adds the docType name to the state', () => {
      const state = new ValidityState({});
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
      const state = new ValidityState({});
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
