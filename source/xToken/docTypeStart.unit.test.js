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

   describe('parse()', () => {
      let mockSource;
      let callback;
      let expectedLToken;

      beforeEach(() => {
         expectedLToken = makeLTokenMaker();
         callback = jasmine.createSpy('callbackSpy');
         spyOn(externalId, 'parse').and.callFake((ignored1, ignored2, cb) => {
            cb({ externalId: true });
         });
         spyOn(declaration, 'toLocalParsing').and.returnValues({ type: 'DOCTYPE_START' });
      });

      it('calls declaration.toLocalParsing', () => {
         const sourceLToken = makeLTokenMaker();
         mockSource = new MockLTokenSource([
            sourceLToken('elemType'),
            sourceLToken('  '),
            sourceLToken('\t'),
            sourceLToken('['),
         ]);
         const decl = {};

         docTypeStart.parse(mockSource, decl, callback);
         mockSource.respondInAsyncTime();

         expect(declaration.toLocalParsing).toHaveBeenCalledWith('DOCTYPE_START', decl);
      });

      it('returns simple values', () => {
         mockSource = new MockLTokenSource([
            'a',
            ' ',
            undefined,
            undefined,
         ]);

         docTypeStart.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'DOCTYPE_START',
            name: expectedLToken('a'),
            postNameSpace: expectedLToken(' '),
            externalId: { externalId: true },
            postExternalIdSpace: undefined,
            startInternalSubset: undefined,
         });
      });

      it('returns all values', () => {
         const sourceLToken = makeLTokenMaker();
         mockSource = new MockLTokenSource([
            sourceLToken('elemType'),
            sourceLToken('  '),
            sourceLToken('\t'),
            sourceLToken('['),
         ]);

         docTypeStart.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'DOCTYPE_START',
            name: expectedLToken('elemType'),
            postNameSpace: expectedLToken('  '),
            postExternalIdSpace: expectedLToken('\t'),
            externalId: { externalId: true },
            startInternalSubset: expectedLToken('['),
         });
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let parsed;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         const sourceLToken = makeLTokenMaker();
         parsed = {
            open: sourceLToken('<!'),
            declType: sourceLToken('DOCTYPE'),
            postDeclTypeSpace: sourceLToken('\t'),
            name: sourceLToken('elmentName'),
         };
         spyOn(declaration, 'checkWellFormed');
         spyOn(misc, 'checkName');
      });

      it('asks the declaration module to look for problems in the declaration part', () => {
         const emd = new EntityMetaData();

         docTypeStart.checkWellFormed(parsed, mockErrorCollector, emd);

         expect(declaration.checkWellFormed).toHaveBeenCalledWith(parsed, mockErrorCollector, emd);
      });

      it('asks the misc.checkName() to validate the name', () => {
         const emd = new EntityMetaData();

         docTypeStart.checkWellFormed(parsed, mockErrorCollector, emd);

         expect(misc.checkName).toHaveBeenCalledWith(parsed.name,
            mockErrorCollector, emd, WellFormedError.ID.DOCTYPE_NAME_INVALID);
      });

      it('reports an error if there is no elment name', () => {
         parsed.name = undefined;

         docTypeStart.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.DOCTYPE_NO_NAME,
            params: undefined,
            lastPosition: undefined, // would be parsed.postDeclTypeSpace, but we're mocking that out
         });
      });

      it('reports no error if there is an elment name', () => {
         docTypeStart.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).not.toReportError({
            id: WellFormedError.ID.DOCTYPE_NO_NAME,
            params: undefined,
            position: undefined,
         });
      });

      it('checks whether externalId is valid', () => {
         const emd = new EntityMetaData();
         parsed.externalId = {};
         spyOn(externalId, 'checkWellFormed');

         docTypeStart.checkWellFormed(parsed, mockErrorCollector, emd);

         expect(externalId.checkWellFormed).toHaveBeenCalledWith(parsed.externalId, mockErrorCollector, emd);
      });

   });

   describe('makeToken()', () => {
      let parsed;

      beforeEach(() => {
         const expectedLToken = makeLTokenMaker();
         parsed = {
            type: 'DOCTYPE_START',
            open: expectedLToken('<!'),
            postOpenSpace: expectedLToken(' '),
            declType: expectedLToken('DOCTYPE'),
            postDeclTypeSpace: expectedLToken('\t'),
            name: expectedLToken('elemType'),
            postNameSpace: expectedLToken('  '),
            externalId: { externalId: true },
            postExternalIdSpace: expectedLToken('\t'),
            startInternalSubset: expectedLToken('['),
         };
         spyOn(externalId, 'appendLTokens');
         spyOn(externalId, 'makeTokenCompatible');
         spyOn(declaration, 'appendLTokens');
      });

      it('calls declaration.appendLTokens', () => {
         const token = docTypeStart.makeToken(parsed);

         expect(declaration.appendLTokens).toHaveBeenCalledWith(token.lTokens, parsed);
      });

      it('calls externalId.appendLTokens', () => {
         const token = docTypeStart.makeToken(parsed);

         expect(externalId.appendLTokens).toHaveBeenCalledWith(token.lTokens, parsed.externalId);
      });

      it('calls externalId.makeTokenCompatible', () => {
         docTypeStart.makeToken(parsed);

         expect(externalId.makeTokenCompatible).toHaveBeenCalledWith(parsed.externalId);
      });

      it('returns a token with the expected fields defined', () => {
         const token = docTypeStart.makeToken(parsed);

         expect(token).toEqual(new docTypeStart.Token('elemType', undefined, true, [
            parsed.name,
            parsed.postNameSpace,
            parsed.postExternalIdSpace,
            parsed.startInternalSubset,
         ]));
      });

      it('returns a token with an empty string if no name was found', () => {
         const parsed = {
            name: undefined,
         };

         const token = docTypeStart.makeToken(parsed);

         expect(token.name).toEqual('');
      });

   });

});
