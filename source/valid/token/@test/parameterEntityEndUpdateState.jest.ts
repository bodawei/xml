/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ParameterEntityEndPToken, ParameterEntityStartPToken } from 'token';
import {
   makeDocTypeStart,
   makeParameterEntityReference,
   makeParameterEntityStart,
} from 'token-test';

import { ValidityState } from '../../common/validityState';
import { parameterEntityEndUpdateState } from '../parameterEntityEndUpdateState';

describe('parameterEntityEndUpdateState (unit)', () => {
   let state: ValidityState;

   it('removes back to before the start of the enclosingStack', () => {
      const ref = makeParameterEntityReference();
      const start = new ParameterEntityStartPToken(ref);
      const end = new ParameterEntityEndPToken(ref);
      state = new ValidityState({
         dtdContext: {
            enclosingStack: [makeParameterEntityStart(), start],
            inExternalMarkupContext: false,
            inExternalSubset: false,
         },
      });

      const newState = parameterEntityEndUpdateState(end, state);

      expect(newState).toEqual({
         ...state,
         dtdContext: {
            enclosingStack: [makeParameterEntityStart()],
            inExternalMarkupContext: true,
            inExternalSubset: false,
         },
      });
   });

   it('removes intervening items if needed', () => {
      const ref = makeParameterEntityReference();
      const ref2 = makeParameterEntityReference();
      const start = new ParameterEntityStartPToken(ref);
      const start2 = new ParameterEntityStartPToken(ref2);
      const end = new ParameterEntityEndPToken(ref);
      state = new ValidityState({
         dtdContext: {
            enclosingStack: [makeParameterEntityStart(), start, start2],
            inExternalMarkupContext: false,
            inExternalSubset: false,
         },
      });

      const newState = parameterEntityEndUpdateState(end, state);

      expect(newState).toEqual({
         ...state,
         dtdContext: {
            enclosingStack: [makeParameterEntityStart()],
            inExternalMarkupContext: true,
            inExternalSubset: false,
         },
      });
   });

   it('does not change the enclosingStack state property if there is no start in the stack', () => {
      const ref = makeParameterEntityReference();
      const end = new ParameterEntityEndPToken(ref);
      state = new ValidityState({
         dtdContext: {
            enclosingStack: [makeDocTypeStart()],
            inExternalMarkupContext: false,
            inExternalSubset: false,
         },
      });

      const newState = parameterEntityEndUpdateState(end, state);

      expect(newState).toEqual({
         ...state,
         dtdContext: {
            enclosingStack: [makeDocTypeStart()],
            inExternalMarkupContext: false,
            inExternalSubset: false,
         },
      });
   });

   it('marks as not in external markup context when not in external subset and there are no more parameter entity starts on the stack', () => {
      const ref = makeParameterEntityReference();
      const start = new ParameterEntityStartPToken(ref);
      const end = new ParameterEntityEndPToken(ref);
      state = new ValidityState({
         dtdContext: {
            enclosingStack: [start],
            inExternalMarkupContext: true,
            inExternalSubset: false,
         },
      });

      const newState = parameterEntityEndUpdateState(end, state);

      expect(newState).toEqual({
         ...state,
         dtdContext: {
            enclosingStack: [],
            inExternalMarkupContext: false,
            inExternalSubset: false,
         },
      });
   });

   it('marks as in external markup context when in external subset but there are no more parameter entity starts on the stack', () => {
      const ref = makeParameterEntityReference();
      const start = new ParameterEntityStartPToken(ref);
      const end = new ParameterEntityEndPToken(ref);
      state = new ValidityState({
         dtdContext: {
            enclosingStack: [start],
            inExternalMarkupContext: false,
            inExternalSubset: true,
         },
      });

      const newState = parameterEntityEndUpdateState(end, state);

      expect(newState).toEqual({
         ...state,
         dtdContext: {
            enclosingStack: [],
            inExternalMarkupContext: true,
            inExternalSubset: true,
         },
      });
   });
});
