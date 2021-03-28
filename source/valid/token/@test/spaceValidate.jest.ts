/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { MockErrorCollector } from 'basic-test';
import { makeElementDeclaration } from 'token-test';

import { spaceValidate } from '../spaceValidate';
import { ValidityError } from '../../error/ValidityError';
import { ElDeclType, ValidateState } from '../../validateState';
import { SpacePToken } from 'token';
import { toSToken } from 'sToken';

describe('spaceValidate (unit)', () => {
   let mockErrorCollector: MockErrorCollector;
   let state: ValidateState;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();
   });

   it('reports an error when the space token has non-S characters in it', () => {
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
      const space = new SpacePToken({ text: toSToken(' \u0085 \u2028') });

      spaceValidate(space, state, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: ValidityError.ID.CHILDREN_BAD_SPACE,
         params: ['\u0085'],
         position: space.text,
         lastPosition: undefined,
      });
      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: ValidityError.ID.CHILDREN_BAD_SPACE,
         params: ['\u2028'],
         position: space.text,
         lastPosition: undefined,
      });
      expect(mockErrorCollector.errors.length).toEqual(2);
   });

   it('reports no error when the space token has only S characters in it', () => {
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
      const space = new SpacePToken({ text: toSToken(' \n \t \r') });

      spaceValidate(space, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports no error when the space token has non-S characters in it but we are not in element content', () => {
      state = new ValidateState({
         elementContext: {
            activeContext: {
               declDetails: {
                  token: makeElementDeclaration(),
                  type: ElDeclType.ANY,
               },
               parentName: 'foo',
               stateId: 0,
            },
            pastEnd: false,
            contextStack: [],
         },
      });
      const space = new SpacePToken({ text: toSToken(' \u0085 \u2028') });

      spaceValidate(space, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });
});
