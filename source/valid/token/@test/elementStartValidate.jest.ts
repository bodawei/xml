/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { MockErrorCollector } from 'error-test';
import { ElementDeclarationPToken } from 'pToken';
import { toSToken } from 'sToken';

import { elementStartValidate } from '../elementStartValidate';
import { ValidityError } from '../../error/ValidityError';
import { ElDeclType, ElementContext, ValidateState } from '../../validateState';
import { ElementStartPToken } from 'token';
import { CmGraph } from '../../contentModal/cmGraphTypes';

describe('elementStartValidate (unit)', () => {
   let elementDeclaration: ElementDeclarationPToken;
   let mockErrorCollector: MockErrorCollector;
   let state: ValidateState;
   let elementStart: ElementStartPToken;
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
      elementStart = new ElementStartPToken({
         open: toSToken('</'),
         name: toSToken('elementName'),
      });
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

   it('reports an error when the context is EMPTY', () => {
      state = new ValidateState({
         elementContext: {
            ...state.elementContext,
            activeContext: {
               declDetails: {
                  token: elementDeclaration,
                  type: ElDeclType.EMPTY,
               },
               parentName: 'parentName',
               stateId: 0,
            },
         },
      });

      elementStartValidate(elementStart, state, mockErrorCollector);

      expect(mockErrorCollector).toReportValidityError({
         id: ValidityError.ID.CONTENT_IN_EMPTY_ELEMENT,
         params: ['parentName'],
         position: elementStart.open,
         lastPosition: undefined,
      });
   });

   it('reports an error when the context is ANY, and the name is not a declared element', () => {
      state = new ValidateState({
         elementContext: {
            ...state.elementContext,
            activeContext: {
               declDetails: {
                  token: elementDeclaration,
                  type: ElDeclType.ANY,
               },
               parentName: 'parentName',
               stateId: 0,
            },
         },
      });
      elementStart = new ElementStartPToken({
         open: toSToken('</'),
         name: toSToken('other'),
      });

      elementStartValidate(elementStart, state, mockErrorCollector);

      expect(mockErrorCollector).toReportValidityError({
         id: ValidityError.ID.ANY_UNDECLARED_ELEMENT,
         params: ['parentName', 'other'],
         position: elementStart.name,
         lastPosition: undefined,
      });
   });

   it('reports an error when the context is MIXED, and the name is not a known name', () => {
      state = new ValidateState({
         elementContext: {
            ...state.elementContext,
            activeContext: {
               declDetails: {
                  token: elementDeclaration,
                  type: ElDeclType.MIXED,
                  names: ['foo'],
                  duplicateNames: [],
               },
               parentName: 'parentName',
               stateId: 0,
            },
         },
      });

      elementStartValidate(elementStart, state, mockErrorCollector);

      expect(mockErrorCollector).toReportValidityError({
         id: ValidityError.ID.UNDECLARED_ELEMENT_IN_MIXED,
         params: ['parentName', 'elementName'],
         position: elementStart.name,
         lastPosition: undefined,
      });
   });

   it('reports an error when the context is CHILDREN, and there is no transition from this state', () => {
      state = new ValidateState({
         elementContext: {
            ...state.elementContext,
            activeContext: {
               declDetails: {
                  token: elementDeclaration,
                  type: ElDeclType.CHILDREN,
                  graph,
               },
               parentName: 'parentName',
               stateId: 4,
            },
         },
      });

      elementStartValidate(elementStart, state, mockErrorCollector);

      expect(mockErrorCollector).toReportValidityError({
         id: ValidityError.ID.INVALID_ELEMENT_IN_CONTENT,
         params: ['parentName', 'elementName'],
         position: elementStart.name,
         lastPosition: undefined,
      });
   });

   it('reports no error when there is no active context', () => {
      state = {
         ...state,
         elementContext: {
            ...state.elementContext,
            activeContext: undefined,
         },
      };

      elementStartValidate(elementStart, state, mockErrorCollector);

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

      elementStartValidate(elementStart, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });
});
