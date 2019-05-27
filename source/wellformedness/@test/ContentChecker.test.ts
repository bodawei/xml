/* Copyright ® 2019 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from 'basic';
import { WellFormedError } from 'error';
import { MockErrorCollector } from 'error-test';
import { toSToken } from 'sToken';

import {
   GENERAL_ENTITY_END_PTOKEN,
   NOTATION_DECLARATION_PTOKEN,
   TEXTDECL_PTOKEN,

   CdataPToken,
   CommentPToken,
   ElementEndPToken,
   ElementStartPToken,
   ElementEmptyPToken,
   GeneralEntityDeclarationPToken,
   GeneralEntityEndPToken,
   GeneralEntityStartPToken,
   GeneralEntityReferencePToken,
   NotationDeclarationPToken,
   TextDeclarationPToken,
} from 'token';

import { ContentChecker } from '../ContentChecker';
import { GeneralEntitiesInfo, CheckState, CHECKER_DONE } from '../checkUtils';

describe('ContentChecker (unit)', () => {
   let emd: EntityMetaData;
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
      generalEntityReference = new GeneralEntityReferencePToken({ open: toSToken('&'), name: toSToken('testRef')});
      generalEntityStart = new GeneralEntityStartPToken(generalEntityReference);
      generalEntityEnd = new GeneralEntityEndPToken(generalEntityReference);

      emd = new EntityMetaData();
      ec = new MockErrorCollector();
   });

   function makeChecker(state: CheckState = new CheckState(), hasAll: boolean = true) {
      return new ContentChecker(state);
   }

   describe('misc', () => {

      it('throws an error if called with something other than an entity or element start', () => {
         const checker = makeChecker();

         expect(() => checker.check(generalEntityReference, ec)).toThrowError(/Must first call check/);
      });

      it('throws an error if called after it is already done', () => {
         const checker = makeChecker();

         checker.check(elementEmpty, ec);

         expect(() => checker.check(generalEntityReference, ec)).toThrowError(/Passed a token to ContentChecker/);
      });

   });

   describe('stacking of elements', () => {

      it('reports done if the first token is an empty element', () => {
         const checker = makeChecker();

         const result = checker.check(elementEmpty, ec);

         expect(result).toEqual(CHECKER_DONE);
      });

      it('reports done if called with a start and then a matching end, and the start was an element start', () => {
         const checker = makeChecker();

         checker.check(elementStart, ec);
         const result = checker.check(elementEnd, ec);

         expect(result).toEqual(CHECKER_DONE);
      });

      it('does not report done if called with a start and then a matching end, and the start was a general entity', () => {
         const checker = makeChecker();

         checker.check(generalEntityStart, ec);
         checker.check(elementStart, ec);
         const result = checker.check(elementEnd, ec);

         expect(result).toEqual(undefined);
      });

      it('reports no error if an empty element appears between start and end', () => {
         const checker = makeChecker();

         checker.check(elementStart, ec);
         checker.check(elementEmpty, ec);
         checker.check(elementEnd, ec);

         expect(ec.errors).toEqual([]);
      });

      it('reports an unbalanced message if name of an end element does not match what is on the stack', () => {
         const unbalancedElement = new ElementEndPToken({ open: toSToken('</'), name: toSToken('bogus') });
         const checker = makeChecker();

         checker.check(elementStart, ec);
         checker.check(unbalancedElement, ec);

         expect(ec).toReportError({
            id: WellFormedError.ID.ELEMENT_UNBALANCED,
            params: [ 'test', 'bogus' ],
            position: unbalancedElement.open,
         });
      });

      it('reports an unbalanced message if there are multiple closes that do not match the current stack value', () => {
         const unbalancedEnd = new ElementEndPToken({ open: toSToken('</'), name: toSToken('bogus') });
         const unbalancedEnd2 = new ElementEndPToken({ open: toSToken('</'), name: toSToken('bogus2') });
         const checker = makeChecker();

         checker.check(elementStart, ec);
         checker.check(unbalancedEnd, ec);
         checker.check(unbalancedEnd2, ec);

         expect(ec).toReportError({
            id: WellFormedError.ID.ELEMENT_UNBALANCED,
            params: [ 'test', 'bogus2' ],
            position: unbalancedEnd2.open,
         });
      });

      it('reports an unbalanced message if there is an end immediately after an opening general entity', () => {
         const checker = makeChecker();

         checker.check(generalEntityStart, ec);
         checker.check(elementEnd, ec);

         expect(ec).toReportError({
            id: WellFormedError.ID.ELEMENT_UNBALANCED,
            params: [ '', 'test' ],
            position: elementEnd.open,
         });
      });

      it('reports done after multiple unbalanced ends and then the correct end', () => {
         const unbalancedEnd = new ElementEndPToken({ open: toSToken('</'), name: toSToken('bogus') });
         const unbalancedEnd2 = new ElementEndPToken({ open: toSToken('</'), name: toSToken('bogus2') });
         const checker = makeChecker();

         checker.check(elementStart, ec);
         checker.check(unbalancedEnd, ec);
         checker.check(unbalancedEnd2, ec);
         const result = checker.check(elementEnd, ec);

         expect(result).toEqual(CHECKER_DONE);
      });

   });

   describe('token context', () => {

      it('reports no errors if a TextDecl is found after a general entity start, and it is an external entity', () => {
         const state = new CheckState();
         state.generalDecls.testRef = new GeneralEntityDeclarationPToken({ open: toSToken('<!'), externalId: {} });
         const checker = makeChecker(state);

         checker.check(generalEntityStart, ec);
         checker.check(textDeclStart, ec);

         expect(ec).toNotReportError(WellFormedError.ID.CONTENT_INVALID_TOKEN);
      });

      it('reports an error if a TextDecl is found after a general entity start, and it is an internal entity', () => {
         const state = new CheckState();
         state.generalDecls.test = new GeneralEntityDeclarationPToken({ open: toSToken('<!') });
         const checker = makeChecker(state);

         checker.check(generalEntityStart, ec);
         checker.check(textDeclStart, ec);

         expect(ec).toReportError({
            id: WellFormedError.ID.CONTENT_INVALID_TOKEN,
            params: [TEXTDECL_PTOKEN],
            position: textDeclStart.open,
         });
      });

      it('reports no errors if a CData section is found after a general entity start', () => {
         const checker = makeChecker();

         checker.check(generalEntityStart, ec);
         checker.check(cdata, ec);

         expect(ec).toNotReportError(WellFormedError.ID.CONTENT_INVALID_TOKEN);
      });

      it('reports an error if a TextDecl is found after an a comment after a general entity start', () => {
         const checker = makeChecker();

         checker.check(generalEntityStart, ec);
         checker.check(comment, ec);
         checker.check(textDeclStart, ec);

         expect(ec).toReportError({
            id: WellFormedError.ID.CONTENT_INVALID_TOKEN,
            params: [TEXTDECL_PTOKEN],
            position: textDeclStart.open,
         });
      });

      it('reports an error if a TextDecl is found after an element start', () => {
         const checker = makeChecker();

         checker.check(elementStart, ec);
         checker.check(textDeclStart, ec);

         expect(ec).toReportError({
            id: WellFormedError.ID.CONTENT_INVALID_TOKEN,
            params: [TEXTDECL_PTOKEN],
            position: textDeclStart.open,
         });
      });

      it('reports an error if a non-content token is found in the content', () => {
         const notationDecl = new NotationDeclarationPToken({ open: toSToken('<!') });
         const checker = makeChecker();

         checker.check(elementStart, ec);
         checker.check(notationDecl, ec);

         expect(ec).toReportError({
            id: WellFormedError.ID.CONTENT_INVALID_TOKEN,
            params: [NOTATION_DECLARATION_PTOKEN],
            position: notationDecl.open,
         });
      });

   });

   describe('entity treatment', () => {

      it('reports no error if a general entity reference has a related declaration (§4.1.0)', () => {
         const entityDecl = new GeneralEntityDeclarationPToken({ open: toSToken('<!'), name: toSToken('test') });
         const ref = new GeneralEntityReferencePToken({ open: toSToken('<'),  name: toSToken('test') });
         const state = new CheckState();
         state.generalDecls.test = entityDecl;
         const checker = makeChecker(state);

         checker.check(elementStart, ec);
         checker.check(ref, ec);

         expect(ec.errors).toEqual([]);
      });

      it('reports an error if a general entity reference is to an unparsed entity (§4.1.0)', () => {
         const entityDecl = new GeneralEntityDeclarationPToken({ open: toSToken('<!'), nDataName: toSToken('jpeg') });
         const unparsedReference = new GeneralEntityReferencePToken({ open: toSToken('<'),  name: toSToken('unparsed') });
         const state = new CheckState();
         state.generalDecls.unparsed = entityDecl;
         const checker = makeChecker(state);

         checker.check(elementStart, ec);
         checker.check(unparsedReference, ec);

         expect(ec).toReportError({
            id: WellFormedError.ID.REFERENCE_UNPARSED_NO_USE,
            params: [ 'unparsed' ],
            position: unparsedReference.open,
         });
      });

      it('reports no error if a general entity reference has no related delcaration and standalone is false (§4.1.0)', () => {
         const noDeclRef = new GeneralEntityReferencePToken({ open: toSToken('<'),  name: toSToken('noDecl') });
         const state = new CheckState();
         state.isStandalone = false;
         state.peRefCount = 1;
         const checker = makeChecker(state);

         checker.check(elementStart, ec);
         checker.check(noDeclRef, ec);

         expect(ec.errors).toEqual([]);
      });

      it('reports an error when there is a reference but no dtd (§4.1.0)', () => {
         const badRef = new GeneralEntityReferencePToken({ open: toSToken('<'),  name: toSToken('test') });
         const state = new CheckState();
         state.hasNoDTD = true;
         const checker = makeChecker(state);

         checker.check(elementStart, ec);
         checker.check(badRef, ec);

         expect(ec).toReportError({
            id: WellFormedError.ID.REFERENCE_NO_DECLARATION,
            params: [ 'test' ],
            position: badRef.open,
         });
      });

      it('reports an error if a general entity reference has no related declaration and standalone is true (§4.1.0)', () => {
         const noDeclRef = new GeneralEntityReferencePToken({ open: toSToken('<'),  name: toSToken('noDecl') });
         const state = new CheckState();
         state.isStandalone = true;
         const checker = makeChecker(state);

         checker.check(elementStart, ec);
         checker.check(noDeclRef, ec);

         expect(ec).toReportError({
            id: WellFormedError.ID.REFERENCE_NO_DECLARATION,
            params: [ 'noDecl' ],
            position: noDeclRef.open,
         });
      });

      it('reports an error if a general entity end does not belong here', () => {
         const endityEnd = new GeneralEntityEndPToken(generalEntityReference);
         const checker = makeChecker();

         checker.check(elementStart, ec);
         checker.check(endityEnd, ec);

         expect(ec).toReportError({
            id: WellFormedError.ID.CONTENT_INVALID_TOKEN,
            params: [ GENERAL_ENTITY_END_PTOKEN ],
            position: generalEntityReference.open,
         });
      });

      it('reports an error if a general entity start is for an undeclared entity (§4.1.0) (do not see how this can happen)', () => {
         const noDeclRef = new GeneralEntityReferencePToken({ open: toSToken('<'),  name: toSToken('noDecl') });
         const noDeclStart = new GeneralEntityStartPToken(noDeclRef);
         const checker = makeChecker();

         checker.check(elementStart, ec);
         checker.check(noDeclStart, ec);

         expect(ec).toReportError({
            id: WellFormedError.ID.REFERENCE_NO_DECLARATION,
            params: [ 'noDecl' ],
            position: noDeclRef.open,
         });
      });

      it('reports no error when an undeclared ge ref, but we do not have all decls (§4.1.0)', () => {
         const noDeclRef = new GeneralEntityReferencePToken({ open: toSToken('<'),  name: toSToken('noDecl') });
         const state = new CheckState();
         state.peRefCount = 1;
         const checker = makeChecker(state);

         checker.check(elementStart, ec);
         checker.check(noDeclRef, ec);

         expect(ec).toNotReportError(WellFormedError.ID.REFERENCE_NO_DECLARATION);
      });

      it('reports no error when an undeclared ge ref, but it is a predefined one (§4.1.0)', () => {
         const noDeclRef = new GeneralEntityReferencePToken({ open: toSToken('<'),  name: toSToken('lt') });
         const state = new CheckState();
         state.peRefCount = 0;
         const checker = makeChecker(state);

         checker.check(elementStart, ec);
         checker.check(noDeclRef, ec);

         expect(ec).toNotReportError(WellFormedError.ID.REFERENCE_NO_DECLARATION);
      });

      it('reports no error when an undeclared ge ref, but there is an external subset (§4.1.0)', () => {
         const noDeclRef = new GeneralEntityReferencePToken({ open: toSToken('<'),  name: toSToken('test') });
         const state = new CheckState();
         state.hasExternalDTD = true;
         const checker = makeChecker(state);

         checker.check(elementStart, ec);
         checker.check(noDeclRef, ec);

         expect(ec).toNotReportError(WellFormedError.ID.REFERENCE_NO_DECLARATION);
      });

      it('reports an error if a general entity reference is found, and there is only an internal dtd with no perefs, but no declaration found (§4.1.0)', () => {
         const noDeclRef = new GeneralEntityReferencePToken({ open: toSToken('<'),  name: toSToken('noDecl') });
         const state = new CheckState();
         state.hasExternalDTD = false;
         const checker = makeChecker(state);

         checker.check(elementStart, ec);
         checker.check(noDeclRef, ec);

         expect(ec).toReportError({
            id: WellFormedError.ID.REFERENCE_NO_DECLARATION,
            params: [ 'noDecl' ],
            position: noDeclRef.open,
         });
      });

      it('handles an embedded general entity and still is done when expected', () => {
         const checker = makeChecker();
         checker.check(elementStart, ec);
         checker.check(comment, ec);
         checker.check(generalEntityStart, ec);
         checker.check(comment, ec);
         checker.check(generalEntityEnd, ec);
         checker.check(comment, ec);

         const result = checker.check(elementEnd, ec);

         expect(result).toEqual(CHECKER_DONE);
      });

      it('does not return a sub-checker this is the first checker found', () => {
         const checker = makeChecker();

         const result = checker.check(generalEntityStart, ec);

         expect(result).toEqual(undefined);
      });

      it('reports done if an entity end is found that matches the start', () => {
         const checker = makeChecker();

         checker.check(generalEntityStart, ec);
         const result = checker.check(generalEntityEnd, ec);

         expect(result).toEqual(CHECKER_DONE);
      });

      it('reports an error if all the start elements have not been closed by the end of the entity (§4.3.2)', () => {
         const checker = makeChecker();

         checker.check(generalEntityStart, ec);
         checker.check(elementStart, ec);
         checker.check(generalEntityEnd, ec);

         expect(ec).toReportError({
            id: WellFormedError.ID.ELEMENT_UNBALANCED,
            params: ['test', GENERAL_ENTITY_END_PTOKEN],
            position: generalEntityEnd.referencePToken.open,
         });
      });

      it('reports an error if a general entity end is found that does not match the first', () => {
         const badRef = new GeneralEntityReferencePToken({ open: toSToken('<'), name: toSToken('other'), });
         const bogusEnd = new GeneralEntityEndPToken(badRef);
         const checker = makeChecker();

         checker.check(generalEntityStart, ec);
         checker.check(bogusEnd, ec);

         expect(ec).toReportError({
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
            attributes: [{
               name: toSToken('first'),
               value: [generalEntityStart, generalEntityStartTwo, generalEntityEnd],
            }],
         });
         const checker = makeChecker();

         checker.check(unbalancedElement, ec);

         expect(ec).toReportError({
            id: WellFormedError.ID.ATTRIBUTE_REFERENCE_UNBALANCED,
            params: [ 'testRef', 'second' ],
            position: generalEntityEnd.referencePToken.open,
         });
      });

      it('reports no errors when entity start and ends are properly blanced', () => {
         const unbalancedElement = new ElementStartPToken({
            open: toSToken('<'),
            attributes: [{
               name: toSToken('first'),
               value: [generalEntityStart, generalEntityStart, generalEntityEnd, generalEntityEnd],
            }],
         });
         const checker = makeChecker();

         checker.check(unbalancedElement, ec);

         expect(ec).toNotReportError(WellFormedError.ID.ATTRIBUTE_REFERENCE_UNBALANCED);
      });

      it('reports no error if a declared reference is found (§4.1.0)', () => {
         const undeclaredRef = new ElementStartPToken({
            open: toSToken('<'),
            attributes: [{
               name: toSToken('first'),
               value: [generalEntityReference],
            }],
         });
         const state = new CheckState();
         state.generalDecls.testRef = new GeneralEntityDeclarationPToken({ open: toSToken('<!') });
         const checker = makeChecker(state);

         checker.check(undeclaredRef, ec);

         expect(ec.errors).toEqual([]);
      });

      it('reports an error if an undeclared reference is found', () => {
         const undeclaredRef = new ElementStartPToken({
            open: toSToken('<'),
            attributes: [{
               name: toSToken('first'),
               value: [generalEntityReference],
            }],
         });
         const checker = makeChecker();

         checker.check(undeclaredRef, ec);

         expect(ec).toReportError({
            id: WellFormedError.ID.REFERENCE_NO_DECLARATION,
            params: [ 'testRef' ],
            position: generalEntityReference.open,
         });
      });

      it('reports no error if an undeclared reference is found but there is an external subset (§4.1.0)', () => {
         const undeclaredRef = new ElementStartPToken({
            open: toSToken('<'),
            attributes: [{
               name: toSToken('first'),
               value: [generalEntityReference],
            }],
         });
         const state = new CheckState();
         state.hasExternalDTD = true;
         const checker = makeChecker(state);

         checker.check(undeclaredRef, ec);

         expect(ec.errors).toEqual([]);
      });

      it('reports an error if an entity references an external entiy (§3.1.0)', () => {
         const withExternalRef = new ElementEmptyPToken({
            open: toSToken('<'),
            attributes: [{
               name: toSToken('first'),
               value: [generalEntityStart],
            }],
         });
         const state = new CheckState();
         state.generalDecls.testRef = new GeneralEntityDeclarationPToken({ open: toSToken('<!'), externalId: {} });
         const checker = makeChecker(state);

         checker.check(withExternalRef, ec);

         expect(ec).toReportError({
            id: WellFormedError.ID.ATTRIBUTE_INVALID_REFERENCE,
            params: [ 'testRef' ],
            position: generalEntityStart.referencePToken.open,
         });
      });

      it('reports an error when unparsed entity referenced from attr value (§4.1.0)', () => {
         const withUnparsedRef = new ElementEmptyPToken({
            open: toSToken('<'),
            attributes: [{
               name: toSToken('first'),
               value: [generalEntityStart],
            }],
         });
         const state = new CheckState();
         state.generalDecls.testRef = new GeneralEntityDeclarationPToken({ open: toSToken('<!'), nDataName: toSToken('foo') });
         const checker = makeChecker(state);

         checker.check(withUnparsedRef, ec);

         expect(ec).toReportError({
            id: WellFormedError.ID.REFERENCE_UNPARSED_NO_USE,
            params: [ 'testRef' ],
            position: generalEntityStart.referencePToken.open,
         });
      });

   });

});
