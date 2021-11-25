/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { MockErrorCollector } from 'basic-test';
import { toSToken } from 'sToken';
import { SpacePToken } from 'token';
import { makeElementDeclaration } from 'token-test';

import { validCodes } from '../../error/validCodes';
import { ElDeclType, ValidityState } from '../../common/validityState';
import { spaceValidate } from '../spaceValidate';

const VID = validCodes.id;

describe('spaceValidate (unit)', () => {
   let mockErrorCollector: MockErrorCollector;
   let state: ValidityState;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();
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
         state = new ValidityState({
            elementContext: {
               activeContext: {
                  details: {
                     graph: { endId: 0, startId: 0, states: {} },
                     isExternalMarkupDeclaration,
                     token: makeElementDeclaration(),
                     type: ElDeclType.ELEMENT,
                  },
                  lastToken: undefined,
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
               id: VID.CONTENTELEMENT_AMBIGUOUS_SPACE,
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
      state = new ValidityState({
         elementContext: {
            activeContext: {
               details: {
                  graph: { endId: 0, startId: 0, states: {} },
                  isExternalMarkupDeclaration: false,
                  token: makeElementDeclaration(),
                  type: ElDeclType.ELEMENT,
               },
               lastToken: undefined,
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

   it('reports no error when the space token S characters in it, but we are not in an ELEMENT context', () => {
      state = new ValidityState({
         elementContext: {
            activeContext: {
               details: {
                  isExternalMarkupDeclaration: true,
                  token: makeElementDeclaration(),
                  type: ElDeclType.ANY,
               },
               lastToken: undefined,
               parentName: 'foo',
               stateId: 0,
            },
            contextStack: [],
            pastEnd: false,
         },
         isStandalone: true,
      });
      const space = new SpacePToken({ text: toSToken('   ') });

      spaceValidate(space, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });
});
