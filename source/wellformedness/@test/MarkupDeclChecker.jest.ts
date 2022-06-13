/* Copyright ® 2019-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ParamCollector } from 'basic-test';
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
import { strOrBlank, toSToken } from 'basic';
import {
   CommentPToken,
   ExternalSubsetStartToken,
   ExternalSubsetEndToken,
   ParameterEntityStartPToken,
   ParameterEntityEndPToken,
   GeneralEntityStartPToken,
   GeneralEntityEndPToken,
   ElidedEntityDeclarationPToken,
   ConditionalStartPToken,
   ConditionalEndPToken,
   DocTypeStartPToken,
   DocTypeEndPToken,
} from 'token';

import { wellFormedErrorCodes } from '../error/wellFormedError';
import { MarkupDeclChecker } from '../MarkupDeclChecker';
import * as checkUtils from '../checkUtils';
import { CheckState, CHECKER_DONE } from '../checkUtils';

import {
   makeTextDecl,
   makeParameterEntityDeclaration,
   makeComment,
   makeAttListDeclaration,
   makeDocTypeStart,
   makeParameterEntityReference,
   makeExternalSubsetEnd,
   makeExternalSubsetStart,
   makeParameterExternalEntityDeclaration,
   makeGeneralEntityDeclaration,
   makeGeneralEntityReference,
   makeSpace,
   makeProcessingInstruction,
   makeNotationDeclaration,
   makeElementDeclaration,
   makeDocTypeEnd,
} from 'token-test';

import { warningCodes } from '../error/warningCodes';

const WFEID = wellFormedErrorCodes.id;

const WID = warningCodes.id;

describe('MarkupDeclChecker (unit)', () => {
   let collector: ParamCollector;
   let checker: MarkupDeclChecker;
   let checkState: CheckState;
   let attributeListDeclaration: AttListDeclarationPToken;
   let comment: CommentPToken;
   let docTypeStart: DocTypeStartPToken;
   let docTypeEnd: DocTypeEndPToken;
   let generalEntityDeclaration: GeneralEntityDeclarationPToken;
   let generalEntityReference: GeneralEntityReferencePToken;
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
      collector = new ParamCollector();
      checkState = new CheckState();
      attributeListDeclaration = makeAttListDeclaration();
      comment = makeComment();
      docTypeStart = makeDocTypeStart();
      docTypeEnd = makeDocTypeEnd();
      externalSubsetStart = makeExternalSubsetStart();
      externalSubsetEnd = makeExternalSubsetEnd();
      generalEntityDeclaration = makeGeneralEntityDeclaration();
      generalEntityReference = makeGeneralEntityReference();
      generalEntityEnd = new GeneralEntityEndPToken(generalEntityReference);
      generalEntityStart = new GeneralEntityStartPToken(generalEntityReference);
      paramEntityRef = makeParameterEntityReference();
      parameterEntityDeclaration = makeParameterEntityDeclaration();
      parameterEntityEnd = new ParameterEntityEndPToken(paramEntityRef);
      parameterEntityStart = new ParameterEntityStartPToken(paramEntityRef);
      internalParamEntityDecl = makeParameterEntityDeclaration();
      externalParamEntityDecl = makeParameterExternalEntityDeclaration();
      textDecl = makeTextDecl();
   });

   function addAllTokens(checker: MarkupDeclChecker, collector: ParamCollector): void {
      checker.check(comment, collector);
      checker.check(makeSpace(), collector);
      checker.check(makeProcessingInstruction(), collector);
      checker.check(makeAttListDeclaration(), collector);
      checker.check(makeElementDeclaration(), collector);
      checker.check(makeGeneralEntityDeclaration(), collector);
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
      checker.check(otherPeDecl, collector);
      checker.check(makeNotationDeclaration(), collector);
   }

   describe('starting', () => {
      it('can be started with a parameter entity start token', () => {
         checkState.paramDecls.entityName = parameterEntityDeclaration;

         new MarkupDeclChecker(parameterEntityStart, collector, checkState, []);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('closes a parameter entity', () => {
         checker = new MarkupDeclChecker(parameterEntityStart, collector, checkState, []);

         checker.check(parameterEntityEnd, collector);

         expect(() => checker.check(comment, collector)).toThrowError(
            /Passed a token to MarkupDeclChecker/,
         );
      });
   });

   describe('internal subset', () => {
      beforeEach(() => {
         collector = new ParamCollector();
         checker = new MarkupDeclChecker(docTypeStart, collector, checkState, []);
      });

      it('can be started with an internal subset start token', () => {
         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('reports an error if a textdecl appears after an internal subset start', () => {
         checker = new MarkupDeclChecker(docTypeStart, collector, checkState, []);

         checker.check(textDecl, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.MARKUPDECL_INVALID_TOKEN,
            params: [textDecl.type],
            position: textDecl.open,
         });
      });

      it('reports no errors if it is closed with an InternalSubsetEndPToken', () => {
         checker.check(docTypeEnd, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('reports an error if called after an internal subset closed it', () => {
         checker.check(docTypeEnd, collector);

         expect(() => checker.check(comment, collector)).toThrowError(
            /Passed a token to MarkupDeclChecker/,
         );
      });

      it('reports no errors when all DTD tokens appear', () => {
         addAllTokens(checker, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      describe('with internal parameter entity', () => {
         let internalParameterEntityStartPToken: ParameterEntityStartPToken;

         beforeEach(() => {
            internalParameterEntityStartPToken = new ParameterEntityStartPToken(paramEntityRef);

            checker.check(internalParamEntityDecl, collector);
            checker.check(internalParameterEntityStartPToken, collector);
         });

         it('reports no errors when all DTD tokens appear', () => {
            addAllTokens(checker, collector);

            // @ts-expect-error 2329/matchers
            expect(collector).not.toHaveAnyProblems();
         });

         it('reports an error if a textdecl appears after an internal parameter entity start', () => {
            checker.check(textDecl, collector);

            // @ts-expect-error 2329/matchers
            expect(collector).toHaveWellFormedError({
               id: WFEID.MARKUPDECL_INVALID_TOKEN,
               params: [textDecl.type],
               position: textDecl.open,
            });
         });

         it('closes the parameter entity and internal subset without problems', () => {
            const end = new ParameterEntityEndPToken(paramEntityRef);
            checker.check(generalEntityDeclaration, collector);

            checker.check(end, collector);
            checker.check(docTypeEnd, collector);

            // @ts-expect-error 2329/matchers
            expect(collector).not.toHaveAnyProblems();
         });
      });

      describe('with external parameter entity', () => {
         let externalParameterEntityStartPToken: ParameterEntityStartPToken;

         beforeEach(() => {
            externalParameterEntityStartPToken = new ParameterEntityStartPToken(paramEntityRef);

            checker.check(externalParamEntityDecl, collector);
            checker.check(externalParameterEntityStartPToken, collector);
         });

         it('reports no errors when all DTD tokens appear', () => {
            addAllTokens(checker, collector);

            // @ts-expect-error 2329/matchers
            expect(collector).not.toHaveAnyProblems();
         });

         it('reports no error if a textdecl appears after an external parameter entity start', () => {
            checker.check(textDecl, collector);

            // @ts-expect-error 2329/matchers
            expect(collector).not.toHaveAnyProblems();
         });

         it('reports no error if a conditional section appears after an external parameter entity start', () => {
            checker.check(new ConditionalStartPToken({ open: toSToken('<!') }), collector);

            // @ts-expect-error 2329/matchers
            expect(collector).not.toHaveAnyProblems();
         });

         it('closes the parameter entity and internal subset without problems', () => {
            const end = new ParameterEntityEndPToken(paramEntityRef);
            checker.check(generalEntityDeclaration, collector);

            checker.check(end, collector);
            checker.check(docTypeEnd, collector);

            // @ts-expect-error 2329/matchers
            expect(collector).not.toHaveAnyProblems();
         });

         it('does not replace an parameter entity in the state with a second one', () => {
            const name = strOrBlank(parameterEntityDeclaration.name);
            checkState.paramDecls[name] = parameterEntityDeclaration;
            checker = new MarkupDeclChecker(externalSubsetStart, collector, checkState, []);
            const secondDeclaration = makeParameterEntityDeclaration();

            checker.check(secondDeclaration, collector);

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

      //    checker.check(notationDeclaration, collector);

      //    expect(collector).toHaveWellFormedError({
      //       id: WFEID.REFERENCE_INVALID_SUBSET_CONTEXT,
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

         checker.check(paramEntityDecl, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.REFERENCE_INVALID_SUBSET_CONTEXT,
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

         checker.check(paramEntityDecl, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.REFERENCE_INVALID_SUBSET_CONTEXT,
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

         checker.check(generalEntityDecl, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.REFERENCE_INVALID_SUBSET_CONTEXT,
            params: [],
            position: generalEntityDecl.open,
         });
      });
   });

   describe('external subset', () => {
      beforeEach(() => {
         checker = new MarkupDeclChecker(externalSubsetStart, collector, checkState, []);
      });

      it('can be started with an external subset start token', () => {
         new MarkupDeclChecker(externalSubsetStart, collector, checkState, []);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('reports no error if a textdecl appears after an external subset start', () => {
         checker = new MarkupDeclChecker(externalSubsetStart, collector, checkState, []);

         checker.check(textDecl, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('reports an error if a textdecl appears after a textdecl', () => {
         checker.check(textDecl, collector);
         checker.check(textDecl, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.MARKUPDECL_INVALID_TOKEN,
            params: [textDecl.type],
            position: textDecl.open,
         });
      });

      it('reports no errors when all DTD tokens appear', () => {
         checker.check(textDecl, collector);
         addAllTokens(checker, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('reports no errors if it is closed with an ExternalSubsetEndPToken', () => {
         checker.check(externalSubsetEnd, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('closes an external subset', () => {
         checker.check(externalSubsetEnd, collector);

         expect(() => checker.check(comment, collector)).toThrowError(
            /Passed a token to MarkupDeclChecker/,
         );
      });

      describe('with conditional section', () => {
         let conditionalSection: ConditionalStartPToken;

         beforeEach(() => {
            conditionalSection = new ConditionalStartPToken({
               open: toSToken('<!['),
               peRefPlus: [],
            });
         });

         it('an error if the end of the external subset happens', () => {
            checker.check(conditionalSection, collector);

            checker.check(new ExternalSubsetEndToken(), collector);

            // @ts-expect-error 2329/matchers
            expect(collector).toHaveWellFormedError({
               id: WFEID.CONDITIONAL_NO_CLOSE,
               params: [],
               position: conditionalSection.open,
            });
         });

         it('an error if the conditional section appears before the start of an external subset', () => {
            new MarkupDeclChecker(conditionalSection, collector, checkState, []);

            // @ts-expect-error 2329/matchers
            expect(collector).toHaveWellFormedError({
               id: WFEID.MARKUPDECL_INVALID_TOKEN,
               params: [conditionalSection.type],
               position: conditionalSection.open,
            });
         });

         it('an error if the conditional end is delivered without an opening', () => {
            const close = new ConditionalEndPToken({ open: toSToken(']>') });

            checker.check(close, collector);

            // @ts-expect-error 2329/matchers
            expect(collector).toHaveWellFormedError({
               id: WFEID.MARKUPDECL_INVALID_TOKEN,
               params: [close.type],
               position: close.open,
            });
         });
      });

      describe('with internal parameter entity', () => {
         let internalParameterEntityStartPToken: ParameterEntityStartPToken;

         beforeEach(() => {
            internalParameterEntityStartPToken = new ParameterEntityStartPToken(paramEntityRef);

            checker.check(internalParamEntityDecl, collector);
            checker.check(internalParameterEntityStartPToken, collector);
         });

         it('reports no errors when all DTD tokens appear', () => {
            addAllTokens(checker, collector);

            // @ts-expect-error 2329/matchers
            expect(collector).not.toHaveAnyProblems();
         });

         it('reports an error if a textdecl appears after an internal parameter entity start', () => {
            checker.check(textDecl, collector);

            // @ts-expect-error 2329/matchers
            expect(collector).toHaveWellFormedError({
               id: WFEID.MARKUPDECL_INVALID_TOKEN,
               params: [textDecl.type],
               position: textDecl.open,
            });
         });

         it('closes the parameter entity and internal subset without problems', () => {
            const end = new ParameterEntityEndPToken(paramEntityRef);
            checker.check(generalEntityDeclaration, collector);

            checker.check(end, collector);
            checker.check(externalSubsetEnd, collector);

            // @ts-expect-error 2329/matchers
            expect(collector).not.toHaveAnyProblems();
         });
      });

      describe('with external parameter entity', () => {
         beforeEach(() => {
            const internalParameterEntityStartPToken = new ParameterEntityStartPToken(
               paramEntityRef,
            );
            checker.check(externalParamEntityDecl, collector);
            checker.check(internalParameterEntityStartPToken, collector);
         });

         it('reports no errors when all DTD tokens appear', () => {
            addAllTokens(checker, collector);

            // @ts-expect-error 2329/matchers
            expect(collector).not.toHaveAnyProblems();
         });

         it('reports no error if a textdecl appears after an external parameter entity start', () => {
            checker.check(textDecl, collector);

            // @ts-expect-error 2329/matchers
            expect(collector).not.toHaveAnyProblems();
         });

         it('closes the parameter entity and internal subset without problems', () => {
            const end = new ParameterEntityEndPToken(paramEntityRef);
            checker.check(generalEntityDeclaration, collector);

            checker.check(end, collector);
            checker.check(externalSubsetEnd, collector);

            // @ts-expect-error 2329/matchers
            expect(collector).not.toHaveAnyProblems();
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

      //    checker.check(notationDeclaration, collector);

      //    expect(collector).not.toHaveWellFormedError({
      //       id: WFEID.REFERENCE_INVALID_SUBSET_CONTEXT,
      //       params: [],
      //       position: notationDeclaration.open,
      //    });
      // });
   });

   describe('ATTLIST', () => {
      it('calls scanAttributeValues() on the attributes in the ATTLIST', () => {
         const spy = jest.spyOn(checkUtils, 'scanAttributeValues').mockImplementation();
         checker = new MarkupDeclChecker(docTypeStart, collector, checkState, []);

         checker.check(attributeListDeclaration, collector);

         expect(spy).toHaveBeenCalledWith(
            attributeListDeclaration.attDefs,
            {},
            expect.any(Object),
            [],
            collector,
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

         checker.check(firstDeclaration, collector);
         checker.check(secondDeclaration, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWFWarning({
            id: WID.ATTLISTDECL_ELEMENT_XTRA_DECLARATION,
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

         checker.check(firstDeclaration, collector);
         checker.check(secondDeclaration, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWFWarning({
            id: WID.ATTLISTDECL_ATTR_XTRA_DECLARATION,
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

         checker.check(firstDeclaration, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWFWarning({
            id: WID.ATTLISTDECL_ATTR_XTRA_DECLARATION,
            params: ['one', 'att1'],
            position: toSToken('att1'),
         });
      });

      it('updates the state with information about which attributes have been seen', () => {
         checker = new MarkupDeclChecker(parameterEntityStart, collector, checkState, []);

         checker.check(attributeListDeclaration, collector);

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
               name: toSToken('second'),
               open: toSToken('&'),
            });
            const generalEntityStartTwo = new GeneralEntityStartPToken(refTwo);
            const attList = new AttListDeclarationPToken({
               attDefs: [
                  {
                     name: toSToken('first'),
                     value: [generalEntityStart, generalEntityStartTwo, generalEntityEnd],
                  },
               ],
               open: toSToken('<'),
            });
            const checker = new MarkupDeclChecker(docTypeStart, collector, checkState, []);

            checker.check(attList, collector);

            // @ts-expect-error 2329/matchers
            expect(collector).toHaveWellFormedError({
               id: WFEID.ATTRIBUTE_REFERENCE_UNBALANCED,
               params: ['testRef', 'second'],
               position: generalEntityEnd.referencePToken.open,
            });
         });

         it('reports no errors when entity start and ends are properly blanced', () => {
            const generalEntityStartTwo = new GeneralEntityStartPToken(generalEntityReference);
            const generalEntityEndTwo = new GeneralEntityEndPToken(generalEntityReference);
            const attList = new AttListDeclarationPToken({
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
               open: toSToken('<'),
            });
            const checker = new MarkupDeclChecker(docTypeStart, collector, checkState, []);

            checker.check(attList, collector);

            // @ts-expect-error 2329/matchers
            expect(collector).not.toHaveProblem(WFEID.ATTRIBUTE_REFERENCE_UNBALANCED);
         });

         it('reports no error if a declared reference is found (§4.1.0)', () => {
            const attList = new AttListDeclarationPToken({
               attDefs: [
                  {
                     name: toSToken('first'),
                     value: [generalEntityStart],
                  },
               ],
               open: toSToken('<'),
            });
            const state = new CheckState();
            state.generalDecls.testRef = {
               declaredInInternalSubset: true,
               token: new GeneralEntityDeclarationPToken({
                  open: toSToken('<!'),
               }),
            };
            const checker = new MarkupDeclChecker(docTypeStart, collector, state, []);

            checker.check(attList, collector);

            // @ts-expect-error 2329/matchers
            expect(collector).not.toHaveAnyProblems();
         });

         it('reports an error if an undeclared reference is found (§4.1.0)', () => {
            const attList = new AttListDeclarationPToken({
               attDefs: [
                  {
                     name: toSToken('first'),
                     value: [generalEntityStart],
                  },
               ],
               open: toSToken('<'),
            });
            const state = new CheckState();
            const checker = new MarkupDeclChecker(docTypeStart, collector, state, []);

            checker.check(attList, collector);

            // @ts-expect-error 2329/matchers
            expect(collector).toHaveWellFormedError({
               id: WFEID.REFERENCE_NO_DECLARATION,
               params: ['testRef'],
               position: generalEntityReference.open,
            });
         });

         it('reports no error if an undeclared reference is found but there is an external subset (logically wrong, but matches the spec) (§4.1.0)', () => {
            const attList = new AttListDeclarationPToken({
               attDefs: [
                  {
                     name: toSToken('first'),
                     value: [generalEntityStart],
                  },
               ],
               open: toSToken('<'),
            });
            const state = new CheckState();
            state.hasExternalDTD = true;
            const checker = new MarkupDeclChecker(docTypeStart, collector, state, []);

            checker.check(attList, collector);

            // @ts-expect-error 2329/matchers
            expect(collector).not.toHaveAnyProblems();
         });

         it('reports no error if an undeclared reference is found, no external subset, but there are perefs before the attlist (§4.1.0)', () => {
            const attList = new AttListDeclarationPToken({
               attDefs: [
                  {
                     name: toSToken('first'),
                     value: [generalEntityStart],
                  },
               ],
               open: toSToken('<'),
            });
            const state = new CheckState();
            state.peRefCount = 1;
            const checker = new MarkupDeclChecker(docTypeStart, collector, state, []);

            checker.check(attList, collector);

            // @ts-expect-error 2329/matchers
            expect(collector).not.toHaveAnyProblems();
         });

         it('reports an error if an entity references an external entiy (§3.1.0)', () => {
            const attList = new AttListDeclarationPToken({
               attDefs: [
                  {
                     name: toSToken('first'),
                     value: [generalEntityStart],
                  },
               ],
               open: toSToken('<'),
            });
            const state = new CheckState();
            state.generalDecls.testRef = {
               declaredInInternalSubset: false,
               token: new GeneralEntityDeclarationPToken({
                  externalId: {},
                  open: toSToken('<!'),
               }),
            };
            const checker = new MarkupDeclChecker(docTypeStart, collector, state, []);

            checker.check(attList, collector);

            // @ts-expect-error 2329/matchers
            expect(collector).toHaveWellFormedError({
               id: WFEID.ATTRIBUTE_INVALID_REFERENCE,
               params: ['testRef'],
               position: generalEntityStart.referencePToken.open,
            });
         });

         it('reports an error when unparsed entity referenced from attr value (§4.1.0)', () => {
            const attList = new AttListDeclarationPToken({
               attDefs: [
                  {
                     name: toSToken('first'),
                     value: [generalEntityStart],
                  },
               ],
               open: toSToken('<'),
            });
            const state = new CheckState();
            state.generalDecls.testRef = {
               declaredInInternalSubset: false,
               token: new GeneralEntityDeclarationPToken({
                  nDataName: toSToken('foo'),
                  open: toSToken('<!'),
               }),
            };
            const checker = new MarkupDeclChecker(docTypeStart, collector, state, []);

            checker.check(attList, collector);

            // @ts-expect-error 2329/matchers
            expect(collector).toHaveWellFormedError({
               id: WFEID.REFERENCE_UNPARSED_NO_USE,
               params: ['testRef'],
               position: generalEntityStart.referencePToken.open,
            });
         });
      });
   });

   describe('ELEMENT', () => {
      it('records when an element declaration was not for an EMPTY element in the check state', () => {
         checker = new MarkupDeclChecker(docTypeStart, collector, checkState, []);

         checker.check(makeElementDeclaration(), collector);

         expect(checkState.elementDecl.elementName).toEqual('OTHER');
      });

      it('records when an element declaration was for an EMPTY element in the check state', () => {
         checker = new MarkupDeclChecker(docTypeStart, collector, checkState, []);

         checker.check(
            new ElementDeclarationPToken({
               contentSpec: toSToken('empty'),
               name: toSToken('foo'),
               open: toSToken('<!'),
            }),
            collector,
         );

         expect(checkState.elementDecl.foo).toEqual('EMPTY');
      });
   });

   describe('general entity declaration', () => {
      it('adds a general entity declaration to the generalDecls', () => {
         checker = new MarkupDeclChecker(docTypeStart, collector, checkState, [], true);

         checker.check(generalEntityDeclaration, collector);

         expect(checkState.generalDecls.geDecl?.token).toEqual(generalEntityDeclaration);
      });

      it('does not replace an general entity in the state with a new one from the external subset', () => {
         const name = strOrBlank(generalEntityDeclaration.name);
         checkState.generalDecls[name] = {
            declaredInInternalSubset: true,
            token: generalEntityDeclaration,
         };
         checker = new MarkupDeclChecker(externalSubsetStart, collector, checkState, []);
         const secondDeclaration = makeGeneralEntityDeclaration();

         checker.check(secondDeclaration, collector);

         expect(checkState.generalDecls[name]?.token).toBe(generalEntityDeclaration);
         expect(checkState.generalDecls[name]?.declaredInInternalSubset).toEqual(true);
      });

      it('reports a warning when there is a second declaration of an entity with the same name (¶4.2.0)', () => {
         const firstDeclaration = makeGeneralEntityDeclaration();
         const secondDeclaration = makeGeneralEntityDeclaration();

         checker.check(firstDeclaration, collector);
         checker.check(secondDeclaration, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWFWarning({
            id: WID.ENTITYDECL_XRA_DECLARATION,
            params: ['geDecl'],
            position: secondDeclaration.open,
         });
      });
   });

   describe('parameter entity reference', () => {
      it('marks that we do not have all declarations after encountering a PE ref in an internal subset', () => {
         checker = new MarkupDeclChecker(docTypeStart, collector, checkState, [], false);

         checker.check(paramEntityRef, collector);

         expect(checkState.peRefCount).toEqual(1);
      });

      it('reports an error if there is self-recursive recursive reference in a parameter entity value', () => {
         const peRefToTwo = new ParameterEntityReferencePToken({
            name: toSToken('two'),
            open: toSToken('%'),
         });
         const peDecl2 = new ParameterEntityDeclarationPToken({
            name: toSToken('two'),
            open: toSToken('<!'),
            value: [
               new ParameterEntityStartPToken(peRefToTwo),
               new ParameterEntityEndPToken(peRefToTwo),
            ],
         });
         checker = new MarkupDeclChecker(docTypeStart, collector, checkState, [], false);

         checker.check(peDecl2, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.REFERENCE_INVALID_RECURSION,
            params: ['two'],
            position: peRefToTwo.open,
         });
      });

      it('does not report an error if there is reference in a general entity value to a parameter entity with the same name as the general entity', () => {
         const peDecl = new ParameterEntityDeclarationPToken({
            name: toSToken('two'),
            open: toSToken('<!'),
            value: [],
         });
         const peRefToTwo = new ParameterEntityReferencePToken({
            name: toSToken('two'),
            open: toSToken('%'),
         });
         const geDecl = new ParameterEntityDeclarationPToken({
            name: toSToken('two'),
            open: toSToken('<!'),
            value: [
               new ParameterEntityStartPToken(peRefToTwo),
               new ParameterEntityEndPToken(peRefToTwo),
            ],
         });
         checker = new MarkupDeclChecker(docTypeStart, collector, checkState, [], false);

         checker.check(peDecl, collector);
         checker.check(geDecl, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveWellFormedError({
            id: WFEID.REFERENCE_INVALID_RECURSION,
            params: ['two'],
            position: peRefToTwo.open,
         });
      });

      it('reports an error if a parameter entity reference in a declaration value is also in the contxt', () => {
         const refToTestEnity = new ParameterEntityReferencePToken({
            name: toSToken('testEntity'),
            open: toSToken('%'),
         });
         const peDecl = new ParameterEntityDeclarationPToken({
            name: toSToken('two'),
            open: toSToken('<!'),
            value: [
               new ParameterEntityStartPToken(refToTestEnity),
               new ParameterEntityEndPToken(refToTestEnity),
            ],
         });
         checker = new MarkupDeclChecker(
            docTypeStart,
            collector,
            checkState,
            ['testEntity'],
            false,
         );

         checker.check(peDecl, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.REFERENCE_INVALID_RECURSION,
            params: ['testEntity'],
            position: refToTestEnity.open,
         });
      });

      it('reports a warning when there is a second declaration of an entity with the same name (¶4.2.0)', () => {
         const firstDeclaration = makeParameterEntityDeclaration();
         const secondDeclaration = makeParameterEntityDeclaration();

         checker.check(firstDeclaration, collector);
         checker.check(secondDeclaration, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWFWarning({
            id: WID.ENTITYDECL_XRA_DECLARATION,
            params: ['entityName'],
            position: secondDeclaration.open,
         });
      });
   });

   describe('elided parameter entity', () => {
      it('reports an error if a parameter entity reference in an elided declaration value is also in the contxt', () => {
         const refToTestEnity = new ParameterEntityReferencePToken({
            name: toSToken('testEntity'),
            open: toSToken('%'),
         });
         const peDecl = new ParameterEntityDeclarationPToken({
            name: toSToken('two'),
            open: toSToken('<!'),
            value: [],
         });
         const elided = new ElidedEntityDeclarationPToken(peDecl, [
            new ParameterEntityStartPToken(refToTestEnity),
            new ParameterEntityEndPToken(refToTestEnity),
         ]);
         checker = new MarkupDeclChecker(
            docTypeStart,
            collector,
            checkState,
            ['testEntity'],
            false,
         );

         checker.check(peDecl, collector);
         checker.check(elided, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.REFERENCE_INVALID_RECURSION,
            params: ['testEntity'],
            position: refToTestEnity.open,
         });
      });
   });

   describe('embedded parameter entity', () => {
      it('returns done after going through a parameter entity and then ending the subset', () => {
         checker = new MarkupDeclChecker(externalSubsetStart, collector, checkState, []);
         checker.check(comment, collector);
         checker.check(parameterEntityStart, collector);
         checker.check(comment, collector);
         checker.check(parameterEntityEnd, collector);
         checker.check(comment, collector);

         const result = checker.check(externalSubsetEnd, collector);

         expect(result).toEqual(CHECKER_DONE);
      });

      it('returns done after going through an external param entity ref and then ending the subset', () => {
         checker = new MarkupDeclChecker(externalSubsetStart, collector, checkState, []);
         checker.check(externalParamEntityDecl, collector);
         checker.check(comment, collector);
         checker.check(parameterEntityStart, collector);
         checker.check(comment, collector);
         checker.check(parameterEntityEnd, collector);
         checker.check(comment, collector);

         const result = checker.check(externalSubsetEnd, collector);

         expect(result).toEqual(CHECKER_DONE);
      });

      it('reports a recursive error if a parameter entity start matches the name of this checker start (§4.1.0)', () => {
         const peRef2 = new ParameterEntityReferencePToken({
            name: toSToken('entityName'),
            open: toSToken('%'),
         });
         const peStart2 = new ParameterEntityStartPToken(peRef2);
         checker = new MarkupDeclChecker(parameterEntityStart, collector, checkState, []);

         checker.check(peStart2, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.REFERENCE_INVALID_RECURSION,
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
               name: toSToken('foo'),
               open: toSToken('%'),
            }),
         );
         checker = new MarkupDeclChecker(peStart2, collector, localCheckState, []);

         checker.check(parameterEntityStart, collector);
         checker.check(parameterEntityEnd, collector);
         checker.check(parameterEntityStart, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('does not report a recursive error if a parameter entity start does not match the name of this checker start (§4.1.0)', () => {
         const peRef2 = new ParameterEntityReferencePToken({
            name: toSToken('entityName2'),
            open: toSToken('%'),
         });
         const peStart2 = new ParameterEntityStartPToken(peRef2);
         checker = new MarkupDeclChecker(parameterEntityStart, collector, checkState, []);

         checker.check(peStart2, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveWellFormedError({
            id: WFEID.REFERENCE_INVALID_RECURSION,
            params: ['entityName2'],
            position: peRef2.open,
         });
      });

      it('reports a recursive error if a parameter entity reference matches the name of this checker start (§4.1.0)', () => {
         const peRef2 = new ParameterEntityReferencePToken({
            name: toSToken('entityName'),
            open: toSToken('%'),
         });
         checker = new MarkupDeclChecker(parameterEntityStart, collector, checkState, []);

         checker.check(peRef2, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.REFERENCE_INVALID_RECURSION,
            params: ['entityName'],
            position: peRef2.open,
         });
      });
   });
});
