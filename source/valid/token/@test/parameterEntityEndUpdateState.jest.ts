/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ParameterEntityEndPToken, ParameterEntityStartPToken } from 'token';

import {
   makeDocTypeStart,
   makeParameterEntityReference,
   makeParameterEntityStart,
} from 'token-test';

import { ValidateState } from '../../validateState';
import { parameterEntityEndUpdateState } from '../parameterEntityEndUpdateState';

describe('parameterEntityEndUpdateState (unit)', () => {
   let state: ValidateState;

   beforeEach(async () => {});

   it('removes back to before the start of the enclosingStack', () => {
      const ref = makeParameterEntityReference();
      const start = new ParameterEntityStartPToken(ref);
      const end = new ParameterEntityEndPToken(ref);
      state = new ValidateState({
         dtdContext: {
            enclosingStack: [makeParameterEntityStart(), start],
         },
      });

      const newState = parameterEntityEndUpdateState(end, state);

      expect(newState).toEqual({
         ...state,
         dtdContext: {
            enclosingStack: [makeParameterEntityStart()],
         },
      });
   });

   it('removes intervening items if needed', () => {
      const ref = makeParameterEntityReference();
      const ref2 = makeParameterEntityReference();
      const start = new ParameterEntityStartPToken(ref);
      const start2 = new ParameterEntityStartPToken(ref2);
      const end = new ParameterEntityEndPToken(ref);
      state = new ValidateState({
         dtdContext: {
            enclosingStack: [makeParameterEntityStart(), start, start2],
         },
      });

      const newState = parameterEntityEndUpdateState(end, state);

      expect(newState).toEqual({
         ...state,
         dtdContext: {
            enclosingStack: [makeParameterEntityStart()],
         },
      });
   });

   it('does not change the enclosingStack state property if there is no start in the stack', () => {
      const ref = makeParameterEntityReference();
      const end = new ParameterEntityEndPToken(ref);
      state = new ValidateState({
         dtdContext: {
            enclosingStack: [makeDocTypeStart()],
         },
      });

      const newState = parameterEntityEndUpdateState(end, state);

      expect(newState).toEqual({
         ...state,
         dtdContext: {
            enclosingStack: [makeDocTypeStart()],
         },
      });
   });
});
