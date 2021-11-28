/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { makeDocTypeEnd, makeDocTypeStart, makeParameterEntityStart } from 'token-test';

import { ValidityState } from '../../common/validityState';
import { docTypeEndUpdateState } from '../docTypeEndUpdateState';

describe('docTypeEndUpdateState (unit)', () => {
   let state: ValidityState;

   it('removes back to before the start of the enclosingStack', () => {
      const start = makeDocTypeStart();
      const end = makeDocTypeEnd();
      state = new ValidityState({
         dtdContext: {
            enclosingStack: [makeParameterEntityStart(), start],
            inExternalMarkupContext: false,
            inExternalSubset: false,
         },
      });

      const newState = docTypeEndUpdateState(end, state);

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
      const end = makeDocTypeEnd();
      state = new ValidityState({
         docType: 'foo',
         dtdContext: {
            enclosingStack: [makeParameterEntityStart()],
            inExternalMarkupContext: false,
            inExternalSubset: false,
         },
      });

      const newState = docTypeEndUpdateState(end, state);

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
