/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { toSToken } from 'basic';
import { ParamCollector } from 'basic-test';
import { CharDataPToken } from 'token';
import { makeElementDeclaration } from 'token-test';

import { ElDeclType, ValidityState } from '../../common/validityState';
import { validityErrorCodes } from '../../error/validityErrorCodes';
import { charDataValidate } from '../charDataValidate';

const VID = validityErrorCodes.id;

describe('charDataValidate (unit)', () => {
   let collector: ParamCollector;
   let state: ValidityState;

   beforeEach(() => {
      collector = new ParamCollector();
   });

   describe('Validity constraint: Standalone Document Declaration (§2.9.0)', () => {
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
         } externally declared (§2.9.0)`, () => {
            state = new ValidityState({
               elementContext: {
                  contextStack: [
                     {
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
                  ],
                  pastEnd: false,
               },
               isStandalone,
            });
            const charData = new CharDataPToken({ text: toSToken('    ') });

            charDataValidate(charData, state, collector);

            if (error) {
               // @ts-expect-error 2329/matchers
               expect(collector).toHaveValidityError({
                  id: VID.CONTENTELEMENT_AMBIGUOUS_SPACE,
                  lastPosition: undefined,
                  params: ['elementName'],
                  position: charData.text,
               });
            } else {
               // @ts-expect-error 2329/matchers
               expect(collector).not.toHaveAnyProblems();
            }
         });
      });

      it('reports no error when the charData token has only S characters in it and the document is not standalone (§2.9.0)', () => {
         state = new ValidityState({
            elementContext: {
               contextStack: [
                  {
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
               ],
               pastEnd: false,
            },
         });
         const charData = new CharDataPToken({ text: toSToken(' \n \t \r') });

         charDataValidate(charData, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('reports no error when the charData token has non-S characters in it but we are not in element content (§2.9.0)', () => {
         state = new ValidityState({
            elementContext: {
               contextStack: [
                  {
                     details: {
                        isExternalMarkupDeclaration: false,
                        token: makeElementDeclaration(),
                        type: ElDeclType.ANY,
                     },
                     lastToken: undefined,
                     parentName: 'foo',
                     stateId: 0,
                  },
               ],
               pastEnd: false,
            },
         });
         const charData = new CharDataPToken({ text: toSToken(' x y') });

         charDataValidate(charData, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('reports no error when the charData token has non-S characters in it and we are in element content (§2.9.0)', () => {
         state = new ValidityState({
            elementContext: {
               contextStack: [
                  {
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
               ],
               pastEnd: false,
            },
         });
         const charData = new CharDataPToken({ text: toSToken(' x y') });

         charDataValidate(charData, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });
   });
});
