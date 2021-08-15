/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ElementDeclarationPToken } from 'pToken';
import { toSToken } from 'sToken';
import { ElementEndPToken } from 'token';

import { ElDeclType, ElementContext, ValidateState } from '../../common/validateState';
import { elementEndUpdateState } from '../elementEndUpdateState';

describe('elementEndUpdateState (unit)', () => {
   let elementDeclaration: ElementDeclarationPToken;
   let elementEnd: ElementEndPToken;
   let state: ValidateState;

   beforeEach(async () => {
      elementEnd = new ElementEndPToken({
         open: toSToken('</'),
         name: toSToken('elementName'),
         close: toSToken('>'),
      });
      elementDeclaration = new ElementDeclarationPToken({
         open: toSToken('<!'),
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
         close: toSToken('>'),
      });
      state = new ValidateState({
         elementDeclarations: {
            elementName: {
               token: elementDeclaration,
               type: ElDeclType.ANY,
            },
         },
      });
   });

   it('removes the context from the stack if the name matches', () => {
      const expectedContext: ElementContext = {
         declDetails: {
            token: elementDeclaration,
            type: ElDeclType.ANY,
         },
         parentName: 'bar',
         stateId: 0,
      };
      const otherContext: ElementContext = {
         declDetails: {
            token: elementDeclaration,
            type: ElDeclType.ANY,
         },
         parentName: 'elementName',
         stateId: 0,
      };
      state = new ValidateState({
         elementDeclarations: {
            elementName: {
               token: elementDeclaration,
               type: ElDeclType.ANY,
            },
         },
         elementContext: {
            contextStack: [expectedContext, otherContext],
            activeContext: otherContext,
            pastEnd: false,
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
         declDetails: {
            token: elementDeclaration,
            type: ElDeclType.ANY,
         },
         parentName: 'elementName',
         stateId: 0,
      };
      state = new ValidateState({
         elementDeclarations: {
            elementName: {
               token: elementDeclaration,
               type: ElDeclType.ANY,
            },
         },
         elementContext: {
            contextStack: [expectedContext],
            activeContext: expectedContext,
            pastEnd: false,
         },
      });

      const newState = elementEndUpdateState(elementEnd, state);

      expect(newState).toEqual({
         ...state,
         elementContext: {
            contextStack: [],
            activeContext: undefined,
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
         declDetails: {
            token: elementDeclaration,
            type: ElDeclType.ELEMENT,
            graph: { startId: 9, endId: 10, states: {} },
         },
         parentName: 'elementName',
         stateId: 9,
      };
      state = new ValidateState({
         elementDeclarations: {
            elementName: {
               token: elementDeclaration,
               type: ElDeclType.ELEMENT,
               graph: { startId: 9, endId: 10, states: {} },
            },
         },
         elementContext: {
            contextStack: [currentContext],
            activeContext: currentContext,
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
