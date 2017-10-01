/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { MockErrorCollector } from '../error/test';
import { makeLTokenMaker, MockLTokenSource } from '../lToken/test';
import { WellFormedError } from '../error';

import * as declaration from './declaration.js';
import * as docTypeStart from './docTypeStart.js';
import * as externalId from './common/externalId.js';
import * as misc from './common/misc.js';

describe('docTypeStart', () => {
   let parsedDocTypeStart;

   beforeEach(() => {
      const expectedLToken = makeLTokenMaker();
      parsedDocTypeStart = {
         type: 'DOCTYPE_START',
         name: expectedLToken('rootElement'),
         postNameSpace: expectedLToken(' '),
         externalId: { externalId: true },
         postExternalIdSpace: expectedLToken(' '),
         startInternalSubset: expectedLToken('['),
      };
   });

   describe('parse()', () => {
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         spyOn(externalId, 'parse').and.callFake((ignored1, ignored2, cb) => {
            cb({ externalId: true });
         });
         spyOn(declaration, 'makeTypedDeclaration').and.returnValues({ type: 'DOCTYPE_START' });
      });

      it('calls declaration.makeTypedDeclaration', () => {
         const mockSource = new MockLTokenSource([
            'elemType',
            '  ',
            '\t',
            '[',
         ]);
         const decl = {};

         docTypeStart.parse(mockSource, decl, callback);
         mockSource.respondInAsyncTime();

         expect(declaration.makeTypedDeclaration).toHaveBeenCalledWith('DOCTYPE_START', decl);
      });

      it('parses a full element start', () => {
         const mockSource = new MockLTokenSource([
            [ 'rootElement', 'word', [ '[' ] ],
            [ ' ', 'space' ],
            [ ' ', 'space' ],
            [ '[', 'match', '[' ],
         ]);

         docTypeStart.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps(parsedDocTypeStart);
      });

      it('handles EOF', () => {
         const mockSource = new MockLTokenSource([
            undefined,
            undefined,
            undefined,
            undefined,
         ]);

         docTypeStart.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'DOCTYPE_START',
            name: undefined,
            postNameSpace: undefined,
            postExternalIdSpace: undefined,
            externalId: { externalId: true },
            startInternalSubset: undefined,
         });
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let emd;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         emd = new EntityMetaData();

         spyOn(declaration, 'checkWellFormed');
         spyOn(misc, 'checkName');
         spyOn(externalId, 'checkWellFormed');
      });

      it('asks the declaration module to look for problems in the declaration part', () => {
         const decl = { decl: true };

         docTypeStart.checkWellFormed(decl, mockErrorCollector, emd);

         expect(declaration.checkWellFormed).toHaveBeenCalledWith(decl, mockErrorCollector, emd);
      });

      it('asks the misc.checkName() to validate the name', () => {
         docTypeStart.checkWellFormed(parsedDocTypeStart, mockErrorCollector, emd);

         expect(misc.checkName).toHaveBeenCalledWith(parsedDocTypeStart.name,
            mockErrorCollector, emd, WellFormedError.ID.DOCTYPE_NAME_INVALID);
      });

      it('checks whether externalId is valid', () => {
         docTypeStart.checkWellFormed(parsedDocTypeStart, mockErrorCollector, emd);

         expect(externalId.checkWellFormed)
            .toHaveBeenCalledWith(parsedDocTypeStart.externalId, mockErrorCollector, emd);
      });

      it('reports an error if there is no elment name', () => {
         parsedDocTypeStart.name = undefined;

         docTypeStart.checkWellFormed(parsedDocTypeStart, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.DOCTYPE_NO_NAME,
            params: undefined,
            lastPosition: undefined, // would be parsed.postDeclTypeSpace, but we're mocking that out
         });
      });

      it('reports no error if there is an elment name', () => {
         docTypeStart.checkWellFormed(parsedDocTypeStart, mockErrorCollector);

         expect(mockErrorCollector).not.toReportError({
            id: WellFormedError.ID.DOCTYPE_NO_NAME,
            params: undefined,
            position: undefined,
         });
      });

   });

   describe('makeToken()', () => {

      beforeEach(() => {
         spyOn(externalId, 'appendLTokens');
         spyOn(externalId, 'makeTokenCompatible');
         spyOn(declaration, 'appendLTokens');
      });

      it('calls declaration.appendLTokens', () => {
         const token = docTypeStart.makeToken(parsedDocTypeStart);

         expect(declaration.appendLTokens).toHaveBeenCalledWith(token.lTokens, parsedDocTypeStart);
      });

      it('calls externalId.appendLTokens', () => {
         const token = docTypeStart.makeToken(parsedDocTypeStart);

         expect(externalId.appendLTokens).toHaveBeenCalledWith(token.lTokens, parsedDocTypeStart.externalId);
      });

      it('calls externalId.makeTokenCompatible', () => {
         docTypeStart.makeToken(parsedDocTypeStart);

         expect(externalId.makeTokenCompatible).toHaveBeenCalledWith(parsedDocTypeStart.externalId);
      });

      it('returns a token with the expected fields defined', () => {
         const token = docTypeStart.makeToken(parsedDocTypeStart);

         expect(token).toEqual(new docTypeStart.Token('rootElement', undefined, true, [
            parsedDocTypeStart.name,
            parsedDocTypeStart.postNameSpace,
            parsedDocTypeStart.postExternalIdSpace,
            parsedDocTypeStart.startInternalSubset,
         ]));
      });

      it('returns a token with an empty string if no name was found', () => {
         delete parsedDocTypeStart.name;

         const token = docTypeStart.makeToken(parsedDocTypeStart);

         expect(token.name).toEqual('');
      });

   });

});
