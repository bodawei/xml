/* Copyright ® 2019-2026 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { toSToken } from 'basic';
import { ParamCollector } from 'basic-test';
import {
   NOTATION_DECLARATION_PTOKEN,
   TEXTDECL_PTOKEN,
   GeneralEntityDeclarationPToken,
   GeneralEntityReferencePToken,
   NotationDeclarationPToken,
   TextDeclarationPToken,
} from 'pToken';
import {
   GENERAL_ENTITY_END_PTOKEN,
   CdataPToken,
   CommentPToken,
   ElementEndPToken,
   ElementStartPToken,
   ElementEmptyPToken,
   GeneralEntityEndPToken,
   GeneralEntityStartPToken,
   CharDataPToken,
} from 'token';

import { CheckState, CHECKER_DONE } from '../checkUtils';
import { ContentChecker } from '../ContentChecker';
import { warningCodes } from '../error/warningCodes';
import { wellFormedErrorCodes } from '../error/wellFormedError';

const WFEID = wellFormedErrorCodes.id;
const WID = warningCodes.id;

describe('ContentChecker (unit)', () => {
   let collector: ParamCollector;
   let textDeclStart: TextDeclarationPToken;
   let elementStart: ElementStartPToken;
   let elementEnd: ElementEndPToken;
   let elementEmpty: ElementEmptyPToken;
   let cdata: CdataPToken;
   let comment: CommentPToken;
   let generalEntityStart: GeneralEntityStartPToken;
   let generalEntityEnd: GeneralEntityEndPToken;
   let generalEntityReference: GeneralEntityReferencePToken;

   beforeEach(() => {
      textDeclStart = new TextDeclarationPToken({ open: toSToken('<?') });
      cdata = new CdataPToken({ open: toSToken('<![') });
      comment = new CommentPToken({ open: toSToken('<!--') });
      elementStart = new ElementStartPToken({ name: toSToken('test'), open: toSToken('<') });
      elementEnd = new ElementEndPToken({ name: toSToken('test'), open: toSToken('</') });
      elementEmpty = new ElementEmptyPToken({ name: toSToken('test'), open: toSToken('<') });
      generalEntityReference = new GeneralEntityReferencePToken({
         name: toSToken('testRef'),
         open: toSToken('&'),
      });
      generalEntityStart = new GeneralEntityStartPToken(generalEntityReference);
      generalEntityEnd = new GeneralEntityEndPToken(generalEntityReference);

      collector = new ParamCollector();
   });

   function makeChecker(
      start: ElementStartPToken | ElementEmptyPToken | GeneralEntityStartPToken,
      state: CheckState = new CheckState(),
   ) {
      return new ContentChecker(start, collector, state, []);
   }

   describe('misc', () => {
      it('throws an error if called after it is already done', () => {
         const checker = makeChecker(elementEmpty);

         expect(() => checker.check(generalEntityReference, collector)).toThrow(
            /Passed a token to ContentChecker/,
         );
      });
   });

   describe('stacking of elements', () => {
      it('reports done if the first token is an empty element', () => {
         const checker = makeChecker(elementEmpty);

         expect(checker.isDone).toEqual(true);
      });

      it('reports done if called with a start and then a matching end, and the start was an element start', () => {
         const checker = makeChecker(elementStart);

         const result = checker.check(elementEnd, collector);

         expect(result).toEqual(CHECKER_DONE);
      });

      it('does not report done if called with a start and then a matching end, and the start was a general entity', () => {
         const checker = makeChecker(generalEntityStart);

         checker.check(elementStart, collector);
         const result = checker.check(elementEnd, collector);

         expect(result).toEqual(undefined);
      });

      it('reports no error if an empty element appears between start and end', () => {
         const state = new CheckState();
         state.elementDecl.test = 'EMPTY';
         const checker = makeChecker(elementStart, state);

         checker.check(elementEmpty, collector);
         checker.check(elementEnd, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('reports a warning if an empty element is used for an element that is not empty', () => {
         const state = new CheckState();
         state.elementDecl.test = undefined;
         const checker = makeChecker(elementStart, state);

         checker.check(elementEmpty, collector);
         checker.check(elementEnd, collector);

         // @ts-expect-error TS2339 - matchers
         expect(collector).toHaveWFWarning({
            id: WID.ELEMENT_EMPTY_WITH_NONEMPTY_DECL,
            params: ['test'],
            position: elementEmpty.open,
         });
      });

      it('reports an unbalanced message if name of an end element does not match what is on the stack', () => {
         const unbalancedElement = new ElementEndPToken({
            name: toSToken('bogus'),
            open: toSToken('</'),
         });
         const checker = makeChecker(elementStart);

         checker.check(unbalancedElement, collector);

         // @ts-expect-error TS2339 - matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.ELEMENT_UNBALANCED,
            params: ['test', 'bogus'],
            position: unbalancedElement.open,
         });
      });

      it('reports an unbalanced message if there are multiple closes that do not match the current stack value', () => {
         const unbalancedEnd = new ElementEndPToken({
            name: toSToken('bogus'),
            open: toSToken('</'),
         });
         const unbalancedEnd2 = new ElementEndPToken({
            name: toSToken('bogus2'),
            open: toSToken('</'),
         });
         const checker = makeChecker(elementStart);

         checker.check(unbalancedEnd, collector);
         checker.check(unbalancedEnd2, collector);

         // @ts-expect-error TS2339 - matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.ELEMENT_UNBALANCED,
            params: ['test', 'bogus2'],
            position: unbalancedEnd2.open,
         });
      });

      it('reports an unbalanced message if there is an end immediately after an opening general entity', () => {
         const checker = makeChecker(generalEntityStart);

         checker.check(elementEnd, collector);

         // @ts-expect-error TS2339 - matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.ELEMENT_UNBALANCED,
            params: ['', 'test'],
            position: elementEnd.open,
         });
      });

      it('reports done after multiple unbalanced ends and then the correct end', () => {
         const unbalancedEnd = new ElementEndPToken({
            name: toSToken('bogus'),
            open: toSToken('</'),
         });
         const unbalancedEnd2 = new ElementEndPToken({
            name: toSToken('bogus2'),
            open: toSToken('</'),
         });
         const checker = makeChecker(elementStart);

         checker.check(unbalancedEnd, collector);
         checker.check(unbalancedEnd2, collector);
         const result = checker.check(elementEnd, collector);

         expect(result).toEqual(CHECKER_DONE);
      });

      it('reports a recursive error if a general entity start matches the name of this checker start (§4.1.0)', () => {
         const geRef2 = new GeneralEntityReferencePToken({
            name: toSToken('testRef'),
            open: toSToken('&'),
         });
         const geStart2 = new GeneralEntityStartPToken(geRef2);
         const checker = makeChecker(generalEntityStart);

         checker.check(geStart2, collector);

         // @ts-expect-error TS2339 - matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.REFERENCE_INVALID_RECURSION,
            params: ['testRef'],
            position: geRef2.open,
         });
      });

      it('reports no recursive error if a general entity start has no name (§4.1.0)', () => {
         const geRef2 = new GeneralEntityReferencePToken({
            open: toSToken('&'),
         });
         const geStart2 = new GeneralEntityStartPToken(geRef2);
         const checker = makeChecker(generalEntityStart);

         checker.check(geStart2, collector);

         // @ts-expect-error TS2339 - matchers
         expect(collector).not.toHaveProblem(WFEID.REFERENCE_INVALID_RECURSION);
      });

      it('does not report a recursive error if a general entity start matches the name of this checker start (§4.1.0)', () => {
         const geRef2 = new GeneralEntityReferencePToken({
            name: toSToken('testRef2'),
            open: toSToken('&'),
         });
         const geStart2 = new GeneralEntityStartPToken(geRef2);
         const checker = makeChecker(generalEntityStart);

         checker.check(geStart2, collector);

         // @ts-expect-error TS2339 - matchers
         expect(collector).not.toHaveWellFormedError({
            id: WFEID.REFERENCE_INVALID_RECURSION,
            params: ['testRef2'],
            position: geRef2.open,
         });
      });

      it('reports a recursive error if a general entity reference matches the name of this checker start (§4.1.0)', () => {
         const geRef2 = new GeneralEntityReferencePToken({
            name: toSToken('testRef'),
            open: toSToken('&'),
         });
         const checker = makeChecker(generalEntityStart);

         checker.check(geRef2, collector);

         // @ts-expect-error TS2339 - matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.REFERENCE_INVALID_RECURSION,
            params: ['testRef'],
            position: geRef2.open,
         });
      });

      it('@reports no recursive error if a general entity reference has no name (§4.1.0)', () => {
         const geRef2 = new GeneralEntityReferencePToken({
            name: undefined,
            open: toSToken('&'),
         });
         const checker = makeChecker(generalEntityStart);

         checker.check(geRef2, collector);

         // @ts-expect-error TS2339 - matchers
         expect(collector).not.toHaveProblem(WFEID.REFERENCE_INVALID_RECURSION);
      });
   });

   describe('token context', () => {
      it('reports no errors if a TextDecl is found after a general entity start, and it is an external entity', () => {
         const state = new CheckState();
         state.generalDecls.testRef = {
            declaredInInternalSubset: true,
            token: new GeneralEntityDeclarationPToken({
               externalId: {},
               open: toSToken('<!'),
            }),
         };
         const checker = makeChecker(generalEntityStart, state);

         checker.check(textDeclStart, collector);

         // @ts-expect-error TS2339 - matchers
         expect(collector).not.toHaveProblem(WFEID.CONTENT_INVALID_TOKEN);
      });

      it('reports an error if a TextDecl is found after a general entity start, and it is an internal entity', () => {
         const state = new CheckState();
         state.generalDecls.test = {
            declaredInInternalSubset: true,
            token: new GeneralEntityDeclarationPToken({
               externalId: {},
               open: toSToken('<!'),
            }),
         };
         const checker = makeChecker(generalEntityStart, state);

         checker.check(textDeclStart, collector);

         // @ts-expect-error TS2339 - matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.CONTENT_INVALID_TOKEN,
            params: [TEXTDECL_PTOKEN],
            position: textDeclStart.open,
         });
      });

      it('reports no errors if a CData section is found after a general entity start', () => {
         const checker = makeChecker(generalEntityStart);

         checker.check(cdata, collector);

         // @ts-expect-error TS2339 - matchers
         expect(collector).not.toHaveProblem(WFEID.CONTENT_INVALID_TOKEN);
      });

      it('reports an error if a TextDecl is found after an a comment after a general entity start', () => {
         const checker = makeChecker(generalEntityStart);

         checker.check(comment, collector);
         checker.check(textDeclStart, collector);

         // @ts-expect-error TS2339 - matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.CONTENT_INVALID_TOKEN,
            params: [TEXTDECL_PTOKEN],
            position: textDeclStart.open,
         });
      });

      it('reports an error if a TextDecl is found after an element start', () => {
         const checker = makeChecker(elementStart);

         checker.check(textDeclStart, collector);

         // @ts-expect-error TS2339 - matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.CONTENT_INVALID_TOKEN,
            params: [TEXTDECL_PTOKEN],
            position: textDeclStart.open,
         });
      });

      it('reports an error if a non-content token is found in the content', () => {
         const notationDecl = new NotationDeclarationPToken({ open: toSToken('<!') });
         const checker = makeChecker(elementStart);

         checker.check(notationDecl, collector);

         // @ts-expect-error TS2339 - matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.CONTENT_INVALID_TOKEN,
            params: [NOTATION_DECLARATION_PTOKEN],
            position: notationDecl.open,
         });
      });

      it('reports an error if a chardata token with "]]>" is found', () => {
         const charData = new CharDataPToken({ text: toSToken(']]>') });
         const checker = makeChecker(elementStart);

         checker.check(charData, collector);

         // @ts-expect-error TS2339 - matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.CHARDATA_INVALID_SECTION_END,
            params: [],
            position: charData.text,
         });
      });
   });

   describe('entity treatment', () => {
      it('reports no error if a general entity reference has a related declaration (§4.1.0)', () => {
         const entityDecl = new GeneralEntityDeclarationPToken({
            name: toSToken('test'),
            open: toSToken('<!'),
         });
         const ref = new GeneralEntityReferencePToken({
            name: toSToken('test'),
            open: toSToken('<'),
         });
         const state = new CheckState();
         state.generalDecls.test = {
            declaredInInternalSubset: true,
            token: entityDecl,
         };
         const checker = makeChecker(elementStart, state);

         checker.check(ref, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('reports an error if a general entity reference is to an unparsed entity (§4.1.0)', () => {
         const entityDecl = new GeneralEntityDeclarationPToken({
            nDataName: toSToken('jpeg'),
            open: toSToken('<!'),
         });
         const unparsedReference = new GeneralEntityReferencePToken({
            name: toSToken('unparsed'),
            open: toSToken('<'),
         });
         const state = new CheckState();
         state.generalDecls.unparsed = {
            declaredInInternalSubset: true,
            token: entityDecl,
         };
         const checker = makeChecker(elementStart, state);

         checker.check(elementStart, collector);
         checker.check(unparsedReference, collector);

         // @ts-expect-error TS2339 - matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.REFERENCE_UNPARSED_NO_USE,
            params: ['unparsed'],
            position: unparsedReference.open,
         });
      });

      it('reports no error if a general entity reference has no related delcaration and standalone is false (§4.1.0)', () => {
         const noDeclRef = new GeneralEntityReferencePToken({
            name: toSToken('noDecl'),
            open: toSToken('<'),
         });
         const state = new CheckState();
         state.isStandalone = false;
         state.peRefCount = 1;
         const checker = makeChecker(elementStart, state);

         checker.check(noDeclRef, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('reports an error when there is a reference but no dtd (§4.1.0)', () => {
         const badRef = new GeneralEntityReferencePToken({
            name: toSToken('test'),
            open: toSToken('<'),
         });
         const state = new CheckState();
         state.hasNoDTD = true;
         const checker = makeChecker(elementStart, state);

         checker.check(badRef, collector);

         // @ts-expect-error TS2339 - matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.REFERENCE_NO_DECLARATION,
            params: ['test'],
            position: badRef.open,
         });
      });

      it('reports an error if a general entity reference has no related declaration and standalone is true (§4.1.0)', () => {
         const noDeclRef = new GeneralEntityReferencePToken({
            name: toSToken('noDecl'),
            open: toSToken('<'),
         });
         const state = new CheckState();
         state.isStandalone = true;
         const checker = makeChecker(elementStart, state);

         checker.check(noDeclRef, collector);

         // @ts-expect-error TS2339 - matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.REFERENCE_NO_DECLARATION,
            params: ['noDecl'],
            position: noDeclRef.open,
         });
      });

      it('reports an error if a general entity end does not belong here', () => {
         const endityEnd = new GeneralEntityEndPToken(generalEntityReference);
         const checker = makeChecker(elementStart);

         checker.check(endityEnd, collector);

         // @ts-expect-error TS2339 - matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.CONTENT_INVALID_TOKEN,
            params: [GENERAL_ENTITY_END_PTOKEN],
            position: generalEntityReference.open,
         });
      });

      it('reports an error if a general entity start is for an undeclared entity (§4.1.0) (do not see how this can happen)', () => {
         const noDeclRef = new GeneralEntityReferencePToken({
            name: toSToken('noDecl'),
            open: toSToken('<'),
         });
         const noDeclStart = new GeneralEntityStartPToken(noDeclRef);
         const checker = makeChecker(elementStart);

         checker.check(noDeclStart, collector);

         // @ts-expect-error TS2339 - matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.REFERENCE_NO_DECLARATION,
            params: ['noDecl'],
            position: noDeclRef.open,
         });
      });

      it('reports no error when an undeclared ge ref, but we do not have all decls (§4.1.0)', () => {
         const noDeclRef = new GeneralEntityReferencePToken({
            name: toSToken('noDecl'),
            open: toSToken('<'),
         });
         const state = new CheckState();
         state.peRefCount = 1;
         const checker = makeChecker(elementStart, state);

         checker.check(noDeclRef, collector);

         // @ts-expect-error TS2339 - matchers
         expect(collector).not.toHaveProblem(WFEID.REFERENCE_NO_DECLARATION);
      });

      it('reports no error when an undeclared ge ref, but it is a predefined one (§4.1.0)', () => {
         const noDeclRef = new GeneralEntityReferencePToken({
            name: toSToken('lt'),
            open: toSToken('<'),
         });
         const state = new CheckState();
         state.peRefCount = 0;
         const checker = makeChecker(elementStart, state);

         checker.check(noDeclRef, collector);

         // @ts-expect-error TS2339 - matchers
         expect(collector).not.toHaveProblem(WFEID.REFERENCE_NO_DECLARATION);
      });

      it('reports no error when an undeclared ge ref, but there is an external subset (§4.1.0)', () => {
         const noDeclRef = new GeneralEntityReferencePToken({
            name: toSToken('test'),
            open: toSToken('<'),
         });
         const state = new CheckState();
         state.hasExternalDTD = true;
         const checker = makeChecker(elementStart, state);

         checker.check(noDeclRef, collector);

         // @ts-expect-error TS2339 - matchers
         expect(collector).not.toHaveProblem(WFEID.REFERENCE_NO_DECLARATION);
      });

      it('reports an error if a general entity reference is found, and there is only an internal dtd with no perefs, but no declaration found (§4.1.0)', () => {
         const noDeclRef = new GeneralEntityReferencePToken({
            name: toSToken('noDecl'),
            open: toSToken('<'),
         });
         const state = new CheckState();
         state.hasExternalDTD = false;
         const checker = makeChecker(elementStart, state);

         checker.check(noDeclRef, collector);

         // @ts-expect-error TS2339 - matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.REFERENCE_NO_DECLARATION,
            params: ['noDecl'],
            position: noDeclRef.open,
         });
      });

      it('handles an embedded general entity and still is done when expected', () => {
         const checker = makeChecker(elementStart);
         checker.check(comment, collector);
         checker.check(generalEntityStart, collector);
         checker.check(comment, collector);
         checker.check(generalEntityEnd, collector);
         checker.check(comment, collector);

         const result = checker.check(elementEnd, collector);

         expect(result).toEqual(CHECKER_DONE);
      });

      it('does not return a sub-checker this is the first checker found', () => {
         const checker = makeChecker(generalEntityStart);

         const result = checker.isDone;

         expect(result).toEqual(false);
      });

      it('reports done if an entity end is found that matches the start', () => {
         const checker = makeChecker(generalEntityStart);

         const result = checker.check(generalEntityEnd, collector);

         expect(result).toEqual(CHECKER_DONE);
      });

      it('reports an error if all the start elements have not been closed by the end of the entity (§4.3.2)', () => {
         const checker = makeChecker(generalEntityStart);

         checker.check(elementStart, collector);
         checker.check(generalEntityEnd, collector);

         // @ts-expect-error TS2339 - matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.ELEMENT_UNBALANCED,
            params: ['test', GENERAL_ENTITY_END_PTOKEN],
            position: generalEntityEnd.referencePToken.open,
         });
      });

      it('reports an error if a general entity end is found that does not match the first', () => {
         const badRef = new GeneralEntityReferencePToken({
            name: toSToken('other'),
            open: toSToken('<'),
         });
         const bogusEnd = new GeneralEntityEndPToken(badRef);
         const checker = makeChecker(generalEntityStart);

         checker.check(bogusEnd, collector);

         // @ts-expect-error TS2339 - matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.CONTENT_INVALID_TOKEN,
            params: [GENERAL_ENTITY_END_PTOKEN],
            position: badRef.open,
         });
      });
   });

   describe('attribute content', () => {
      it('reports an error in the case of unbalanced entity starts and ends', () => {
         const refTwo = new GeneralEntityReferencePToken({
            name: toSToken('second'),
            open: toSToken('&'),
         });
         const generalEntityStartTwo = new GeneralEntityStartPToken(refTwo);
         const unbalancedElement = new ElementStartPToken({
            attributes: [
               {
                  name: toSToken('first'),
                  value: [generalEntityStart, generalEntityStartTwo, generalEntityEnd],
               },
            ],
            open: toSToken('<'),
         });
         makeChecker(unbalancedElement);

         // @ts-expect-error TS2339 - matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.ATTRIBUTE_REFERENCE_UNBALANCED,
            params: ['testRef', 'second'],
            position: generalEntityEnd.referencePToken.open,
         });
      });

      it('reports no errors when entity start and ends are properly blanced', () => {
         const unbalancedElement = new ElementStartPToken({
            attributes: [
               {
                  name: toSToken('first'),
                  value: [
                     generalEntityStart,
                     generalEntityStart,
                     generalEntityEnd,
                     generalEntityEnd,
                  ],
               },
            ],
            open: toSToken('<'),
         });
         makeChecker(unbalancedElement);

         // @ts-expect-error TS2339 - matchers
         expect(collector).not.toHaveProblem(WFEID.ATTRIBUTE_REFERENCE_UNBALANCED);
      });

      it('reports no error if a declared reference is found (§4.1.0)', () => {
         const undeclaredRef = new ElementStartPToken({
            attributes: [
               {
                  name: toSToken('first'),
                  value: [generalEntityReference],
               },
            ],
            open: toSToken('<'),
         });
         const state = new CheckState();
         state.generalDecls.testRef = {
            declaredInInternalSubset: true,
            token: new GeneralEntityDeclarationPToken({ open: toSToken('<!') }),
         };
         makeChecker(undeclaredRef, state);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('reports an error if an undeclared reference is found', () => {
         const undeclaredRef = new ElementStartPToken({
            attributes: [
               {
                  name: toSToken('first'),
                  value: [generalEntityReference],
               },
            ],
            open: toSToken('<'),
         });

         makeChecker(undeclaredRef);

         // @ts-expect-error TS2339 - matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.REFERENCE_NO_DECLARATION,
            params: ['testRef'],
            position: generalEntityReference.open,
         });
      });

      it('reports no error if an undeclared reference is found but there is an external subset (§4.1.0)', () => {
         const undeclaredRef = new ElementStartPToken({
            attributes: [
               {
                  name: toSToken('first'),
                  value: [generalEntityReference],
               },
            ],
            open: toSToken('<'),
         });
         const state = new CheckState();
         state.hasExternalDTD = true;

         makeChecker(undeclaredRef, state);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('reports an error if an entity references an external entiy (§3.1.0)', () => {
         const withExternalRef = new ElementEmptyPToken({
            attributes: [
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
               externalId: {},
               open: toSToken('<!'),
            }),
         };
         makeChecker(withExternalRef, state);

         // @ts-expect-error TS2339 - matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.ATTRIBUTE_INVALID_REFERENCE,
            params: ['testRef'],
            position: generalEntityStart.referencePToken.open,
         });
      });

      it('reports an error when unparsed entity referenced from attr value (§4.1.0)', () => {
         const withUnparsedRef = new ElementEmptyPToken({
            attributes: [
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
               nDataName: toSToken('foo'),
               open: toSToken('<!'),
            }),
         };
         makeChecker(withUnparsedRef, state);

         // @ts-expect-error TS2339 - matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.REFERENCE_UNPARSED_NO_USE,
            params: ['testRef'],
            position: generalEntityStart.referencePToken.open,
         });
      });
   });
});
