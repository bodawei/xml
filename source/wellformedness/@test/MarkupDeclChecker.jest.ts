/* Copyright ® 2019-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { MockErrorCollector } from 'basic-test';
import {
   AttListDeclarationPToken,
   ElementDeclarationPToken,
   GeneralEntityDeclarationPToken,
   GeneralEntityReferencePToken,
   ParameterEntityDeclarationPToken,
   ParameterEntityReferencePToken,
   TextDeclarationPToken,
   TextPToken,
} from 'pToken';
import { strOrBlank, toSToken } from 'sToken';
import {
   CommentPToken,
   InternalSubsetStartToken,
   ExternalSubsetStartToken,
   ExternalSubsetEndToken,
   InternalSubsetEndToken,
   ParameterEntityStartPToken,
   ParameterEntityEndPToken,
   GeneralEntityStartPToken,
   GeneralEntityEndPToken,
   ElidedEntityDeclarationPToken,
   ConditionalPToken,
   ConditionalClosePToken,
} from 'token';

import { WellFormedError } from '../error/WellFormedError';
import { MarkupDeclChecker } from '../MarkupDeclChecker';
import * as checkUtils from '../checkUtils';
import { CheckState, CHECKER_DONE } from '../checkUtils';

import {
   makeTextDecl,
   makeParameterEntityDeclaration,
   makeComment,
   makeAttListDeclaration,
   makeParameterEntityReference,
   makeExternalSubsetEnd,
   makeExternalSubsetStart,
   makeInternalSubsetEnd,
   makeInternalSubsetStart,
   makeParameterExternalEntityDeclaration,
   makeGeneralEntityDeclaration,
   makeGeneralEntityReference,
   makeSpace,
   makeProcessingInstruction,
   makeNotationDeclaration,
   makeElementDeclaration,
} from 'token-test';

import { warning } from 'basic';

const WARNID = warning.id;

describe('MarkupDeclChecker (unit)', () => {
   let ec: MockErrorCollector;
   let checker: MarkupDeclChecker;
   let checkState: CheckState;
   let attributeListDeclaration: AttListDeclarationPToken;
   let comment: CommentPToken;
   let generalEntityDeclaration: GeneralEntityDeclarationPToken;
   let generalEntityReference: GeneralEntityReferencePToken;
   let internalSubsetStart: InternalSubsetStartToken;
   let internalSubsetEnd: InternalSubsetEndToken;
   let externalSubsetStart: ExternalSubsetStartToken;
   let externalSubsetEnd: ExternalSubsetEndToken;
   let parameterEntityDeclaration: ParameterEntityDeclarationPToken;
   let parameterEntityEnd: ParameterEntityEndPToken;
   let paramEntityRef: ParameterEntityReferencePToken;
   let parameterEntityStart: ParameterEntityStartPToken;
   let generalEntityEnd: GeneralEntityEndPToken;
   let generalEntityStart: GeneralEntityStartPToken;
   let externalParamEntityDecl: ParameterEntityDeclarationPToken;
   let internalParamEntityDecl: ParameterEntityDeclarationPToken;
   let textDecl: TextDeclarationPToken;

   beforeEach(() => {
      jest.restoreAllMocks();
      jest.resetAllMocks();
      ec = new MockErrorCollector();
      checkState = new CheckState();
      attributeListDeclaration = makeAttListDeclaration();
      comment = makeComment();
      externalSubsetStart = makeExternalSubsetStart();
      externalSubsetEnd = makeExternalSubsetEnd();
      generalEntityDeclaration = makeGeneralEntityDeclaration();
      generalEntityReference = makeGeneralEntityReference();
      generalEntityEnd = new GeneralEntityEndPToken(generalEntityReference);
      generalEntityStart = new GeneralEntityStartPToken(generalEntityReference);
      internalSubsetStart = makeInternalSubsetStart();
      internalSubsetEnd = makeInternalSubsetEnd();
      paramEntityRef = makeParameterEntityReference();
      parameterEntityDeclaration = makeParameterEntityDeclaration();
      parameterEntityEnd = new ParameterEntityEndPToken(paramEntityRef);
      parameterEntityStart = new ParameterEntityStartPToken(paramEntityRef);
      internalParamEntityDecl = makeParameterEntityDeclaration();
      externalParamEntityDecl = makeParameterExternalEntityDeclaration();
      textDecl = makeTextDecl();
   });

   function addAllTokens(checker: MarkupDeclChecker, ec: MockErrorCollector): void {
      checker.check(comment, ec);
      checker.check(makeSpace(), ec);
      checker.check(makeProcessingInstruction(), ec);
      checker.check(makeAttListDeclaration(), ec);
      checker.check(makeElementDeclaration(), ec);
      checker.check(makeGeneralEntityDeclaration(), ec);
      const otherPeDecl = new ParameterEntityDeclarationPToken({
         close: toSToken('>'),
         closeQuote: toSToken('"'),
         name: toSToken('other'),
         nameSpace: toSToken(' '),
         open: toSToken('<!'),
         openQuote: toSToken('"'),
         parameter: toSToken('%'),
         parameterSpace: toSToken(' '),
         value: [new TextPToken({ text: toSToken('value') })],
      });
      checker.check(otherPeDecl, ec);
      checker.check(makeNotationDeclaration(), ec);
   }

   describe('starting', () => {
      it('can be started with a parameter entity start token', () => {
         checkState.paramDecls.entityName = parameterEntityDeclaration;

         new MarkupDeclChecker(parameterEntityStart, ec, checkState, []);

         expect(ec.errors).toEqual([]);
      });

      it('closes a parameter entity', () => {
         checker = new MarkupDeclChecker(parameterEntityStart, ec, checkState, []);

         checker.check(parameterEntityEnd, ec);

         expect(() => checker.check(comment, ec)).toThrowError(
            /Passed a token to MarkupDeclChecker/,
         );
      });
   });

   describe('internal subset', () => {
      beforeEach(() => {
         ec = new MockErrorCollector();
         checker = new MarkupDeclChecker(internalSubsetStart, ec, checkState, []);
      });

      it('can be started with an internal subset start token', () => {
         expect(ec.errors).toEqual([]);
      });

      it('reports an error if a textdecl appears after an internal subset start', () => {
         checker = new MarkupDeclChecker(internalSubsetStart, ec, checkState, []);

         checker.check(textDecl, ec);

         // @ts-expect-error 2329/matchers
         expect(ec).toReportWFError({
            id: WellFormedError.ID.MARKUPDECL_INVALID_TOKEN,
            params: [textDecl.type],
            position: textDecl.open,
         });
      });

      it('reports no errors if it is closed with an InternalSubsetEndPToken', () => {
         checker.check(internalSubsetEnd, ec);

         expect(ec.errors).toEqual([]);
      });

      it('reports an error if called after an internal subset closed it', () => {
         checker.check(internalSubsetEnd, ec);

         expect(() => checker.check(comment, ec)).toThrowError(
            /Passed a token to MarkupDeclChecker/,
         );
      });

      it('reports no errors when all DTD tokens appear', () => {
         addAllTokens(checker, ec);

         expect(ec.errors).toEqual([]);
      });

      describe('with internal parameter entity', () => {
         let internalParameterEntityStartPToken: ParameterEntityStartPToken;

         beforeEach(() => {
            internalParameterEntityStartPToken = new ParameterEntityStartPToken(paramEntityRef);

            checker.check(internalParamEntityDecl, ec);
            checker.check(internalParameterEntityStartPToken, ec);
         });

         it('reports no errors when all DTD tokens appear', () => {
            addAllTokens(checker, ec);

            expect(ec.errors).toEqual([]);
         });

         it('reports an error if a textdecl appears after an internal parameter entity start', () => {
            checker.check(textDecl, ec);

            // @ts-expect-error 2329/matchers
            expect(ec).toReportWFError({
               id: WellFormedError.ID.MARKUPDECL_INVALID_TOKEN,
               params: [textDecl.type],
               position: textDecl.open,
            });
         });

         it('closes the parameter entity and internal subset without problems', () => {
            const end = new ParameterEntityEndPToken(paramEntityRef);
            checker.check(generalEntityDeclaration, ec);

            checker.check(end, ec);
            checker.check(internalSubsetEnd, ec);

            expect(ec.errors).toEqual([]);
         });
      });

      describe('with external parameter entity', () => {
         let externalParameterEntityStartPToken: ParameterEntityStartPToken;

         beforeEach(() => {
            externalParameterEntityStartPToken = new ParameterEntityStartPToken(paramEntityRef);

            checker.check(externalParamEntityDecl, ec);
            checker.check(externalParameterEntityStartPToken, ec);
         });

         it('reports no errors when all DTD tokens appear', () => {
            addAllTokens(checker, ec);

            expect(ec.errors).toEqual([]);
         });

         it('reports no error if a textdecl appears after an external parameter entity start', () => {
            checker.check(textDecl, ec);

            expect(ec.errors).toEqual([]);
         });

         it('reports no error if a conditional section appears after an external parameter entity start', () => {
            checker.check(new ConditionalPToken({ open: toSToken('<!') }), ec);

            expect(ec.errors).toEqual([]);
         });

         it('closes the parameter entity and internal subset without problems', () => {
            const end = new ParameterEntityEndPToken(paramEntityRef);
            checker.check(generalEntityDeclaration, ec);

            checker.check(end, ec);
            checker.check(internalSubsetEnd, ec);

            expect(ec.errors).toEqual([]);
         });

         it('does not replace an parameter entity in the state with a second one', () => {
            const name = strOrBlank(parameterEntityDeclaration.name);
            checkState.paramDecls[name] = parameterEntityDeclaration;
            checker = new MarkupDeclChecker(externalSubsetStart, ec, checkState, []);
            const secondDeclaration = makeParameterEntityDeclaration();

            checker.check(secondDeclaration, ec);

            expect(checkState.paramDecls[name]).toBe(parameterEntityDeclaration);
         });
      });

      // it('reports an error if there is a parameter entity reference in a token in the internal subset', () => {
      //    const notationDeclaration = new NotationDeclarationPToken({
      //       open: toSToken('<!'),
      //       peRefPlus: [
      //          {
      //             type: UnassignedType.REFERENCE,
      //             token: new ParameterEntityReferencePToken({
      //                open: toSToken('%'),
      //             }),
      //          },
      //       ],
      //    });

      //    checker.check(notationDeclaration, ec);

      //    expect(ec).toReportWFError({
      //       id: WellFormedError.ID.REFERENCE_INVALID_SUBSET_CONTEXT,
      //       params: [],
      //       position: notationDeclaration.open,
      //    });
      // });

      it('reports an error if there is a parameter entity reference in a parameter entity declaration in the internal subset', () => {
         const paramEntityDecl = new ParameterEntityDeclarationPToken({
            open: toSToken('<!'),
            value: [
               new ParameterEntityReferencePToken({
                  open: toSToken('%'),
               }),
            ],
         });

         checker.check(paramEntityDecl, ec);

         // @ts-expect-error 2329/matchers
         expect(ec).toReportWFError({
            id: WellFormedError.ID.REFERENCE_INVALID_SUBSET_CONTEXT,
            params: [],
            position: paramEntityDecl.open,
         });
      });

      it('reports an error if there is a parameter entity start in a parameter entity declaration in the internal subset', () => {
         const paramEntityDecl = new ParameterEntityDeclarationPToken({
            open: toSToken('<!'),
            value: [
               new ParameterEntityStartPToken(
                  new ParameterEntityReferencePToken({
                     open: toSToken('%'),
                  }),
               ),
            ],
         });

         checker.check(paramEntityDecl, ec);

         // @ts-expect-error 2329/matchers
         expect(ec).toReportWFError({
            id: WellFormedError.ID.REFERENCE_INVALID_SUBSET_CONTEXT,
            params: [],
            position: paramEntityDecl.open,
         });
      });

      it('reports an error if there is a parameter entity reference in a general entity declaration in the internal subset', () => {
         const generalEntityDecl = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            value: [
               new ParameterEntityReferencePToken({
                  open: toSToken('%'),
               }),
            ],
         });

         checker.check(generalEntityDecl, ec);

         // @ts-expect-error 2329/matchers
         expect(ec).toReportWFError({
            id: WellFormedError.ID.REFERENCE_INVALID_SUBSET_CONTEXT,
            params: [],
            position: generalEntityDecl.open,
         });
      });
   });

   describe('external subset', () => {
      beforeEach(() => {
         checker = new MarkupDeclChecker(externalSubsetStart, ec, checkState, []);
      });

      it('can be started with an external subset start token', () => {
         new MarkupDeclChecker(externalSubsetStart, ec, checkState, []);

         expect(ec.errors).toEqual([]);
      });

      it('reports no error if a textdecl appears after an external subset start', () => {
         checker = new MarkupDeclChecker(externalSubsetStart, ec, checkState, []);

         checker.check(textDecl, ec);

         expect(ec.errors).toEqual([]);
      });

      it('reports an error if a textdecl appears after a textdecl', () => {
         checker.check(textDecl, ec);
         checker.check(textDecl, ec);

         // @ts-expect-error 2329/matchers
         expect(ec).toReportWFError({
            id: WellFormedError.ID.MARKUPDECL_INVALID_TOKEN,
            params: [textDecl.type],
            position: textDecl.open,
         });
      });

      it('reports no errors when all DTD tokens appear', () => {
         checker.check(textDecl, ec);
         addAllTokens(checker, ec);

         expect(ec.errors).toEqual([]);
      });

      it('reports no errors if it is closed with an ExternalSubsetEndPToken', () => {
         checker.check(externalSubsetEnd, ec);

         expect(ec.errors).toEqual([]);
      });

      it('closes an external subset', () => {
         checker.check(externalSubsetEnd, ec);

         expect(() => checker.check(comment, ec)).toThrowError(
            /Passed a token to MarkupDeclChecker/,
         );
      });

      describe('with conditional section', () => {
         let conditionalSection: ConditionalPToken;

         beforeEach(() => {
            conditionalSection = new ConditionalPToken({ open: toSToken('<!['), peRefPlus: [] });
         });

         it('an error if the end of the external subset happens', () => {
            checker.check(conditionalSection, ec);

            checker.check(new ExternalSubsetEndToken(), ec);

            // @ts-expect-error 2329/matchers
            expect(ec).toReportWFError({
               id: WellFormedError.ID.CONDITIONAL_NO_CLOSE,
               params: [],
               position: conditionalSection.open,
            });
         });

         it('an error if the conditional section appears before the start of an external subset', () => {
            new MarkupDeclChecker(conditionalSection, ec, checkState, []);

            // @ts-expect-error 2329/matchers
            expect(ec).toReportWFError({
               id: WellFormedError.ID.MARKUPDECL_INVALID_TOKEN,
               params: [conditionalSection.type],
               position: conditionalSection.open,
            });
         });

         it('an error if the conditional end is delivered without an opening', () => {
            const close = new ConditionalClosePToken({ open: toSToken(']>') });

            checker.check(close, ec);

            // @ts-expect-error 2329/matchers
            expect(ec).toReportWFError({
               id: WellFormedError.ID.MARKUPDECL_INVALID_TOKEN,
               params: [close.type],
               position: close.open,
            });
         });
      });

      describe('with internal parameter entity', () => {
         let internalParameterEntityStartPToken: ParameterEntityStartPToken;

         beforeEach(() => {
            internalParameterEntityStartPToken = new ParameterEntityStartPToken(paramEntityRef);

            checker.check(internalParamEntityDecl, ec);
            checker.check(internalParameterEntityStartPToken, ec);
         });

         it('reports no errors when all DTD tokens appear', () => {
            addAllTokens(checker, ec);

            expect(ec.errors).toEqual([]);
         });

         it('reports an error if a textdecl appears after an internal parameter entity start', () => {
            checker.check(textDecl, ec);

            // @ts-expect-error 2329/matchers
            expect(ec).toReportWFError({
               id: WellFormedError.ID.MARKUPDECL_INVALID_TOKEN,
               params: [textDecl.type],
               position: textDecl.open,
            });
         });

         it('closes the parameter entity and internal subset without problems', () => {
            const end = new ParameterEntityEndPToken(paramEntityRef);
            checker.check(generalEntityDeclaration, ec);

            checker.check(end, ec);
            checker.check(externalSubsetEnd, ec);

            expect(ec.errors).toEqual([]);
         });
      });

      describe('with external parameter entity', () => {
         beforeEach(() => {
            const internalParameterEntityStartPToken = new ParameterEntityStartPToken(
               paramEntityRef,
            );
            checker.check(externalParamEntityDecl, ec);
            checker.check(internalParameterEntityStartPToken, ec);
         });

         it('reports no errors when all DTD tokens appear', () => {
            addAllTokens(checker, ec);

            expect(ec.errors).toEqual([]);
         });

         it('reports no error if a textdecl appears after an external parameter entity start', () => {
            checker.check(textDecl, ec);

            expect(ec.errors).toEqual([]);
         });

         it('closes the parameter entity and internal subset without problems', () => {
            const end = new ParameterEntityEndPToken(paramEntityRef);
            checker.check(generalEntityDeclaration, ec);

            checker.check(end, ec);
            checker.check(externalSubsetEnd, ec);

            expect(ec.errors).toEqual([]);
         });
      });

      // it('does not report an error if there is a parameter entity reference in a token in the external subset', () => {
      //    const notationDeclaration = new NotationDeclarationPToken({
      //       open: toSToken('<!'),
      //       peRefPlus: [
      //          {
      //             type: UnassignedType.REFERENCE,
      //             token: new ParameterEntityReferencePToken({
      //                open: toSToken('%'),
      //             }),
      //          },
      //       ],
      //    });

      //    checker.check(notationDeclaration, ec);

      //    expect(ec).not.toReportWFError({
      //       id: WellFormedError.ID.REFERENCE_INVALID_SUBSET_CONTEXT,
      //       params: [],
      //       position: notationDeclaration.open,
      //    });
      // });
   });

   describe('ATTLIST', () => {
      it('calls scanAttributeValues() on the attributes in the ATTLIST', () => {
         const spy = jest.spyOn(checkUtils, 'scanAttributeValues').mockImplementation();
         checker = new MarkupDeclChecker(internalSubsetStart, ec, checkState, []);

         checker.check(attributeListDeclaration, ec);

         expect(spy).toHaveBeenCalledWith(
            attributeListDeclaration.attDefs,
            {},
            expect.any(Object),
            [],
            ec,
         );
      });

      it('reports a warning when there are multiple ATTLIST declarations for the same element (§3.3.0)', () => {
         const firstDeclaration = new AttListDeclarationPToken({
            elementName: toSToken('one'),
            open: toSToken('<!'),
         });
         const secondDeclaration = new AttListDeclarationPToken({
            elementName: toSToken('one'),
            open: toSToken('<!'),
         });

         checker.check(firstDeclaration, ec);
         checker.check(secondDeclaration, ec);

         // @ts-expect-error 2329/matchers
         expect(ec).toReportWarning({
            id: WARNID.ATTLISTDECL_ELEMENT_XTRA_DECLARATION,
            params: ['one'],
            position: secondDeclaration.elementName,
         });
      });

      it('reports a warning when there are multiple att declarations with the same name across att defs (§3.3.0)', () => {
         const firstDeclaration = new AttListDeclarationPToken({
            attDefs: [
               {
                  name: toSToken('att1'),
                  value: [],
               },
            ],
            elementName: toSToken('one'),
            open: toSToken('<!'),
         });
         const secondDeclaration = new AttListDeclarationPToken({
            attDefs: [
               {
                  name: toSToken('att1'),
                  value: [],
               },
            ],
            elementName: toSToken('one'),
            open: toSToken('<!'),
         });

         checker.check(firstDeclaration, ec);
         checker.check(secondDeclaration, ec);

         // @ts-expect-error 2329/matchers
         expect(ec).toReportWarning({
            id: WARNID.ATTLISTDECL_ATTR_XTRA_DECLARATION,
            params: ['one', 'att1'],
            position: toSToken('att1'),
         });
      });

      it('reports a warning when there are multiple att declarations with the same name within one attdef (§3.3.0)', () => {
         const firstDeclaration = new AttListDeclarationPToken({
            attDefs: [
               {
                  name: toSToken('att1'),
                  value: [],
               },
               {
                  name: toSToken('att1'),
                  value: [],
               },
            ],
            elementName: toSToken('one'),
            open: toSToken('<!'),
         });

         checker.check(firstDeclaration, ec);

         // @ts-expect-error 2329/matchers
         expect(ec).toReportWarning({
            id: WARNID.ATTLISTDECL_ATTR_XTRA_DECLARATION,
            params: ['one', 'att1'],
            position: toSToken('att1'),
         });
      });

      it('updates the state with information about which attributes have been seen', () => {
         checker = new MarkupDeclChecker(parameterEntityStart, ec, checkState, []);

         checker.check(attributeListDeclaration, ec);

         expect(checkState).toMatchObject({
            atts: {
               elStart: {
                  att1: true,
               },
            },
         });
      });

      describe('attribute content', () => {
         it('reports an error in the case of unbalanced entity starts and ends', () => {
            const refTwo = new GeneralEntityReferencePToken({
               open: toSToken('&'),
               name: toSToken('second'),
            });
            const generalEntityStartTwo = new GeneralEntityStartPToken(refTwo);
            const attList = new AttListDeclarationPToken({
               open: toSToken('<'),
               attDefs: [
                  {
                     name: toSToken('first'),
                     value: [generalEntityStart, generalEntityStartTwo, generalEntityEnd],
                  },
               ],
            });
            const checker = new MarkupDeclChecker(internalSubsetStart, ec, checkState, []);

            checker.check(attList, ec);

            // @ts-expect-error 2329/matchers
            expect(ec).toReportWFError({
               id: WellFormedError.ID.ATTRIBUTE_REFERENCE_UNBALANCED,
               params: ['testRef', 'second'],
               position: generalEntityEnd.referencePToken.open,
            });
         });

         it('reports no errors when entity start and ends are properly blanced', () => {
            const generalEntityStartTwo = new GeneralEntityStartPToken(generalEntityReference);
            const generalEntityEndTwo = new GeneralEntityEndPToken(generalEntityReference);
            const attList = new AttListDeclarationPToken({
               open: toSToken('<'),
               attDefs: [
                  {
                     name: toSToken('first'),
                     value: [
                        generalEntityStart,
                        generalEntityStartTwo,
                        generalEntityEndTwo,
                        generalEntityEnd,
                     ],
                  },
               ],
            });
            const checker = new MarkupDeclChecker(internalSubsetStart, ec, checkState, []);

            checker.check(attList, ec);

            // @ts-expect-error 2329/matchers
            expect(ec).toNotReportError(WellFormedError.ID.ATTRIBUTE_REFERENCE_UNBALANCED);
         });

         it('reports no error if a declared reference is found (§4.1.0)', () => {
            const attList = new AttListDeclarationPToken({
               open: toSToken('<'),
               attDefs: [
                  {
                     name: toSToken('first'),
                     value: [generalEntityStart],
                  },
               ],
            });
            const state = new CheckState();
            state.generalDecls.testRef = {
               token: new GeneralEntityDeclarationPToken({
                  open: toSToken('<!'),
               }),
               declaredInInternalSubset: true,
            };
            const checker = new MarkupDeclChecker(internalSubsetStart, ec, state, []);

            checker.check(attList, ec);

            expect(ec.errors).toEqual([]);
         });

         it('reports an error if an undeclared reference is found (§4.1.0)', () => {
            const attList = new AttListDeclarationPToken({
               open: toSToken('<'),
               attDefs: [
                  {
                     name: toSToken('first'),
                     value: [generalEntityStart],
                  },
               ],
            });
            const state = new CheckState();
            const checker = new MarkupDeclChecker(internalSubsetStart, ec, state, []);

            checker.check(attList, ec);

            // @ts-expect-error 2329/matchers
            expect(ec).toReportWFError({
               id: WellFormedError.ID.REFERENCE_NO_DECLARATION,
               params: ['testRef'],
               position: generalEntityReference.open,
            });
         });

         it('reports no error if an undeclared reference is found but there is an external subset (logically wrong, but matches the spec) (§4.1.0)', () => {
            const attList = new AttListDeclarationPToken({
               open: toSToken('<'),
               attDefs: [
                  {
                     name: toSToken('first'),
                     value: [generalEntityStart],
                  },
               ],
            });
            const state = new CheckState();
            state.hasExternalDTD = true;
            const checker = new MarkupDeclChecker(internalSubsetStart, ec, state, []);

            checker.check(attList, ec);

            expect(ec.errors).toEqual([]);
         });

         it('reports no error if an undeclared reference is found, no external subset, but there are perefs before the attlist (§4.1.0)', () => {
            const attList = new AttListDeclarationPToken({
               open: toSToken('<'),
               attDefs: [
                  {
                     name: toSToken('first'),
                     value: [generalEntityStart],
                  },
               ],
            });
            const state = new CheckState();
            state.peRefCount = 1;
            const checker = new MarkupDeclChecker(internalSubsetStart, ec, state, []);

            checker.check(attList, ec);

            expect(ec.errors).toEqual([]);
         });

         it('reports an error if an entity references an external entiy (§3.1.0)', () => {
            const attList = new AttListDeclarationPToken({
               open: toSToken('<'),
               attDefs: [
                  {
                     name: toSToken('first'),
                     value: [generalEntityStart],
                  },
               ],
            });
            const state = new CheckState();
            state.generalDecls.testRef = {
               token: new GeneralEntityDeclarationPToken({
                  open: toSToken('<!'),
                  externalId: {},
               }),
               declaredInInternalSubset: false,
            };
            const checker = new MarkupDeclChecker(internalSubsetStart, ec, state, []);

            checker.check(attList, ec);

            // @ts-expect-error 2329/matchers
            expect(ec).toReportWFError({
               id: WellFormedError.ID.ATTRIBUTE_INVALID_REFERENCE,
               params: ['testRef'],
               position: generalEntityStart.referencePToken.open,
            });
         });

         it('reports an error when unparsed entity referenced from attr value (§4.1.0)', () => {
            const attList = new AttListDeclarationPToken({
               open: toSToken('<'),
               attDefs: [
                  {
                     name: toSToken('first'),
                     value: [generalEntityStart],
                  },
               ],
            });
            const state = new CheckState();
            state.generalDecls.testRef = {
               token: new GeneralEntityDeclarationPToken({
                  open: toSToken('<!'),
                  nDataName: toSToken('foo'),
               }),
               declaredInInternalSubset: false,
            };
            const checker = new MarkupDeclChecker(internalSubsetStart, ec, state, []);

            checker.check(attList, ec);

            // @ts-expect-error 2329/matchers
            expect(ec).toReportWFError({
               id: WellFormedError.ID.REFERENCE_UNPARSED_NO_USE,
               params: ['testRef'],
               position: generalEntityStart.referencePToken.open,
            });
         });
      });
   });

   describe('ELEMENT', () => {
      it('records when an element declaration was not for an EMPTY element in the check state', () => {
         checker = new MarkupDeclChecker(internalSubsetStart, ec, checkState, []);

         checker.check(makeElementDeclaration(), ec);

         expect(checkState.elementDecl.elementName).toEqual(undefined);
      });

      it('records when an element declaration was for an EMPTY element in the check state', () => {
         checker = new MarkupDeclChecker(internalSubsetStart, ec, checkState, []);

         checker.check(
            new ElementDeclarationPToken({
               contentSpec: toSToken('empty'),
               name: toSToken('foo'),
               open: toSToken('<!'),
            }),
            ec,
         );

         expect(checkState.elementDecl.foo).toEqual('EMPTY');
      });
   });

   describe('general entity declaration', () => {
      it('adds a general entity declaration to the generalDecls', () => {
         checker = new MarkupDeclChecker(internalSubsetStart, ec, checkState, [], true);

         checker.check(generalEntityDeclaration, ec);

         expect(checkState.generalDecls.geDecl?.token).toEqual(generalEntityDeclaration);
      });

      it('does not replace an general entity in the state with a new one from the external subset', () => {
         const name = strOrBlank(generalEntityDeclaration.name);
         checkState.generalDecls[name] = {
            token: generalEntityDeclaration,
            declaredInInternalSubset: true,
         };
         checker = new MarkupDeclChecker(externalSubsetStart, ec, checkState, []);
         const secondDeclaration = makeGeneralEntityDeclaration();

         checker.check(secondDeclaration, ec);

         expect(checkState.generalDecls[name]?.token).toBe(generalEntityDeclaration);
         expect(checkState.generalDecls[name]?.declaredInInternalSubset).toEqual(true);
      });

      it('reports a warning when there is a second declaration of an entity with the same name (¶4.2.0)', () => {
         const firstDeclaration = makeGeneralEntityDeclaration();
         const secondDeclaration = makeGeneralEntityDeclaration();

         checker.check(firstDeclaration, ec);
         checker.check(secondDeclaration, ec);

         // @ts-expect-error 2329/matchers
         expect(ec).toReportWarning({
            id: WARNID.ENTITYDECL_XRA_DECLARATION,
            params: ['geDecl'],
            position: secondDeclaration.open,
         });
      });
   });

   describe('parameter entity reference', () => {
      it('marks that we do not have all declarations after encountering a PE ref in an internal subset', () => {
         checker = new MarkupDeclChecker(internalSubsetStart, ec, checkState, [], false);

         checker.check(paramEntityRef, ec);

         expect(checkState.peRefCount).toEqual(1);
      });

      it('reports an error if there is self-recursive recursive reference in a parameter entity value', () => {
         const peRefToTwo = new ParameterEntityReferencePToken({
            open: toSToken('%'),
            name: toSToken('two'),
         });
         const peDecl2 = new ParameterEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('two'),
            value: [
               new ParameterEntityStartPToken(peRefToTwo),
               new ParameterEntityEndPToken(peRefToTwo),
            ],
         });
         checker = new MarkupDeclChecker(internalSubsetStart, ec, checkState, [], false);

         checker.check(peDecl2, ec);

         // @ts-expect-error 2329/matchers
         expect(ec).toReportWFError({
            id: WellFormedError.ID.REFERENCE_INVALID_RECURSION,
            params: ['two'],
            position: peRefToTwo.open,
         });
      });

      it('does not report an error if there is reference in a general entity value to a parameter entity with the same name as the general entity', () => {
         const peDecl = new ParameterEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('two'),
            value: [],
         });
         const peRefToTwo = new ParameterEntityReferencePToken({
            open: toSToken('%'),
            name: toSToken('two'),
         });
         const geDecl = new ParameterEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('two'),
            value: [
               new ParameterEntityStartPToken(peRefToTwo),
               new ParameterEntityEndPToken(peRefToTwo),
            ],
         });
         checker = new MarkupDeclChecker(internalSubsetStart, ec, checkState, [], false);

         checker.check(peDecl, ec);
         checker.check(geDecl, ec);

         // @ts-expect-error 2329/matchers
         expect(ec).not.toReportWFError({
            id: WellFormedError.ID.REFERENCE_INVALID_RECURSION,
            params: ['two'],
            position: peRefToTwo.open,
         });
      });

      it('reports an error if a parameter entity reference in a declaration value is also in the contxt', () => {
         const refToTestEnity = new ParameterEntityReferencePToken({
            open: toSToken('%'),
            name: toSToken('testEntity'),
         });
         const peDecl = new ParameterEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('two'),
            value: [
               new ParameterEntityStartPToken(refToTestEnity),
               new ParameterEntityEndPToken(refToTestEnity),
            ],
         });
         checker = new MarkupDeclChecker(
            internalSubsetStart,
            ec,
            checkState,
            ['testEntity'],
            false,
         );

         checker.check(peDecl, ec);

         // @ts-expect-error 2329/matchers
         expect(ec).toReportWFError({
            id: WellFormedError.ID.REFERENCE_INVALID_RECURSION,
            params: ['testEntity'],
            position: refToTestEnity.open,
         });
      });

      it('reports a warning when there is a second declaration of an entity with the same name (¶4.2.0)', () => {
         const firstDeclaration = makeParameterEntityDeclaration();
         const secondDeclaration = makeParameterEntityDeclaration();

         checker.check(firstDeclaration, ec);
         checker.check(secondDeclaration, ec);

         // @ts-expect-error 2329/matchers
         expect(ec).toReportWarning({
            id: WARNID.ENTITYDECL_XRA_DECLARATION,
            params: ['entityName'],
            position: secondDeclaration.open,
         });
      });
   });

   describe('elided parameter entity', () => {
      it('reports an error if a parameter entity reference in an elided declaration value is also in the contxt', () => {
         const refToTestEnity = new ParameterEntityReferencePToken({
            open: toSToken('%'),
            name: toSToken('testEntity'),
         });
         const peDecl = new ParameterEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('two'),
            value: [],
         });
         const elided = new ElidedEntityDeclarationPToken(peDecl, [
            new ParameterEntityStartPToken(refToTestEnity),
            new ParameterEntityEndPToken(refToTestEnity),
         ]);
         checker = new MarkupDeclChecker(
            internalSubsetStart,
            ec,
            checkState,
            ['testEntity'],
            false,
         );

         checker.check(peDecl, ec);
         checker.check(elided, ec);

         // @ts-expect-error 2329/matchers
         expect(ec).toReportWFError({
            id: WellFormedError.ID.REFERENCE_INVALID_RECURSION,
            params: ['testEntity'],
            position: refToTestEnity.open,
         });
      });
   });

   describe('embedded parameter entity', () => {
      it('returns done after going through a parameter entity and then ending the subset', () => {
         checker = new MarkupDeclChecker(externalSubsetStart, ec, checkState, []);
         checker.check(comment, ec);
         checker.check(parameterEntityStart, ec);
         checker.check(comment, ec);
         checker.check(parameterEntityEnd, ec);
         checker.check(comment, ec);

         const result = checker.check(externalSubsetEnd, ec);

         expect(result).toEqual(CHECKER_DONE);
      });

      it('returns done after going through an external param entity ref and then ending the subset', () => {
         checker = new MarkupDeclChecker(externalSubsetStart, ec, checkState, []);
         checker.check(externalParamEntityDecl, ec);
         checker.check(comment, ec);
         checker.check(parameterEntityStart, ec);
         checker.check(comment, ec);
         checker.check(parameterEntityEnd, ec);
         checker.check(comment, ec);

         const result = checker.check(externalSubsetEnd, ec);

         expect(result).toEqual(CHECKER_DONE);
      });

      it('reports a recursive error if a parameter entity start matches the name of this checker start (§4.1.0)', () => {
         const peRef2 = new ParameterEntityReferencePToken({
            open: toSToken('%'),
            name: toSToken('entityName'),
         });
         const peStart2 = new ParameterEntityStartPToken(peRef2);
         checker = new MarkupDeclChecker(parameterEntityStart, ec, checkState, []);

         checker.check(peStart2, ec);

         // @ts-expect-error 2329/matchers
         expect(ec).toReportWFError({
            id: WellFormedError.ID.REFERENCE_INVALID_RECURSION,
            params: ['entityName'],
            position: peRef2.open,
         });
      });

      it('cleans up the peContext after a parameter entity end (that is, starting a new pe after ending one does not leave the state corrupted) (§4.1.0)', () => {
         const localCheckState = {
            ...checkState,
            paramDecls: {
               entityName: parameterEntityDeclaration,
               foo: parameterEntityDeclaration,
            },
         };
         const peStart2 = new ParameterEntityStartPToken(
            new ParameterEntityReferencePToken({
               open: toSToken('%'),
               name: toSToken('foo'),
            }),
         );
         checker = new MarkupDeclChecker(peStart2, ec, localCheckState, []);

         checker.check(parameterEntityStart, ec);
         checker.check(parameterEntityEnd, ec);
         checker.check(parameterEntityStart, ec);

         expect(ec.errors.length).toEqual(0);
      });

      it('does not report a recursive error if a parameter entity start does not match the name of this checker start (§4.1.0)', () => {
         const peRef2 = new ParameterEntityReferencePToken({
            open: toSToken('%'),
            name: toSToken('entityName2'),
         });
         const peStart2 = new ParameterEntityStartPToken(peRef2);
         checker = new MarkupDeclChecker(parameterEntityStart, ec, checkState, []);

         checker.check(peStart2, ec);

         // @ts-expect-error 2329/matchers
         expect(ec).not.toReportWFError({
            id: WellFormedError.ID.REFERENCE_INVALID_RECURSION,
            params: ['entityName2'],
            position: peRef2.open,
         });
      });

      it('reports a recursive error if a parameter entity reference matches the name of this checker start (§4.1.0)', () => {
         const peRef2 = new ParameterEntityReferencePToken({
            open: toSToken('%'),
            name: toSToken('entityName'),
         });
         checker = new MarkupDeclChecker(parameterEntityStart, ec, checkState, []);

         checker.check(peRef2, ec);

         // @ts-expect-error 2329/matchers
         expect(ec).toReportWFError({
            id: WellFormedError.ID.REFERENCE_INVALID_RECURSION,
            params: ['entityName'],
            position: peRef2.open,
         });
      });
   });
});
