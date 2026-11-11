/* Copyright ® 2021-2026 by 柏大衛. All rights reserved. */

import { makeConditionalStart } from 'token-test';
import { describe, expect, it } from 'vitest';

import { ValidityState } from '../../common/validityState';
import { conditionalStartUpdateState } from '../conditionalStartUpdateState';

describe('conditionalStartUpdateState (unit)', () => {
   it('adds the conditional start to the state', () => {
      const state = new ValidityState({});
      const start = makeConditionalStart();

      const newState = conditionalStartUpdateState(start, state);

      expect(newState).toEqual({
         ...state,
         dtdContext: {
            enclosingStack: [start],
            inExternalMarkupContext: false,
            inExternalSubset: false,
         },
      });
   });
});
