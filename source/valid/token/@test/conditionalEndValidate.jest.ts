/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { MockErrorCollector } from 'basic-test';
import { toSToken } from 'sToken';
import { ConditionalEndPToken } from 'token';
import { makeConditionalStart, makeParameterEntityStart } from 'token-test';

import { ValidityState } from '../../common/validityState';
import { validCodes } from '../../error/validCodes';
import { conditionalEndValidate } from '../conditionalEndValidate';

const VID = validCodes.id;

describe('conditionalEndValidate (unit)', () => {
   let mockErrorCollector: MockErrorCollector;
   let state: ValidityState;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();

      state = new ValidityState({
         dtdContext: {
            enclosingStack: [makeParameterEntityStart()],
            inExternalMarkupContext: false,
            inExternalSubset: false,
            lastPToken: undefined,
         },
      });
   });

   describe('Proper conditional section/PE nesting (§3.4.0)', () => {
      it('reports an error when the previous thing in the enclosingStack is not a conditional start (§3.4.0)', () => {
         const conditional = new ConditionalEndPToken({
            open: toSToken('<!['),
         });

         conditionalEndValidate(conditional, state, mockErrorCollector);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportValidityError({
            id: VID.PEREF_INVALID_CONDITIONALSECTION_END_NESTING,
            lastPosition: undefined,
            params: [],
            position: conditional.open,
         });
      });

      it('reports an error when the enclosingStack is somehow empty (§3.4.0)', () => {
         state = new ValidityState({
            dtdContext: {
               enclosingStack: [],
               inExternalMarkupContext: false,
               inExternalSubset: false,
               lastPToken: undefined,
            },
         });
         const conditional = new ConditionalEndPToken({
            open: toSToken('<!['),
         });

         conditionalEndValidate(conditional, state, mockErrorCollector);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportValidityError({
            id: VID.PEREF_INVALID_CONDITIONALSECTION_END_NESTING,
            lastPosition: undefined,
            params: [],
            position: conditional.open,
         });
      });

      it('reports no error when the previous thing in the enclosingStack is a conditional start (§3.4.0)', () => {
         const conditional = new ConditionalEndPToken({
            open: toSToken('<!['),
         });
         state = new ValidityState({
            dtdContext: {
               enclosingStack: [makeConditionalStart()],
               inExternalMarkupContext: false,
               inExternalSubset: false,
               lastPToken: undefined,
            },
         });

         conditionalEndValidate(conditional, state, mockErrorCollector);

         expect(mockErrorCollector.errors).toEqual([]);
      });
   });
});
