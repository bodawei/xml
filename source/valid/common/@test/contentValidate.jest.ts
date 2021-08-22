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
   makeConditionalStart,
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

import { ElDeclType, ValidityState } from '../validityState';
import { validCodes } from '../../error/validCodes';
import { ContentModelP, ElementDeclarationPToken, ParseToken } from 'pToken';
import { makeCmGraph } from '../../contentModel/makeCmGraph';
import { contentValidate } from '../contentValidate';

const VID = validCodes.id;

jest.mock('../../common/elementDeclarationPreprocess');
jest.mock('../../token/attListDeclarationValidate');
jest.mock('../../token/attListDeclarationUpdateState');
jest.mock('../../token/conditionalEndUpdateState');
jest.mock('../../token/conditionalEndValidate');
jest.mock('../../token/conditionalStartUpdateState');
jest.mock('../../token/conditionalStartValidate');
jest.mock('../../token/docTypeStartUpdateState');
jest.mock('../../token/docTypeEndValidate');
jest.mock('../../token/elementDeclarationUpdateState');
jest.mock('../../token/elementDeclarationValidate');
jest.mock('../../token/elementEndUpdateState');
jest.mock('../../token/elementEndValidate');
jest.mock('../../token/elementStartUpdateState');
jest.mock('../../token/elementStartValidate');
jest.mock('../../token/elidedEntityDeclarationUpdateState');
jest.mock('../../token/entityDeclarationValidate');
jest.mock('../../token/externalSubsetEndUpdateState');
jest.mock('../../token/externalSubsetStartUpdateState');
jest.mock('../../token/generalEntityDeclarationUpdateState');
jest.mock('../../token/generalEntityReferenceValidate');
jest.mock('../../token/generalEntityStartValidate');
jest.mock('../../token/notationDeclarationUpdateState');
jest.mock('../../token/notationDeclarationValidate');
jest.mock('../../token/parameterEntityDeclarationUpdateState');
jest.mock('../../token/parameterEntityReferenceValidate');
jest.mock('../../token/parameterEntityStartValidate');
jest.mock('../../token/xmlDeclarationUpdateState');

describe('conentValidate (unit)', () => {
   let ec: MockErrorCollector;

   beforeEach(() => {
      ec = new MockErrorCollector();
   });

   it('reports an error when the context is EMPTY, and any non-element end token is delivered (§3.0.0)', () => {
      const state = new ValidityState({
         elementContext: {
            activeContext: {
               details: {
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
         id: VID.CONTENTEMPTY_INVALID_SYNTAX,
         lastPosition: undefined,
         params: ['elementName'],
         position: makeProcessingInstruction().open,
      });
   });

   it('reports no error when the context is EMPTY, and an element end token is delivered (§3.0.0)', () => {
      const state = new ValidityState({
         elementContext: {
            activeContext: {
               details: {
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
      [makeAttListDeclaration(), [false, false, false]],
      [makeCdata(), [false, false, false]],
      [makeCharData(), [false, false, false]],
      [makeCharData('  \t \n \r '), [true, true, true]],
      [makeCharRef(), [false, false, false]],
      [makeComment(), [false, true, true]],
      [makeConditionalStart(), [false, false, false]],
      [makeConditionalClose(), [false, false, false]],
      [makeDocTypeStart(), [false, false, false]],
      [makeDocTypeEnd(), [false, false, false]],
      [makeElementDeclaration(), [false, false, false]],
      [makeElementEmpty(), [true, true, true]],
      [makeElementEnd(), [true, true, true]],
      [makeElementStart(), [true, true, true]],
      [makeGeneralEntityEnd(), [false, true, true]],
      [makeGeneralEntityDeclaration(), [false, false, false]],
      [makeGeneralEntityReference(), [false, false, false]],
      [makeGeneralEntityStart(), [false, true, true]],
      [makeNotationDeclaration(), [false, false, false]],
      [makeParameterEntityDeclaration(), [false, false, false]],
      [makeParameterEntityEnd(), [false, false, false]],
      [makeParameterEntityReference(), [false, false, false]],
      [makeParameterEntityStart(), [false, false, false]],
      [makeProcessingInstruction(), [false, true, true]],
      [makeSpace(), [true, true, true]],
      [makeTextPToken('xxx'), [false, false, false]],
      [makeTextDecl(), [false, true, true]],
      [makeXmlDecl(), [false, false, false]],
   ];
   dataItems.forEach((items) => {
      const [token, versions] = items;
      const [v10e1, v10e5, v11e1] = versions;

      const edition: Array<[XmlVersion, XmlEdition, boolean]> = [
         [1.0, 2, v10e1],
         [1.0, 5, v10e5],
         [1.1, 1, v11e1],
      ];
      edition.forEach(([version, edition, pass]) => {
         it(`${pass ? 'does not report' : 'reports'} an error when a ${
            token.type
         } token is found in an element with element content in ${version}/${edition} (§3.0.0)`, () => {
            const state = new ValidityState({
               confVer: new ConformanceVersion(version, edition),
               elementContext: {
                  activeContext: {
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
                  contextStack: [],
                  pastEnd: false,
               },
            });

            contentValidate(token, state, ec);

            if (!pass) {
               // @ts-expect-error 2329/matchers
               expect(ec).toReportValidityError({
                  id: VID.CONTENTELEMENT_INVALID_SYNTAX,
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
      const state = new ValidityState({
         confVer: new ConformanceVersion(1.0, 1),
         elementContext: {
            activeContext: {
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
            contextStack: [],
            pastEnd: false,
         },
      });

      contentValidate(makeSpace(), state, ec);

      // @ts-expect-error 2329/matchers
      expect(ec).toReportValidityError({
         id: VID.CONTENTELEMENT_XTRA_SPACE,
         lastPosition: undefined,
         params: ['elementName'],
         position: makeSpace().text,
      });
   });

   it('reports an error when the token preceeding the end was whitespace and this is version 1.0/1 (§3.0.0)', () => {
      const state = new ValidityState({
         confVer: new ConformanceVersion(1.0, 1),
         elementContext: {
            activeContext: {
               details: {
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
         id: VID.CONTENTELEMENT_XTRA_SPACE,
         lastPosition: undefined,
         params: ['elStart'],
         position: makeSpace().text,
      });
   });

   it('reports no error when the token preceeding the end was whitespace and this is version 1.0/1 (§3.0.0)', () => {
      const state = new ValidityState({
         confVer: new ConformanceVersion(1.0, 2),
         elementContext: {
            activeContext: {
               details: {
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

   const mixedDataItems: Array<[ParseToken, Array<boolean>]> = [
      [makeAttListDeclaration(), [false, false, false]],
      [makeCdata(), [false, false, true]],
      [makeCharData(), [true, true, true]],
      [makeCharData('  \t \n \r '), [true, true, true]],
      [makeCharRef(), [false, false, true]],
      [makeComment(), [false, true, true]],
      [makeConditionalStart(), [false, false, false]],
      [makeConditionalClose(), [false, false, false]],
      [makeDocTypeStart(), [false, false, false]],
      [makeDocTypeEnd(), [false, false, false]],
      [makeElementDeclaration(), [false, false, false]],
      [makeElementEmpty(), [true, true, true]],
      [makeElementEnd(), [true, true, true]],
      [makeElementStart(), [true, true, true]],
      [makeGeneralEntityEnd(), [false, true, true]],
      [makeGeneralEntityDeclaration(), [false, false, false]],
      [makeGeneralEntityReference(), [false, false, false]],
      [makeGeneralEntityStart(), [false, true, true]],
      [makeNotationDeclaration(), [false, false, false]],
      [makeParameterEntityDeclaration(), [false, false, false]],
      [makeParameterEntityEnd(), [false, false, false]],
      [makeParameterEntityReference(), [false, false, false]],
      [makeParameterEntityStart(), [false, false, false]],
      [makeProcessingInstruction(), [false, true, true]],
      [makeSpace(), [true, true, true]],
      [makeTextPToken('xxx'), [false, false, false]],
      [makeTextDecl(), [false, true, true]],
      [makeXmlDecl(), [false, false, false]],
   ];
   mixedDataItems.forEach((items) => {
      const [token, versions] = items;
      const [v10e1, v10e3, v11e2] = versions;

      const edition: Array<[XmlVersion, XmlEdition, boolean]> = [
         [1.0, 1, v10e1],
         [1.0, 3, v10e3],
         [1.1, 2, v11e2],
      ];
      edition.forEach(([version, edition, pass]) => {
         it(`${pass ? 'does not report' : 'reports'} an error when a ${
            token.type
         } token is found in an element with MIXED content in ${version}/${edition} (§3.0.0)`, () => {
            const state = new ValidityState({
               confVer: new ConformanceVersion(version, edition),
               elementContext: {
                  activeContext: {
                     details: {
                        isExternalMarkupDeclaration: false,
                        names: [],
                        token: new ElementDeclarationPToken({
                           name: toSToken('elementName'),
                           open: toSToken('<!'),
                        }),
                        type: ElDeclType.MIXED,
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

            if (!pass) {
               // @ts-expect-error 2329/matchers
               expect(ec).toReportValidityError({
                  id: VID.CONTENTMIXED_INVALID_SYNTAX,
                  lastPosition: undefined,
                  params: ['elementName', String(version), String(edition), token.type],
                  position: getFirstSToken(token),
               });
            } else {
               expect(ec.errors).toEqual([]);
            }
         });

         it(`${pass ? 'does not report' : 'reports'} an error when a ${
            token.type
         } token is found in an element with an ANY content in ${version}/${edition} (§3.0.0)`, () => {
            const state = new ValidityState({
               confVer: new ConformanceVersion(version, edition),
               elementContext: {
                  activeContext: {
                     details: {
                        isExternalMarkupDeclaration: false,
                        token: new ElementDeclarationPToken({
                           name: toSToken('elementName'),
                           open: toSToken('<!'),
                        }),
                        type: ElDeclType.ANY,
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

            if (!pass) {
               // @ts-expect-error 2329/matchers
               expect(ec).toReportValidityError({
                  id: VID.CONTENTANY_INVALID_SYNTAX,
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
});
