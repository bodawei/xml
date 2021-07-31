/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion, XmlEdition, XmlVersion } from 'basic';
import { MockErrorCollector } from 'basic-test';
import { toSToken } from 'sToken';
import { getFirstSToken } from 'token';
import {
   makeAttListDeclaration,
   makeCdata,
   makeCharData,
   makeCharRef,
   makeComment,
   makeConditionalClose,
   makeConditionalSection,
   makeDocTypeEnd,
   makeDocTypeStart,
   makeElementDeclaration,
   makeElementEmpty,
   makeElementEnd,
   makeElementStart,
   makeGeneralEntityDeclaration,
   makeGeneralEntityEnd,
   makeGeneralEntityReference,
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

import { ElDeclType, ValidateState } from '../validateState';
import { validityConstraint } from '../error/validityConstraint';
import { ContentModelP, ElementDeclarationPToken, ParseToken } from 'pToken';
import { makeCmGraph } from '../contentModal/makeCmGraph';
import { contentValidate } from '../contentValidate';

const VID = validityConstraint.id;

jest.mock('../token/attListDeclarationValidate');
jest.mock('../token/attListDeclarationUpdateState');
jest.mock('../token/conditionalEndUpdateState');
jest.mock('../token/conditionalEndValidate');
jest.mock('../token/conditionalStartUpdateState');
jest.mock('../token/conditionalStartValidate');
jest.mock('../token/docTypeStartUpdateState');
jest.mock('../token/dtdEndValidate');
jest.mock('../token/elementDeclarationUpdateState');
jest.mock('../token/elementDeclarationPreprocess');
jest.mock('../token/elementDeclarationValidate');
jest.mock('../token/elementEndUpdateState');
jest.mock('../token/elementEndValidate');
jest.mock('../token/elementStartUpdateState');
jest.mock('../token/elementStartValidate');
jest.mock('../token/elidedEntityDeclarationUpdateState');
jest.mock('../token/entityDeclarationValidate');
jest.mock('../token/externalSubsetEndUpdateState');
jest.mock('../token/externalSubsetStartUpdateState');
jest.mock('../token/generalEntityDeclarationUpdateState');
jest.mock('../token/generalEntityReferenceValidate');
jest.mock('../token/generalEntityStartValidate');
jest.mock('../token/notationDeclarationUpdateState');
jest.mock('../token/notationDeclarationValidate');
jest.mock('../token/parameterEntityDeclarationUpdateState');
jest.mock('../token/parameterEntityReferenceValidate');
jest.mock('../token/parameterEntityStartValidate');
jest.mock('../token/xmlDeclarationUpdateState');

describe('conentValidate (unit)', () => {
   let ec: MockErrorCollector;

   beforeEach(async () => {
      ec = new MockErrorCollector();
   });

   it('reports an error when the context is EMPTY, and any non-element end token is delivered (§3.0.0)', () => {
      const state = new ValidateState({
         elementContext: {
            activeContext: {
               declDetails: {
                  isExternalMarkupDeclaration: false,
                  token: new ElementDeclarationPToken({
                     declType: toSToken('EMPTY'),
                     name: toSToken('elementName'),
                     open: toSToken('<!'),
                  }),
                  type: ElDeclType.EMPTY,
               },
               lastToken: undefined,
               parentName: 'elementName',
               stateId: 0,
            },
            contextStack: [],
            pastEnd: false,
         },
      });

      contentValidate(makeProcessingInstruction(), state, ec);

      // @ts-expect-error 2329/matchers
      expect(ec).toReportValidityError({
         id: VID.CONTENT_IN_EMPTY_ELEMENT,
         lastPosition: undefined,
         params: ['elementName'],
         position: makeProcessingInstruction().open,
      });
   });

   it('reports no error when the context is EMPTY, and an element end token is delivered (§3.0.0)', () => {
      const state = new ValidateState({
         elementContext: {
            activeContext: {
               declDetails: {
                  isExternalMarkupDeclaration: false,
                  token: new ElementDeclarationPToken({
                     declType: toSToken('EMPTY'),
                     name: toSToken('elementName'),
                     open: toSToken('<!'),
                  }),
                  type: ElDeclType.EMPTY,
               },
               lastToken: undefined,
               parentName: 'elementName',
               stateId: 0,
            },
            contextStack: [],
            pastEnd: false,
         },
      });

      contentValidate(makeElementEnd(), state, ec);

      expect(ec.errors).toEqual([]);
   });

   const dataItems: Array<[ParseToken, Array<boolean>]> = [
      [makeAttListDeclaration(), [true, true, true]],
      [makeCdata(), [true, true, true]],
      [makeCharData(), [true, true, true]],
      [makeCharData('  \t \n \r '), [false, false, false]],
      [makeCharRef(), [true, true, true]],
      [makeComment(), [true, false, false]],
      [makeConditionalSection(), [true, true, true]],
      [makeConditionalClose(), [true, true, true]],
      [makeDocTypeStart(), [true, true, true]],
      [makeDocTypeEnd(), [true, true, true]],
      [makeElementDeclaration(), [true, true, true]],
      [makeElementEmpty(), [false, false, false]],
      [makeElementEnd(), [false, false, false]],
      [makeElementStart(), [false, false, false]],
      [makeGeneralEntityEnd(), [true, false, false]],
      [makeGeneralEntityDeclaration(), [true, true, true]],
      [makeGeneralEntityReference(), [true, true, true]],
      [makeGeneralEntityStart(), [true, false, false]],
      [makeNotationDeclaration(), [true, true, true]],
      [makeParameterEntityDeclaration(), [true, true, true]],
      [makeParameterEntityEnd(), [true, true, true]],
      [makeParameterEntityReference(), [true, true, true]],
      [makeParameterEntityStart(), [true, true, true]],
      [makeProcessingInstruction(), [true, false, false]],
      [makeSpace(), [false, false, false]],
      [makeTextPToken('xxx'), [true, true, true]],
      [makeTextDecl(), [true, false, false]],
      [makeXmlDecl(), [true, true, true]],
   ];
   dataItems.forEach((items) => {
      const [token, versions] = items;
      const [v10e1, v10e5, v11e1] = versions;

      const edition: Array<[XmlVersion, XmlEdition, boolean]> = [
         [1.0, 2, v10e1],
         [1.0, 5, v10e5],
         [1.1, 1, v11e1],
      ];
      edition.forEach(([version, edition, hasError]) => {
         it(`${hasError ? 'reports' : 'does not report'} an error when a ${
            token.type
         } token is found in an element with element content in ${version}/${edition} (§3.0.0)`, () => {
            const state = new ValidateState({
               confVer: new ConformanceVersion(version, edition),
               elementContext: {
                  activeContext: {
                     declDetails: {
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
                  contextStack: [],
                  pastEnd: false,
               },
            });

            contentValidate(token, state, ec);

            if (hasError) {
               // @ts-expect-error 2329/matchers
               expect(ec).toReportValidityError({
                  id: VID.CONTENT_IN_ELEMENT_ELEMENT,
                  lastPosition: undefined,
                  params: ['elementName', String(version), String(edition), token.type],
                  position: getFirstSToken(token),
               });
            } else {
               expect(ec.errors).toEqual([]);
            }
         });
      });
   });

   it('reports an error when the element context is ELEMENT, the version is 1.0/1 and a space is found before the first other thing (§3.0.0)', () => {
      const state = new ValidateState({
         confVer: new ConformanceVersion(1.0, 1),
         elementContext: {
            activeContext: {
               declDetails: {
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
            contextStack: [],
            pastEnd: false,
         },
      });

      contentValidate(makeSpace(), state, ec);

      // @ts-expect-error 2329/matchers
      expect(ec).toReportValidityError({
         id: VID.CONTENT_XTRA_SPACE,
         lastPosition: undefined,
         params: ['elementName'],
         position: makeSpace().text,
      });
   });

   it('reports an error when the token preceeding the end was whitespace and this is version 1.0/1 (§3.0.0)', () => {
      const state = new ValidateState({
         confVer: new ConformanceVersion(1.0, 1),
         elementContext: {
            activeContext: {
               declDetails: {
                  graph: makeCmGraph(new ContentModelP()),
                  isExternalMarkupDeclaration: false,
                  token: makeElementDeclaration(),
                  type: ElDeclType.ELEMENT,
               },
               lastToken: makeSpace(),
               parentName: 'elStart',
               stateId: 1,
            },
            contextStack: [],
            pastEnd: false,
         },
      });

      contentValidate(makeElementEnd(), state, ec);

      // @ts-expect-error 2329/matchers
      expect(ec).toReportValidityError({
         id: VID.CONTENT_XTRA_SPACE,
         lastPosition: undefined,
         params: ['elStart'],
         position: makeSpace().text,
      });
   });

   it('reports no error when the token preceeding the end was whitespace and this is version 1.0/1 (§3.0.0)', () => {
      const state = new ValidateState({
         confVer: new ConformanceVersion(1.0, 2),
         elementContext: {
            activeContext: {
               declDetails: {
                  graph: makeCmGraph(new ContentModelP()),
                  isExternalMarkupDeclaration: false,
                  token: makeElementDeclaration(),
                  type: ElDeclType.ELEMENT,
               },
               lastToken: makeSpace(),
               parentName: 'elStart',
               stateId: 1,
            },
            contextStack: [],
            pastEnd: false,
         },
      });

      contentValidate(makeElementEnd(), state, ec);

      expect(ec.errors).toEqual([]);
   });
});
