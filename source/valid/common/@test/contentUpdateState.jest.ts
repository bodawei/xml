/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion } from 'basic';
import { ContentModelP, ElementDeclarationPToken, ParseToken } from 'pToken';
import { toSToken } from 'sToken';
import {
   makeAttListDeclaration,
   makeCdata,
   makeCharData,
   makeCharRef,
   makeComment,
   makeConditionalClose,
   makeConditionalStart,
   makeDocTypeEnd,
   makeDocTypeStart,
   makeElementDeclaration,
   makeElementEmpty,
   makeElementEnd,
   makeElementStart,
   makeGeneralEntityDeclaration,
   makeGeneralEntityEnd,
   makeGeneralEntityStart,
   makeNotationDeclaration,
   makeParameterEntityDeclaration,
   makeParameterEntityEnd,
   makeParameterEntityReference,
   makeParameterEntityStart,
   makeProcessingInstruction,
   makeSpace,
   makeTextDecl,
   makeTextPToken,
   makeXmlDecl,
} from 'token-test';

import { contentUpdateState } from '../contentUpdateState';
import { ElDeclType, ValidityState } from '../validityState';
import { makeCmGraph } from '../../contentModel/makeCmGraph';

describe('contentUpdateState (unit)', () => {
   const dataItems: Array<[ParseToken, boolean]> = [
      [makeAttListDeclaration(), true],
      [makeCdata(), true],
      [makeCharData(), true],
      [makeCharData('  \t \n \r '), true],
      [makeCharRef(), true],
      [makeComment(), true],
      [makeConditionalStart(), true],
      [makeConditionalClose(), true],
      [makeDocTypeStart(), true],
      [makeDocTypeEnd(), true],
      [makeElementDeclaration(), true],
      [makeElementEmpty(), true],
      [makeElementEnd(), true],
      [makeElementStart(), true],
      [makeGeneralEntityEnd(), false],
      [makeGeneralEntityDeclaration(), true],
      [makeGeneralEntityStart(), false],
      [makeNotationDeclaration(), true],
      [makeParameterEntityDeclaration(), true],
      [makeParameterEntityEnd(), true],
      [makeParameterEntityReference(), true],
      [makeParameterEntityStart(), true],
      [makeProcessingInstruction(), true],
      [makeSpace(), true],
      [makeTextPToken('xxx'), true],
      [makeTextDecl(), false],
      [makeXmlDecl(), true],
      [new ConformanceVersion(), false],
   ];
   dataItems.forEach((items) => {
      const [token, updates] = items;

      it(`${updates ? 'adds' : 'does not add'} a token to the state for ${
         token.type
      } tokens (§3.0.0)`, () => {
         const state = new ValidityState({
            elementContext: {
               contextStack: [
                  {
                     details: {
                        graph: makeCmGraph(new ContentModelP()),
                        isExternalMarkupDeclaration: false,
                        token: new ElementDeclarationPToken({
                           contentModel: new ContentModelP(),
                           name: toSToken('elementName'),
                           open: toSToken('<!'),
                        }),
                        type: ElDeclType.ELEMENT,
                     },
                     lastToken: undefined,
                     parentName: 'elementName',
                     stateId: 0,
                  },
               ],
               pastEnd: false,
            },
         });

         const newState = contentUpdateState(token, state);
         const expected = updates ? token : undefined;

         expect(newState.elementContext.contextStack[0]?.lastToken).toEqual(expected);
      });
   });

   it('does not update the state if this is not an ELEMENT type (§3.0.0)', () => {
      const state = new ValidityState({
         elementContext: {
            contextStack: [
               {
                  details: {
                     isExternalMarkupDeclaration: false,
                     token: new ElementDeclarationPToken({
                        open: toSToken('<!'),
                     }),
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

      const newState = contentUpdateState(makeElementStart(), state);

      expect(newState).toEqual(state);
   });
});
