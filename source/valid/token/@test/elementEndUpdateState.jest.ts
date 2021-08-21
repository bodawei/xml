/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ElementDeclarationPToken } from 'pToken';
import { toSToken } from 'sToken';
import { ElementEndPToken } from 'token';

import { ElDeclType, ElementContext, ValidityState } from '../../common/validityState';
import { elementEndUpdateState } from '../elementEndUpdateState';

describe('elementEndUpdateState (unit)', () => {
   let elementDeclaration: ElementDeclarationPToken;
   let elementEnd: ElementEndPToken;
   let state: ValidityState;

   beforeEach(() => {
      elementEnd = new ElementEndPToken({
         close: toSToken('>'),
         name: toSToken('elementName'),
         open: toSToken('</'),
      });
      elementDeclaration = new ElementDeclarationPToken({
         close: toSToken('>'),
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
         open: toSToken('<!'),
      });
      state = new ValidityState({
         elements: {
            elementName: {
               isExternalMarkupDeclaration: false,
               token: elementDeclaration,
               type: ElDeclType.ANY,
            },
         },
      });
   });

   it('removes the context from the stack if the name matches', () => {
      const expectedContext: ElementContext = {
         details: {
            isExternalMarkupDeclaration: false,
            token: elementDeclaration,
            type: ElDeclType.ANY,
         },
         parentName: 'bar',
         stateId: 0,
      };
      const otherContext: ElementContext = {
         details: {
            isExternalMarkupDeclaration: false,
            token: elementDeclaration,
            type: ElDeclType.ANY,
         },
         parentName: 'elementName',
         stateId: 0,
      };
      state = new ValidityState({
         elementContext: {
            activeContext: otherContext,
            contextStack: [expectedContext, otherContext],
            pastEnd: false,
         },
         elements: {
            elementName: {
               isExternalMarkupDeclaration: false,
               token: elementDeclaration,
               type: ElDeclType.ANY,
            },
         },
      });

      const newState = elementEndUpdateState(elementEnd, state);

      expect(newState).toEqual({
         ...state,
         elementContext: {
            contextStack: [expectedContext],
            activeContext: expectedContext,
            pastEnd: false,
         },
      });
   });

   it('marks the document as done and emppties the active context if this ends the topmost context', () => {
      const expectedContext: ElementContext = {
         details: {
            token: elementDeclaration,
            type: ElDeclType.ANY,
         },
         parentName: 'elementName',
         stateId: 0,
      };
      state = new ValidityState({
         elements: {
            elementName: {
               token: elementDeclaration,
               type: ElDeclType.ANY,
            },
         },
         elementContext: {
            activeContext: expectedContext,
            contextStack: [expectedContext],
            pastEnd: false,
         },
      });

      const newState = elementEndUpdateState(elementEnd, state);

      expect(newState).toEqual({
         ...state,
         elementContext: {
            activeContext: undefined,
            contextStack: [],
            pastEnd: true,
         },
      });
   });

   it('changes nothing if we are not in the middle of processing', () => {
      const newState = elementEndUpdateState(elementEnd, state);

      expect(newState).toEqual(state);
   });

   it('changes nothing if the end does not match the context on the stack', () => {
      const currentContext: ElementContext = {
         details: {
            token: elementDeclaration,
            type: ElDeclType.ELEMENT,
            graph: { startId: 9, endId: 10, states: {} },
         },
         parentName: 'elementName',
         stateId: 9,
      };
      state = new ValidityState({
         elements: {
            elementName: {
               token: elementDeclaration,
               type: ElDeclType.ELEMENT,
               graph: { startId: 9, endId: 10, states: {} },
            },
         },
         elementContext: {
            activeContext: currentContext,
            contextStack: [currentContext],
            pastEnd: false,
         },
      });
      elementEnd = new ElementEndPToken({
         open: toSToken('</'),
         name: toSToken('other'),
         close: toSToken('>'),
      });

      const newState = elementEndUpdateState(elementEnd, state);

      expect(newState).toEqual(state);
   });
});
