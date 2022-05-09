/* Copyright ® 2019-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { MockErrorCollector } from 'basic-test';
import {
   NOTATION_DECLARATION_PTOKEN,
   TEXTDECL_PTOKEN,
   GeneralEntityDeclarationPToken,
   GeneralEntityReferencePToken,
   NotationDeclarationPToken,
   TextDeclarationPToken,
} from 'pToken';
import { toSToken } from 'sToken';
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

import { WellFormedError } from '../error/WellFormedError';
import { ContentChecker } from '../ContentChecker';
import { CheckState, CHECKER_DONE } from '../checkUtils';
import { wellFormedWarningCodes } from '../error/wellFormedWarningCodes';

const WARNID = wellFormedWarningCodes.id;

describe('ContentChecker (unit)', () => {
   let ec: MockErrorCollector;
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
      elementStart = new ElementStartPToken({ open: toSToken('<'), name: toSToken('test') });
      elementEnd = new ElementEndPToken({ open: toSToken('</'), name: toSToken('test') });
      elementEmpty = new ElementEmptyPToken({ open: toSToken('<'), name: toSToken('test') });
      generalEntityReference = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('testRef'),
      });
      generalEntityStart = new GeneralEntityStartPToken(generalEntityReference);
      generalEntityEnd = new GeneralEntityEndPToken(generalEntityReference);

      ec = new MockErrorCollector();
   });

   function makeChecker(
      start: ElementStartPToken | ElementEmptyPToken | GeneralEntityStartPToken,
      state: CheckState = new CheckState(),
   ) {
      return new ContentChecker(start, ec, state, []);
   }

   describe('misc', () => {
      it('throws an error if called after it is already done', () => {
         const checker = makeChecker(elementEmpty);

         expect(() => checker.check(generalEntityReference, ec)).toThrowError(
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

         const result = checker.check(elementEnd, ec);

         expect(result).toEqual(CHECKER_DONE);
      });

      it('does not report done if called with a start and then a matching end, and the start was a general entity', () => {
         const checker = makeChecker(generalEntityStart);

         checker.check(elementStart, ec);
         const result = checker.check(elementEnd, ec);

         expect(result).toEqual(undefined);
      });

      it('reports no error if an empty element appears between start and end', () => {
         const state = new CheckState();
         state.elementDecl.test = 'EMPTY';
         const checker = makeChecker(elementStart, state);

         checker.check(elementEmpty, ec);
         checker.check(elementEnd, ec);

         expect(ec.errors).toEqual([]);
      });

      it('reports a warning if an empty element is used for an element that is not empty', () => {
         const state = new CheckState();
         state.elementDecl.test = undefined;
         const checker = makeChecker(elementStart, state);

         checker.check(elementEmpty, ec);
         checker.check(elementEnd, ec);

         // @ts-expect-error TS2339 - matchers
         expect(ec).toReportWarning({
            id: WARNID.ELEMENT_EMPTY_WITH_NONEMPTY_DECL,
            params: ['test'],
            position: elementEmpty.open,
         });
      });

      it('reports an unbalanced message if name of an end element does not match what is on the stack', () => {
         const unbalancedElement = new ElementEndPToken({
            open: toSToken('</'),
            name: toSToken('bogus'),
         });
         const checker = makeChecker(elementStart);

         checker.check(unbalancedElement, ec);

         // @ts-expect-error TS2339 - matchers
         expect(ec).toReportWFError({
            id: WellFormedError.ID.ELEMENT_UNBALANCED,
            params: ['test', 'bogus'],
            position: unbalancedElement.open,
         });
      });

      it('reports an unbalanced message if there are multiple closes that do not match the current stack value', () => {
         const unbalancedEnd = new ElementEndPToken({
            open: toSToken('</'),
            name: toSToken('bogus'),
         });
         const unbalancedEnd2 = new ElementEndPToken({
            open: toSToken('</'),
            name: toSToken('bogus2'),
         });
         const checker = makeChecker(elementStart);

         checker.check(unbalancedEnd, ec);
         checker.check(unbalancedEnd2, ec);

         // @ts-expect-error TS2339 - matchers
         expect(ec).toReportWFError({
            id: WellFormedError.ID.ELEMENT_UNBALANCED,
            params: ['test', 'bogus2'],
            position: unbalancedEnd2.open,
         });
      });

      it('reports an unbalanced message if there is an end immediately after an opening general entity', () => {
         const checker = makeChecker(generalEntityStart);

         checker.check(elementEnd, ec);

         // @ts-expect-error TS2339 - matchers
         expect(ec).toReportWFError({
            id: WellFormedError.ID.ELEMENT_UNBALANCED,
            params: ['', 'test'],
            position: elementEnd.open,
         });
      });

      it('reports done after multiple unbalanced ends and then the correct end', () => {
         const unbalancedEnd = new ElementEndPToken({
            open: toSToken('</'),
            name: toSToken('bogus'),
         });
         const unbalancedEnd2 = new ElementEndPToken({
            open: toSToken('</'),
            name: toSToken('bogus2'),
         });
         const checker = makeChecker(elementStart);

         checker.check(unbalancedEnd, ec);
         checker.check(unbalancedEnd2, ec);
         const result = checker.check(elementEnd, ec);

         expect(result).toEqual(CHECKER_DONE);
      });

      it('reports a recursive error if a general entity start matches the name of this checker start (§4.1.0)', () => {
         const geRef2 = new GeneralEntityReferencePToken({
            open: toSToken('&'),
            name: toSToken('testRef'),
         });
         const geStart2 = new GeneralEntityStartPToken(geRef2);
         const checker = makeChecker(generalEntityStart);

         checker.check(geStart2, ec);

         // @ts-expect-error TS2339 - matchers
         expect(ec).toReportWFError({
            id: WellFormedError.ID.REFERENCE_INVALID_RECURSION,
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

         checker.check(geStart2, ec);

         // @ts-expect-error TS2339 - matchers
         expect(ec).toNotReportError(WellFormedError.ID.REFERENCE_INVALID_RECURSION);
      });

      it('does not report a recursive error if a general entity start matches the name of this checker start (§4.1.0)', () => {
         const geRef2 = new GeneralEntityReferencePToken({
            open: toSToken('&'),
            name: toSToken('testRef2'),
         });
         const geStart2 = new GeneralEntityStartPToken(geRef2);
         const checker = makeChecker(generalEntityStart);

         checker.check(geStart2, ec);

         // @ts-expect-error TS2339 - matchers
         expect(ec).not.toReportWFError({
            id: WellFormedError.ID.REFERENCE_INVALID_RECURSION,
            params: ['testRef2'],
            position: geRef2.open,
         });
      });

      it('reports a recursive error if a general entity reference matches the name of this checker start (§4.1.0)', () => {
         const geRef2 = new GeneralEntityReferencePToken({
            open: toSToken('&'),
            name: toSToken('testRef'),
         });
         const checker = makeChecker(generalEntityStart);

         checker.check(geRef2, ec);

         // @ts-expect-error TS2339 - matchers
         expect(ec).toReportWFError({
            id: WellFormedError.ID.REFERENCE_INVALID_RECURSION,
            params: ['testRef'],
            position: geRef2.open,
         });
      });

      it('@reports no recursive error if a general entity reference has no name (§4.1.0)', () => {
         const geRef2 = new GeneralEntityReferencePToken({
            open: toSToken('&'),
            name: undefined,
         });
         const checker = makeChecker(generalEntityStart);

         checker.check(geRef2, ec);

         // @ts-expect-error TS2339 - matchers
         expect(ec).toNotReportError(WellFormedError.ID.REFERENCE_INVALID_RECURSION);
      });
   });

   describe('token context', () => {
      it('reports no errors if a TextDecl is found after a general entity start, and it is an external entity', () => {
         const state = new CheckState();
         state.generalDecls.testRef = {
            token: new GeneralEntityDeclarationPToken({
               open: toSToken('<!'),
               externalId: {},
            }),
            declaredInInternalSubset: true,
         };
         const checker = makeChecker(generalEntityStart, state);

         checker.check(textDeclStart, ec);

         // @ts-expect-error TS2339 - matchers
         expect(ec).toNotReportError(WellFormedError.ID.CONTENT_INVALID_TOKEN);
      });

      it('reports an error if a TextDecl is found after a general entity start, and it is an internal entity', () => {
         const state = new CheckState();
         state.generalDecls.test = {
            token: new GeneralEntityDeclarationPToken({
               open: toSToken('<!'),
               externalId: {},
            }),
            declaredInInternalSubset: true,
         };
         const checker = makeChecker(generalEntityStart, state);

         checker.check(textDeclStart, ec);

         // @ts-expect-error TS2339 - matchers
         expect(ec).toReportWFError({
            id: WellFormedError.ID.CONTENT_INVALID_TOKEN,
            params: [TEXTDECL_PTOKEN],
            position: textDeclStart.open,
         });
      });

      it('reports no errors if a CData section is found after a general entity start', () => {
         const checker = makeChecker(generalEntityStart);

         checker.check(cdata, ec);

         // @ts-expect-error TS2339 - matchers
         expect(ec).toNotReportError(WellFormedError.ID.CONTENT_INVALID_TOKEN);
      });

      it('reports an error if a TextDecl is found after an a comment after a general entity start', () => {
         const checker = makeChecker(generalEntityStart);

         checker.check(comment, ec);
         checker.check(textDeclStart, ec);

         // @ts-expect-error TS2339 - matchers
         expect(ec).toReportWFError({
            id: WellFormedError.ID.CONTENT_INVALID_TOKEN,
            params: [TEXTDECL_PTOKEN],
            position: textDeclStart.open,
         });
      });

      it('reports an error if a TextDecl is found after an element start', () => {
         const checker = makeChecker(elementStart);

         checker.check(textDeclStart, ec);

         // @ts-expect-error TS2339 - matchers
         expect(ec).toReportWFError({
            id: WellFormedError.ID.CONTENT_INVALID_TOKEN,
            params: [TEXTDECL_PTOKEN],
            position: textDeclStart.open,
         });
      });

      it('reports an error if a non-content token is found in the content', () => {
         const notationDecl = new NotationDeclarationPToken({ open: toSToken('<!') });
         const checker = makeChecker(elementStart);

         checker.check(notationDecl, ec);

         // @ts-expect-error TS2339 - matchers
         expect(ec).toReportWFError({
            id: WellFormedError.ID.CONTENT_INVALID_TOKEN,
            params: [NOTATION_DECLARATION_PTOKEN],
            position: notationDecl.open,
         });
      });

      it('reports an error if a chardata token with "]]>" is found', () => {
         const charData = new CharDataPToken({ text: toSToken(']]>') });
         const checker = makeChecker(elementStart);

         checker.check(charData, ec);

         // @ts-expect-error TS2339 - matchers
         expect(ec).toReportWFError({
            id: WellFormedError.ID.CHARDATA_INVALID_SECTION_END,
            params: [],
            position: charData.text,
         });
      });
   });

   describe('entity treatment', () => {
      it('reports no error if a general entity reference has a related declaration (§4.1.0)', () => {
         const entityDecl = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('test'),
         });
         const ref = new GeneralEntityReferencePToken({
            open: toSToken('<'),
            name: toSToken('test'),
         });
         const state = new CheckState();
         state.generalDecls.test = {
            token: entityDecl,
            declaredInInternalSubset: true,
         };
         const checker = makeChecker(elementStart, state);

         checker.check(ref, ec);

         expect(ec.errors).toEqual([]);
      });

      it('reports an error if a general entity reference is to an unparsed entity (§4.1.0)', () => {
         const entityDecl = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            nDataName: toSToken('jpeg'),
         });
         const unparsedReference = new GeneralEntityReferencePToken({
            open: toSToken('<'),
            name: toSToken('unparsed'),
         });
         const state = new CheckState();
         state.generalDecls.unparsed = {
            token: entityDecl,
            declaredInInternalSubset: true,
         };
         const checker = makeChecker(elementStart, state);

         checker.check(elementStart, ec);
         checker.check(unparsedReference, ec);

         // @ts-expect-error TS2339 - matchers
         expect(ec).toReportWFError({
            id: WellFormedError.ID.REFERENCE_UNPARSED_NO_USE,
            params: ['unparsed'],
            position: unparsedReference.open,
         });
      });

      it('reports no error if a general entity reference has no related delcaration and standalone is false (§4.1.0)', () => {
         const noDeclRef = new GeneralEntityReferencePToken({
            open: toSToken('<'),
            name: toSToken('noDecl'),
         });
         const state = new CheckState();
         state.isStandalone = false;
         state.peRefCount = 1;
         const checker = makeChecker(elementStart, state);

         checker.check(noDeclRef, ec);

         expect(ec.errors).toEqual([]);
      });

      it('reports an error when there is a reference but no dtd (§4.1.0)', () => {
         const badRef = new GeneralEntityReferencePToken({
            open: toSToken('<'),
            name: toSToken('test'),
         });
         const state = new CheckState();
         state.hasNoDTD = true;
         const checker = makeChecker(elementStart, state);

         checker.check(badRef, ec);

         // @ts-expect-error TS2339 - matchers
         expect(ec).toReportWFError({
            id: WellFormedError.ID.REFERENCE_NO_DECLARATION,
            params: ['test'],
            position: badRef.open,
         });
      });

      it('reports an error if a general entity reference has no related declaration and standalone is true (§4.1.0)', () => {
         const noDeclRef = new GeneralEntityReferencePToken({
            open: toSToken('<'),
            name: toSToken('noDecl'),
         });
         const state = new CheckState();
         state.isStandalone = true;
         const checker = makeChecker(elementStart, state);

         checker.check(noDeclRef, ec);

         // @ts-expect-error TS2339 - matchers
         expect(ec).toReportWFError({
            id: WellFormedError.ID.REFERENCE_NO_DECLARATION,
            params: ['noDecl'],
            position: noDeclRef.open,
         });
      });

      it('reports an error if a general entity end does not belong here', () => {
         const endityEnd = new GeneralEntityEndPToken(generalEntityReference);
         const checker = makeChecker(elementStart);

         checker.check(endityEnd, ec);

         // @ts-expect-error TS2339 - matchers
         expect(ec).toReportWFError({
            id: WellFormedError.ID.CONTENT_INVALID_TOKEN,
            params: [GENERAL_ENTITY_END_PTOKEN],
            position: generalEntityReference.open,
         });
      });

      it('reports an error if a general entity start is for an undeclared entity (§4.1.0) (do not see how this can happen)', () => {
         const noDeclRef = new GeneralEntityReferencePToken({
            open: toSToken('<'),
            name: toSToken('noDecl'),
         });
         const noDeclStart = new GeneralEntityStartPToken(noDeclRef);
         const checker = makeChecker(elementStart);

         checker.check(noDeclStart, ec);

         // @ts-expect-error TS2339 - matchers
         expect(ec).toReportWFError({
            id: WellFormedError.ID.REFERENCE_NO_DECLARATION,
            params: ['noDecl'],
            position: noDeclRef.open,
         });
      });

      it('reports no error when an undeclared ge ref, but we do not have all decls (§4.1.0)', () => {
         const noDeclRef = new GeneralEntityReferencePToken({
            open: toSToken('<'),
            name: toSToken('noDecl'),
         });
         const state = new CheckState();
         state.peRefCount = 1;
         const checker = makeChecker(elementStart, state);

         checker.check(noDeclRef, ec);

         // @ts-expect-error TS2339 - matchers
         expect(ec).toNotReportError(WellFormedError.ID.REFERENCE_NO_DECLARATION);
      });

      it('reports no error when an undeclared ge ref, but it is a predefined one (§4.1.0)', () => {
         const noDeclRef = new GeneralEntityReferencePToken({
            open: toSToken('<'),
            name: toSToken('lt'),
         });
         const state = new CheckState();
         state.peRefCount = 0;
         const checker = makeChecker(elementStart, state);

         checker.check(noDeclRef, ec);

         // @ts-expect-error TS2339 - matchers
         expect(ec).toNotReportError(WellFormedError.ID.REFERENCE_NO_DECLARATION);
      });

      it('reports no error when an undeclared ge ref, but there is an external subset (§4.1.0)', () => {
         const noDeclRef = new GeneralEntityReferencePToken({
            open: toSToken('<'),
            name: toSToken('test'),
         });
         const state = new CheckState();
         state.hasExternalDTD = true;
         const checker = makeChecker(elementStart, state);

         checker.check(noDeclRef, ec);

         // @ts-expect-error TS2339 - matchers
         expect(ec).toNotReportError(WellFormedError.ID.REFERENCE_NO_DECLARATION);
      });

      it('reports an error if a general entity reference is found, and there is only an internal dtd with no perefs, but no declaration found (§4.1.0)', () => {
         const noDeclRef = new GeneralEntityReferencePToken({
            open: toSToken('<'),
            name: toSToken('noDecl'),
         });
         const state = new CheckState();
         state.hasExternalDTD = false;
         const checker = makeChecker(elementStart, state);

         checker.check(noDeclRef, ec);

         // @ts-expect-error TS2339 - matchers
         expect(ec).toReportWFError({
            id: WellFormedError.ID.REFERENCE_NO_DECLARATION,
            params: ['noDecl'],
            position: noDeclRef.open,
         });
      });

      it('handles an embedded general entity and still is done when expected', () => {
         const checker = makeChecker(elementStart);
         checker.check(comment, ec);
         checker.check(generalEntityStart, ec);
         checker.check(comment, ec);
         checker.check(generalEntityEnd, ec);
         checker.check(comment, ec);

         const result = checker.check(elementEnd, ec);

         expect(result).toEqual(CHECKER_DONE);
      });

      it('does not return a sub-checker this is the first checker found', () => {
         const checker = makeChecker(generalEntityStart);

         const result = checker.isDone;

         expect(result).toEqual(false);
      });

      it('reports done if an entity end is found that matches the start', () => {
         const checker = makeChecker(generalEntityStart);

         const result = checker.check(generalEntityEnd, ec);

         expect(result).toEqual(CHECKER_DONE);
      });

      it('reports an error if all the start elements have not been closed by the end of the entity (§4.3.2)', () => {
         const checker = makeChecker(generalEntityStart);

         checker.check(elementStart, ec);
         checker.check(generalEntityEnd, ec);

         // @ts-expect-error TS2339 - matchers
         expect(ec).toReportWFError({
            id: WellFormedError.ID.ELEMENT_UNBALANCED,
            params: ['test', GENERAL_ENTITY_END_PTOKEN],
            position: generalEntityEnd.referencePToken.open,
         });
      });

      it('reports an error if a general entity end is found that does not match the first', () => {
         const badRef = new GeneralEntityReferencePToken({
            open: toSToken('<'),
            name: toSToken('other'),
         });
         const bogusEnd = new GeneralEntityEndPToken(badRef);
         const checker = makeChecker(generalEntityStart);

         checker.check(bogusEnd, ec);

         // @ts-expect-error TS2339 - matchers
         expect(ec).toReportWFError({
            id: WellFormedError.ID.CONTENT_INVALID_TOKEN,
            params: [GENERAL_ENTITY_END_PTOKEN],
            position: badRef.open,
         });
      });
   });

   describe('attribute content', () => {
      it('reports an error in the case of unbalanced entity starts and ends', () => {
         const refTwo = new GeneralEntityReferencePToken({
            open: toSToken('&'),
            name: toSToken('second'),
         });
         const generalEntityStartTwo = new GeneralEntityStartPToken(refTwo);
         const unbalancedElement = new ElementStartPToken({
            open: toSToken('<'),
            attributes: [
               {
                  name: toSToken('first'),
                  value: [generalEntityStart, generalEntityStartTwo, generalEntityEnd],
               },
            ],
         });
         makeChecker(unbalancedElement);

         // @ts-expect-error TS2339 - matchers
         expect(ec).toReportWFError({
            id: WellFormedError.ID.ATTRIBUTE_REFERENCE_UNBALANCED,
            params: ['testRef', 'second'],
            position: generalEntityEnd.referencePToken.open,
         });
      });

      it('reports no errors when entity start and ends are properly blanced', () => {
         const unbalancedElement = new ElementStartPToken({
            open: toSToken('<'),
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
         });
         makeChecker(unbalancedElement);

         // @ts-expect-error TS2339 - matchers
         expect(ec).toNotReportError(WellFormedError.ID.ATTRIBUTE_REFERENCE_UNBALANCED);
      });

      it('reports no error if a declared reference is found (§4.1.0)', () => {
         const undeclaredRef = new ElementStartPToken({
            open: toSToken('<'),
            attributes: [
               {
                  name: toSToken('first'),
                  value: [generalEntityReference],
               },
            ],
         });
         const state = new CheckState();
         state.generalDecls.testRef = {
            token: new GeneralEntityDeclarationPToken({ open: toSToken('<!') }),
            declaredInInternalSubset: true,
         };
         makeChecker(undeclaredRef, state);

         expect(ec.errors).toEqual([]);
      });

      it('reports an error if an undeclared reference is found', () => {
         const undeclaredRef = new ElementStartPToken({
            open: toSToken('<'),
            attributes: [
               {
                  name: toSToken('first'),
                  value: [generalEntityReference],
               },
            ],
         });

         makeChecker(undeclaredRef);

         // @ts-expect-error TS2339 - matchers
         expect(ec).toReportWFError({
            id: WellFormedError.ID.REFERENCE_NO_DECLARATION,
            params: ['testRef'],
            position: generalEntityReference.open,
         });
      });

      it('reports no error if an undeclared reference is found but there is an external subset (§4.1.0)', () => {
         const undeclaredRef = new ElementStartPToken({
            open: toSToken('<'),
            attributes: [
               {
                  name: toSToken('first'),
                  value: [generalEntityReference],
               },
            ],
         });
         const state = new CheckState();
         state.hasExternalDTD = true;

         makeChecker(undeclaredRef, state);

         expect(ec.errors).toEqual([]);
      });

      it('reports an error if an entity references an external entiy (§3.1.0)', () => {
         const withExternalRef = new ElementEmptyPToken({
            open: toSToken('<'),
            attributes: [
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
            declaredInInternalSubset: true,
         };
         makeChecker(withExternalRef, state);

         // @ts-expect-error TS2339 - matchers
         expect(ec).toReportWFError({
            id: WellFormedError.ID.ATTRIBUTE_INVALID_REFERENCE,
            params: ['testRef'],
            position: generalEntityStart.referencePToken.open,
         });
      });

      it('reports an error when unparsed entity referenced from attr value (§4.1.0)', () => {
         const withUnparsedRef = new ElementEmptyPToken({
            open: toSToken('<'),
            attributes: [
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
            declaredInInternalSubset: true,
         };
         makeChecker(withUnparsedRef, state);

         // @ts-expect-error TS2339 - matchers
         expect(ec).toReportWFError({
            id: WellFormedError.ID.REFERENCE_UNPARSED_NO_USE,
            params: ['testRef'],
            position: generalEntityStart.referencePToken.open,
         });
      });
   });
});
