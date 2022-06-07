/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { makeExternalSubsetEnd } from 'token-test';

import { ValidityState } from '../../common/validityState';
import { externalSubsetEndUpdateState } from '../externalSubsetEndUpdateState';

describe('externalSubsetEndUpdateState (unit)', () => {
   let state: ValidityState;

   beforeEach(() => {
      state = new ValidityState();
   });

   it('sets inExternalSubset to true when called with the subset start token', () => {
      const extSubsetEnd = makeExternalSubsetEnd();

      const newState = externalSubsetEndUpdateState(extSubsetEnd, state);

      expect(newState).toEqual({
         ...state,
         dtdContext: {
            ...state.dtdContext,
            inExternalMarkupContext: false,
            inExternalSubset: false,
         },
      });
   });
});
