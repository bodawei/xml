/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { MockErrorCollector } from 'error-test';
import { ElementDeclarationPToken } from 'pToken';
import { toSToken } from 'sToken';

import { elementEndValidate } from '../elementEndValidate';
import { ValidityError } from '../../error/ValidityError';
import { ElDeclType, ElementContext, ValidateState } from '../../validateState';
import { ElementEndPToken } from 'token';
import { CmGraph } from '../../contentModal/cmGraphTypes';

describe('elementEndValidate (unit)', () => {
   let elementDeclaration: ElementDeclarationPToken;
   let mockErrorCollector: MockErrorCollector;
   let state: ValidateState;
   let elementEnd: ElementEndPToken;
   let graph: CmGraph;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();
      elementDeclaration = new ElementDeclarationPToken({
         open: toSToken('<!'),
         openSpace: undefined,
         declType: toSToken('ELEMENT'),
         declTypeSpace: toSToken(' '),
         name: toSToken('elementName'),
         nameSpace: toSToken(' '),
         close: toSToken('>'),
      });
      elementEnd = new ElementEndPToken({ open: toSToken('</'), name: toSToken('elementName') });
      graph = {
         startId: 0,
         endId: 0,
         states: {
            '4': {
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
               done: false,
            },
         },
      };
      const currentContext: ElementContext = {
         declDetails: {
            token: elementDeclaration,
            type: ElDeclType.CHILDREN,
            graph,
         },
         parentName: 'elementName',
         stateId: 4,
      };
      state = new ValidateState({
         elementDeclarations: {
            elementName: {
               type: ElDeclType.CHILDREN,
               token: new ElementDeclarationPToken({
                  open: toSToken('<!'),
                  declType: toSToken('ELEMENT'),
                  name: toSToken('elementName'),
                  close: toSToken('>'),
               }),
               graph,
            },
         },
         elementContext: {
            contextStack: [currentContext],
            activeContext: currentContext,
            pastEnd: false,
         },
      });
   });

   it('reports an error the current context is a CHILDREN context, but we are not at the end', () => {
      elementEndValidate(elementEnd, state, mockErrorCollector);

      // @ts-expect-error 2329/matchers
            expect(mockErrorCollector).toReportValidityError({
         id: ValidityError.ID.CHILDREN_UNEXPECTED_END,
         params: ['elementName', 'one, two'],
         position: elementDeclaration.name,
         lastPosition: undefined,
      });
   });

   it('reports no error the current context is a CHILDREN context, but we are at the end', () => {
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

   it('reports no error when the active context is not a CHILDREN context', () => {
      state = {
         ...state,
         elementContext: {
            ...state.elementContext,
            activeContext: {
               declDetails: {
                  token: elementDeclaration,
                  type: ElDeclType.ANY,
               },
               parentName: 'elementName',
               stateId: 4,
            },
         },
      };

      elementEndValidate(elementEnd, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });
});
