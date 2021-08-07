/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { MockErrorCollector } from 'basic-test';
import { ElementDeclarationPToken } from 'pToken';
import { toSToken } from 'sToken';
import { ElementEndPToken } from 'token';

import { CmGraph } from '../../contentModal/cmGraphTypes';
import { validityConstraint } from '../../error/validityConstraint';
import { ElDeclType, ElementContext, ValidateState } from '../../validateState';
import { elementEndValidate } from '../elementEndValidate';

const VID = validityConstraint.id;

describe('elementEndValidate (unit)', () => {
   let elementDeclaration: ElementDeclarationPToken;
   let mockErrorCollector: MockErrorCollector;
   let state: ValidateState;
   let elementEnd: ElementEndPToken;
   let graph: CmGraph;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();
      elementDeclaration = new ElementDeclarationPToken({
         close: toSToken('>'),
         declType: toSToken('ELEMENT'),
         declTypeSpace: toSToken(' '),
         name: toSToken('elementName'),
         nameSpace: toSToken(' '),
         open: toSToken('<!'),
         openSpace: undefined,
      });
      elementEnd = new ElementEndPToken({ name: toSToken('elementName'), open: toSToken('</') });
      graph = {
         endId: 0,
         startId: 0,
         states: {
            '4': {
               done: false,
               id: 4,
               trans: {
                  one: {
                     ref: '/1/2',
                     stateId: 5,
                  },
                  two: {
                     ref: '/3/4',
                     stateId: 6,
                  },
               },
            },
         },
      };
      const currentContext: ElementContext = {
         declDetails: {
            graph,
            isExternalMarkupDeclaration: false,
            token: elementDeclaration,
            type: ElDeclType.ELEMENT,
         },
         lastToken: undefined,
         parentName: 'elementName',
         stateId: 4,
      };
      state = new ValidateState({
         elementContext: {
            activeContext: currentContext,
            contextStack: [currentContext],
            pastEnd: false,
         },
         elementDeclarations: {
            elementName: {
               graph,
               isExternalMarkupDeclaration: false,
               token: new ElementDeclarationPToken({
                  close: toSToken('>'),
                  declType: toSToken('ELEMENT'),
                  name: toSToken('elementName'),
                  open: toSToken('<!'),
               }),
               type: ElDeclType.ELEMENT,
            },
         },
      });
   });

   it('reports an error the current context is a ELEMENT context, but we are not at the end', () => {
      elementEndValidate(elementEnd, state, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: VID.CONTENT_UNEXPECTED_END,
         lastPosition: undefined,
         params: ['elementName', 'one, two'],
         position: elementDeclaration.name,
      });
   });

   it('reports no error the current context is a ELEMENT context, but we are at the end', () => {
      graph.states[4].done = true;

      elementEndValidate(elementEnd, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports no error when there is no active context', () => {
      state = {
         ...state,
         elementContext: {
            ...state.elementContext,
            activeContext: undefined,
         },
      };

      elementEndValidate(elementEnd, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports no error when we are past the end of the document', () => {
      state = {
         ...state,
         elementContext: {
            ...state.elementContext,
            pastEnd: true,
         },
      };

      elementEndValidate(elementEnd, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports no error when the active context is not an ELEMENT context', () => {
      state = {
         ...state,
         elementContext: {
            ...state.elementContext,
            activeContext: {
               declDetails: {
                  isExternalMarkupDeclaration: false,
                  token: elementDeclaration,
                  type: ElDeclType.ANY,
               },
               lastToken: undefined,
               parentName: 'elementName',
               stateId: 4,
            },
         },
      };

      elementEndValidate(elementEnd, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });
});
