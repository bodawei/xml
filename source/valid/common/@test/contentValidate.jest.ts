/* Copyright ® 2021-2026 by 柏大衛. All rights reserved. */

import { ConformanceVersion, XmlEdition, XmlVersion, toSToken } from 'basic';
import { ParamCollector } from 'basic-test';
import { ContentModelP, ElementDeclarationPToken, ParseToken } from 'pToken';
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
import { describe, expect, it, vi } from 'vitest';

import { makeCmGraph } from '../../contentModel/makeCmGraph';
import { validityErrorCodes } from '../../error/validityErrorCodes';
import { contentValidate } from '../contentValidate';
import { ElDeclType, ValidityState } from '../validityState';

const VID = validityErrorCodes.id;

vi.mock('../../common/elementDeclarationPreprocess');
vi.mock('../../token/attListDeclarationValidate');
vi.mock('../../token/attListDeclarationUpdateState');
vi.mock('../../token/conditionalEndUpdateState');
vi.mock('../../token/conditionalEndValidate');
vi.mock('../../token/conditionalStartUpdateState');
vi.mock('../../token/conditionalStartValidate');
vi.mock('../../token/docTypeStartUpdateState');
vi.mock('../../token/docTypeEndValidate');
vi.mock('../../token/elementDeclarationUpdateState');
vi.mock('../../token/elementDeclarationValidate');
vi.mock('../../token/elementEndUpdateState');
vi.mock('../../token/elementEndValidate');
vi.mock('../../token/elementStartUpdateState');
vi.mock('../../token/elementStartValidate');
vi.mock('../../token/elidedEntityDeclarationUpdateState');
vi.mock('../../token/entityDeclarationValidate');
vi.mock('../../token/externalSubsetEndUpdateState');
vi.mock('../../token/externalSubsetStartUpdateState');
vi.mock('../../token/generalEntityDeclarationUpdateState');
vi.mock('../../token/generalEntityReferenceValidate');
vi.mock('../../token/generalEntityStartValidate');
vi.mock('../../token/notationDeclarationUpdateState');
vi.mock('../../token/notationDeclarationValidate');
vi.mock('../../token/parameterEntityDeclarationUpdateState');
vi.mock('../../token/parameterEntityReferenceValidate');
vi.mock('../../token/parameterEntityStartValidate');
vi.mock('../../token/xmlDeclarationUpdateState');

describe('conentValidate (unit)', () => {
   let collector: ParamCollector;

   beforeEach(() => {
      collector = new ParamCollector();
   });

   it('reports an error when the context is EMPTY, and any non-element end token is delivered (§3.0.0)', () => {
      const state = new ValidityState({
         elementContext: {
            contextStack: [
               {
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
            ],
            pastEnd: false,
         },
      });

      contentValidate(makeProcessingInstruction(), state, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveValidityError({
         id: VID.CONTENTEMPTY_INVALID_SYNTAX,
         lastPosition: undefined,
         params: ['elementName'],
         position: makeProcessingInstruction().open,
      });
   });

   it('reports no error when the context is EMPTY, and an element end token is delivered (§3.0.0)', () => {
      const state = new ValidityState({
         elementContext: {
            contextStack: [
               {
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
            ],
            pastEnd: false,
         },
      });

      contentValidate(makeElementEnd(), state, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
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

      const editions: Array<[XmlVersion, XmlEdition, boolean]> = [
         [1.0, 2, v10e1],
         [1.0, 5, v10e5],
         [1.1, 1, v11e1],
      ];
      editions.forEach(([version, edition, pass]) => {
         it(`${pass ? 'does not report' : 'reports'} an error when a ${
            token.type
         } token is found in an element with element content in ${version}/${edition} (§3.0.0)`, () => {
            const state = new ValidityState({
               confVer: new ConformanceVersion(version, edition),
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

            contentValidate(token, state, collector);

            if (!pass) {
               // @ts-expect-error 2329/matchers
               expect(collector).toHaveValidityError({
                  id: VID.CONTENTELEMENT_INVALID_SYNTAX,
                  lastPosition: undefined,
                  params: ['elementName', String(version), String(edition), token.type],
                  position: getFirstSToken(token),
               });
            } else {
               // @ts-expect-error 2329/matchers
               expect(collector).not.toHaveAnyProblems();
            }
         });
      });
   });

   it('reports an error when the element context is ELEMENT, the version is 1.0/1 and a space is found before the first other thing (§3.0.0)', () => {
      const state = new ValidityState({
         confVer: new ConformanceVersion(1.0, 1),
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

      contentValidate(makeSpace(), state, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveValidityError({
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
            contextStack: [
               {
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
            ],
            pastEnd: false,
         },
      });

      contentValidate(makeElementEnd(), state, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveValidityError({
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
            contextStack: [
               {
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
            ],
            pastEnd: false,
         },
      });

      contentValidate(makeElementEnd(), state, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
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

      const editions: Array<[XmlVersion, XmlEdition, boolean]> = [
         [1.0, 1, v10e1],
         [1.0, 3, v10e3],
         [1.1, 2, v11e2],
      ];
      editions.forEach(([version, edition, pass]) => {
         it(`${pass ? 'does not report' : 'reports'} an error when a ${
            token.type
         } token is found in an element with MIXED content in ${version}/${edition} (§3.0.0)`, () => {
            const state = new ValidityState({
               confVer: new ConformanceVersion(version, edition),
               elementContext: {
                  contextStack: [
                     {
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
                  ],
                  pastEnd: false,
               },
            });

            contentValidate(token, state, collector);

            if (!pass) {
               // @ts-expect-error 2329/matchers
               expect(collector).toHaveValidityError({
                  id: VID.CONTENTMIXED_INVALID_SYNTAX,
                  lastPosition: undefined,
                  params: ['elementName', String(version), String(edition), token.type],
                  position: getFirstSToken(token),
               });
            } else {
               // @ts-expect-error 2329/matchers
               expect(collector).not.toHaveAnyProblems();
            }
         });

         it(`${pass ? 'does not report' : 'reports'} an error when a ${
            token.type
         } token is found in an element with an ANY content in ${version}/${edition} (§3.0.0)`, () => {
            const state = new ValidityState({
               confVer: new ConformanceVersion(version, edition),
               elementContext: {
                  contextStack: [
                     {
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
                  ],
                  pastEnd: false,
               },
            });

            contentValidate(token, state, collector);

            if (!pass) {
               // @ts-expect-error 2329/matchers
               expect(collector).toHaveValidityError({
                  id: VID.CONTENTANY_INVALID_SYNTAX,
                  lastPosition: undefined,
                  params: ['elementName', String(version), String(edition), token.type],
                  position: getFirstSToken(token),
               });
            } else {
               // @ts-expect-error 2329/matchers
               expect(collector).not.toHaveAnyProblems();
            }
         });
      });
   });
});
