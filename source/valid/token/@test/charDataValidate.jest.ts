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
                  graph: { endId: 0, startId: 0, states: {} },
                  isExternalMarkupDeclaration: false,
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
      const charData = new CharDataPToken({ text: toSToken(' \u0085 \u2028') });

      charDataValidate(charData, state, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: ValidityError.ID.ELEMENT_CONTENT_BAD_SPACE,
         lastPosition: undefined,
         params: [' \u0085 \u2028'],
         position: charData.text,
      });
      expect(mockErrorCollector.errors.length).toEqual(1);
   });

   [
      {
         error: true,
         isExternalMarkupDeclaration: true,
         isStandalone: true,
      },
      {
         error: false,
         isExternalMarkupDeclaration: true,
         isStandalone: false,
      },
      {
         error: false,
         isExternalMarkupDeclaration: false,
         isStandalone: true,
      },
      {
         error: false,
         isExternalMarkupDeclaration: false,
         isStandalone: false,
      },
   ].forEach((items) => {
      const { error, isExternalMarkupDeclaration, isStandalone } = items;

      it(`reports an error when this is${
         isStandalone ? '' : ' not'
      } standalone and the enclosing element was${
         isExternalMarkupDeclaration ? '' : ' not'
      } externally declared`, () => {
         state = new ValidateState({
            elementContext: {
               activeContext: {
                  declDetails: {
                     graph: { endId: 0, startId: 0, states: {} },
                     isExternalMarkupDeclaration,
                     token: makeElementDeclaration(),
                     type: ElDeclType.ELEMENT,
                  },
                  parentName: 'foo',
                  stateId: 0,
               },
               contextStack: [],
               pastEnd: false,
            },
            isStandalone,
         });
         const charData = new CharDataPToken({ text: toSToken('    ') });

         charDataValidate(charData, state, mockErrorCollector);

         if (error) {
            // @ts-expect-error 2329/matchers
            expect(mockErrorCollector).toReportValidityError({
               id: ValidityError.ID.ELEMENT_CONTENT_SPACE_EXTERNAL_DECLARED,
               lastPosition: undefined,
               params: ['elementName'],
               position: charData.text,
            });
         } else {
            expect(mockErrorCollector.errors).toEqual([]);
         }
      });
   });

   it('reports no error when the charData token has only S characters in it', () => {
      state = new ValidateState({
         elementContext: {
            activeContext: {
               declDetails: {
                  graph: { endId: 0, startId: 0, states: {} },
                  isExternalMarkupDeclaration: false,
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
      const charData = new CharDataPToken({ text: toSToken(' \n \t \r') });

      charDataValidate(charData, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports no error when the charData token has non-S characters in it but we are not in element content', () => {
      state = new ValidateState({
         elementContext: {
            activeContext: {
               declDetails: {
                  isExternalMarkupDeclaration: false,
                  token: makeElementDeclaration(),
                  type: ElDeclType.ANY,
               },
               parentName: 'foo',
               stateId: 0,
            },
            contextStack: [],
            pastEnd: false,
         },
      });
      const charData = new CharDataPToken({ text: toSToken(' \u0085 \u2028') });

      charDataValidate(charData, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });
});
