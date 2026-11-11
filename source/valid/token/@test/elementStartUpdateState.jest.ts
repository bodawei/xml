/* Copyright ® 2020-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { ElementDeclarationPToken, TextPToken } from 'pToken';
import { ElementStartPToken, ElementEmptyPToken } from 'token';
import { describe, expect, it } from 'vitest';

import { ElDeclType, ElementContext, ValidityState } from '../../common/validityState';
import { CmGraph } from '../../contentModel/cmGraphTypes';
import { elementStartUpdateState } from '../elementStartUpdateState';

describe('elementStartUpdateState (unit)', () => {
   let elementDeclaration: ElementDeclarationPToken;
   let elementStart: ElementStartPToken;
   let elementEmpty: ElementEmptyPToken;
   let state: ValidityState;
   let graph: CmGraph;

   beforeEach(() => {
      graph = {
         endId: 0,
         startId: 0,
         states: {
            '4': {
               done: false,
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
            },
         },
      };
      elementEmpty = new ElementEmptyPToken({
         close: toSToken('/>'),
         name: toSToken('elementName'),
         open: toSToken('<'),
      });
      elementStart = new ElementStartPToken({
         close: toSToken('>'),
         name: toSToken('elementName'),
         open: toSToken('<'),
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

   it('adds a context to the stack and makes it active for the specified element', () => {
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

      const newState = elementStartUpdateState(elementStart, state);

      expect(newState).toEqual({
         ...state,
         elementContext: {
            contextStack: [expectedContext],
            pastEnd: false,
         },
      });
   });

   it('adds a context to the stack with a fake token if no details could be found', () => {
      const unmatched = new ElementStartPToken({
         close: toSToken('>'),
         name: toSToken('unmatched'),
         open: toSToken('<!'),
      });
      const expectedContext: ElementContext = {
         details: {
            isExternalMarkupDeclaration: false,
            token: undefined,
            type: ElDeclType.ANY,
         },
         lastToken: undefined,
         parentName: 'unmatched',
         stateId: 0,
      };

      const newState = elementStartUpdateState(unmatched, state);

      expect(newState).toEqual({
         ...state,
         elementContext: {
            contextStack: [expectedContext],
            pastEnd: false,
         },
      });
   });

   it('adds a context to the stack with an absent token with the appropriate isExternalMarkupDeclaration value if no details could be found', () => {
      state = new ValidityState({
         dtdContext: {
            enclosingStack: [],
            inExternalMarkupContext: true,
            inExternalSubset: false,
         },
      });
      const unmatched = new ElementStartPToken({
         close: toSToken('>'),
         name: toSToken('unmatched'),
         open: toSToken('<!'),
      });
      const expectedContext: ElementContext = {
         details: {
            isExternalMarkupDeclaration: true,
            token: undefined,
            type: ElDeclType.ANY,
         },
         lastToken: undefined,
         parentName: 'unmatched',
         stateId: 0,
      };

      const newState = elementStartUpdateState(unmatched, state);

      expect(newState).toEqual({
         ...state,
         dtdContext: {
            enclosingStack: [],
            inExternalMarkupContext: true,
            inExternalSubset: false,
         },
         elementContext: {
            contextStack: [expectedContext],
            pastEnd: false,
         },
      });
   });

   it('adds a context to the stack with a fake token if no details could be found', () => {
      state = new ValidityState({
         elements: {
            elementName: {
               graph: { endId: 10, startId: 9, states: {} },
               isExternalMarkupDeclaration: false,
               token: elementDeclaration,
               type: ElDeclType.ELEMENT,
            },
         },
      });
      const expectedContext: ElementContext = {
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

      const newState = elementStartUpdateState(elementStart, state);

      expect(newState).toEqual({
         ...state,
         elementContext: {
            contextStack: [expectedContext],
            pastEnd: false,
         },
      });
   });

   it('transitions the current context to a new state, when context is ELEMENT', () => {
      const curContext: ElementContext = {
         details: {
            graph,
            isExternalMarkupDeclaration: false,
            token: elementDeclaration,
            type: ElDeclType.ELEMENT,
         },
         lastToken: undefined,
         parentName: 'elementName',
         stateId: 4,
      };
      const modifiedActive = { ...curContext, stateId: 5 };
      state = new ValidityState({
         elementContext: {
            contextStack: [curContext],
            pastEnd: false,
         },
         elements: {
            elementName: {
               graph,
               isExternalMarkupDeclaration: false,
               token: elementDeclaration,
               type: ElDeclType.ELEMENT,
            },
         },
      });
      const expectedContext: ElementContext = {
         details: {
            graph,
            isExternalMarkupDeclaration: false,
            token: elementDeclaration,
            type: ElDeclType.ELEMENT,
         },
         lastToken: undefined,
         parentName: 'elementName',
         stateId: 0,
      };

      const newState = elementStartUpdateState(elementStart, state);

      expect(newState).toEqual({
         ...state,
         elementContext: {
            contextStack: [modifiedActive, expectedContext],
            pastEnd: false,
         },
      });
   });

   it('does not transition to a new state, when context is ELEMENT, but the graph has no transition for this', () => {
      const curContext: ElementContext = {
         details: {
            graph,
            isExternalMarkupDeclaration: false,
            token: elementDeclaration,
            type: ElDeclType.ELEMENT,
         },
         lastToken: undefined,
         parentName: 'elementName',
         stateId: 4,
      };
      state = new ValidityState({
         elementContext: {
            contextStack: [curContext],
            pastEnd: false,
         },
         elements: {
            elementName: {
               graph,
               isExternalMarkupDeclaration: false,
               token: elementDeclaration,
               type: ElDeclType.ELEMENT,
            },
         },
      });
      elementStart = new ElementStartPToken({
         close: toSToken('>'),
         name: toSToken('noTransition'),
         open: toSToken('<'),
      });
      const expectedContext: ElementContext = {
         details: {
            isExternalMarkupDeclaration: false,
            token: undefined,
            type: ElDeclType.ANY,
         },
         lastToken: undefined,
         parentName: 'noTransition',
         stateId: 0,
      };

      const newState = elementStartUpdateState(elementStart, state);

      expect(newState).toEqual({
         ...state,
         elementContext: {
            contextStack: [curContext, expectedContext],
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
            pastEnd: true,
         },
      });
   });

   it('changes nothing if it encounters an empty element while in the body of the document', () => {
      state = new ValidityState({
         elementContext: {
            contextStack: [
               {
                  details: {
                     isExternalMarkupDeclaration: false,
                     token: elementDeclaration,
                     type: ElDeclType.ANY,
                  },
                  lastToken: undefined,
                  parentName: 'elementName',
                  stateId: 0,
               },
            ],
            pastEnd: false,
         },
      });

      const newState = elementStartUpdateState(elementEmpty, state);

      expect(newState).toEqual(state);
   });

   it('adds info about each ID value to the state (§3.3.1)', () => {
      state = new ValidityState({
         attributes: {
            elementName: {
               att1: {
                  def: {
                     name: toSToken('att1'),
                     type: toSToken('ID'),
                     value: [],
                  },
                  isExternalMarkupDeclaration: false,
               },
            },
         },
      });

      const newState = elementStartUpdateState(
         new ElementStartPToken({
            attributes: [
               {
                  name: toSToken('att1'),
                  value: [new TextPToken(toSToken('attValue'))],
               },
            ],
            name: toSToken('elementName'),
            open: toSToken('<'),
         }),
         state,
      );

      expect(newState).toEqual({
         ...state,
         elementContext: expect.any(Object) as never,
         ids: {
            attValue: {
               attName: 'att1',
               elName: 'elementName',
            },
         },
      });
   });

   it('does not replace an existing entry for an id (§3.3.1)', () => {
      state = new ValidityState({
         attributes: {
            elementName: {
               att1: {
                  def: {
                     name: toSToken('att1'),
                     type: toSToken('ID'),
                     value: [],
                  },
                  isExternalMarkupDeclaration: false,
               },
            },
         },
         ids: {
            attValue: {
               attName: 'otherAtt',
               elName: 'other',
            },
         },
      });

      const newState = elementStartUpdateState(
         new ElementStartPToken({
            attributes: [
               {
                  name: toSToken('att1'),
                  value: [new TextPToken(toSToken('attValue'))],
               },
            ],
            name: toSToken('elementName'),
            open: toSToken('<'),
         }),
         state,
      );

      expect(newState).toEqual({
         ...state,
         elementContext: expect.any(Object) as never,
         ids: {
            attValue: {
               attName: 'otherAtt',
               elName: 'other',
            },
         },
      });
   });

   describe('IDREFS constraing (§3.3.1)', () => {
      it('adds info about each IDREF value to the state (§3.3.1)', () => {
         state = new ValidityState({
            attributes: {
               elementName: {
                  att1: {
                     def: {
                        name: toSToken('att1'),
                        type: toSToken('IDREF'),
                        value: [],
                     },
                     isExternalMarkupDeclaration: false,
                  },
               },
            },
         });

         const newState = elementStartUpdateState(
            new ElementStartPToken({
               attributes: [
                  {
                     name: toSToken('att1'),
                     value: [new TextPToken(toSToken('attValue'))],
                  },
               ],
               name: toSToken('elementName'),
               open: toSToken('<'),
            }),
            state,
         );

         expect(newState).toEqual({
            ...state,
            elementContext: expect.any(Object) as never,
            idRefs: {
               attValue: {
                  attName: 'att1',
                  elName: 'elementName',
                  sToken: toSToken('att1'),
               },
            },
         });
      });

      it('adds info about each IDREFS value to the state (§3.3.1)', () => {
         state = new ValidityState({
            attributes: {
               elementName: {
                  att1: {
                     def: {
                        name: toSToken('att1'),
                        type: toSToken('IDREFS'),
                        value: [],
                     },
                     isExternalMarkupDeclaration: false,
                  },
               },
            },
         });

         const newState = elementStartUpdateState(
            new ElementStartPToken({
               attributes: [
                  {
                     name: toSToken('att1'),
                     value: [new TextPToken(toSToken('attValue1 attValue2'))],
                  },
               ],
               name: toSToken('elementName'),
               open: toSToken('<'),
            }),
            state,
         );

         expect(newState).toEqual({
            ...state,
            elementContext: expect.any(Object) as never,
            idRefs: {
               attValue1: {
                  attName: 'att1',
                  elName: 'elementName',
                  sToken: toSToken('att1'),
               },
               attValue2: {
                  attName: 'att1',
                  elName: 'elementName',
                  sToken: toSToken('att1'),
               },
            },
         });
      });

      it('does not add info about an IDREF value if the id is already in the state (§3.3.1)', () => {
         state = new ValidityState({
            attributes: {
               elementName: {
                  att1: {
                     def: {
                        name: toSToken('att1'),
                        type: toSToken('IDREFS'),
                        value: [],
                     },
                     isExternalMarkupDeclaration: false,
                  },
               },
            },
            ids: {
               value1: {
                  attName: 'someAtt',
                  elName: 'someElement',
               },
            },
         });

         const newState = elementStartUpdateState(
            new ElementStartPToken({
               attributes: [
                  {
                     name: toSToken('att1'),
                     value: [new TextPToken(toSToken('value1 attValue2'))],
                  },
               ],
               name: toSToken('elementName'),
               open: toSToken('<'),
            }),
            state,
         );

         expect(newState).toEqual({
            ...state,
            elementContext: expect.any(Object) as never,
            idRefs: {
               attValue2: {
                  attName: 'att1',
                  elName: 'elementName',
                  sToken: toSToken('att1'),
               },
            },
         });
      });
   });
});
