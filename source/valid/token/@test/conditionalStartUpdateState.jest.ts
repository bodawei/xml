/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { makeConditionalSection } from 'token-test';

import { ValidateState } from '../../common/validateState';
import { conditionalStartUpdateState } from '../conditionalStartUpdateState';

describe('conditionalStartUpdateState (unit)', () => {
   let state: ValidateState;

   beforeEach(async () => {
      state = new ValidateState({});
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
