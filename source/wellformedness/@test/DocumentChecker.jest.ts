/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it, jest } from '@jest/globals';

import { ConformanceVersion, EntityId } from 'basic';
import { ErrorCollector, WellFormedError } from 'error';
import { MockErrorCollector } from 'error-test';
import {
   ProcessingInstructionPToken,
   TextDeclarationPToken,
   XmlDeclarationPToken,
   XMLDECL_PTOKEN,
} from 'pToken';
import { toSToken } from 'sToken';
import {
   CDATA_PTOKEN,
   COMMENT_PTOKEN,
   ELEMENT_EMPTY_PTOKEN,
   ELEMENT_START_PTOKEN,
   EXTERNAL_SUBSET_START_TOKEN,
   INTERNAL_SUBSET_START_TOKEN,
   CdataPToken,
   CommentPToken,
   DocTypeEndPToken,
   DocTypeStartPToken,
   ElementEndPToken,
   ElementStartPToken,
   ElementEmptyPToken,
   ExternalSubsetEndToken,
   ExternalSubsetStartToken,
   InternalSubsetEndToken,
   InternalSubsetStartToken,
   SpacePToken,
   PToken,
   ConditionalPToken,
} from 'token';
import {
   makeTextDecl,
   makeProcessingInstruction,
   makeSpace,
   makeDocTypeStart,
   makeDocTypeEnd,
   makeXmlDecl,
   makeComment,
   makeCdata,
   makeExternalSubsetEnd,
   makeExternalSubsetStart,
   makeInternalSubsetEnd,
   makeInternalSubsetStart,
   makeElementStart,
   makeElementEnd,
   makeElementEmpty,
} from 'token-test';

import { DocumentChecker } from '../DocumentChecker';
import { CHECKER_DONE, CheckState, Checker } from '../checkUtils';
import { checkMap } from '../checkMap';
import checkConditionalStartWellFormed from '../token/conditionalStart';

jest.mock('../token/conditionalStart');

describe('DocumentChecker (unit)', () => {
   let checker: DocumentChecker;
   let subState: CheckState;
   let subParams: Array<unknown>;
   let cdata: CdataPToken;
   let comment: CommentPToken;
   let space: SpacePToken;
   let processingInstruction: ProcessingInstructionPToken;
   let ec: MockErrorCollector;
   let confVer: ConformanceVersion;
   let textDecl: TextDeclarationPToken;
   let xmlDecl: XmlDeclarationPToken;
   let xmlDeclStandalone: XmlDeclarationPToken;
   let docTypeStart: DocTypeStartPToken;
   let docTypeStartExtSubset: DocTypeStartPToken;
   let docTypeEnd: DocTypeEndPToken;
   let elementEnd: ElementEndPToken;
   let elementStart: ElementStartPToken;
   let elementEmpty: ElementEmptyPToken;
   let internalSubsetEnd: InternalSubsetEndToken;
   let internalSubsetStart: InternalSubsetStartToken;
   let externalSubsetEnd: ExternalSubsetEndToken;
   let externalSubsetStart: ExternalSubsetStartToken;

   class MockChecker implements Checker {
      lastSeen?: PToken;

      constructor(checkState: CheckState) {
         subState = checkState;
      }

      check(...args: Array<unknown>): void | typeof CHECKER_DONE {
         subParams = args; // eslint-disable-line prefer-rest-params
         const pToken: PToken = args[0] as PToken;
         if (pToken.type === ELEMENT_EMPTY_PTOKEN) {
            return CHECKER_DONE;
         }

         if (pToken.type === COMMENT_PTOKEN) {
            return undefined;
         }

         if (
            this.lastSeen &&
            (this.lastSeen.type === INTERNAL_SUBSET_START_TOKEN ||
               this.lastSeen.type === EXTERNAL_SUBSET_START_TOKEN ||
               this.lastSeen.type === ELEMENT_START_PTOKEN)
         ) {
            return CHECKER_DONE;
         }

         this.lastSeen = pToken;
      }
   }

   beforeEach(() => {
      jest.restoreAllMocks();
      jest.resetAllMocks();
      subState = new CheckState();
      subParams = [];
      ec = new MockErrorCollector();
      checker = new DocumentChecker({
         content: MockChecker,
         dtd: MockChecker,
      });

      confVer = new ConformanceVersion();

      cdata = makeCdata();
      comment = makeComment();
      docTypeEnd = makeDocTypeEnd();
      docTypeStart = makeDocTypeStart();
      externalSubsetEnd = makeExternalSubsetEnd();
      externalSubsetStart = makeExternalSubsetStart();
      internalSubsetEnd = makeInternalSubsetEnd();
      internalSubsetStart = makeInternalSubsetStart();
      processingInstruction = makeProcessingInstruction();
      space = makeSpace();
      textDecl = makeTextDecl();
      xmlDecl = makeXmlDecl();
      elementStart = makeElementStart();
      elementEnd = makeElementEnd();
      elementEmpty = makeElementEmpty();
      xmlDeclStandalone = new XmlDeclarationPToken({
         ...xmlDecl,
         fields: [
            ...xmlDecl.fields,
            {
               name: toSToken('standalone'),
               value: toSToken('yes'),
            },
         ],
      });
      docTypeStartExtSubset = new DocTypeStartPToken({
         ...docTypeStart,
         openSubset: undefined,
         externalId: {},
      });
   });

   describe('check()', () => {
      it('calls pToken.checkWellFormed() when encountering an XML Declaration', () => {
         const cwfSpy = jest.spyOn(checkMap, XMLDECL_PTOKEN).mockImplementation();
         checker.check(confVer, ec);

         checker.check(xmlDecl, ec);

         expect(cwfSpy).toHaveBeenCalledWith(xmlDecl, expect.any(ErrorCollector), confVer);
      });

      it('handles an XmlError with no problems', () => {
         const error = new WellFormedError(WellFormedError.ID.XMLDECL_NO_PARAMS);

         checker.check(error, ec);

         expect(ec.errors).toEqual([]);
      });

      it('handles an EntityId with no problems', () => {
         checker.check(new EntityId(), ec);

         expect(ec.errors).toEqual([]);
      });

      it('handles an ConditionalSection start with no problems', () => {
         const conditional = new ConditionalPToken({
            open: toSToken('<!['),
            bracket: toSToken('['),
         });

         checker.check(conditional, ec);

         expect(checkConditionalStartWellFormed).toHaveBeenCalledWith(conditional, ec);
      });

      describe('dtd subchecker', () => {
         it('calls with the token and error collector', () => {
            checker.check(xmlDecl, ec);
            checker.check(space, ec);
            checker.check(docTypeStart, ec);
            checker.check(internalSubsetStart, ec);

            expect(subParams[0]).toEqual(internalSubsetStart);
            expect(subParams[1]).toEqual(ec);
         });

         it('passes internal subset flags', () => {
            const expected = new CheckState();
            expected.hasNoDTD = false;

            checker.check(xmlDecl, ec);
            checker.check(space, ec);
            checker.check(docTypeStart, ec);
            checker.check(internalSubsetStart, ec);

            expect(subState).toEqual(expected);
         });

         it('passes subset flags when there is no dtd at all', () => {
            docTypeStart = new DocTypeStartPToken({
               ...docTypeStart,
               openSubset: undefined,
            });
            const expected = new CheckState();
            expected.hasNoDTD = true;

            checker.check(xmlDecl, ec);
            checker.check(space, ec);
            checker.check(docTypeStart, ec);
            checker.check(internalSubsetStart, ec);

            expect(subState).toEqual(expected);
         });

         it('passes subset flags when there is an external subset', () => {
            const expected = new CheckState();
            expected.hasNoDTD = false;
            expected.hasExternalDTD = true;

            checker.check(xmlDecl, ec);
            checker.check(space, ec);
            checker.check(docTypeStartExtSubset, ec);
            checker.check(internalSubsetStart, ec);

            expect(subState).toEqual(expected);
         });

         it('passes standalone flag', () => {
            const expected = new CheckState();
            expected.isStandalone = true;

            checker.check(xmlDeclStandalone, ec);
            checker.check(space, ec);
            checker.check(docTypeStart, ec);
            checker.check(internalSubsetStart, ec);

            expect(subState).toEqual(expected);
         });

         it('repeated doctype starts have no effect', () => {
            const expected = new CheckState();
            expected.hasNoDTD = false;
            expected.hasExternalDTD = true;

            checker.check(xmlDecl, ec);
            checker.check(space, ec);
            checker.check(docTypeStartExtSubset, ec);
            checker.check(makeDocTypeStart(), ec);
            checker.check(internalSubsetStart, ec);

            expect(subState).toEqual(expected);
         });

         it('repeated XML Declarations do not affect the first one', () => {
            const expected = new CheckState();
            expected.isStandalone = true;

            checker.check(xmlDeclStandalone, ec);
            checker.check(space, ec);
            checker.check(makeXmlDecl(), ec);
            checker.check(docTypeStart, ec);
            checker.check(internalSubsetStart, ec);

            expect(subState).toEqual(expected);
         });
      });

      describe('content subchecker', () => {
         it('calls content sub-checker with the token and error collector', () => {
            checker.check(xmlDecl, ec);
            checker.check(space, ec);
            checker.check(docTypeStart, ec);
            checker.check(docTypeEnd, ec);
            checker.check(elementStart, ec);

            expect(subParams[0]).toEqual(elementStart);
            expect(subParams[1]).toEqual(ec);
         });

         it('passes internal subset flags', () => {
            const expected = new CheckState();
            expected.hasNoDTD = false;

            checker.check(xmlDecl, ec);
            checker.check(elementStart, ec);

            expect(subState).toEqual(expected);
         });

         it('passes subset flags when there is no dtd at all', () => {
            docTypeStart = new DocTypeStartPToken({
               ...docTypeStart,
               openSubset: undefined,
            });
            const expected = new CheckState();
            expected.hasNoDTD = true;

            checker.check(xmlDecl, ec);
            checker.check(space, ec);
            checker.check(docTypeStart, ec);
            checker.check(docTypeEnd, ec);
            checker.check(elementStart, ec);

            expect(subState).toEqual(expected);
         });

         it('passes subset flags when there is an external subset', () => {
            const expected = new CheckState();
            expected.hasNoDTD = false;
            expected.hasExternalDTD = true;

            checker.check(xmlDecl, ec);
            checker.check(docTypeStartExtSubset, ec);
            checker.check(docTypeEnd, ec);
            checker.check(elementStart, ec);

            expect(subState).toEqual(expected);
         });

         it('passes standalone flag', () => {
            const expected = new CheckState();
            expected.isStandalone = true;

            checker.check(xmlDeclStandalone, ec);
            checker.check(docTypeStart, ec);
            checker.check(docTypeEnd, ec);
            checker.check(elementStart, ec);

            expect(subState).toEqual(expected);
         });

         it('repeated doctype starts have no effect', () => {
            const expected = new CheckState();
            expected.hasNoDTD = false;
            expected.hasExternalDTD = true;

            checker.check(xmlDecl, ec);
            checker.check(space, ec);
            checker.check(docTypeStartExtSubset, ec);
            checker.check(docTypeEnd, ec);
            checker.check(makeDocTypeStart(), ec);
            checker.check(elementStart, ec);

            expect(subState).toEqual(expected);
         });

         it('repeated XML Declarations do not affect the first one', () => {
            const expected = new CheckState();
            expected.isStandalone = true;

            checker.check(xmlDeclStandalone, ec);
            checker.check(makeXmlDecl(), ec);
            checker.check(docTypeStart, ec);
            checker.check(docTypeEnd, ec);
            checker.check(elementStart, ec);

            expect(subState).toEqual(expected);
         });
      });

      describe('initial state', () => {
         it('reports no error when an XML Declaration is found at the start', () => {
            checker.check(xmlDecl, ec);

            expect(ec.errors).toEqual([]);
         });

         it('does not report an error if document starts with an element start', () => {
            checker.check(elementStart, ec);

            // @ts-expect-error 2329/matchers
            expect(ec).toNotReportError(WellFormedError.ID.TOKEN_INVALID_CONTEXT);
         });

         it('reports an error when a textDecl is found at the start', () => {
            checker.check(textDecl, ec);

            // @ts-expect-error 2329/matchers
            expect(ec).toReportError({
               id: WellFormedError.ID.TOKEN_INVALID_CONTEXT,
               params: [textDecl.type],
               position: textDecl.open,
            });
         });

         it('reports no error when a space is found at the start', () => {
            checker.check(space, ec);

            // @ts-expect-error 2329/matchers
            expect(ec).toNotReportError(WellFormedError.ID.TOKEN_INVALID_CONTEXT);
         });

         it('reports an error if an xml declaration is found other than at the start of the document', () => {
            checker.check(xmlDecl, ec);
            checker.check(xmlDecl, ec);

            expect(ec.errors.length).toEqual(1);
            // @ts-expect-error 2329/matchers
            expect(ec).toReportError({
               id: WellFormedError.ID.TOKEN_INVALID_CONTEXT,
               params: [XMLDECL_PTOKEN],
               position: xmlDecl.open,
            });
         });
      });

      describe('post XML Declaration', () => {
         beforeEach(() => {
            checker.check(xmlDecl, ec);
         });

         it('reports an error if something incorrect is found', () => {
            checker.check(cdata, ec);

            // @ts-expect-error 2329/matchers
            expect(ec).toReportError({
               id: WellFormedError.ID.TOKEN_INVALID_CONTEXT,
               params: [CDATA_PTOKEN],
               position: cdata.open,
            });
         });

         it('allows a comment', () => {
            checker.check(comment, ec);

            expect(ec.errors).toEqual([]);
         });

         it('allows a space', () => {
            checker.check(space, ec);

            expect(ec.errors).toEqual([]);
         });

         it('allows a processing instruction', () => {
            checker.check(processingInstruction, ec);

            expect(ec.errors).toEqual([]);
         });

         it('allows an element start', () => {
            checker.check(elementStart, ec);

            expect(ec.errors).toEqual([]);
         });

         it('allows an empty element', () => {
            checker.check(elementEmpty, ec);

            expect(ec.errors).toEqual([]);
         });

         it('allows an doctype start', () => {
            checker.check(docTypeStart, ec);

            expect(ec.errors).toEqual([]);
         });

         it('allows several no-state-changes in a row', () => {
            checker.check(comment, ec);
            checker.check(comment, ec);
            checker.check(processingInstruction, ec);
            checker.check(space, ec);
            checker.check(docTypeStart, ec);

            expect(ec.errors).toEqual([]);
         });
      });

      describe('in DOCTYPE', () => {
         beforeEach(() => {
            checker.check(xmlDecl, ec);
            checker.check(space, ec);
            checker.check(docTypeStart, ec);
         });

         it('reports an error if something incorrect is found', () => {
            checker.check(cdata, ec);

            // @ts-expect-error 2329/matchers
            expect(ec).toReportError({
               id: WellFormedError.ID.TOKEN_INVALID_CONTEXT,
               params: [CDATA_PTOKEN],
               position: cdata.open,
            });
         });

         it('allows the end of the DOCTYE', () => {
            checker.check(docTypeEnd, ec);

            expect(ec.errors).toEqual([]);
         });

         it('allows an internal subset start marker', () => {
            checker.check(internalSubsetStart, ec);

            expect(ec.errors).toEqual([]);
         });

         it('allows an external subset start marker', () => {
            checker.check(externalSubsetStart, ec);

            expect(ec.errors).toEqual([]);
         });

         it('rejects multiple internal subset starts', () => {
            checker.check(internalSubsetStart, ec);
            checker.check(internalSubsetEnd, ec);
            checker.check(internalSubsetStart, ec);

            // @ts-expect-error 2329/matchers
            expect(ec).toReportError({
               id: WellFormedError.ID.TOKEN_INVALID_CONTEXT,
               params: [INTERNAL_SUBSET_START_TOKEN],
               position: docTypeStart.openSubset,
            });
         });

         it('rejects multiple external subset starts', () => {
            checker.check(externalSubsetStart, ec);
            checker.check(externalSubsetEnd, ec);
            checker.check(externalSubsetStart, ec);

            // @ts-expect-error 2329/matchers
            expect(ec).toReportError({
               id: WellFormedError.ID.TOKEN_INVALID_CONTEXT,
               params: [EXTERNAL_SUBSET_START_TOKEN],
               position: docTypeStart.openSubset,
            });
         });

         it('rejects an internal subset after an external subset', () => {
            checker.check(externalSubsetStart, ec);
            checker.check(externalSubsetEnd, ec);
            checker.check(internalSubsetStart, ec);

            // @ts-expect-error 2329/matchers
            expect(ec).toReportError({
               id: WellFormedError.ID.TOKEN_INVALID_CONTEXT,
               params: [INTERNAL_SUBSET_START_TOKEN],
               position: docTypeStart.openSubset,
            });
         });

         it('accepts an internal then external then docTypeEnd', () => {
            checker.check(internalSubsetStart, ec);
            checker.check(internalSubsetEnd, ec);
            checker.check(externalSubsetStart, ec);
            checker.check(externalSubsetEnd, ec);
            checker.check(docTypeEnd, ec);

            expect(ec.errors).toEqual([]);
         });

         it('rejects an element start and then accepts a docTypeEnd', () => {
            checker.check(elementStart, ec);
            checker.check(internalSubsetStart, ec);
            checker.check(internalSubsetEnd, ec);
            checker.check(docTypeEnd, ec);

            expect(ec.errors.length).toEqual(1);
            // @ts-expect-error 2329/matchers
            expect(ec).toReportError({
               id: WellFormedError.ID.TOKEN_INVALID_CONTEXT,
               params: [ELEMENT_START_PTOKEN],
               position: elementStart.open,
            });
         });
      });

      describe('post DOCTYPE', () => {
         beforeEach(() => {
            checker.check(xmlDecl, ec);
            checker.check(docTypeStart, ec);
            checker.check(docTypeEnd, ec);
         });

         it('reports an error if something incorrect is found', () => {
            checker.check(cdata, ec);

            // @ts-expect-error 2329/matchers
            expect(ec).toReportError({
               id: WellFormedError.ID.TOKEN_INVALID_CONTEXT,
               params: [CDATA_PTOKEN],
               position: cdata.open,
            });
         });

         it('allows a comment', () => {
            checker.check(comment, ec);

            expect(ec.errors).toEqual([]);
         });

         it('allows a space', () => {
            checker.check(space, ec);

            expect(ec.errors).toEqual([]);
         });

         it('allows a processing instruction', () => {
            checker.check(processingInstruction, ec);

            expect(ec.errors).toEqual([]);
         });

         it('allows an element start', () => {
            checker.check(elementStart, ec);

            expect(ec.errors).toEqual([]);
         });

         it('allows an empty element', () => {
            checker.check(elementEmpty, ec);

            expect(ec.errors).toEqual([]);
         });

         it('allows several no-state-changes in a row', () => {
            checker.check(comment, ec);
            checker.check(comment, ec);
            checker.check(processingInstruction, ec);
            checker.check(space, ec);
            checker.check(elementStart, ec);

            expect(ec.errors).toEqual([]);
         });
      });

      describe('in ELEMENT', () => {
         beforeEach(() => {
            checker.check(xmlDecl, ec);
            checker.check(docTypeStart, ec);
            checker.check(docTypeEnd, ec);
            checker.check(elementStart, ec);
         });

         // This exercises not deleting the sub-checker after a call
         it('can respond to things within the element', () => {
            checker.check(comment, ec);
            checker.check(elementEnd, ec);

            expect(ec.errors).toEqual([]);
         });
      });

      describe('in TRAILING MISC', () => {
         beforeEach(() => {
            checker.check(xmlDecl, ec);
            checker.check(docTypeStart, ec);
            checker.check(docTypeEnd, ec);
         });

         it('rejects content after an element start and end', () => {
            checker.check(elementStart, ec);
            checker.check(elementEnd, ec);
            checker.check(cdata, ec);

            // @ts-expect-error 2329/matchers
            expect(ec).toReportError({
               id: WellFormedError.ID.TOKEN_INVALID_CONTEXT,
               params: [CDATA_PTOKEN],
               position: cdata.open,
            });
         });

         it('rejects content after an empty element', () => {
            checker.check(elementEmpty, ec);
            checker.check(cdata, ec);

            // @ts-expect-error 2329/matchers
            expect(ec).toReportError({
               id: WellFormedError.ID.TOKEN_INVALID_CONTEXT,
               params: [CDATA_PTOKEN],
               position: cdata.open,
            });
         });

         it('allows a comment', () => {
            checker.check(elementStart, ec);
            checker.check(elementEnd, ec);
            checker.check(comment, ec);

            expect(ec.errors).toEqual([]);
         });

         it('allows a space', () => {
            checker.check(elementEmpty, ec);
            checker.check(space, ec);

            expect(ec.errors).toEqual([]);
         });

         it('allows a processing instruction', () => {
            checker.check(elementStart, ec);
            checker.check(elementEnd, ec);
            checker.check(processingInstruction, ec);

            expect(ec.errors).toEqual([]);
         });

         it('allows several no-state-changes in a row', () => {
            checker.check(elementEmpty, ec);
            checker.check(comment, ec);
            checker.check(comment, ec);
            checker.check(processingInstruction, ec);
            checker.check(space, ec);

            expect(ec.errors).toEqual([]);
         });
      });
   });

   describe('finish()', () => {
      describe('initial state', () => {
         it('reports an error if called before anything has been processed', () => {
            checker.finish(ec);

            // @ts-expect-error 2329/matchers
            expect(ec).toReportError({
               id: WellFormedError.ID.DOC_END_EARLY,
               params: undefined,
               position: undefined,
            });
         });
      });

      describe('post XML Declaration', () => {
         beforeEach(() => {
            checker.check(xmlDecl, ec);
         });

         it('reports an error if called after the XML Declaration', () => {
            checker.finish(ec);

            // @ts-expect-error 2329/matchers
            expect(ec).toReportError({
               id: WellFormedError.ID.DOC_END_EARLY,
               params: undefined,
               position: xmlDecl.close,
            });
         });
      });

      describe('in DOCTYPE', () => {
         beforeEach(() => {
            checker.check(xmlDecl, ec);
            checker.check(space, ec);
            checker.check(docTypeStart, ec);
         });

         it('reports an error when called after a DOCTYPE has started', () => {
            checker.finish(ec);

            // @ts-expect-error 2329/matchers
            expect(ec).toReportError({
               id: WellFormedError.ID.DOC_END_EARLY,
               params: undefined,
               position: docTypeStart.openSubset,
            });
         });
      });

      describe('post DOCTYPE', () => {
         beforeEach(() => {
            checker.check(xmlDecl, ec);
            checker.check(docTypeStart, ec);
            checker.check(docTypeEnd, ec);
         });

         it('reports an error if called after the DOCTYPE', () => {
            checker.finish(ec);

            // @ts-expect-error 2329/matchers
            expect(ec).toReportError({
               id: WellFormedError.ID.DOC_END_EARLY,
               params: undefined,
               position: docTypeStart.openSubset,
            });
         });

         it('reports an error if called after the start of an element', () => {
            checker.check(elementStart, ec);

            checker.finish(ec);

            // @ts-expect-error 2329/matchers
            expect(ec).toReportError({
               id: WellFormedError.ID.DOC_END_EARLY,
               params: undefined,
               position: elementStart.close,
            });
         });
      });

      describe('in TRAILING MISC', () => {
         beforeEach(() => {
            checker.check(xmlDecl, ec);
            checker.check(docTypeStart, ec);
            checker.check(docTypeEnd, ec);
         });

         it('reports no errors after an element start and end', () => {
            checker.check(elementStart, ec);
            checker.check(elementEnd, ec);

            checker.finish(ec);

            expect(ec.errors).toEqual([]);
         });

         it('reports no errors after an empty element', () => {
            checker.check(elementEmpty, ec);

            checker.finish(ec);

            expect(ec.errors).toEqual([]);
         });
      });
   });
});
