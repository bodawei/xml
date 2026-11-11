/* Copyright ® 2020-2026 by 柏大衛. All rights reserved. */

import { makeExternalSubsetStart } from 'token-test';
import { describe, expect, it } from 'vitest';

import { ValidityState } from '../../common/validityState';
import { externalSubsetStartUpdateState } from '../externalSubsetStartUpdateState';

describe('externalSubsetStartUpdateState (unit)', () => {
   let state: ValidityState;

   beforeEach(() => {
      state = new ValidityState();
   });

   it('sets inExternalSubset to true when called with the subset start token', () => {
      const extSubsetStart = makeExternalSubsetStart();

      const newState = externalSubsetStartUpdateState(extSubsetStart, state);

      expect(newState).toEqual({
         ...state,
         dtdContext: {
            ...state.dtdContext,
            inExternalMarkupContext: true,
            inExternalSubset: true,
         },
      });
   });
});
