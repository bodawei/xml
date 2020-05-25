/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from 'basic';
import { WellFormedError } from 'error';
import { defaultExtractors } from 'extractor';
import { toSToken, STokenSource } from 'sToken';
import {
   DOCTYPE_END_PTOKEN,
   DOCTYPE_START_PTOKEN,
   ERROR_TYPE,
   INTERNAL_SUBSET_START_TOKEN,
   INTERNAL_SUBSET_END_TOKEN,
   EXTERNAL_SUBSET_START_TOKEN,
   EXTERNAL_SUBSET_END_TOKEN,
   NOTATION_DECLARATION_PTOKEN,
   AttributeValuePToken,
   CharRefPToken,
   DocTypeEndPToken,
   DocTypeStartPToken,
   ElementDeclarationPToken,
   ElementStartPToken,
   ElementEmptyPToken,
   EntityValuePToken,
   GeneralEntityDeclarationPToken,
   GeneralEntityReferencePToken,
   NotationDeclarationPToken,
   ParameterEntityDeclarationPToken,
   TextPToken,
   PToken,
   XmlError,
   AttListPToken,
} from 'token';

import * as expandAttributes from '../utils/expandAttributes';
import * as expandEntityValueModule from '../utils/expandEntityValue';
import * as streamEntityReference from '../utils/streamEntityReference';
import * as expandUnassigned from '../utils/expandUnassigned';
import { EXTERNAL_DTD_PSEUDO_TOKEN } from '../utils/ExternalDtdSubsetPseudoToken';
import { EntityExpander } from '../EntityExpander';
import { AttributeValueResults, ExpandParams, RetrieveResults } from '../types';

describe('EntityExpander (unit)', () => {
   let expandUnassignedSpy: jasmine.Spy;

   beforeEach(() => {
      expandUnassignedSpy = spyOn(expandUnassigned, 'expandUnassigned');
   });

   function harvestTypes(results: Array<PToken>): Array<string> {
      return results.map((element) => element.type);
   }

   function retrieveExternalEntity(): RetrieveResults {
      const sTokenSource = new STokenSource(defaultExtractors, {} as any);

      return {
         sTokenSource,
         getErrors(): Array<XmlError> {
            return [];
         },
      };
   }

   function parseAttributeValue(
      sTokenSource: STokenSource,
      done: (results: AttributeValueResults) => void,
   ): void {
      done({ newValue: [], errors: [] });
   }

   function doExpand(
      tokens: Array<PToken>,
      validate: boolean,
      allDone: (results: Array<PToken>) => void,
   ): void {
      const results: Array<PToken> = [];
      const unsent = tokens.slice(0);

      const entityExpander = new EntityExpander(validate, results.push.bind(results), {
         parseBody: (): void => {},
         parseEntityValue: (): void => {},
         retrieveExternalEntity,
         parseAttributeValue,
      });

      function processNextToken(): void {
         const nextToken = unsent.shift();

         if (!nextToken) {
            allDone(results);
            return;
         }

         entityExpander.expandPToken(nextToken, processNextToken);
      }

      processNextToken();
   }

   describe('EntityMetaData', () => {
      let emd: EntityMetaData;

      beforeEach(() => {
         emd = new EntityMetaData();
      });

      it('passes the EntityMetaData instance through', (done) => {
         doExpand([emd], true, (results) => {
            expect(results).toEqual([emd]);
            done();
         });
      });

      it('passes the EntityMetaData to the utility functions in the expandParams', (done) => {
         const expandAttributeSpy: jasmine.Spy = spyOn(expandAttributes, 'expandAttributes');
         expandAttributeSpy.and.callFake((value: any, params: any, cb: any) => {
            cb([
               {
                  newValue: [],
                  errors: [],
               },
            ]);
         });
         const startElement = new ElementStartPToken({
            open: toSToken('<'),
            name: toSToken('student'),
            attributes: [
               {
                  name: toSToken('two'),
                  value: [new CharRefPToken({ open: toSToken('&#') })],
               },
            ],
         });

         doExpand([emd, startElement], true, () => {
            expect(expandAttributeSpy.calls.argsFor(0)[1].emd).toEqual(emd);
            done();
         });
      });
   });

   describe('passes most token types through unchanged', () => {
      let textPToken: TextPToken;

      beforeEach(() => {
         textPToken = new TextPToken({ text: toSToken('foo') });
      });

      it('passes the PToken through', (done) => {
         doExpand([textPToken], true, (results) => {
            expect(results).toEqual([textPToken]);
            done();
         });
      });
   });

   describe('DOCTYPE declaration', () => {
      let docTypeStart: DocTypeStartPToken;
      let docTypeEnd: DocTypeEndPToken;

      beforeEach(() => {
         docTypeStart = new DocTypeStartPToken({
            open: toSToken('<!'),
            name: toSToken('root'),
         });
         docTypeEnd = new DocTypeEndPToken({
            docTypeStartPToken: docTypeStart,
            close: toSToken('>'),
         });
      });

      it('adds no internal or external entity markers if there are none', (done) => {
         doExpand([docTypeStart, docTypeEnd], true, (results) => {
            expect(harvestTypes(results)).toEqual([DOCTYPE_START_PTOKEN, DOCTYPE_END_PTOKEN]);
            done();
         });
      });

      it('adds an internal subset markers when there is an internal subset that is empty', (done) => {
         docTypeStart = new DocTypeStartPToken({
            open: toSToken('<!'),
            name: toSToken('root'),
            openSubset: toSToken('['),
         });

         doExpand([docTypeStart, docTypeEnd], true, (results) => {
            expect(harvestTypes(results)).toEqual([
               DOCTYPE_START_PTOKEN,
               INTERNAL_SUBSET_START_TOKEN,
               INTERNAL_SUBSET_END_TOKEN,
               DOCTYPE_END_PTOKEN,
            ]);
            done();
         });
      });

      it('adds an internal subset markers when there is a non-empty internal', (done) => {
         docTypeStart = new DocTypeStartPToken({
            open: toSToken('<!'),
            name: toSToken('root'),
            openSubset: toSToken('['),
         });
         const notation = new NotationDeclarationPToken({ open: toSToken('<!') });

         doExpand([docTypeStart, notation, docTypeEnd], true, (results) => {
            expect(harvestTypes(results)).toEqual([
               DOCTYPE_START_PTOKEN,
               INTERNAL_SUBSET_START_TOKEN,
               NOTATION_DECLARATION_PTOKEN,
               INTERNAL_SUBSET_END_TOKEN,
               DOCTYPE_END_PTOKEN,
            ]);
            done();
         });
      });

      it('calls the streamEntityReference() function with the subset token, prams and a callback', (done) => {
         docTypeStart = new DocTypeStartPToken({
            open: toSToken('<!'),
            name: toSToken('root'),
            externalId: {
               system: {
                  value: [new TextPToken({ text: toSToken('systemFoo') })],
               },
            },
         });
         const streamEntityReferenceSpy: jasmine.Spy = spyOn(
            streamEntityReference,
            'streamEntityReference',
         );
         streamEntityReferenceSpy.and.callFake((token, params, callback) => {
            callback(undefined, () => {});
         });

         doExpand([docTypeStart, docTypeEnd], true, (results) => {
            const args = streamEntityReferenceSpy.calls.argsFor(0);

            expect(args[0].type).toEqual(EXTERNAL_DTD_PSEUDO_TOKEN);
            expect(args[1].entityDetails).not.toBeUndefined();
            expect(args[2]).toBeInstanceOf(Function);
            done();
         });
      });

      it('adds external subset markers when there is an externalId', (done) => {
         docTypeStart = new DocTypeStartPToken({
            open: toSToken('<!'),
            name: toSToken('root'),
            externalId: {
               system: {
                  value: [new TextPToken({ text: toSToken('systemFoo') })],
               },
            },
         });
         const streamEntityReferenceSpy: jasmine.Spy = spyOn(
            streamEntityReference,
            'streamEntityReference',
         );
         const notation = new NotationDeclarationPToken({ open: toSToken('<!') });
         streamEntityReferenceSpy.and.callFake((token, params, callback) => {
            callback(notation, () => {
               callback(undefined, () => {});
            });
         });

         doExpand([docTypeStart, docTypeEnd], true, (results) => {
            expect(harvestTypes(results)).toEqual([
               DOCTYPE_START_PTOKEN,
               NOTATION_DECLARATION_PTOKEN,
               DOCTYPE_END_PTOKEN,
            ]);
            done();
         });
      });

      it('adds an internal and calls processing of the xternal subset if both subsets are mentioned', (done) => {
         const notation = new NotationDeclarationPToken({ open: toSToken('<!') });
         docTypeStart = new DocTypeStartPToken({
            open: toSToken('<!'),
            name: toSToken('root'),
            openSubset: toSToken('['),
            externalId: {
               system: {
                  value: [new TextPToken({ text: toSToken('systemFoo') })],
               },
            },
         });
         const streamEntityReferenceSpy: jasmine.Spy = spyOn(
            streamEntityReference,
            'streamEntityReference',
         );
         const error = new WellFormedError(WellFormedError.ID.XMLDECL_PARAM_UNKNOWN, ['x']);
         streamEntityReferenceSpy.and.callFake((token, params, callback) => {
            callback(error, () => {
               callback(undefined, () => {});
            });
         });

         doExpand([docTypeStart, notation, docTypeEnd], true, (results) => {
            expect(harvestTypes(results)).toEqual([
               DOCTYPE_START_PTOKEN,
               INTERNAL_SUBSET_START_TOKEN,
               NOTATION_DECLARATION_PTOKEN,
               INTERNAL_SUBSET_END_TOKEN,
               ERROR_TYPE,
               DOCTYPE_END_PTOKEN,
            ]);
            done();
         });
      });

      it('dos not add external subset markers if this is not a validating processor', (done) => {
         const notation = new NotationDeclarationPToken({ open: toSToken('<!') });
         docTypeStart = new DocTypeStartPToken({
            open: toSToken('<!'),
            name: toSToken('root'),
            openSubset: toSToken('['),
            externalId: {
               system: {
                  value: [new TextPToken({ text: toSToken('systemFoo') })],
               },
            },
         });

         doExpand([docTypeStart, notation, docTypeEnd], false, (results) => {
            expect(harvestTypes(results)).toEqual([
               DOCTYPE_START_PTOKEN,
               INTERNAL_SUBSET_START_TOKEN,
               NOTATION_DECLARATION_PTOKEN,
               INTERNAL_SUBSET_END_TOKEN,
               DOCTYPE_END_PTOKEN,
            ]);
            done();
         });
      });
   });

   describe('declarations', () => {
      let notation: NotationDeclarationPToken;

      beforeEach(() => {
         notation = new NotationDeclarationPToken({
            type: 'NOTATION_DECLARATION_PTOKEN',
            open: toSToken('<!'),
            name: toSToken('test'),
            externalId: {
               type: 'EXTERNAL_ID',
            },
         });
      });

      it('passes a declaration with unassigned values through', (done) => {
         (notation.unassigned as any) = [1];
         (notation.assignUnassigned as any) = () => {};

         expandUnassignedSpy.and.callFake((unassigned, params, callback) => {
            callback({ newValue: [2], errors: [] });
         });

         doExpand([notation], true, (results) => {
            expect(results).toEqual([notation]);
            done();
         });
      });

      it('passes a declaration with unassigned values to the expandUnassigned() utility', (done) => {
         (notation.unassigned as any) = [1];
         (notation.assignUnassigned as any) = () => {};

         expandUnassignedSpy.and.callFake((unassigned, params, callback) => {
            callback({ newValue: [], errors: [] });
         });

         doExpand([notation], true, () => {
            const params = expandUnassignedSpy.calls.argsFor(0);

            expect(params[0]).toEqual([1]);
            expect(params[1].entityDetails).not.toBeUndefined();
            expect(params[2]).toBeInstanceOf(Function);
            done();
         });
      });

      it('delivers any errors encountered while expanding the unassigned', (done) => {
         (notation.unassigned as any) = [1];
         (notation.assignUnassigned as any) = jasmine.createSpy();
         const error = new WellFormedError(WellFormedError.ID.XMLDECL_PARAM_UNKNOWN, ['x']);

         expandUnassignedSpy.and.callFake((unassigned, params, callback) => {
            callback({ newValue: [2], errors: [error] });
         });

         doExpand([notation], true, (results) => {
            expect(harvestTypes(results)).toEqual([ERROR_TYPE, NOTATION_DECLARATION_PTOKEN]);
            done();
         });
      });
   });

   describe('NOTATION declaration', () => {
      let notation: NotationDeclarationPToken;

      beforeEach(() => {
         notation = new NotationDeclarationPToken({
            type: 'NOTATION_DECLARATION_PTOKEN',
            open: toSToken('<!'),
            name: toSToken('test'),
            externalId: {
               type: 'EXTERNAL_ID',
            },
         });
      });

      it('passes a declaration with no unassigned values through without changes', (done) => {
         doExpand([notation], true, (results) => {
            expect(results).toEqual([notation]);
            done();
         });
      });

      it('asks the notation to assign any newly unassigned values to itself', (done) => {
         (notation.unassigned as any) = [1];
         (notation.assignUnassigned as any) = jasmine.createSpy();

         expandUnassignedSpy.and.callFake((unassigned, params, callback) => {
            callback({ newValue: [2], errors: [] });
         });

         doExpand([notation], true, () => {
            expect(notation.assignUnassigned).toHaveBeenCalled();
            expect(notation.unassigned).toEqual([2] as any);
            done();
         });
      });
   });

   describe('ELEMENT declaration', () => {
      let elementDecl: ElementDeclarationPToken;

      beforeEach(() => {
         elementDecl = new ElementDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('student'),
         });
      });

      it('passes a declaration with no unassigned values through without changes', (done) => {
         const input = [elementDecl];

         doExpand(input, true, (results) => {
            expect(results).toEqual([elementDecl]);
            done();
         });
      });

      it('asks the element to assign any newly unassigned values to itself', (done) => {
         (elementDecl.unassigned as any) = [1];
         (elementDecl.assignUnassigned as any) = jasmine.createSpy();

         expandUnassignedSpy.and.callFake((unassigned, params, callback) => {
            callback({ newValue: [2], errors: [] });
         });

         doExpand([elementDecl], true, () => {
            expect(elementDecl.assignUnassigned).toHaveBeenCalled();
            expect(elementDecl.unassigned).toEqual([2] as any);
            done();
         });
      });
   });

   describe('ATTLIST declaration', () => {
      let expandAttributeSpy: jasmine.Spy;

      beforeEach(() => {
         expandAttributeSpy = spyOn(expandAttributes, 'expandAttributes');
         let index = 0;

         expandAttributeSpy.and.callFake((value: Array<object>, params: object, cb: Function) => {
            const result = value.map(() => {
               const code = WellFormedError.ID.XMLDECL_PARAM_UNKNOWN;
               index++;

               return {
                  newValue: [new TextPToken({ text: toSToken(`testValue #${index}`) })],
                  errors: [new WellFormedError(code, [`${index}`])],
               };
            });

            cb(result);
         });
      });

      it('processes the default attribute values of the ATTLIST PToken', (done) => {
         const attList = new AttListPToken({
            open: toSToken('<!'),
            elementName: toSToken('student'),
            attDefs: [
               {
                  name: toSToken('two'),
                  value: [new CharRefPToken({ open: toSToken('&#') })],
               },
               {
                  name: toSToken('three'),
                  value: [new TextPToken({ text: toSToken('twoValue') })],
               },
            ],
         });
         const error1 = new WellFormedError(WellFormedError.ID.XMLDECL_PARAM_UNKNOWN, ['1']);
         const error2 = new WellFormedError(WellFormedError.ID.XMLDECL_PARAM_UNKNOWN, ['2']);
         const expanded = new AttListPToken({
            open: toSToken('<!'),
            elementName: toSToken('student'),
            attDefs: [
               {
                  name: toSToken('two'),
                  value: [new TextPToken({ text: toSToken('testValue #1') })],
               },
               {
                  name: toSToken('three'),
                  value: [new TextPToken({ text: toSToken('testValue #2') })],
               },
            ],
         });

         doExpand([attList], true, (results) => {
            expect(results).toEqual([error1, error2, expanded]);
            done();
         });
      });

      it('calls the expandAttributes() routine with the attDefs, expand params and a callback', (done) => {
         const attList = new AttListPToken({
            open: toSToken('<!'),
            elementName: toSToken('student'),
            attDefs: [
               {
                  name: toSToken('three'),
                  value: [new TextPToken({ text: toSToken('twoValue') })],
               },
            ],
         });

         doExpand([attList], true, () => {
            const callArgs = expandAttributeSpy.calls.mostRecent().args;

            expect(callArgs[0]).toEqual(attList.attDefs);
            expect(callArgs[1].emd).not.toBeUndefined();
            expect(callArgs[2]).toBeInstanceOf(Function);
            done();
         });
      });

      it('asks the AttListPToken to assign any newly unassigned values to itself', (done) => {
         const attList = new AttListPToken({
            open: toSToken('<!'),
            elementName: toSToken('student'),
            attDefs: [],
            unassigned: [1] as any,
            assignUnassigned: jasmine.createSpy(),
         });

         expandUnassignedSpy.and.callFake((unassigned, params, callback) => {
            callback({ newValue: [2], errors: [] });
         });

         doExpand([attList], true, () => {
            expect(attList.assignUnassigned).toHaveBeenCalled();
            expect(attList.unassigned).toEqual([2] as any);
            done();
         });
      });
   });

   describe('ENTITY declaration', () => {
      let geDecl: GeneralEntityDeclarationPToken;
      let peDecl: ParameterEntityDeclarationPToken;
      let expandEntityValueSpy: jasmine.Spy;

      beforeEach(() => {
         expandEntityValueSpy = spyOn(expandEntityValueModule, 'expandEntityValue');
         let index = 0;

         expandEntityValueSpy.and.callFake(
            (pToken: EntityValuePToken, params: object, chain: any, cb: Function) => {
               const error = new WellFormedError(WellFormedError.ID.XMLDECL_PARAM_UNKNOWN, [
                  `${index}`,
               ]);
               index++;
               cb({
                  newValue: [new TextPToken({ text: toSToken(`testValue #${index}`) })],
                  errors: [error],
               });
            },
         );
      });

      it('calls expandEntityValue() with the general entity value, expandParams and a callback', (done) => {
         geDecl = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('student'),
            value: [new CharRefPToken({ open: toSToken('&#') })],
         });

         doExpand([geDecl], true, () => {
            const args = expandEntityValueSpy.calls.argsFor(0);

            expect(args[0]).toEqual([new CharRefPToken({ open: toSToken('&#') })]);
            expect(args[1].entityDetails).not.toBeUndefined();
            expect(args[2]).toEqual([]);
            expect(args[3]).toBeInstanceOf(Function);
            done();
         });
      });

      it('calls expandEntityValue() with the parameter entity value, expandParams and a callback', (done) => {
         peDecl = new ParameterEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('student'),
            value: [new CharRefPToken({ open: toSToken('&#') })],
         });

         doExpand([peDecl], true, () => {
            const args = expandEntityValueSpy.calls.argsFor(0);

            expect(args[0]).toEqual([new CharRefPToken({ open: toSToken('&#') })]);
            expect(args[1].entityDetails).not.toBeUndefined();
            expect(args[2]).toEqual(['student']);
            expect(args[3]).toBeInstanceOf(Function);
            done();
         });
      });

      it('delivers the geDecl along with any errors that happened while expanding its value', (done) => {
         geDecl = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('student'),
            value: [new CharRefPToken({ open: toSToken('&#') })],
         });
         const error1 = new WellFormedError(WellFormedError.ID.XMLDECL_PARAM_UNKNOWN, ['0']);

         doExpand([geDecl], true, (results) => {
            expect(results).toEqual([error1, geDecl]);
            done();
         });
      });

      it('does not expand the entity value if this is an external entity', (done) => {
         geDecl = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('student'),
            externalId: {},
            value: [new CharRefPToken({ open: toSToken('&#') })],
         });

         doExpand([geDecl], true, () => {
            expect(expandEntityValueSpy).not.toHaveBeenCalled();
            done();
         });
      });

      it('does not expand the entity value if this entity has no name', (done) => {
         geDecl = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            value: [new CharRefPToken({ open: toSToken('&#') })],
         });

         doExpand([geDecl], true, () => {
            expect(expandEntityValueSpy).not.toHaveBeenCalled();
            done();
         });
      });

      it('does not expand the entity value if this entity is already in the entity details', (done) => {
         geDecl = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('student'),
            value: [new CharRefPToken({ open: toSToken('&#') })],
         });

         doExpand([geDecl, geDecl], true, () => {
            expect(expandEntityValueSpy).toHaveBeenCalledTimes(1);
            done();
         });
      });

      it('does not set up the value in entity details until after calling expandEntityValue()', (done) => {
         let hasGeDecl: boolean;
         let afterCallParams: ExpandParams;
         geDecl = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('student'),
            value: [new CharRefPToken({ open: toSToken('&#') })],
         });

         expandEntityValueSpy.and.callFake(
            (pToken: any, params: ExpandParams, chain: any, cb: any) => {
               hasGeDecl = params.entityDetails.hasEntity(geDecl);
               afterCallParams = params;
               cb({ newValue: [new TextPToken({ text: toSToken(`testValue`) })], errors: [] });
            },
         );

         doExpand([geDecl, geDecl], true, () => {
            expect(hasGeDecl).toEqual(false);
            expect(afterCallParams.entityDetails.hasEntity(geDecl)).toEqual(true);
            done();
         });
      });

      it('asks the entity declaration to assign any newly unassigned values to itself', (done) => {
         geDecl = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('student'),
            value: [new CharRefPToken({ open: toSToken('&#') })],
            unassigned: [1] as any,
            assignUnassigned: jasmine.createSpy(),
         });

         expandUnassignedSpy.and.callFake((unassigned, params, callback) => {
            callback({ newValue: [2], errors: [] });
         });

         doExpand([geDecl], true, () => {
            expect(geDecl.assignUnassigned).toHaveBeenCalled();
            expect(geDecl.unassigned).toEqual([2] as any);
            done();
         });
      });
   });

   describe('element start', () => {
      let startElement: ElementStartPToken;
      let expandAttributeSpy: jasmine.Spy;

      beforeEach(() => {
         expandAttributeSpy = spyOn(expandAttributes, 'expandAttributes');
         let index = 0;

         startElement = new ElementStartPToken({
            open: toSToken('<'),
            name: toSToken('student'),
         });

         expandAttributeSpy.and.callFake((value: Array<object>, params: object, cb: Function) => {
            const result = value.map(() => {
               const code = WellFormedError.ID.XMLDECL_PARAM_UNKNOWN;
               index++;

               return {
                  newValue: [new TextPToken({ text: toSToken(`testValue #${index}`) })],
                  errors: [new WellFormedError(code, [`${index}`])],
               };
            });

            cb(result);
         });
      });

      it('passes a the element through with no changes when it has no attributes', (done) => {
         doExpand([startElement], true, (results) => {
            expect(results).toEqual([startElement]);
            done();
         });
      });

      it('returns the expanded general entity references when there is one in the attribute', (done) => {
         const error1 = new WellFormedError(WellFormedError.ID.XMLDECL_PARAM_UNKNOWN, ['1']);
         const error2 = new WellFormedError(WellFormedError.ID.XMLDECL_PARAM_UNKNOWN, ['2']);
         const reference1 = new GeneralEntityReferencePToken({
            open: toSToken('&'),
            name: toSToken('foo'),
         });
         startElement = new ElementStartPToken({
            open: toSToken('<'),
            name: toSToken('student'),
            attributes: [
               {
                  name: toSToken('two'),
                  value: [
                     new CharRefPToken({ open: toSToken('&#') }),
                     new TextPToken({ text: toSToken('twoValue') }),
                     reference1,
                  ],
               },
               {
                  name: toSToken('three'),
                  value: [reference1],
               },
            ],
         });
         const expandedStart = new ElementStartPToken({
            open: toSToken('<'),
            name: toSToken('student'),
            attributes: [
               {
                  name: toSToken('two'),
                  value: [new TextPToken({ text: toSToken('testValue #1') })],
               },
               {
                  name: toSToken('three'),
                  value: [new TextPToken({ text: toSToken('testValue #2') })],
               },
            ],
         });

         doExpand([startElement], true, (results) => {
            expect(results).toEqual([error1, error2, expandedStart]);
            done();
         });
      });

      it('calls the expandAttribute() routine with the value, expand params and a callback', (done) => {
         startElement = new ElementStartPToken({
            open: toSToken('<'),
            name: toSToken('student'),
            attributes: [
               {
                  name: toSToken('two'),
                  value: [new CharRefPToken({ open: toSToken('&#') })],
               },
            ],
         });

         doExpand([startElement], true, () => {
            const callArgs = expandAttributeSpy.calls.mostRecent().args;

            expect(callArgs[0]).toEqual(startElement.attributes);
            expect(callArgs[1].entityDetails).not.toBeUndefined();
            expect(callArgs[2]).toBeInstanceOf(Function);
            done();
         });
      });
   });

   describe('empty element start', () => {
      let emptyElement: ElementEmptyPToken;

      beforeEach(() => {
         emptyElement = new ElementEmptyPToken({
            open: toSToken('<'),
            name: toSToken('student'),
         });
      });

      it('passes a the element through with no changes when it has no attributes', (done) => {
         const input = [emptyElement];

         doExpand(input, true, (results) => {
            expect(results).toEqual([emptyElement]);
            done();
         });
      });
   });
});
