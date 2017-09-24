/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { XmlWarning } from '../error';
import { MockErrorCollector } from '../error/test';
import { makeLTokenMaker, MockLTokenSource } from '../lToken/test';
import { WellFormedError } from '../error';

import * as declaration from './declaration.js';
import * as notationDeclaration from './notationDeclaration.js';
import * as externalId from './common/externalId.js';
import * as misc from './common/misc.js';

describe('notationdeDlaration (unit)', () => {
   let defaultParsed;
   let expectedLToken;

   beforeEach(() => {
      expectedLToken = makeLTokenMaker();
      defaultParsed = {
         type: 'NOTATIONDECL',
         open: expectedLToken('<!'),
         postOpenSpace: undefined,
         declType: expectedLToken('NOTATION'),
         postDeclTypeSpace: expectedLToken(' '),
         name: expectedLToken('notationName'),
         postNameSpace: expectedLToken(' '),
         externalId: { externalId: true },
         postExternalIdSpace: expectedLToken(' '),
         close: expectedLToken('>'),
      };
   });

   describe('parse()', () => {
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         spyOn(externalId, 'parse');
         externalId.parse.and.callFake((source, terminators, cb) => {
            cb({ externalId: true });
         });
         spyOn(declaration, 'makeTypedDeclaration').and.returnValues({
            type: notationDeclaration.TYPE,
         });
      });

      it('calls declaration.makeTypedDeclaration()', () => {
         const mockSource = new MockLTokenSource([
            'name',
            ' ',
            undefined,
            '>',
         ]);
         const decl = {};

         notationDeclaration.parse(mockSource, decl, callback);
         mockSource.respondInAsyncTime();

         expect(declaration.makeTypedDeclaration).toHaveBeenCalledWith(notationDeclaration.TYPE, decl);
      });

      it('calls externalId.parse()', () => {
         const mockSource = new MockLTokenSource([
            'name',
            ' ',
            undefined,
            '>',
         ]);

         notationDeclaration.parse(mockSource, defaultParsed, callback);
         mockSource.respondInAsyncTime();

         expect(externalId.parse.calls.argsFor(0)[0]).toEqual(mockSource);
         expect(externalId.parse.calls.argsFor(0)[1]).toEqual([ '>' ]);
         expect(externalId.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
      });

      it('does a simple parse', () => {
         // delete the things that our mocking of declaration will not return
         delete defaultParsed.open;
         delete defaultParsed.postOpenSpace;
         delete defaultParsed.declType;
         delete defaultParsed.postDeclTypeSpace;
         const mockSource = new MockLTokenSource([
            'notationName',
            ' ',
            // Skipping externalId parsing here
            ' ',
            '>',
         ], 11, 0, 11);

         notationDeclaration.parse(mockSource, {
            type: defaultParsed.type,
         }, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps(defaultParsed);
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         spyOn(declaration, 'checkWellFormed');
         spyOn(externalId, 'checkWellFormed');
         spyOn(misc, 'checkName');
         spyOn(misc, 'checkWellFormedNameRecommendation');
      });

      it('asks the declaration module to look for problems in the declaration part', () => {
         const emd = new EntityMetaData();

         notationDeclaration.checkWellFormed(defaultParsed, mockErrorCollector, emd);

         expect(declaration.checkWellFormed).toHaveBeenCalledWith(defaultParsed, mockErrorCollector, emd);
      });

      it('asks the externalId module to look for well formed problems', () => {
         const emd = new EntityMetaData();

         notationDeclaration.checkWellFormed(defaultParsed, mockErrorCollector, emd);

         expect(externalId.checkWellFormed)
            .toHaveBeenCalledWith(defaultParsed.externalId, mockErrorCollector, emd);
      });

      it('reports an error if there is no name', () => {
         delete defaultParsed.name;

         notationDeclaration.checkWellFormed(defaultParsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.NOTATIONDECL_NO_NAME,
            params: undefined,
            position: undefined,
            lastPosition: undefined,   // this would be the space after NOTATION, but it is mocked out
         });
      });

      it('calls misc.checkName() to report on bad names', () => {
         const emd = new EntityMetaData();

         notationDeclaration.checkWellFormed(defaultParsed, mockErrorCollector, emd);

         expect(misc.checkName).toHaveBeenCalledWith(defaultParsed.name,
            mockErrorCollector, emd, WellFormedError.ID.NOTATIONDECL_NAME_INVALID);
      });

      it('calls misc.checkWellFormedNameRecommendation() to report on bad names', () => {
         const emd = new EntityMetaData();

         notationDeclaration.checkWellFormed(defaultParsed, mockErrorCollector, emd);

         expect(misc.checkWellFormedNameRecommendation).toHaveBeenCalledWith(defaultParsed.name,
            mockErrorCollector, emd, XmlWarning.ID.NOTATIONDECL_NAME_XMLDASH_RESERVED,
            XmlWarning.ID.NOTATIONDECL_NAME_XML_RESERVED);
      });

      it('reports an error if there is no space after the name', () => {
         delete defaultParsed.postNameSpace;

         notationDeclaration.checkWellFormed(defaultParsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.NOTATIONDECL_NO_SPACE_AFTER_NAME,
            params: [ 'notationName' ],
            position: undefined,
            lastPosition: defaultParsed.name,
         });
      });

      it('reports an error if there is no external ID', () => {
         defaultParsed.externalId = undefined;

         notationDeclaration.checkWellFormed(defaultParsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.NOTATIONDECL_NO_EXTERNALID,
            params: undefined,
            lastPosition: defaultParsed.postNameSpace,
         });
      });

      it('reports an error if there was no closing', () => {
         delete defaultParsed.close;

         notationDeclaration.checkWellFormed(defaultParsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.NOTATIONDECL_NO_CLOSE,
            params: [ defaultParsed.name.text ],
            position: undefined,
            lastPosition: defaultParsed.postExternalIdSpace,
         });
      });

   });

   describe('makeToken()', () => {

      beforeEach(() => {
         spyOn(declaration, 'appendLTokens');
         spyOn(externalId, 'makeTokenCompatible');
         spyOn(externalId, 'appendLTokens');
      });

      it('calls declaration.appendLTokens()', () => {
         const token = notationDeclaration.makeToken(defaultParsed);

         expect(declaration.appendLTokens).toHaveBeenCalledWith(token.lTokens, defaultParsed);
      });

      it('calls externalId.makeTokenCompatible()', () => {
         notationDeclaration.makeToken(defaultParsed);

         expect(externalId.makeTokenCompatible).toHaveBeenCalledWith(defaultParsed.externalId);
      });

      it('calls externalId.appendLTokens()', () => {
         const token = notationDeclaration.makeToken(defaultParsed);

         expect(externalId.appendLTokens).toHaveBeenCalledWith(token.lTokens, defaultParsed.externalId);
      });

      it('returns notation declaration token with the name from the parsing', () => {
         const token = notationDeclaration.makeToken(defaultParsed);

         expect(token).toEqual(new notationDeclaration.Token('notationName', undefined, [
            defaultParsed.name,
            defaultParsed.postNameSpace,
            defaultParsed.postExternalIdSpace,
            defaultParsed.close,
         ]));
      });

      it('returns a notation declaration with a blank name if there is no name', () => {
         delete defaultParsed.name;
         const token = notationDeclaration.makeToken(defaultParsed);

         expect(token).toEqual(new notationDeclaration.Token('', undefined, [
            defaultParsed.postNameSpace,
            defaultParsed.postExternalIdSpace,
            defaultParsed.close,
         ]));
      });

   });

});
