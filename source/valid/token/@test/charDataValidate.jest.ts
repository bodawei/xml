/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { MockErrorCollector } from 'basic-test';
import { makeElementDeclaration } from 'token-test';

import { charDataValidate } from '../charDataValidate';
import { ValidityError } from '../../error/ValidityError';
import { ElDeclType, ValidateState } from '../../validateState';
import { CharDataPToken } from 'token';
import { toSToken } from 'sToken';

describe('charDataValidate (unit)', () => {
   let mockErrorCollector: MockErrorCollector;
   let state: ValidateState;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();
   });

   it('reports an error when in element content', () => {
      state = new ValidateState({
         elementContext: {
            activeContext: {
               declDetails: {
                  token: makeElementDeclaration(),
                  type: ElDeclType.ELEMENT,
                  graph: { startId: 0, endId: 0, states: {} },
               },
               parentName: 'foo',
               stateId: 0,
            },
            pastEnd: false,
            contextStack: [],
         },
      });
      const charData = new CharDataPToken({ text: toSToken(' \u0085 \u2028') });

      charDataValidate(charData, state, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: ValidityError.ID.ELEMENT_CONTENT_BAD_SPACE,
         params: [' \u0085 \u2028'],
         position: charData.text,
         lastPosition: undefined,
      });
      expect(mockErrorCollector.errors.length).toEqual(1);
   });

   it('reports no error when the charData token has only S characters in it', () => {
      state = new ValidateState({
         elementContext: {
            activeContext: {
               declDetails: {
                  token: makeElementDeclaration(),
                  type: ElDeclType.ELEMENT,
                  graph: { startId: 0, endId: 0, states: {} },
               },
               parentName: 'foo',
               stateId: 0,
            },
            pastEnd: false,
            contextStack: [],
         },
      });
      const charData = new CharDataPToken({ text: toSToken(' \n \t \r') });

      charDataValidate(charData, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports no error when the charData token has non-S characters in it but we are not in element content', () => {
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
      const charData = new CharDataPToken({ text: toSToken(' \u0085 \u2028') });

      charDataValidate(charData, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });
});
