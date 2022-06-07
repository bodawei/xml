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
         lastToken: undefined,
         parentName: 'bar',
         stateId: 0,
      };
      const otherContext: ElementContext = {
         details: {
            isExternalMarkupDeclaration: false,
            token: elementDeclaration,
            type: ElDeclType.ANY,
         },
         lastToken: undefined,
         parentName: 'elementName',
         stateId: 0,
      };
      state = new ValidityState({
         elementContext: {
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
            pastEnd: false,
         },
      });
   });

   it('marks the document as done and emppties the active context if this ends the topmost context', () => {
      const expectedContext: ElementContext = {
         details: {
            isExternalMarkupDeclaration: false,
            token: elementDeclaration,
            type: ElDeclType.ANY,
         },
         lastToken: undefined,
         parentName: 'elementName',
         stateId: 0,
      };
      state = new ValidityState({
         elementContext: {
            contextStack: [expectedContext],
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
            graph: { endId: 10, startId: 9, states: {} },
            isExternalMarkupDeclaration: false,
            token: elementDeclaration,
            type: ElDeclType.ELEMENT,
         },
         lastToken: undefined,
         parentName: 'elementName',
         stateId: 9,
      };
      state = new ValidityState({
         elementContext: {
            contextStack: [currentContext],
            pastEnd: false,
         },
         elements: {
            elementName: {
               graph: { endId: 10, startId: 9, states: {} },
               isExternalMarkupDeclaration: false,
               token: elementDeclaration,
               type: ElDeclType.ELEMENT,
            },
         },
      });
      elementEnd = new ElementEndPToken({
         close: toSToken('>'),
         name: toSToken('other'),
         open: toSToken('</'),
      });

      const newState = elementEndUpdateState(elementEnd, state);

      expect(newState).toEqual(state);
   });
});
