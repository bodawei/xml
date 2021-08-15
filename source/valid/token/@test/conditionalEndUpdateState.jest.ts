/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import {
   makeConditionalClose,
   makeConditionalSection,
   makeDocTypeStart,
   makeParameterEntityStart,
} from 'token-test';

import { ValidateState } from '../../common/validateState';
import { conditionalEndUpdateState } from '../conditionalEndUpdateState';

describe('conditionalEndUpdateState (unit)', () => {
   let state: ValidateState;

   beforeEach(async () => {});

   it('removes back to before the start of the conditional section', () => {
      const start = makeDocTypeStart();
      state = new ValidateState({
         dtdContext: {
            enclosingStack: [makeParameterEntityStart(), makeConditionalSection(), start],
         },
      });

      const newState = conditionalEndUpdateState(makeConditionalClose(), state);

      expect(newState).toEqual({
         ...state,
         dtdContext: {
            enclosingStack: [makeParameterEntityStart()],
            inExternalMarkupContext: false,
            inExternalSubset: false,
         },
      });
   });

   it('does not change the enclosingStack state property if there is no start in the stack', () => {
      state = new ValidateState({
         dtdContext: {
            enclosingStack: [makeParameterEntityStart()],
         },
      });

      const newState = conditionalEndUpdateState(makeConditionalClose(), state);

      expect(newState).toEqual({
         ...state,
         dtdContext: {
            enclosingStack: [makeParameterEntityStart()],
            inExternalMarkupContext: false,
            inExternalSubset: false,
         },
      });
   });
});
