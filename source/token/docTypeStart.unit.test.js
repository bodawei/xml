/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { MockErrorCollector } from '../basic/test';
import { makeLTokenMaker, MockLTokenSource } from '../lToken/test';
import { WellFormedError } from '../error';

import * as declaration from './declaration.js';
import * as docTypeStart from './docTypeStart.js';
import * as externalId from './externalId.js';

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

      it('uses whatever preliminary declaration values were passed in', () => {
         mockSource = new MockLTokenSource([
            'a',
            ' ',
            undefined,
            undefined,
         ]);

         docTypeStart.parse(mockSource, {
            open: 'a',
            postOpenSpace: 'b',
            declType: 'c',
            postDeclTypeSpace: 'd',
         }, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            open: 'a',
            postOpenSpace: 'b',
            declType: 'c',
            postDeclTypeSpace: 'd',
         });
      });

      it('returns all values', () => {
         const sourceLToken = makeLTokenMaker();
         const declStart = {
            open: sourceLToken('<!'),
            postOpenSpace: sourceLToken(' '),
            declType: sourceLToken('DOCTYPE'),
            postDeclTypeSpace: sourceLToken('\t'),
         };
         mockSource = new MockLTokenSource([
            sourceLToken('elemType'),
            sourceLToken('  '),
            sourceLToken('\t'),
            sourceLToken('['),
         ]);

         docTypeStart.parse(mockSource, declStart, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'DOCTYPE_START',
            open: expectedLToken('<!'),
            postOpenSpace: expectedLToken(' '),
            declType: expectedLToken('DOCTYPE'),
            postDeclTypeSpace: expectedLToken('\t'),
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
      });

      it('returns an an error collector', () => {
         const errors = docTypeStart.checkWellFormed(parsed, mockErrorCollector);

         expect(errors).toEqual(mockErrorCollector);
      });

      it('reports an error if the declaration portion has a problem', () => {
         spyOn(declaration, 'checkWellFormed');

         docTypeStart.checkWellFormed(parsed, mockErrorCollector);

         expect(declaration.checkWellFormed).toHaveBeenCalledWith(parsed, mockErrorCollector);
      });

      it('reports an error if there is no elment name', () => {
         parsed.name = undefined;

         docTypeStart.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.DOCTYPE_NO_NAME,
            params: undefined,
            position: undefined,
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

      it('checks whether the name is valid', () => {
         docTypeStart.checkWellFormed(parsed, mockErrorCollector,
            new EntityMetaData(EntityMetaData.KIND.DOCUMENT, 1.0, 2));

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.DOCTYPE_NAME_INVALID,
            params: [ 'elmentName' ],
            position: parsed.name,
         });
      });

      it('checks whether externalId is valid', () => {
         parsed.externalId = {};
         spyOn(externalId, 'checkWellFormed');

         docTypeStart.checkWellFormed(parsed, mockErrorCollector);

         expect(externalId.checkWellFormed).toHaveBeenCalledWith(parsed.externalId, mockErrorCollector);
      });

   });

   describe('makeToken()', () => {

      it('returns a token with the expected fields defined', () => {
         spyOn(externalId, 'getLTokens');
         spyOn(externalId, 'makeTokenCompatible');
         const expectedLToken = makeLTokenMaker();
         const parsed = {
            type: 'DOCTYPE_START',
            open: expectedLToken('<!'),
            postOpenSpace: expectedLToken(' '),
            declType: expectedLToken('DOCTYPE'),
            postDeclTypeSpace: expectedLToken('\t'),
            name: expectedLToken('elemType'),
            postNameSpace: expectedLToken('  '),
            postExternalIdSpace: expectedLToken('\t'),
            startInternalSubset: expectedLToken('['),
         };

         const token = docTypeStart.makeToken(parsed);

         expect(externalId.getLTokens).toHaveBeenCalled();
         expect(externalId.makeTokenCompatible).toHaveBeenCalled();
         expect(token).toEqual(new docTypeStart.Token('elemType', undefined, true, [
            parsed.open,
            parsed.postOpenSpace,
            parsed.declType,
            parsed.postDeclTypeSpace,
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

      it('asks externalId to provide an entity location', () => {
         const parsed = {
            name: undefined,
            externalId: { externalId: true },
         };
         spyOn(externalId, 'makeTokenCompatible');

         docTypeStart.makeToken(parsed);

         expect(externalId.makeTokenCompatible).toHaveBeenCalledWith(parsed.externalId);
      });

   });

});
