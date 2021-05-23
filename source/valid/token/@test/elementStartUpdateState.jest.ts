/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ElementDeclarationPToken, TextPToken } from 'pToken';
import { CmGraph } from 'source/valid/contentModal/cmGraphTypes';
import { SToken, toSToken } from 'sToken';
import { ElementStartPToken, ElementEmptyPToken } from 'token';

import { ElDeclType, ElementContext, ValidateState } from '../../validateState';
import { elementStartUpdateState } from '../elementStartUpdateState';

describe('elementStartUpdateState (unit)', () => {
   let elementDeclaration: ElementDeclarationPToken;
   let elementStart: ElementStartPToken;
   let elementEmpty: ElementEmptyPToken;
   let state: ValidateState;
   let graph: CmGraph;

   beforeEach(async () => {
      graph = {
         startId: 0,
         endId: 0,
         states: {
            '4': {
               id: 4,
               trans: {
                  elementName: {
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
      elementEmpty = new ElementEmptyPToken({
         open: toSToken('<'),
         name: toSToken('elementName'),
         close: toSToken('/>'),
      });
      elementStart = new ElementStartPToken({
         open: toSToken('<'),
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

   it('adds a context to the stack and makes it active for the specified element', () => {
      const expectedContext: ElementContext = {
         declDetails: {
            token: elementDeclaration,
            type: ElDeclType.ANY,
         },
         parentName: 'elementName',
         stateId: 0,
      };

      const newState = elementStartUpdateState(elementStart, state);

      expect(newState).toEqual({
         ...state,
         elementContext: {
            contextStack: [expectedContext],
            activeContext: expectedContext,
            pastEnd: false,
         },
      });
   });

   it('adds a context to the stack with a fake token if no details could be found', () => {
      const unmatched = new ElementStartPToken({
         open: toSToken('<!'),
         name: toSToken('unmatched'),
         close: toSToken('>'),
      });
      const expectedContext: ElementContext = {
         declDetails: {
            token: new ElementDeclarationPToken({ open: new SToken('<!', '<!', []) }),
            type: ElDeclType.ANY,
         },
         parentName: 'unmatched',
         stateId: 0,
      };

      const newState = elementStartUpdateState(unmatched, state);

      expect(newState).toEqual({
         ...state,
         elementContext: {
            contextStack: [expectedContext],
            activeContext: expectedContext,
            pastEnd: false,
         },
      });
   });

   it('adds a context to the stack with a fake token if no details could be found', () => {
      state = new ValidateState({
         elementDeclarations: {
            elementName: {
               token: elementDeclaration,
               type: ElDeclType.ELEMENT,
               graph: { startId: 9, endId: 10, states: {} },
            },
         },
      });
      const expectedContext: ElementContext = {
         declDetails: {
            token: elementDeclaration,
            type: ElDeclType.ELEMENT,
            graph: { startId: 9, endId: 10, states: {} },
         },
         parentName: 'elementName',
         stateId: 9,
      };

      const newState = elementStartUpdateState(elementStart, state);

      expect(newState).toEqual({
         ...state,
         elementContext: {
            contextStack: [expectedContext],
            activeContext: expectedContext,
            pastEnd: false,
         },
      });
   });

   it('transitions the activeContext to a new state, when context is ELEMENT', () => {
      const activeContext: ElementContext = {
         declDetails: {
            token: elementDeclaration,
            type: ElDeclType.ELEMENT,
            graph,
         },
         parentName: 'elementName',
         stateId: 4,
      };
      const modifiedActive = { ...activeContext, stateId: 5 };
      state = new ValidateState({
         elementDeclarations: {
            elementName: {
               token: elementDeclaration,
               type: ElDeclType.ELEMENT,
               graph,
            },
         },
         elementContext: {
            contextStack: [activeContext],
            activeContext: activeContext,
            pastEnd: false,
         },
      });
      const expectedContext: ElementContext = {
         declDetails: {
            token: elementDeclaration,
            type: ElDeclType.ELEMENT,
            graph,
         },
         parentName: 'elementName',
         stateId: 0,
      };

      const newState = elementStartUpdateState(elementStart, state);

      expect(newState).toEqual({
         ...state,
         elementContext: {
            contextStack: [modifiedActive, expectedContext],
            activeContext: expectedContext,
            pastEnd: false,
         },
      });
   });

   it('does not transition to a new state, when context is ELEMENT, but the graph has no transition for this', () => {
      const activeContext: ElementContext = {
         declDetails: {
            token: elementDeclaration,
            type: ElDeclType.ELEMENT,
            graph,
         },
         parentName: 'elementName',
         stateId: 4,
      };
      state = new ValidateState({
         elementDeclarations: {
            elementName: {
               token: elementDeclaration,
               type: ElDeclType.ELEMENT,
               graph,
            },
         },
         elementContext: {
            contextStack: [activeContext],
            activeContext: activeContext,
            pastEnd: false,
         },
      });
      elementStart = new ElementStartPToken({
         open: toSToken('<'),
         name: toSToken('noTransition'),
         close: toSToken('>'),
      });
      const expectedContext: ElementContext = {
         declDetails: {
            token: new ElementDeclarationPToken({ open: new SToken('<!', '<!', []) }),
            type: ElDeclType.ANY,
         },
         parentName: 'noTransition',
         stateId: 0,
      };

      const newState = elementStartUpdateState(elementStart, state);

      expect(newState).toEqual({
         ...state,
         elementContext: {
            contextStack: [activeContext, expectedContext],
            activeContext: expectedContext,
            pastEnd: false,
         },
      });
   });

   it('marks the document as done if there was nothing on the context stack, and we endounter an empty element', () => {
      const newState = elementStartUpdateState(elementEmpty, state);

      expect(newState).toEqual({
         ...state,
         elementContext: {
            contextStack: [],
            activeContext: undefined,
            pastEnd: true,
         },
      });
   });

   it('changes nothing if it encounters an empty element while in the body of the document', () => {
      state = new ValidateState({
         elementContext: {
            contextStack: [
               {
                  declDetails: {
                     token: elementDeclaration,
                     type: ElDeclType.ANY,
                  },
                  parentName: 'elementName',
                  stateId: 0,
               },
            ],
            activeContext: undefined,
            pastEnd: false,
         },
      });

      const newState = elementStartUpdateState(elementEmpty, state);

      expect(newState).toEqual(state);
   });

   it('adds info about each ID value to the state (§3.3.1)', () => {
      state = new ValidateState({
         attributeDefs: {
            elementName: {
               att1: {
                  def: {
                     name: toSToken('att1'),
                     value: [],
                     type: toSToken('ID'),
                  },
                  isExternal: true,
               },
            },
         },
      });

      const newState = elementStartUpdateState(
         new ElementStartPToken({
            open: toSToken('<'),
            name: toSToken('elementName'),
            attributes: [
               {
                  name: toSToken('att1'),
                  value: [new TextPToken(toSToken('attValue'))],
               },
            ],
         }),
         state,
      );

      expect(newState).toEqual({
         ...state,
         elementContext: expect.any(Object),
         ids: {
            attValue: {
               elName: 'elementName',
               attName: 'att1',
            },
         },
      });
   });

   it('does not replace an existing entry for an id (§3.3.1)', () => {
      state = new ValidateState({
         attributeDefs: {
            elementName: {
               att1: {
                  def: {
                     name: toSToken('att1'),
                     value: [],
                     type: toSToken('ID'),
                  },
                  isExternal: true,
               },
            },
         },
         ids: {
            attValue: {
               elName: 'other',
               attName: 'otherAtt',
            },
         },
      });

      const newState = elementStartUpdateState(
         new ElementStartPToken({
            open: toSToken('<'),
            name: toSToken('elementName'),
            attributes: [
               {
                  name: toSToken('att1'),
                  value: [new TextPToken(toSToken('attValue'))],
               },
            ],
         }),
         state,
      );

      expect(newState).toEqual({
         ...state,
         elementContext: expect.any(Object),
         ids: {
            attValue: {
               elName: 'other',
               attName: 'otherAtt',
            },
         },
      });
   });
});
