/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { MockErrorCollector } from 'basic-test';
import { makeElementDeclaration, makeParameterEntityReference } from 'token-test';

import { conditionalValidate } from '../conditionalValidate';
import { ValidityError } from '../../error/ValidityError';
import { ElDeclType, ValidateState } from '../../validateState';
import { ConditionalPToken } from 'token';
import { toSToken } from 'sToken';

describe('conditionalValidate (unit)', () => {
   let mockErrorCollector: MockErrorCollector;
   let state: ValidateState;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();

      state = new ValidateState({
         elementContext: {
            activeContext: {
               declDetails: {
                  token: makeElementDeclaration(),
                  type: ElDeclType.CHILDREN,
                  graph: { startId: 0, endId: 0, states: {} },
               },
               parentName: 'foo',
               stateId: 0,
            },
            pastEnd: false,
            contextStack: [],
         },
      });
   });

   it('reports an error when in element content', () => {
      const peRef = makeParameterEntityReference();
      const conditional = new ConditionalPToken({
         open: toSToken('<!['),
         unexpanded: {
            peRef,
            includedBracket: true,
         },
      });

      conditionalValidate(conditional, state, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: ValidityError.ID.CONDITIONAL_BAD_NESTING,
         params: ['entityName'],
         position: peRef.open,
         lastPosition: undefined,
      });
   });

   it('reports no error when there is no unexpanded', () => {
      const conditional = new ConditionalPToken({
         open: toSToken('<!['),
      });

      conditionalValidate(conditional, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports no error when we did not include the bracket', () => {
      const peRef = makeParameterEntityReference();
      const conditional = new ConditionalPToken({
         open: toSToken('<!['),
         unexpanded: {
            peRef,
            includedBracket: false,
         },
      });

      conditionalValidate(conditional, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });
});
