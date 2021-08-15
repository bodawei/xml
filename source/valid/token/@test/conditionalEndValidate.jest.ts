/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { MockErrorCollector } from 'basic-test';
import { toSToken } from 'sToken';
import { ConditionalClosePToken } from 'token';
import { makeConditionalSection, makeParameterEntityStart } from 'token-test';

import { validCodes } from '../../error/validCodes';
import { ValidateState } from '../../common/validateState';
import { conditionalEndValidate } from '../conditionalEndValidate';

const VID = validCodes.id;

describe('conditionalEndValidate (unit)', () => {
   let mockErrorCollector: MockErrorCollector;
   let state: ValidateState;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();

      state = new ValidateState({
         dtdContext: {
            enclosingStack: [makeParameterEntityStart()],
         },
      });
   });

   it('reports an error when the previous thing in the enclosingStack is not a conditional start', () => {
      const conditional = new ConditionalClosePToken({
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

   it('reports no error when the previous thing in the enclosingStack is a conditional start', () => {
      const conditional = new ConditionalClosePToken({
         open: toSToken('<!['),
      });
      state = new ValidateState({
         dtdContext: {
            enclosingStack: [makeConditionalSection()],
         },
      });

      conditionalEndValidate(conditional, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });
});
