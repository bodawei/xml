/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { makeConditionalSection } from 'token-test';

import { ValidityState } from '../../common/validityState';
import { conditionalStartUpdateState } from '../conditionalStartUpdateState';

describe('conditionalStartUpdateState (unit)', () => {
   let state: ValidityState;

   beforeEach(async () => {
      state = new ValidityState({});
   });

   it('adds the conditional start to the state', () => {
      const start = makeConditionalSection();

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
