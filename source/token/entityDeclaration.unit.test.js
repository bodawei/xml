/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { MockErrorCollector } from '../error/test';
import { makeSTokenMaker, MockSTokenSource } from '../sToken/test';
import { WellFormedError, XmlWarning } from '../error';

import * as declaration from './bridge/declaration.js';
import * as entityDeclaration from './entityDeclaration.js';
import externalId from './common/externalId.js';
import * as misc from './common/misc.js';
import * as literal from './common/literal.js';

describe('entityDeclaration (unit)', () => {
   let entityDeclarationPToken;
   let paramEntityDeclarationPToken;

   beforeEach(() => {
      const makeSToken = makeSTokenMaker();
      entityDeclarationPToken = new entityDeclaration.PToken({
         name: makeSToken('anEntity'),
         postNameSpace: makeSToken(' '),
         postExternalIdSpace: makeSToken(' '),
         close: makeSToken('>'),
      });

      const makeToken = makeSTokenMaker();
      paramEntityDeclarationPToken = new entityDeclaration.ParamPToken({
         parameter: makeToken('%'),
         postParameterSpace: makeToken(' '),
         name: makeToken('anEntity'),
         postNameSpace: makeToken(' '),
         close: makeToken('>'),
      });
   });

   describe('PToken', () => {

      beforeEach(() => {
         spyOn(literal, 'getSTokens');
         spyOn(externalId, 'getSTokens');
      });

      describe('getSTokenStream()', () => {

         it('returns all the STokens', () => {
            expect(entityDeclarationPToken.getSTokenArray()).toEqual([
               entityDeclarationPToken.name,
               entityDeclarationPToken.postNameSpace,
               entityDeclarationPToken.postExternalIdSpace,
               entityDeclarationPToken.close,
            ]);
         });

      });

   });

   describe('ParamPToken', () => {

      beforeEach(() => {
         spyOn(literal, 'getSTokens');
         spyOn(externalId, 'getSTokens');
      });

      describe('getSTokenStream()', () => {

         it('returns all the STokens', () => {
            expect(paramEntityDeclarationPToken.getSTokenArray()).toEqual([
               paramEntityDeclarationPToken.parameter,
               paramEntityDeclarationPToken.postParameterSpace,
               paramEntityDeclarationPToken.name,
               paramEntityDeclarationPToken.postNameSpace,
               paramEntityDeclarationPToken.close,
            ]);
         });

      });

   });

   describe('parse()', () => {
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         spyOn(externalId, 'parse');
         externalId.parse.and.callFake((source, terminators, cb) => {
            cb({ externalId: true });
         });
         spyOn(literal, 'parse');
      });

      it('calls literal.parse()', () => {
         const mockSource = new MockSTokenSource([
            MockSTokenSource.PEEK('a'),
            'anEntity',
            ' ',
         ]);
         delete entityDeclarationPToken.postExternalIdSpace;
         delete entityDeclarationPToken.close;
         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(literal.parse.calls.argsFor(0)[0]).toEqual(mockSource);
         expect(literal.parse.calls.argsFor(0)[1]).toEqual({
            pToken: entityDeclarationPToken,
            peRef: true,
         });
         expect(literal.parse.calls.argsFor(0)[2] instanceof Function).toEqual(true);
      });

      it('calls externalId.parse()', () => {
         literal.parse.and.callFake((_1, _2, callback) => { callback(false); });
         const mockSource = new MockSTokenSource([
            MockSTokenSource.PEEK('e'),
            'entityName',
            ' ',
            MockSTokenSource.PEEK('S'),
            ' ',
            undefined,
            '>',
         ]);
         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(externalId.parse.calls.argsFor(0)[0]).toEqual(mockSource);
         expect(externalId.parse.calls.argsFor(0)[1]).toEqual([ '>' ]);
         expect(externalId.parse.calls.argsFor(0)[2] instanceof Function).toEqual(true);
      });

      it('does a parse of a general entity with a literal value', () => {
         literal.parse.and.callFake((_1, _2, callback) => { callback(false); });
         const mockSource = new MockSTokenSource([
            MockSTokenSource.PEEK('e'),
            [ 'anEntity', 'word', [ '>' ] ],
            [ ' ', 'space' ],
            // Skipping literal parsing here
            // Skipping externalId parsing here
            [ ' ', 'space' ],
            [ undefined, 'peekWord', [ '>' ] ],
            [ '>', 'match', '>' ],
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(entityDeclarationPToken);
      });

      it('returns nothing if at EOF. That is: <!ENTITY', () => {
         const mockSource = new MockSTokenSource([
            undefined,
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ new entityDeclaration.PToken() ] ]);
      });

      it('returns parameter entity info if this is a parameter entity: <!ENTITY % entityName ...', () => {
         literal.parse.and.callFake((_1, _2, callback) => { callback(false); });
         const mockSource = new MockSTokenSource([
            MockSTokenSource.PEEK('%'),
            [ '%', 'char' ],
            [ ' ', 'space' ],
            [ 'anEntity', 'word', [ '>' ] ],
            [ ' ', 'space' ],
            // Skipping literal parsing here
            // Skipping externalId parsing here
            [ undefined, 'space' ],
            [ undefined, 'peekWord', [ '>' ] ],
            [ '>', 'match', '>' ],
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(paramEntityDeclarationPToken);
      });

      it('returns parameter entity without the trailing space if none present: <!ENTITY %entityName...', () => {
         const expectedSToken = makeSTokenMaker();
         literal.parse.and.callFake((_1, _2, callback) => { callback(false); });
         const mockSource = new MockSTokenSource([
            MockSTokenSource.PEEK('%'),
            '%',
            undefined,
            'entityName',
            ' ',
            undefined,
            undefined,
            '>',
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps({
            parameter: expectedSToken('%'),
            postParameterSpace: undefined,
            name: expectedSToken('entityName'),
         });
      });

      it('returns nothing if there is no name, space, or start of value: <!ENTITY %', () => {
         const expectedSToken = makeSTokenMaker();
         literal.parse.and.callFake((_1, _2, callback) => { callback(false); });
         externalId.parse.and.callFake((_1, _2, callback) => { callback(undefined); });
         const mockSource = new MockSTokenSource([
            MockSTokenSource.PEEK('%'),
            '%',
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps({
            parameter: expectedSToken('%'),
            postParameterSpace: undefined,
            name: undefined,
            postNameSpace: undefined,
         });
      });

      it('returns no space between entity name and value: <!ENTITY entityName"foo" >', () => {
         const expectedSToken = makeSTokenMaker();
         literal.parse.and.callFake((_1, _2, callback) => { callback(true); });
         const mockSource = new MockSTokenSource([
            MockSTokenSource.PEEK('e'),
            'entityName',
            undefined,
            undefined,
            '>',
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps({
            name: expectedSToken('entityName'),
            postNameSpace: undefined,
         });
      });

      it('adds trailing space after quoted value if present: <!ENTITY entityName "foo" >', () => {
         literal.parse.and.callFake((_1, _2, callback) => { callback(true); });
         const mockSource = new MockSTokenSource([
            MockSTokenSource.PEEK('e'),
            'entityName',
            ' ',
            ' ',
            '>',
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         const expectedSToken = makeSTokenMaker(undefined, 11, 0, 11);
         expect(callback).toContainPTokenProps({
            postEntityValueSpace: expectedSToken(' '),
            close: expectedSToken('>'),
         });
      });

      it('stops if externalId returns nothing: <!ENTITY entityName >', () => {
         const expectedSToken = makeSTokenMaker();
         literal.parse.and.callFake((_1, _2, callback) => { callback(false); });
         const mockSource = new MockSTokenSource([
            MockSTokenSource.PEEK('e'),
            'entityName',
            ' ',
            '>',
            '>',
         ]);
         externalId.parse.and.callFake((source, terminators, cb) => {
            cb(undefined);
         });

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps({
            name: expectedSToken('entityName'),
            postNameSpace: expectedSToken(' '),
            externalId: undefined,
         });
      });

      it('returns a space after the externalID: <!ENTITY entityName SYSTEM "foo" >', () => {
         literal.parse.and.callFake((_1, _2, callback) => { callback(false); });
         const mockSource = new MockSTokenSource([
            MockSTokenSource.PEEK('e'),
            'entityName',
            ' ',
            ' ',
            undefined, // peekWord
            '>',
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         const expectedSToken = makeSTokenMaker(undefined, 11, 0, 11);
         expect(callback).toContainPTokenProps({
            externalId: {
               externalId: true,
            },
            postExternalIdSpace: expectedSToken(' '),
            close: expectedSToken('>'),
         });
      });

      it('returns an NDATA clause if found: <!ENTITY entityName SYSTEM "foo" NDATA testNData >', () => {
         literal.parse.and.callFake((_1, _2, callback) => { callback(false); });
         const mockSource = new MockSTokenSource([
            MockSTokenSource.PEEK('e'),
            'entityName',
            ' ',
               // externalId
            ' ',
            MockSTokenSource.PEEK('NDATA'),
            'NDATA',
            ' ',
            'testNData',
            ' ',
            '>',
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         const expectedSToken = makeSTokenMaker(undefined, 11, 0, 11);
         expect(callback).toContainPTokenProps({
            postExternalIdSpace: expectedSToken(' '),
            nData: expectedSToken('NDATA'),
            postNDataSpace: expectedSToken(' '),
            nDataName: expectedSToken('testNData'),
            postNDataNameSpace: expectedSToken(' '),
            close: expectedSToken('>'),
         });
      });

      it('recognizes a non-all caps NDATA: <!ENTITY entityName SYSTEM "foo" ndaTa testNData >', () => {
         literal.parse.and.callFake((_1, _2, callback) => { callback(false); });
         const mockSource = new MockSTokenSource([
            MockSTokenSource.PEEK('e'),
            'entityName',
            ' ',
               // externalId
            ' ',
            MockSTokenSource.PEEK('ndaTa'),
            'ndaTa',
            ' ',
            'testNData',
            ' ',
            '>',
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         const expectedSToken = makeSTokenMaker(undefined, 12, 0, 12);
         expect(callback).toContainPTokenProps({
            nData: expectedSToken('ndaTa'),
         });
      });

      it('does not mind no space after the ndata value: <!ENTITY entityName SYSTEM "foo" ndaTa testNData>', () => {
         literal.parse.and.callFake((_1, _2, callback) => { callback(false); });
         const mockSource = new MockSTokenSource([
            MockSTokenSource.PEEK('e'),
            'entityName',
            ' ',
               // externalId
            ' ',
            MockSTokenSource.PEEK('ndaTa'),
            'ndaTa',
            ' ',
            'testNData',
            undefined,
            '>',
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         const expectedSToken = makeSTokenMaker(undefined, 12, 0, 12);
         expect(callback).toContainPTokenProps({
            nData: expectedSToken('ndaTa'),
            postNDataSpace: expectedSToken(' '),
            nDataName: expectedSToken('testNData'),
            postNDataNameSpace: undefined,
            close: expectedSToken('>'),
         });
      });

      it('returns if stops after NDATA: <!ENTITY entityName SYSTEM "foo" NDATA', () => {
         literal.parse.and.callFake((_1, _2, callback) => { callback(false); });
         const mockSource = new MockSTokenSource([
            MockSTokenSource.PEEK('e'),
            'entityName',
            ' ',
               // externalId
            ' ',
            MockSTokenSource.PEEK('NDATA'),
            'NDATA',
            undefined,
            undefined,
            undefined,
            undefined,
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         const expectedSToken = makeSTokenMaker(undefined, 11, 0, 11);
         expect(callback).toContainPTokenProps({
            postExternalIdSpace: expectedSToken(' '),
            nData: expectedSToken('NDATA'),
            postNDataSpace: undefined,
            nDataName: undefined,
            postNDataNameSpace: undefined,
            close: undefined,
         });
      });

      describe('terminators', () => {

         it('passes quotes and > as terminators for getting the name', () => {
            const mockSource = new MockSTokenSource([
               MockSTokenSource.PEEK('e'),
               [ 'entityName', 'word', [ '>' ] ],
               ' ',
               undefined,
               undefined,
               '>',
            ]);

            entityDeclaration.parse(mockSource, {}, callback);
            mockSource.respondInAsyncTime();

            expect(mockSource.extractToObject.calls.argsFor(0)[1]).toEqual([ '>', '"', '\'' ]);
         });

      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let pToken;
      let expectedSToken;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         expectedSToken = makeSTokenMaker();
         pToken = {
            open: expectedSToken('<!'),
            declType: expectedSToken('ENTITY'),
            postDeclTypeSpace: expectedSToken('\t'),
            name: expectedSToken('entityName'),
            postNameSpace: expectedSToken(' '),
            openQuote: expectedSToken('"'),
            value: expectedSToken('entityValue'),
            closeQuote: expectedSToken('"'),
            postEntityValueSpace: undefined,
            close: expectedSToken('>'),
         };
         spyOn(declaration, 'checkWellFormed');
         spyOn(misc, 'checkName');
         spyOn(misc, 'checkWellFormedNameRecommendation');
         spyOn(misc, 'checkWellFormedText');
         spyOn(externalId, 'checkWellFormed');
         spyOn(literal, 'checkWellFormed');
      });

      it('asks the declaration module to look for problems in the declaration part', () => {
         const emd = new EntityMetaData();

         entityDeclaration.checkWellFormed(pToken, mockErrorCollector, emd);

         expect(declaration.checkWellFormed).toHaveBeenCalledWith(pToken, mockErrorCollector, emd);
      });

      it('asks the literal module to look for problems in the declaration part', () => {
         const emd = new EntityMetaData();

         entityDeclaration.checkWellFormed(pToken, mockErrorCollector, emd);

         expect(literal.checkWellFormed).toHaveBeenCalledWith(pToken, mockErrorCollector, emd,
            WellFormedError.ID.NOUN_ENTITYVALUE);
      });

      it('reports an error if % is not followed by a space', () => {
         pToken.parameter = expectedSToken('%');

         entityDeclaration.checkWellFormed(pToken, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector.report)
            .toHaveBeenCalledWith(WellFormedError.ID.ENTITYDECL_PERCENT_NO_TRAILING_SPACE, [ 'entityName' ]);
      });

      it('reports an error if there is no name', () => {
         delete pToken.name;

         entityDeclaration.checkWellFormed(pToken, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ENTITYDECL_NO_NAME,
            params: undefined,
            position: undefined,
            lastPosition: undefined,   // normally would be the space after ENTITY, but it is mocked out
         });
      });

      it('calls misc.checkName() to report on name validity', () => {
         const emd = new EntityMetaData();

         entityDeclaration.checkWellFormed(pToken, mockErrorCollector, emd);

         expect(misc.checkName).toHaveBeenCalledWith(pToken.name,
            mockErrorCollector, emd, WellFormedError.ID.ENTITYDECL_NAME_INVALID);
      });

      it('calls misc.checkWellFormedNameRecommendation() to report on bad names', () => {
         const emd = new EntityMetaData();

         entityDeclaration.checkWellFormed(pToken, mockErrorCollector, emd);

         expect(misc.checkWellFormedNameRecommendation).toHaveBeenCalledWith(pToken.name,
            mockErrorCollector, emd, XmlWarning.ID.ENTITYDECL_NAME_XMLDASH_RESERVED,
            XmlWarning.ID.ENTITYDECL_NAME_XML_RESERVED);
      });

      it('reports an error if there is no space after the name', () => {
         delete pToken.postNameSpace;

         entityDeclaration.checkWellFormed(pToken, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ENTITYDECL_NAME_NO_TRAILING_SPACE,
            params: [ 'entityName' ],
            position: undefined,
            lastPosition: pToken.name,
         });
      });

      it('calls externalId.checkWellFormed() to check on the externalId', () => {
         delete pToken.openQuote;
         delete pToken.value;
         delete pToken.closeQuote;
         pToken.externalId = { externalId: true };
         const emd = new EntityMetaData();

         entityDeclaration.checkWellFormed(pToken, mockErrorCollector, emd);

         expect(externalId.checkWellFormed).toHaveBeenCalledWith(pToken.externalId,
            mockErrorCollector, emd);
      });

      it('reports an error if NDATA is the wrong case', () => {
         pToken.externalId = { externalId: true };
         pToken.nData = expectedSToken('nData');
         pToken.nDataName = expectedSToken('foo');

         entityDeclaration.checkWellFormed(pToken, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ENTITYDECL_NDATA_INVALID_CASE,
            params: [ 'entityName', 'nData' ],
            position: pToken.nData,
         });
      });

      it('reports an error if there is no NDATA value', () => {
         pToken.externalId = { externalId: true };
         pToken.nData = expectedSToken('nData');

         entityDeclaration.checkWellFormed(pToken, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ENTITYDECL_NDATA_NO_NAME,
            params: [ 'entityName' ],
            lastPosition: pToken.nData,
         });
      });

      it('calls checkWellFormedText() to check on the ndata value', () => {
         pToken.externalId = { externalId: true };
         pToken.nData = expectedSToken('NDATA');
         pToken.nDataName = expectedSToken('foo');
         const emd = new EntityMetaData();

         entityDeclaration.checkWellFormed(pToken, mockErrorCollector, emd);

         expect(misc.checkWellFormedText).toHaveBeenCalledWith(pToken.nDataName,
            mockErrorCollector, emd);
      });

      it('reports an error if there is no EnitytValue or ExternalID', () => {
         delete pToken.openQuote;
         delete pToken.value;
         delete pToken.closeQuote;

         entityDeclaration.checkWellFormed(pToken, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ENTITYDECL_NO_VALUE,
            params: [ 'entityName' ],
            lastPosition: pToken.postNameSpace,
         });
      });

      it('reports an error if there was no closing', () => {
         delete pToken.close;

         entityDeclaration.checkWellFormed(pToken, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ENTITYDECL_NO_CLOSE,
            params: [ 'entityName' ],
            position: undefined,
            lastPosition: pToken.postNameSpace,
         });
      });

   });

   describe('pTokenToXToken()', () => {
      let pToken;

      beforeEach(() => {
         const expectedSToken = makeSTokenMaker();
         spyOn(literal, 'makeTokenCompatible');
         spyOn(externalId, 'makeEntityLocation');
         pToken = {
            parameter: expectedSToken('%'),
            name: expectedSToken('entityName'),
            value: [ expectedSToken('value') ],
         };
      });

      it('calls literal.makeTokenCompatible()', () => {
         delete pToken.paramater;

         entityDeclaration.pTokenToXToken(pToken);

         expect(literal.makeTokenCompatible).toHaveBeenCalledWith(pToken);
      });

      it('calls externalId.makeEntityLocation()', () => {
         delete pToken.parameter;
         delete pToken.value;
         pToken.externalId = { externalId: true };

         entityDeclaration.pTokenToXToken(pToken);

         expect(externalId.makeEntityLocation).toHaveBeenCalledWith(pToken.externalId);
      });

      it('returns an entity declaration token with the name and value found in the parsing', () => {
         delete pToken.parameter;

         const token = entityDeclaration.pTokenToXToken(pToken);

         expect(token).toEqual(new entityDeclaration.XToken('entityName', undefined,
            undefined, '', pToken));
      });

      it('returns a parameter entity declaration token with the name and value found in the parsing', () => {
         const xToken = entityDeclaration.pTokenToXToken(pToken);

         expect(xToken).toEqual(new entityDeclaration.ParamXToken('entityName', undefined,
            undefined, '', pToken));
      });

      it('returns a entity declaration with a blank name if there is no name', () => {
         delete pToken.parameter;
         delete pToken.name;

         const xToken = entityDeclaration.pTokenToXToken(pToken);

         expect(xToken).toEqual(new entityDeclaration.XToken('', undefined, undefined, '', pToken));
      });

      it('returns a entity declaration with an undefined value if there is no value', () => {
         delete pToken.parameter;
         delete pToken.value;

         const xToken = entityDeclaration.pTokenToXToken(pToken);

         expect(xToken).toEqual(new entityDeclaration.XToken('entityName', undefined, undefined, '', pToken));
      });

   });

});
