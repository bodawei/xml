/* Copyright ® 2021-2026 by 柏大衛. All rights reserved. */

import {
   makeConditionalClose,
   makeConditionalStart,
   makeDocTypeStart,
   makeParameterEntityStart,
} from 'token-test';
import { describe, expect, it } from 'vitest';

import { ValidityState } from '../../common/validityState';
import { conditionalEndUpdateState } from '../conditionalEndUpdateState';

describe('conditionalEndUpdateState (unit)', () => {
   let state: ValidityState;

   it('removes back to before the start of the conditional section', () => {
      const start = makeDocTypeStart();
      state = new ValidityState({
         dtdContext: {
            enclosingStack: [makeParameterEntityStart(), makeConditionalStart(), start],
            inExternalMarkupContext: false,
            inExternalSubset: false,
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
      state = new ValidityState({
         dtdContext: {
            enclosingStack: [makeParameterEntityStart()],
            inExternalMarkupContext: false,
            inExternalSubset: false,
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
