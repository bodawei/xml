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
      const space = new SpacePToken({ text: toSToken(' \u0085 \u2028') });

      spaceValidate(space, state, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: ValidityError.ID.ELEMENT_CONTENT_BAD_SPACE,
         lastPosition: undefined,
         params: ['\u0085'],
         position: space.text,
      });
      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: ValidityError.ID.ELEMENT_CONTENT_BAD_SPACE,
         lastPosition: undefined,
         params: ['\u2028'],
         position: space.text,
      });
      expect(mockErrorCollector.errors.length).toEqual(2);
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
         const space = new SpacePToken({ text: toSToken('   ') });

         spaceValidate(space, state, mockErrorCollector);

         if (error) {
            // @ts-expect-error 2329/matchers
            expect(mockErrorCollector).toReportValidityError({
               id: ValidityError.ID.ELEMENT_CONTENT_SPACE_EXTERNAL_DECLARED,
               lastPosition: undefined,
               params: ['elementName'],
               position: space.text,
            });
         } else {
            expect(mockErrorCollector.errors).toEqual([]);
         }
      });
   });

   it('reports no error when the space token has only S characters in it', () => {
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
      const space = new SpacePToken({ text: toSToken(' \n \t \r') });

      spaceValidate(space, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports no error when the space token has non-S characters in it but we are not in element content', () => {
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
      const space = new SpacePToken({ text: toSToken(' \u0085 \u2028') });

      spaceValidate(space, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });
});
