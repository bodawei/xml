/* Copyright ® 2019 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { WellFormedError } from 'error';
import { MockErrorCollector } from 'error-test';
import { toSToken } from 'sToken';

import {
   CommentPToken,
   GeneralEntityDeclarationPToken,
   GeneralEntityReferencePToken,
   TextDeclarationPToken,
   InternalSubsetStartToken,
   ExternalSubsetStartToken,
   ExternalSubsetEndToken,
   InternalSubsetEndToken,
   ParameterEntityStartPToken,
   ParameterEntityReferencePToken,
   ParameterEntityEndPToken,
   ParameterEntityDeclarationPToken,
   GeneralEntityStartPToken,
   GeneralEntityEndPToken,
} from 'token';
import { AttListPToken } from 'source/token/attListDeclaration';

import { MarkupDeclChecker } from '../MarkupDeclChecker';
import * as checkUtils from '../checkUtils';
import { CheckState, CHECKER_DONE } from '../checkUtils';

import { makeTextDecl, makeParameterEntityDeclaration, makeComment, makeAttListDeclaration, makeParameterEntityReference, makeExternalSubsetEnd, makeExternalSubsetStart, makeInternalSubsetEnd, makeInternalSubsetStart, makeParameterExternalEntityDeclaration, makeGeneralEntityDeclaration, makeGeneralEntityReference, makeSpace, makeProcessingInstruction, makeNotationDeclaration, makeElementDeclaration } from './tokens';

describe('MarkupDeclChecker (unit)', () => {
   let ec: MockErrorCollector;
   let checker: MarkupDeclChecker;
   let checkState: CheckState;
   let attributeListDeclaration: AttListPToken;
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

   function addAllTokens(checker: MarkupDeclChecker, ec: MockErrorCollector) {
      checker.check(comment, ec);
      checker.check(makeSpace(), ec);
      checker.check(makeProcessingInstruction(), ec);
      checker.check(makeAttListDeclaration(), ec);
      checker.check(makeElementDeclaration(), ec);
      checker.check(makeGeneralEntityDeclaration(), ec);
      checker.check(makeParameterEntityDeclaration(), ec);
      checker.check(makeNotationDeclaration(), ec);
   }

   describe('starting', () => {

      it('can be started with a parameter entity start token', () => {
         checkState.paramDecls.entityName = parameterEntityDeclaration;

         checker = new MarkupDeclChecker(checkState);

         checker.check(parameterEntityStart, ec)

         expect(ec.errors).toEqual([]);
      });

      it('reports an error it is started with something other than an internal or external subset', () => {
         checker = new MarkupDeclChecker(checkState);

         checker.check(comment, ec)

         expect(ec).toReportError({
            id: WellFormedError.ID.MARKUPDECL_INVALID_TOKEN,
            params: [ comment.type ],
            position: comment.open,
         });
      });

      it('closes a parameter entity', () => {
         checker = new MarkupDeclChecker(checkState);

         checker.check(parameterEntityStart, ec);
         checker.check(parameterEntityEnd, ec);

         expect(() => checker.check(comment, ec)).toThrowError(/Passed a token to MarkupDeclChecker/);
      });

   });

   describe('internal subset', () => {

      beforeEach(() => {
         ec = new MockErrorCollector();
         checker = new MarkupDeclChecker(checkState);
         checker.check(internalSubsetStart, ec);
      });

      it('can be started with an internal subset start token', () => {
         expect(ec.errors).toEqual([]);
      });

      it('reports an error if a textdecl appears after an internal subset start', () => {
         checker = new MarkupDeclChecker(checkState);

         checker.check(internalSubsetStart, ec)
         checker.check(textDecl, ec)

         expect(ec).toReportError({
            id: WellFormedError.ID.MARKUPDECL_INVALID_TOKEN,
            params: [ textDecl.type ],
            position: textDecl.open,
         });
      });

      it('reports no errors if it is closed with an InternalSubsetEndPToken', () => {
         checker.check(internalSubsetEnd, ec);

         expect(ec.errors).toEqual([]);
      });

      it('reports an error if called after an internal subset closed it', () => {
         checker.check(internalSubsetEnd, ec);

         expect(() => checker.check(comment, ec)).toThrowError(/Passed a token to MarkupDeclChecker/);
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
            checker.check(textDecl, ec)

            expect(ec).toReportError({
               id: WellFormedError.ID.MARKUPDECL_INVALID_TOKEN,
               params: [ textDecl.type ],
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
            checker.check(textDecl, ec)

            expect(ec.errors).toEqual([]);
         });

         it('closes the parameter entity and internal subset without problems', () => {
            const end = new ParameterEntityEndPToken(paramEntityRef);
            checker.check(generalEntityDeclaration, ec);

            checker.check(end, ec);
            checker.check(internalSubsetEnd, ec);

            expect(ec.errors).toEqual([]);
         });

      });

   });

   describe('external subset', () => {

      beforeEach(() => {
         checker = new MarkupDeclChecker(checkState);
         checker.check(externalSubsetStart, ec);
      });

      it('can be started with an external subset start token', () => {
         checker = new MarkupDeclChecker(checkState);

         checker.check(externalSubsetStart, ec)

         expect(ec.errors).toEqual([]);
      });

      it('reports no error if a textdecl appears after an external subset start', () => {
         checker = new MarkupDeclChecker(checkState);

         checker.check(externalSubsetStart, ec)
         checker.check(textDecl, ec)

         expect(ec.errors).toEqual([]);
      });

      it('reports an error if a textdecl appears after a textdecl', () => {
         checker.check(textDecl, ec)
         checker.check(textDecl, ec)

         expect(ec).toReportError({
            id: WellFormedError.ID.MARKUPDECL_INVALID_TOKEN,
            params: [ textDecl.type ],
            position: textDecl.open,
         });
      });

      it('reports no errors when all DTD tokens appear', () => {
         checker.check(textDecl, ec)
         addAllTokens(checker, ec);

         expect(ec.errors).toEqual([]);
      });

      it('reports no errors if it is closed with an ExternalSubsetEndPToken', () => {
         checker.check(externalSubsetEnd, ec);

         expect(ec.errors).toEqual([]);
      });

      it('closes an external subset', () => {
         checker.check(externalSubsetEnd, ec);

         expect(() => checker.check(comment, ec)).toThrowError(/Passed a token to MarkupDeclChecker/);
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
            checker.check(textDecl, ec)

            expect(ec).toReportError({
               id: WellFormedError.ID.MARKUPDECL_INVALID_TOKEN,
               params: [ textDecl.type ],
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
            const internalParameterEntityStartPToken = new ParameterEntityStartPToken(paramEntityRef);
            checker.check(externalParamEntityDecl, ec);
            checker.check(internalParameterEntityStartPToken, ec);
         });

         it('reports no errors when all DTD tokens appear', () => {
            addAllTokens(checker, ec);

            expect(ec.errors).toEqual([]);
         });

         it('reports no error if a textdecl appears after an external parameter entity start', () => {
            checker.check(textDecl, ec)

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

   });

   describe('ATTLIST', () => {

      it('calls scanAttributeValues() on the attributes in the ATTLIST', () => {
         const spy = spyOn(checkUtils, 'scanAttributeValues');
         checker = new MarkupDeclChecker(checkState);

         checker.check(internalSubsetStart, ec)
         checker.check(attributeListDeclaration, ec)

         expect(spy).toHaveBeenCalledWith(attributeListDeclaration.attDefs, {}, new CheckState(), ec);
      });

      describe('attribute content', () => {

         xit('reports an error in the case of unbalanced entity starts and ends', () => {
            const generalEntityStartTwo = new GeneralEntityStartPToken(generalEntityReference);
            const attList = new AttListPToken({
               open: toSToken('<'),
               attDefs: [{
                  name: toSToken('first'),
                  value: [generalEntityStart, generalEntityStartTwo, generalEntityEnd],
               }],
            });
            const checker = new MarkupDeclChecker(checkState);

            checker.check(internalSubsetStart, ec)
            checker.check(attList, ec);

            expect(ec).toReportError({
               id: WellFormedError.ID.ATTRIBUTE_REFERENCE_UNBALANCED,
               params: [ 'testRef', 'second' ],
               position: generalEntityEnd.referencePToken.open,
            });
         });

         it('reports no errors when entity start and ends are properly blanced', () => {
            const generalEntityStartTwo = new GeneralEntityStartPToken(generalEntityReference);
            const generalEntityEndTwo = new GeneralEntityEndPToken(generalEntityReference);
            const attList = new AttListPToken({
               open: toSToken('<'),
               attDefs: [{
                  name: toSToken('first'),
                  value: [generalEntityStart, generalEntityStartTwo, generalEntityEndTwo, generalEntityEnd],
               }],
            });
            const checker = new MarkupDeclChecker(checkState);

            checker.check(internalSubsetStart, ec)
            checker.check(attList, ec);


            expect(ec).toNotReportError(WellFormedError.ID.ATTRIBUTE_REFERENCE_UNBALANCED);
         });

         it('reports no error if a declared reference is found (§4.1.0)', () => {
            const attList = new AttListPToken({
               open: toSToken('<'),
               attDefs: [{
                  name: toSToken('first'),
                  value: [generalEntityStart],
               }],
            });
            const state = new CheckState();
            state.generalDecls.testRef = new GeneralEntityDeclarationPToken({ open: toSToken('<!') });
            const checker = new MarkupDeclChecker(state);

            checker.check(internalSubsetStart, ec)
            checker.check(attList, ec);

            expect(ec.errors).toEqual([]);
         });

         it('reports an error if an undeclared reference is found (§4.1.0)', () => {
            const attList = new AttListPToken({
               open: toSToken('<'),
               attDefs: [{
                  name: toSToken('first'),
                  value: [generalEntityStart],
               }],
            });
            const state = new CheckState();
            const checker = new MarkupDeclChecker(state);

            checker.check(internalSubsetStart, ec)
            checker.check(attList, ec);

            expect(ec).toReportError({
               id: WellFormedError.ID.REFERENCE_NO_DECLARATION,
               params: [ 'testRef' ],
               position: generalEntityReference.open,
            });
         });

         it('reports no error if an undeclared reference is found but there is an external subset (logically wrong, but matches the spec) (§4.1.0)', () => {
            const attList = new AttListPToken({
               open: toSToken('<'),
               attDefs: [{
                  name: toSToken('first'),
                  value: [generalEntityStart],
               }],
            });
            const state = new CheckState();
            state.hasExternalDTD = true;
            const checker = new MarkupDeclChecker(state);

            checker.check(internalSubsetStart, ec)
            checker.check(attList, ec);

            expect(ec.errors).toEqual([]);
         });

         it('reports no error if an undeclared reference is found, no external subset, but there are perefs before the attlist (§4.1.0)', () => {
            const attList = new AttListPToken({
               open: toSToken('<'),
               attDefs: [{
                  name: toSToken('first'),
                  value: [generalEntityStart],
               }],
            });
            const state = new CheckState();
            state.peRefCount = 1;
            const checker = new MarkupDeclChecker(state);

            checker.check(internalSubsetStart, ec)
            checker.check(attList, ec);

            expect(ec.errors).toEqual([]);
         });

         it('reports an error if an entity references an external entiy (§3.1.0)', () => {
            const attList = new AttListPToken({
               open: toSToken('<'),
               attDefs: [{
                  name: toSToken('first'),
                  value: [generalEntityStart],
               }],
            });
            const state = new CheckState();
            state.generalDecls.testRef = new GeneralEntityDeclarationPToken({ open: toSToken('<!'), externalId: {} });
            const checker = new MarkupDeclChecker(state);

            checker.check(internalSubsetStart, ec)
            checker.check(attList, ec);

            expect(ec).toReportError({
               id: WellFormedError.ID.ATTRIBUTE_INVALID_REFERENCE,
               params: [ 'testRef' ],
               position: generalEntityStart.referencePToken.open,
            });
         });

         it('reports an error when unparsed entity referenced from attr value (§4.1.0)', () => {
            const attList = new AttListPToken({
               open: toSToken('<'),
               attDefs: [{
                  name: toSToken('first'),
                  value: [generalEntityStart],
               }],
            });
            const state = new CheckState();
            state.generalDecls.testRef = new GeneralEntityDeclarationPToken({ open: toSToken('<!'), nDataName: toSToken('foo') });
            const checker = new MarkupDeclChecker(state);

            checker.check(internalSubsetStart, ec)
            checker.check(attList, ec);

            expect(ec).toReportError({
               id: WellFormedError.ID.REFERENCE_UNPARSED_NO_USE,
               params: [ 'testRef' ],
               position: generalEntityStart.referencePToken.open,
            });
         });

      });

   });

   describe('general entity declaration', () => {

      it('adds a general entity declaration to the generalDecls', () => {
         checker = new MarkupDeclChecker(checkState, true);

         checker.check(internalSubsetStart, ec)
         checker.check(generalEntityDeclaration, ec)

         expect(checkState.generalDecls.genDecl).toEqual(generalEntityDeclaration);
      });

   });

   describe('parameter entity reference', () => {

      it('marks that we do not have all declarations after encountering a PE ref in an internal subset', () => {
         checker = new MarkupDeclChecker(checkState, true);

         checker.check(internalSubsetStart, ec)
         checker.check(paramEntityRef, ec)

         expect(checkState.peRefCount).toEqual(1);
      });

   });

   describe('embedded parameter entity', () => {

      it('returns done after going through a parameter entity and then ending the subset', () => {
         checker = new MarkupDeclChecker(checkState);
         checker.check(externalSubsetStart, ec)
         checker.check(comment, ec)
         checker.check(parameterEntityStart, ec)
         checker.check(comment, ec)
         checker.check(parameterEntityEnd, ec)
         checker.check(comment, ec)

         const result = checker.check(externalSubsetEnd, ec)

         expect(result).toEqual(CHECKER_DONE);
      });

      it('returns done after going through an external param entity ref and then ending the subset', () => {
         checker = new MarkupDeclChecker(checkState);
         checker.check(externalSubsetStart, ec)
         checker.check(externalParamEntityDecl, ec)
         checker.check(comment, ec)
         checker.check(parameterEntityStart, ec)
         checker.check(comment, ec)
         checker.check(parameterEntityEnd, ec)
         checker.check(comment, ec)

         const result = checker.check(externalSubsetEnd, ec)

         expect(result).toEqual(CHECKER_DONE);
      });

   });

});
