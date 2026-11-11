/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { ParamCollector } from 'basic-test';
import { ElementDeclarationPToken } from 'pToken';
import { ElementEndPToken } from 'token';
import { describe, expect, it } from 'vitest';

import { ElDeclType, ElementContext, ValidityState } from '../../common/validityState';
import { CmGraph } from '../../contentModel/cmGraphTypes';
import { validityErrorCodes } from '../../error/validityErrorCodes';
import { elementEndValidate } from '../elementEndValidate';

const VID = validityErrorCodes.id;

describe('elementEndValidate (unit)', () => {
   let elementDeclaration: ElementDeclarationPToken;
   let collector: ParamCollector;
   let state: ValidityState;
   let elementEnd: ElementEndPToken;
   let graph: CmGraph;

   beforeEach(() => {
      collector = new ParamCollector();
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
            contextStack: [currentContext],
            pastEnd: false,
         },
         elements: {
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

   describe('Validity Constraint: Element Valid (§3.0.0)', () => {
      it('reports an error the current context is a ELEMENT context, but we are not at the end (§3.0.0)', () => {
         elementEndValidate(elementEnd, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidityError({
            id: VID.CONTENT_PREMATURE_END,
            lastPosition: undefined,
            params: ['elementName', 'one, two'],
            position: elementDeclaration.name,
         });
      });

      it('reports no error the current context is a ELEMENT context, but we are at the end (§3.0.0)', () => {
         graph = {
            endId: 0,
            startId: 0,
            states: {
               '4': {
                  done: true,
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
         state = new ValidityState({
            elementContext: {
               contextStack: [
                  {
                     details: {
                        graph,
                        isExternalMarkupDeclaration: false,
                        token: elementDeclaration,
                        type: ElDeclType.ELEMENT,
                     },
                     lastToken: undefined,
                     parentName: 'elementName',
                     stateId: 4,
                  },
               ],
               pastEnd: false,
            },
            elements: {
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

         elementEndValidate(elementEnd, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('reports no error when there is no active context (§3.0.0)', () => {
         state = {
            ...state,
            elementContext: {
               ...state.elementContext,
               contextStack: [],
            },
         };

         elementEndValidate(elementEnd, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('reports no error when we are past the end of the document (§3.0.0)', () => {
         state = {
            ...state,
            elementContext: {
               ...state.elementContext,
               pastEnd: true,
            },
         };

         elementEndValidate(elementEnd, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('reports no error when the active context is not an ELEMENT context (§3.0.0)', () => {
         state = {
            ...state,
            elementContext: {
               ...state.elementContext,
               contextStack: [
                  {
                     details: {
                        isExternalMarkupDeclaration: false,
                        token: elementDeclaration,
                        type: ElDeclType.ANY,
                     },
                     lastToken: undefined,
                     parentName: 'elementName',
                     stateId: 4,
                  },
               ],
            },
         };

         elementEndValidate(elementEnd, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });
   });
});
