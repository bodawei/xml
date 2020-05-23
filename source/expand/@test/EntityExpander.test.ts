/* Copyright ® 2018-2019 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { Token, EntityMetaData, ENTITY_META_DATA } from 'basic';
import { WellFormedError } from 'error';
import { defaultExtractors } from 'extractor';
import { PTokenStream, PTokenFromLiteralStream } from 'pTokenStream';
import { toSToken, STokenSource } from 'sToken';
import {
   DOCTYPE_END_PTOKEN,
   DOCTYPE_START_PTOKEN,
   GENERAL_ENTITY_DECLARATION_PTOKEN,
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
   ExternalId,
   GeneralEntityDeclarationPToken,
   GeneralEntityReferencePToken,
   NotationDeclarationPToken,
   ParameterEntityDeclarationPToken,
   TextPToken,
   PToken,
   XmlError,
   AttListPToken,
} from 'token';

// For mocking purposes
// eslint-disable-next-line
const expandAttributeValue = require('../utils/expandAttributeValue');
// eslint-disable-next-line
const expandEntityValueModule = require('../utils/expandEntityValue');

import { EntityExpander } from '../EntityExpander';

import { ExpandToken, ExpandParams, RetrieveResults } from '../types';

describe('EntityExpander (unit)', () => {
   const externalMap: { [publicName: string]: string } = {};

   function parseBody(
      sTokenSource: STokenSource,
      inContent: boolean,
      writeToken: ExpandToken,
   ): void {
      const pTokenStream = new PTokenStream(sTokenSource);

      (pTokenStream as any)._inContent = inContent;

      pTokenStream.on('data', (token: PToken) => {
         pTokenStream.pause();
         writeToken(token, () => {
            pTokenStream.resume();
         });
      });
      pTokenStream.on('end', () => {
         writeToken(undefined, () => {});
      });
   }

   function parseEntityValue(
      sTokenSource: STokenSource,
      done: (results: EntityValuePToken | void) => void,
   ): void {
      const pTokenStream = new PTokenFromLiteralStream(sTokenSource, { peRef: true });
      const results: EntityValuePToken = [];

      pTokenStream.on('data', (token: Token) => {
         results.push(token as any);
      });
      pTokenStream.on('end', () => {
         done(results);
      });
   }

   function retrieveExternalEntity(
      externalId: ExternalId,
      entityMetaData: EntityMetaData,
   ): RetrieveResults {
      const sTokenSource = new STokenSource(defaultExtractors, entityMetaData);

      const str = externalMap[(externalId.system!.value[0] as any).text.str];

      sTokenSource.addText(str);
      sTokenSource.endText();

      return {
         sTokenSource,
         getErrors(): Array<XmlError> {
            return [];
         },
      };
   }

   function parseAttributeValue(
      sTokenSource: STokenSource,
      done: (results: AttributeValuePToken | void, errors: Array<XmlError>) => void,
   ): void {
      done([], []);
   }

   function doExpand(
      tokens: Array<Token>,
      validate: boolean,
      allDone: (results: Array<Token>) => void,
   ): void {
      const results: Array<Token> = [];
      const unsent = tokens.slice(0);

      function pushToken(result: Token | void): boolean {
         if (result) {
            results.push(result);
         }

         return true;
      }

      const entityExpander = new EntityExpander(validate, pushToken, {
         parseBody,
         parseEntityValue,
         retrieveExternalEntity,
         parseAttributeValue,
      });

      function processNextToken(): void {
         if (unsent.length === 0) {
            allDone(results);

            return;
         }

         const nextToken = unsent[0];
         unsent.shift();

         entityExpander.expandPToken(nextToken as any, processNextToken);
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

      it('passes the EntityMetaData to the expandAttributeMetaData function', (done) => {
         const expandAttributeSpy: jasmine.Spy = spyOn(
            expandAttributeValue,
            'expandAttributeValue',
         );
         expandAttributeSpy.and.callFake((value: any, params: any, cb: any) => {
            cb({
               newValue: [],
               errors: [],
            });
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
            expect(expandAttributeSpy.calls.argsFor(0)[1].emd as any).toEqual(emd);
            done();
         });
      });
   });

   describe('TextPToken', () => {
      let textPToken: TextPToken;

      beforeEach(() => {
         textPToken = new TextPToken({ text: toSToken('foo') });
      });

      it('passes the EntityMetaData instance through', (done) => {
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
         const input = [docTypeStart, docTypeEnd];

         doExpand(input, true, (results) => {
            const types = results.map((element) => element.type);

            expect(types).toEqual([DOCTYPE_START_PTOKEN, DOCTYPE_END_PTOKEN]);
            done();
         });
      });

      it('adds an internal subset markers when there is an internal subset that is empty', (done) => {
         docTypeStart = new DocTypeStartPToken({
            open: toSToken('<!'),
            name: toSToken('root'),
            openSubset: toSToken('['),
         });
         const input = [docTypeStart, docTypeEnd];

         doExpand(input, true, (results) => {
            const types = results.map((element) => element.type);

            expect(types).toEqual([
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
         const input = [docTypeStart, notation, docTypeEnd];

         doExpand(input, true, (results) => {
            const types = results.map((element) => element.type);

            expect(types).toEqual([
               DOCTYPE_START_PTOKEN,
               INTERNAL_SUBSET_START_TOKEN,
               NOTATION_DECLARATION_PTOKEN,
               INTERNAL_SUBSET_END_TOKEN,
               DOCTYPE_END_PTOKEN,
            ]);
            done();
         });
      });

      it('adds external subset markers when there is an externalId', (done) => {
         externalMap.systemFoo = '<!ENTITY foo "bar">';
         docTypeStart = new DocTypeStartPToken({
            open: toSToken('<!'),
            name: toSToken('root'),
            externalId: {
               system: {
                  value: [new TextPToken({ text: toSToken('systemFoo') })],
               },
            },
         });
         const input = [docTypeStart, docTypeEnd];

         doExpand(input, true, (results) => {
            const types = results.map((element) => element.type);

            expect(types).toEqual([
               DOCTYPE_START_PTOKEN,
               EXTERNAL_SUBSET_START_TOKEN,
               ENTITY_META_DATA,
               GENERAL_ENTITY_DECLARATION_PTOKEN,
               EXTERNAL_SUBSET_END_TOKEN,
               DOCTYPE_END_PTOKEN,
            ]);
            done();
         });
      });

      it('adds an internal and external subset markers if both are there', (done) => {
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
         const input = [docTypeStart, notation, docTypeEnd];

         doExpand(input, true, (results) => {
            const types = results.map((element) => element.type);

            expect(types).toEqual([
               DOCTYPE_START_PTOKEN,
               INTERNAL_SUBSET_START_TOKEN,
               NOTATION_DECLARATION_PTOKEN,
               INTERNAL_SUBSET_END_TOKEN,
               EXTERNAL_SUBSET_START_TOKEN,
               ENTITY_META_DATA,
               GENERAL_ENTITY_DECLARATION_PTOKEN,
               EXTERNAL_SUBSET_END_TOKEN,
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
         const input = [docTypeStart, notation, docTypeEnd];

         doExpand(input, false, (results) => {
            const types = results.map((element) => element.type);

            expect(types).toEqual([
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
         const input = [notation];

         doExpand(input, true, (results) => {
            expect(results).toEqual([notation]);
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
   });

   describe('ATTLIST declaration', () => {
      let attList: AttListPToken;
      let expandAttributeSpy: jasmine.Spy;

      beforeEach(() => {
         expandAttributeSpy = spyOn(expandAttributeValue, 'expandAttributeValue');
         let index = 0;

         attList = new AttListPToken({
            open: toSToken('<!'),
            elementName: toSToken('student'),
         });

         expandAttributeSpy.and.callFake((value: any, params: any, cb: any) => {
            const error = new WellFormedError(WellFormedError.ID.XMLDECL_PARAM_UNKNOWN, [
               `${index}`,
            ]);
            index++;
            cb({
               newValue: [new TextPToken({ text: toSToken(`testValue #${index}`) })],
               errors: [error],
            });
         });
      });

      it('processes the default attribute values of the ATTLIST PToken', (done) => {
         attList = new AttListPToken({
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
         const error1 = new WellFormedError(WellFormedError.ID.XMLDECL_PARAM_UNKNOWN, ['0']);
         const error2 = new WellFormedError(WellFormedError.ID.XMLDECL_PARAM_UNKNOWN, ['1']);
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

      it('calls the expandAttributeValue() routine with the value, expand params and a callback', (done) => {
         attList = new AttListPToken({
            open: toSToken('<!'),
            elementName: toSToken('student'),
            attDefs: [
               {
                  name: toSToken('three'),
                  value: [new TextPToken({ text: toSToken('twoValue') })],
               },
            ],
         });
         const expectedValue = [new TextPToken({ text: toSToken('twoValue') })];

         doExpand([attList], true, () => {
            const callArgs = expandAttributeSpy.calls.mostRecent().args;

            expect(callArgs[0]).toEqual(expectedValue);
            expect(callArgs[1].emd).not.toBeUndefined();
            expect(callArgs[2]).toBeInstanceOf(Function);
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

         expandEntityValueSpy.and.callFake((pToken: any, params: any, cb: any) => {
            const error = new WellFormedError(WellFormedError.ID.XMLDECL_PARAM_UNKNOWN, [
               `${index}`,
            ]);
            index++;
            cb([new TextPToken({ text: toSToken(`testValue #${index}`) })], [error]);
         });
      });

      it('calls expandEntityValue() with the general entity value and a set up cache', (done) => {
         geDecl = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('student'),
            value: [new CharRefPToken({ open: toSToken('&#') })],
         });

         doExpand([geDecl], true, () => {
            const args = expandEntityValueSpy.calls.argsFor(0);

            expect(args[0]).toEqual([new CharRefPToken({ open: toSToken('&#') })]);
            expect(args[1].entityDetails.hasEntity(geDecl)).toEqual(true);
            expect(args[2]).toBeInstanceOf(Function);
            done();
         });
      });

      it('calls expandEntityValue() with the parameter entity value and a set up cache', (done) => {
         peDecl = new ParameterEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('student'),
            value: [new CharRefPToken({ open: toSToken('&#') })],
         });

         doExpand([peDecl], true, () => {
            const args = expandEntityValueSpy.calls.argsFor(0);

            expect(args[0]).toEqual([new CharRefPToken({ open: toSToken('&#') })]);
            expect(args[1].entityDetails.hasEntity(peDecl)).toEqual(true);
            expect(args[2]).toBeInstanceOf(Function);
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

      it('does not expand the entity value if this entity is already in the cache', (done) => {
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

      it('does not set up the cache entry until after calling expandEntityValue()', (done) => {
         let hasGeDecl: boolean;
         let afterCallParams: ExpandParams;
         geDecl = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('student'),
            value: [new CharRefPToken({ open: toSToken('&#') })],
         });

         expandEntityValueSpy.and.callFake((pToken: any, params: ExpandParams, cb: any) => {
            hasGeDecl = params.entityDetails.hasEntity(geDecl);
            afterCallParams = params;
            cb([new TextPToken({ text: toSToken(`testValue`) })], []);
         });

         doExpand([geDecl, geDecl], true, () => {
            expect(hasGeDecl).toEqual(false);
            expect(afterCallParams.entityDetails.hasEntity(geDecl)).toEqual(true);
            done();
         });
      });
   });

   describe('element start', () => {
      let startElement: ElementStartPToken;
      let expandAttributeSpy: jasmine.Spy;

      beforeEach(() => {
         expandAttributeSpy = spyOn(expandAttributeValue, 'expandAttributeValue');
         let index = 0;

         startElement = new ElementStartPToken({
            open: toSToken('<'),
            name: toSToken('student'),
         });

         expandAttributeSpy.and.callFake((value: any, params: any, cb: any) => {
            index++;
            const error = new WellFormedError(WellFormedError.ID.XMLDECL_PARAM_UNKNOWN, [
               `${index}`,
            ]);
            cb({
               newValue: [new TextPToken({ text: toSToken(`testValue #${index}`) })],
               errors: [error],
            });
         });
      });

      it('passes a the element through with no changes when it has no attributes', (done) => {
         const input = [startElement];

         doExpand(input, true, (results) => {
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

      it('calls the expandAttributeValue() routine with the value, expand params and a callback', (done) => {
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
         const expectedValue = [new CharRefPToken({ open: toSToken('&#') })];

         doExpand([startElement], true, () => {
            const callArgs = expandAttributeSpy.calls.mostRecent().args;

            expect(callArgs[0]).toEqual(expectedValue);
            expect(callArgs[1].emd).not.toBeUndefined();
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
