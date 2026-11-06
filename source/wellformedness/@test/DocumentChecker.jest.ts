/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it, jest } from '@jest/globals';

import { ProblemCollector, ConformanceVersion, EntityId } from 'basic';
import {
   ParseToken,
   ProcessingInstructionPToken,
   TextDeclarationPToken,
   XmlDeclarationPToken,
} from 'pToken';
import { toSToken } from 'basic';
import {
   COMMENT_PTOKEN,
   ELEMENT_EMPTY_PTOKEN,
   ELEMENT_START_PTOKEN,
   EXTERNAL_SUBSET_START_TOKEN,
   CdataPToken,
   CommentPToken,
   DocTypeEndPToken,
   DocTypeStartPToken,
   ElementEndPToken,
   ElementStartPToken,
   ElementEmptyPToken,
   ExternalSubsetEndToken,
   ExternalSubsetStartToken,
   SpacePToken,
   PToken,
   ConditionalStartPToken,
   DOCTYPE_START_PTOKEN,
} from 'token';
import {
   makeTextDecl,
   makeProcessingInstruction,
   makeSpace,
   makeDocTypeStart,
   makeDocTypeEnd,
   makeXmlDecl,
   makeXmlDecl10,
   makeComment,
   makeCdata,
   makeExternalSubsetEnd,
   makeExternalSubsetStart,
   makeElementStart,
   makeElementEnd,
   makeElementEmpty,
} from 'token-test';

import { dtdEndCheck } from '../common/dtdEndCheck';
import { wellFormedErrorCodes, WellFormedError } from '../error/wellFormedError';
import { DocumentChecker } from '../DocumentChecker';
import {
   CHECKER_DONE,
   CheckState,
   MarkupChecker,
   ContentChecker,
   ContentCheckerConstructor,
   MarkupCheckerConstructor,
} from '../checkUtils';
import { checkMap } from '../checkMap';
import { conditionalStartCheck } from '../token/conditionalStartCheck';

jest.mock('../common/dtdEndCheck');
jest.mock('../token/conditionalStartCheck');

const WFEID = wellFormedErrorCodes.id;

describe('DocumentChecker (unit)', () => {
   let checker: DocumentChecker;
   let subState: CheckState;
   let subParams: Array<unknown>;
   let cdata: CdataPToken;
   let comment: CommentPToken;
   let space: SpacePToken;
   let processingInstruction: ProcessingInstructionPToken;
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
   let externalSubsetEnd: ExternalSubsetEndToken;
   let externalSubsetStart: ExternalSubsetStartToken;

   class MockMarkupChecker implements MarkupChecker {
      lastSeen?: ParseToken;

      constructor(start: ParseToken, collector: ProblemCollector, checkState: CheckState) {
         subParams = [start, collector];
         subState = checkState;
         this.lastSeen = start;
         this.inSecondPassContxt = false;
      }

      inSecondPassContxt: boolean;

      check(...args: Array<unknown>): undefined | typeof CHECKER_DONE {
         subParams = args; // eslint-disable-line prefer-rest-params
         const pToken: PToken = args[0] as PToken;

         if (pToken.type === COMMENT_PTOKEN) {
            return undefined;
         }

         if (
            this.lastSeen &&
            (this.lastSeen.type === DOCTYPE_START_PTOKEN ||
               this.lastSeen.type === EXTERNAL_SUBSET_START_TOKEN)
         ) {
            return CHECKER_DONE;
         }

         this.lastSeen = pToken;
      }
   }

   class MockContentChecker implements ContentChecker {
      lastSeen?: ParseToken;

      allDone: boolean;

      constructor(start: ParseToken, collector: ProblemCollector, checkState: CheckState) {
         subParams = [start, collector];
         subState = checkState;
         this.lastSeen = start;
         this.allDone = start.type === ELEMENT_EMPTY_PTOKEN;
         this.inSecondPassContxt = false;
      }

      inSecondPassContxt: boolean;

      get isDone() {
         return this.allDone;
      }

      check(...args: Array<unknown>): undefined | typeof CHECKER_DONE {
         subParams = args; // eslint-disable-line prefer-rest-params
         const pToken: PToken = args[0] as PToken;

         if (pToken.type === COMMENT_PTOKEN) {
            return undefined;
         }

         if (this.lastSeen?.type === ELEMENT_START_PTOKEN) {
            this.allDone = true;
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
      checker = new DocumentChecker({
         content: MockContentChecker as unknown as ContentCheckerConstructor,
         dtd: MockMarkupChecker as unknown as MarkupCheckerConstructor,
      });

      confVer = new ConformanceVersion();

      cdata = makeCdata();
      comment = makeComment();
      docTypeEnd = makeDocTypeEnd();
      docTypeStart = makeDocTypeStart();
      externalSubsetEnd = makeExternalSubsetEnd();
      externalSubsetStart = makeExternalSubsetStart();
      processingInstruction = makeProcessingInstruction();
      space = makeSpace();
      textDecl = makeTextDecl();
      xmlDecl = makeXmlDecl10();
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
         externalId: {},
         openSubset: undefined,
      });
   });

   describe('check()', () => {
      it('calls pToken.checkWellFormed() when encountering an XML Declaration', () => {
         const cwfSpy = jest
            .spyOn(
               checkMap as Record<string, (...args: Array<unknown>) => unknown>,
               'XMLDECL_PTOKEN',
            )
            .mockImplementation((() => {}) as never);
         checker.check(confVer);

         checker.check(xmlDecl);

         expect(cwfSpy).toHaveBeenCalledWith(xmlDecl, expect.any(Object), confVer, undefined);
      });

      it('handles an error token with no problems', () => {
         const error = new WellFormedError(WFEID.XMLDECL_NO_PARAMS);

         const problems = checker.check(error);

         expect(problems.length).toEqual(0);
      });

      it('handles an EntityId with no problems', () => {
         const problems = checker.check(new EntityId());

         expect(problems.length).toEqual(0);
      });

      it('handles an ConditionalSection start with no problems', () => {
         const conditional = new ConditionalStartPToken({
            bracket: toSToken('['),
            open: toSToken('<!['),
         });

         checker.check(conditional);

         expect(conditionalStartCheck).toHaveBeenCalledWith(conditional, expect.any(Object));
      });

      describe('dtd subchecker', () => {
         it('calls with the token and error collector', () => {
            checker.check(xmlDecl);
            checker.check(space);
            checker.check(docTypeStart);
            checker.check(docTypeStart);

            expect(subParams[0]).toEqual(docTypeStart);
            expect(subParams[1]).toEqual(expect.any(Object));
         });

         it('passes internal subset flags', () => {
            const expected = new CheckState();
            expected.hasNoDTD = false;

            checker.check(xmlDecl);
            checker.check(space);
            checker.check(docTypeStart);
            checker.check(docTypeStart);

            expect(subState).toEqual(expected);
         });

         it('passes subset flags when there is no dtd at all', () => {
            docTypeStart = new DocTypeStartPToken({
               ...docTypeStart,
               openSubset: undefined,
            });
            const expected = new CheckState();
            expected.hasNoDTD = true;

            checker.check(xmlDecl);
            checker.check(space);
            checker.check(docTypeStart);

            expect(subState).toEqual(expected);
         });

         it('passes subset flags when there is an external subset', () => {
            const expected = new CheckState();
            expected.hasNoDTD = false;
            expected.hasExternalDTD = true;

            checker.check(xmlDecl);
            checker.check(space);
            checker.check(docTypeStartExtSubset);

            expect(subState).toEqual(expected);
         });

         it('passes standalone flag', () => {
            const expected = new CheckState();
            expected.isStandalone = true;

            checker.check(xmlDeclStandalone);
            checker.check(space);
            checker.check(docTypeStart);

            expect(subState).toEqual(expected);
         });

         it('repeated doctype starts have no effect', () => {
            const expected = new CheckState();
            expected.hasNoDTD = false;
            expected.hasExternalDTD = true;

            checker.check(xmlDecl);
            checker.check(space);
            checker.check(docTypeStartExtSubset);
            checker.check(makeDocTypeStart());

            expect(subState).toEqual(expected);
         });

         it('repeated XML Declarations do not affect the first one', () => {
            const expected = new CheckState();
            expected.isStandalone = true;

            checker.check(xmlDeclStandalone);
            checker.check(space);
            checker.check(makeXmlDecl());
            checker.check(docTypeStart);

            expect(subState).toEqual(expected);
         });
      });

      describe('content subchecker', () => {
         it('calls content sub-checker with the token and error collector', () => {
            checker.check(xmlDecl);
            checker.check(space);
            checker.check(docTypeStart);
            checker.check(docTypeEnd);
            checker.check(elementStart);

            expect(subParams[0]).toEqual(elementStart);
            expect(subParams[1]).toEqual(expect.any(Object));
         });

         it('passes internal subset flags', () => {
            const expected = new CheckState();
            expected.hasNoDTD = false;

            checker.check(xmlDecl);
            checker.check(elementStart);

            expect(subState).toEqual(expected);
         });

         it('passes subset flags when there is no dtd at all', () => {
            docTypeStart = new DocTypeStartPToken({
               ...docTypeStart,
               openSubset: undefined,
            });
            const expected = new CheckState();
            expected.hasNoDTD = true;

            checker.check(xmlDecl);
            checker.check(space);
            checker.check(docTypeStart);
            checker.check(docTypeEnd);
            checker.check(elementStart);

            expect(subState).toEqual(expected);
         });

         it('passes subset flags when there is an external subset', () => {
            const expected = new CheckState();
            expected.hasNoDTD = false;
            expected.hasExternalDTD = true;

            checker.check(xmlDecl);
            checker.check(docTypeStartExtSubset);
            checker.check(docTypeEnd);
            checker.check(elementStart);

            expect(subState).toEqual(expected);
         });

         it('passes standalone flag', () => {
            const expected = new CheckState();
            expected.isStandalone = true;

            checker.check(xmlDeclStandalone);
            checker.check(docTypeStart);
            checker.check(docTypeEnd);
            checker.check(elementStart);

            expect(subState).toEqual(expected);
         });

         it('repeated doctype starts have no effect', () => {
            const expected = new CheckState();
            expected.hasNoDTD = false;
            expected.hasExternalDTD = true;
            checker.check(xmlDecl);
            checker.check(space);
            checker.check(docTypeStartExtSubset);
            checker.check(docTypeEnd);
            checker.check(makeDocTypeStart());
            checker.check(elementStart);

            expect(subState).toEqual(expected);
         });

         it('repeated XML Declarations do not affect the first one', () => {
            const expected = new CheckState();
            expected.isStandalone = true;

            checker.check(xmlDeclStandalone);
            checker.check(makeXmlDecl());
            checker.check(docTypeStart);
            checker.check(docTypeEnd);
            checker.check(elementStart);

            expect(subState).toEqual(expected);
         });
      });

      describe('initial state', () => {
         it('reports no error when an XML Declaration is found at the start', () => {
            const problems = checker.check(xmlDecl);

            expect(problems.length).toEqual(0);
         });

         it('does not report an error if document starts with an element start', () => {
            const problems = checker.check(elementStart);

            expect(problems.length).toEqual(0);
         });

         it('reports an error when a textDecl is found at the start', () => {
            const problems = checker.check(textDecl);

            expect(problems[2].id).toEqual(WFEID.TOKEN_INVALID_CONTEXT);
         });

         it('reports no error when a space is found at the start', () => {
            const problems = checker.check(space);

            expect(problems.length).toEqual(0);
         });

         it('reports an error if an xml declaration is found other than at the start of the document', () => {
            const prob1 = checker.check(xmlDecl);
            const prob2 = checker.check(xmlDecl);
            const problems = prob1.concat(prob2);

            expect(problems.length).toEqual(1);
            expect(problems[0].id).toEqual(WFEID.TOKEN_INVALID_CONTEXT);
         });
      });

      describe('post XML Declaration', () => {
         beforeEach(() => {
            checker.check(xmlDecl);
         });

         it('reports an error if something incorrect is found', () => {
            const problems = checker.check(cdata);

            expect(problems[0].id).toEqual(WFEID.TOKEN_INVALID_CONTEXT);
         });

         it('allows a comment', () => {
            const problems = checker.check(comment);

            expect(problems.length).toEqual(0);
         });

         it('allows a space', () => {
            const problems = checker.check(space);

            expect(problems.length).toEqual(0);
         });

         it('allows a processing instruction', () => {
            const problems = checker.check(processingInstruction);

            expect(problems.length).toEqual(0);
         });

         it('allows an element start', () => {
            const problems = checker.check(elementStart);

            expect(problems.length).toEqual(0);
         });

         it('allows an empty element', () => {
            const problems = checker.check(elementEmpty);

            expect(problems.length).toEqual(0);
         });

         it('allows an doctype start', () => {
            const problems = checker.check(docTypeStart);

            expect(problems.length).toEqual(0);
         });

         it('allows several no-state-changes in a row', () => {
            const p1 = checker.check(comment);
            const p2 = checker.check(comment);
            const p3 = checker.check(processingInstruction);
            const p4 = checker.check(space);
            const p5 = checker.check(docTypeStart);

            const problems = p1.concat(p2, p3, p4, p5);
            expect(problems.length).toEqual(0);
         });
      });

      describe('in DOCTYPE', () => {
         beforeEach(() => {
            checker.check(xmlDecl);
            checker.check(space);
            checker.check(docTypeStart);
         });

         it('allows the end of the DOCTYPE', () => {
            const problems = checker.check(docTypeEnd);

            expect(problems.length).toEqual(0);
         });

         it('calls docTypeEndCheck() when encountering a doctype end', () => {
            checker.check(docTypeEnd);

            expect(dtdEndCheck).toHaveBeenCalledWith(
               expect.any(Object),
               expect.any(ProblemCollector),
            );
         });

         it('allows an external subset start marker', () => {
            const problems = checker.check(externalSubsetStart);

            expect(problems.length).toEqual(0);
         });

         it('rejects multiple external subset starts', () => {
            checker.check(externalSubsetStart);
            checker.check(externalSubsetEnd);
            const problems = checker.check(externalSubsetStart);

            const problem = problems[0];
            expect(problem.id).toEqual(WFEID.TOKEN_INVALID_CONTEXT);
         });
      });

      describe('post DOCTYPE', () => {
         beforeEach(() => {
            checker.check(xmlDecl);
            checker.check(docTypeStart);
            checker.check(docTypeEnd);
         });

         it('reports an error if something incorrect is found', () => {
            const problems = checker.check(cdata);

            const problem = problems[0];
            expect(problem.id).toEqual(WFEID.TOKEN_INVALID_CONTEXT);
         });

         it('allows a comment', () => {
            const problems = checker.check(comment);

            expect(problems.length).toEqual(0);
         });

         it('allows a space', () => {
            const problems = checker.check(space);

            expect(problems.length).toEqual(0);
         });

         it('allows a processing instruction', () => {
            const problems = checker.check(processingInstruction);

            expect(problems.length).toEqual(0);
         });

         it('allows an element start', () => {
            const problems = checker.check(elementStart);

            expect(problems.length).toEqual(0);
         });

         it('allows an empty element', () => {
            const problems = checker.check(elementEmpty);

            expect(problems.length).toEqual(0);
         });

         it('allows several no-state-changes in a row', () => {
            const p1 = checker.check(comment);
            const p2 = checker.check(comment);
            const p3 = checker.check(processingInstruction);
            const p4 = checker.check(space);
            const p5 = checker.check(elementStart);

            const lengths = p1.length + p2.length + p3.length + p4.length + p5.length;
            expect(lengths).toEqual(0);
         });
      });

      describe('in ELEMENT', () => {
         beforeEach(() => {
            checker.check(xmlDecl);
            checker.check(docTypeStart);
            checker.check(docTypeEnd);
            checker.check(elementStart);
         });

         // This exercises not deleting the sub-checker after a call
         it('can respond to things within the element', () => {
            const p1 = checker.check(comment);
            const p2 = checker.check(elementEnd);

            const lengths = p1.length + p2.length;
            expect(lengths).toEqual(0);
         });
      });

      describe('in TRAILING MISC', () => {
         beforeEach(() => {
            checker.check(xmlDecl);
            checker.check(docTypeStart);
            checker.check(docTypeEnd);
         });

         it('rejects content after an element start and end', () => {
            const p1 = checker.check(elementStart);
            const p2 = checker.check(elementEnd);
            const p3 = checker.check(cdata);

            expect([...p1, ...p2, ...p3]).toMatchInlineSnapshot(`
               [
                 WellFormedError {
                   "code": 1003,
                   "context": Offset {
                     "column": 0,
                     "entityId": EntityId {
                       "publicId": undefined,
                       "systemId": "",
                       "type": "ENTITY_ID",
                     },
                     "index": 0,
                     "row": 0,
                   },
                   "id": "TOKEN_INVALID_CONTEXT",
                   "message": "The token (CDATA_PTOKEN) must not be used in this location.",
                   "place": Offset {
                     "column": 0,
                     "entityId": EntityId {
                       "publicId": undefined,
                       "systemId": "",
                       "type": "ENTITY_ID",
                     },
                     "index": 0,
                     "row": 0,
                   },
                   "severity": "FATAL_ERROR_SSEVERITY",
                   "source": "wellformed",
                   "type": "PROBLEM",
                 },
               ]
            `);
         });

         it('rejects content after an empty element', () => {
            const p1 = checker.check(elementEmpty);
            const p2 = checker.check(cdata);

            expect([...p1, ...p2]).toMatchInlineSnapshot(`
               [
                 WellFormedError {
                   "code": 1003,
                   "context": Offset {
                     "column": 0,
                     "entityId": EntityId {
                       "publicId": undefined,
                       "systemId": "",
                       "type": "ENTITY_ID",
                     },
                     "index": 0,
                     "row": 0,
                   },
                   "id": "TOKEN_INVALID_CONTEXT",
                   "message": "The token (CDATA_PTOKEN) must not be used in this location.",
                   "place": Offset {
                     "column": 0,
                     "entityId": EntityId {
                       "publicId": undefined,
                       "systemId": "",
                       "type": "ENTITY_ID",
                     },
                     "index": 0,
                     "row": 0,
                   },
                   "severity": "FATAL_ERROR_SSEVERITY",
                   "source": "wellformed",
                   "type": "PROBLEM",
                 },
               ]
            `);
         });

         it('allows a comment', () => {
            const p1 = checker.check(elementStart);
            const p2 = checker.check(elementEnd);
            const p3 = checker.check(comment);

            const lengths = p1.length + p2.length + p3.length;
            expect(lengths).toEqual(0);
         });

         it('allows a space', () => {
            const p1 = checker.check(elementEmpty);
            const p2 = checker.check(space);

            const lengths = p1.length + p2.length;
            expect(lengths).toEqual(0);
         });

         it('allows a processing instruction', () => {
            const p1 = checker.check(elementStart);
            const p2 = checker.check(elementEnd);
            const p3 = checker.check(processingInstruction);

            const lengths = p1.length + p2.length + p3.length;
            expect(lengths).toEqual(0);
         });

         it('allows several no-state-changes in a row', () => {
            const p1 = checker.check(elementEmpty);
            const p2 = checker.check(comment);
            const p3 = checker.check(comment);
            const p4 = checker.check(processingInstruction);
            const p5 = checker.check(space);

            const lengths = p1.length + p2.length + p3.length + p4.length + p5.length;
            expect(lengths).toEqual(0);
         });
      });
   });

   describe('finish()', () => {
      describe('initial state', () => {
         it('reports an error if called before anything has been processed', () => {
            const problems = checker.finish();

            const problem = problems[0];
            expect(problem.id).toEqual(WFEID.DOC_END_EARLY);
         });
      });

      describe('post XML Declaration', () => {
         beforeEach(() => {
            checker.check(xmlDecl);
         });

         it('reports an error if called after the XML Declaration', () => {
            const problems = checker.finish();

            const problem = problems[0];
            expect(problem.id).toEqual(WFEID.DOC_END_EARLY);
         });
      });

      describe('in DOCTYPE', () => {
         beforeEach(() => {
            checker.check(xmlDecl);
            checker.check(space);
            checker.check(docTypeStart);
         });

         it('reports an error when called after a DOCTYPE has started', () => {
            const problems = checker.finish();

            const problem = problems[0];
            expect(problem.id).toEqual(WFEID.DOC_END_EARLY);
         });
      });

      describe('post DOCTYPE', () => {
         beforeEach(() => {
            checker.check(xmlDecl);
            checker.check(docTypeStart);
            checker.check(docTypeEnd);
         });

         it('reports an error if called after the DOCTYPE', () => {
            const problems = checker.finish();

            const problem = problems[0];
            expect(problem.id).toEqual(WFEID.DOC_END_EARLY);
         });

         it('reports an error if called after the start of an element', () => {
            const prob1 = checker.check(elementStart);

            const prob2 = checker.finish();

            const problem = [...prob1, ...prob2][0];
            expect(problem.id).toEqual(WFEID.DOC_END_EARLY);
         });
      });

      describe('in TRAILING MISC', () => {
         beforeEach(() => {
            checker.check(xmlDecl);
            checker.check(docTypeStart);
            checker.check(docTypeEnd);
         });

         it('reports no errors after an element start and end', () => {
            const prob1 = checker.check(elementStart);
            const prob2 = checker.check(elementEnd);

            const prob3 = checker.finish();

            expect(prob1.length + prob2.length + prob3.length).toEqual(0);
         });

         it('reports no errors after an empty element', () => {
            const prob1 = checker.check(elementEmpty);

            const prob2 = checker.finish();

            expect(prob1.length + prob2.length).toEqual(0);
         });
      });
   });
});
