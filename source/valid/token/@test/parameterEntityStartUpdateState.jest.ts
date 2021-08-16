/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { makeParameterEntityStart } from 'token-test';

import { ValidityState } from '../../common/validityState';
import { parameterEntityStartUpdateState } from '../parameterEntityStartUpdateState';

describe('parameterEntityStartUpdateState (unit)', () => {
   let state: ValidityState;

   beforeEach(async () => {
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
