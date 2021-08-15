/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { makeExternalSubsetStart } from 'token-test';

import { ValidateState } from '../../common/validateState';
import { externalSubsetStartUpdateState } from '../externalSubsetStartUpdateState';

describe('externalSubsetStartUpdateState (unit)', () => {
   let state: ValidateState;

   beforeEach(async () => {
      state = new ValidateState();
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
