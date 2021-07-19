/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { MockErrorCollector } from 'basic-test';
import { makeElementDeclaration, makeParameterEntityReference } from 'token-test';

import { conditionalStartValidate } from '../conditionalStartValidate';
import { ValidityError } from '../../error/ValidityError';
import { ElDeclType, ValidateState } from '../../validateState';
import { ConditionalPToken } from 'token';
import { toSToken } from 'sToken';

describe('conditionalStartValidate (unit)', () => {
   let mockErrorCollector: MockErrorCollector;
   let state: ValidateState;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();

      state = new ValidateState({
         elementContext: {
            activeContext: {
               declDetails: {
                  graph: { endId: 0, startId: 0, states: {} },
                  token: makeElementDeclaration(),
                  type: ElDeclType.ELEMENT,
               },
               parentName: 'foo',
               stateId: 0,
            },
            contextStack: [],
            pastEnd: false,
         },
      });
   });

   it('reports an error when in element content', () => {
      const peRef = makeParameterEntityReference();
      const conditional = new ConditionalPToken({
         open: toSToken('<!['),
         unexpanded: {
            includedBracket: true,
            peRef,
            propName: 'test',
         },
      });

      conditionalStartValidate(conditional, state, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: ValidityError.ID.CONDITIONAL_BAD_NESTING,
         lastPosition: undefined,
         params: ['entityName'],
         position: peRef.open,
      });
   });

   it('reports no error when there is no unexpanded', () => {
      const conditional = new ConditionalPToken({
         open: toSToken('<!['),
      });

      conditionalStartValidate(conditional, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports no error when we did not include the bracket', () => {
      const peRef = makeParameterEntityReference();
      const conditional = new ConditionalPToken({
         open: toSToken('<!['),
         unexpanded: {
            includedBracket: false,
            peRef,
            propName: 'test',
         },
      });

      conditionalStartValidate(conditional, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });
});
