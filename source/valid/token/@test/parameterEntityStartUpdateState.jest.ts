/* Copyright ® 2021-2026 by 柏大衛. All rights reserved. */

import { makeParameterEntityStart } from 'token-test';
import { describe, expect, it } from 'vitest';

import { ValidityState } from '../../common/validityState';
import { parameterEntityStartUpdateState } from '../parameterEntityStartUpdateState';

describe('parameterEntityStartUpdateState (unit)', () => {
   let state: ValidityState;

   beforeEach(() => {
      state = new ValidityState({});
   });

   it('adds the ptoken name to the enclosingStack', () => {
      const start = makeParameterEntityStart();

      const newState = parameterEntityStartUpdateState(start, state);

      expect(newState).toEqual({
         ...state,
         dtdContext: {
            enclosingStack: [start],
            inExternalMarkupContext: true,
            inExternalSubset: false,
         },
         hasPeRefs: true,
      });
   });
});
