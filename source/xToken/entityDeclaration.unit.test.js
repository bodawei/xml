/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { MockErrorCollector } from '../error/test';
import { makeLTokenMaker, MockLTokenSource } from '../lToken/test';
import { WellFormedError, XmlWarning } from '../error';

import * as declaration from './declaration.js';
import * as entityDeclaration from './entityDeclaration.js';
import * as externalId from './common/externalId.js';
import * as misc from './common/misc.js';
import * as literal from './common/literal.js';

describe('entityDeclaration (unit)', () => {
   let entityDeclarationPToken;
   let paramEntityDeclarationPToken;

   beforeEach(() => {
      const makeLToken = makeLTokenMaker();
      entityDeclarationPToken = {
         type: 'ENTITYDECL',
         name: makeLToken('anEntity'),
         postNameSpace: makeLToken(' '),
         postExternalIdSpace: makeLToken(' '),
         close: makeLToken('>'),
      };

      const makeToken = makeLTokenMaker();
      paramEntityDeclarationPToken = {
         type: 'ENTITYDECL',
         parameter: makeToken('%'),
         postParameterSpace: makeToken(' '),
         name: makeToken('anEntity'),
         postNameSpace: makeToken(' '),
         close: makeToken('>'),
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
         spyOn(literal, 'parse');
         spyOn(declaration, 'makeTypedDeclaration').and.returnValues({ type: 'ENTITYDECL' });
      });

      it('calls declaration.makeTypedDeclaration()', () => {
         const mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('e'),
            'entityName',
            ' ',
            MockLTokenSource.PEEK('S'),
            // Skipping externalId parsing here
            ' ',
            undefined,
            '>',
         ]);
         const decl = {};

         entityDeclaration.parse(mockSource, decl, callback);
         mockSource.respondInAsyncTime();

         expect(declaration.makeTypedDeclaration).toHaveBeenCalledWith('ENTITYDECL', decl);
      });

      it('calls literal.parse()', () => {
         const mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('a'),
            'anEntity',
            ' ',
         ]);
         delete entityDeclarationPToken.postExternalIdSpace;
         delete entityDeclarationPToken.close;
         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(literal.parse.calls.argsFor(0)[0]).toEqual(mockSource);
         expect(literal.parse.calls.argsFor(0)[1]).toEqual({
            prefix: 'literal',
            parsed: entityDeclarationPToken,
            peRef: true,
         });
         expect(literal.parse.calls.argsFor(0)[2] instanceof Function).toEqual(true);
      });

      it('calls externalId.parse()', () => {
         literal.parse.and.callFake((_1, _2, callback) => { callback(false); });
         const mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('e'),
            'entityName',
            ' ',
            MockLTokenSource.PEEK('S'),
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
         const mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('e'),
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

         expect(callback).toContainParsedProps(entityDeclarationPToken);
      });

      it('returns nothing if at EOF. That is: <!ENTITY', () => {
         const mockSource = new MockLTokenSource([
            undefined,
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            type: 'ENTITYDECL',
         } ] ]);
      });

      it('returns parameter entity info if this is a parameter entity: <!ENTITY % entityName ...', () => {
         literal.parse.and.callFake((_1, _2, callback) => { callback(false); });
         const mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('%'),
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

         expect(callback).toContainParsedProps(paramEntityDeclarationPToken);
      });

      it('returns parameter entity without the trailing space if none present: <!ENTITY %entityName...', () => {
         const expectedLToken = makeLTokenMaker();
         literal.parse.and.callFake((_1, _2, callback) => { callback(false); });
         const mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('%'),
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

         expect(callback).toContainParsedProps({
            parameter: expectedLToken('%'),
            postParameterSpace: undefined,
            name: expectedLToken('entityName'),
         });
      });

      it('returns nothing if there is no name, space, or start of value: <!ENTITY %', () => {
         const expectedLToken = makeLTokenMaker();
         literal.parse.and.callFake((_1, _2, callback) => { callback(false); });
         externalId.parse.and.callFake((_1, _2, callback) => { callback(undefined); });
         const mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('%'),
            '%',
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            parameter: expectedLToken('%'),
            postParameterSpace: undefined,
            name: undefined,
            postNameSpace: undefined,
         });
      });

      it('returns no space between entity name and value: <!ENTITY entityName"foo" >', () => {
         const expectedLToken = makeLTokenMaker();
         literal.parse.and.callFake((_1, _2, callback) => { callback(true); });
         const mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('e'),
            'entityName',
            undefined,
            undefined,
            '>',
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            name: expectedLToken('entityName'),
            postNameSpace: undefined,
         });
      });

      it('adds trailing space after quoted value if present: <!ENTITY entityName "foo" >', () => {
         literal.parse.and.callFake((_1, _2, callback) => { callback(true); });
         const mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('e'),
            'entityName',
            ' ',
            ' ',
            '>',
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         const expectedLToken = makeLTokenMaker(undefined, 11, 0, 11);
         expect(callback).toContainParsedProps({
            postEntityValueSpace: expectedLToken(' '),
            close: expectedLToken('>'),
         });
      });

      it('stops if externalId returns nothing: <!ENTITY entityName >', () => {
         const expectedLToken = makeLTokenMaker();
         literal.parse.and.callFake((_1, _2, callback) => { callback(false); });
         const mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('e'),
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

         expect(callback).toContainParsedProps({
            name: expectedLToken('entityName'),
            postNameSpace: expectedLToken(' '),
            externalId: undefined,
         });
      });

      it('returns a space after the externalID: <!ENTITY entityName SYSTEM "foo" >', () => {
         literal.parse.and.callFake((_1, _2, callback) => { callback(false); });
         const mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('e'),
            'entityName',
            ' ',
            ' ',
            undefined, // peekWord
            '>',
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         const expectedLToken = makeLTokenMaker(undefined, 11, 0, 11);
         expect(callback).toContainParsedProps({
            externalId: {
               externalId: true,
            },
            postExternalIdSpace: expectedLToken(' '),
            close: expectedLToken('>'),
         });
      });

      it('returns an NDATA clause if found: <!ENTITY entityName SYSTEM "foo" NDATA testNData >', () => {
         literal.parse.and.callFake((_1, _2, callback) => { callback(false); });
         const mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('e'),
            'entityName',
            ' ',
               // externalId
            ' ',
            MockLTokenSource.PEEK('NDATA'),
            'NDATA',
            ' ',
            'testNData',
            ' ',
            '>',
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         const expectedLToken = makeLTokenMaker(undefined, 11, 0, 11);
         expect(callback).toContainParsedProps({
            postExternalIdSpace: expectedLToken(' '),
            nData: expectedLToken('NDATA'),
            postNDataSpace: expectedLToken(' '),
            nDataName: expectedLToken('testNData'),
            postNDataNameSpace: expectedLToken(' '),
            close: expectedLToken('>'),
         });
      });

      it('recognizes a non-all caps NDATA: <!ENTITY entityName SYSTEM "foo" ndaTa testNData >', () => {
         literal.parse.and.callFake((_1, _2, callback) => { callback(false); });
         const mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('e'),
            'entityName',
            ' ',
               // externalId
            ' ',
            MockLTokenSource.PEEK('ndaTa'),
            'ndaTa',
            ' ',
            'testNData',
            ' ',
            '>',
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         const expectedLToken = makeLTokenMaker(undefined, 12, 0, 12);
         expect(callback).toContainParsedProps({
            nData: expectedLToken('ndaTa'),
         });
      });

      it('does not mind no space after the ndata value: <!ENTITY entityName SYSTEM "foo" ndaTa testNData>', () => {
         literal.parse.and.callFake((_1, _2, callback) => { callback(false); });
         const mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('e'),
            'entityName',
            ' ',
               // externalId
            ' ',
            MockLTokenSource.PEEK('ndaTa'),
            'ndaTa',
            ' ',
            'testNData',
            undefined,
            '>',
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         const expectedLToken = makeLTokenMaker(undefined, 12, 0, 12);
         expect(callback).toContainParsedProps({
            nData: expectedLToken('ndaTa'),
            postNDataSpace: expectedLToken(' '),
            nDataName: expectedLToken('testNData'),
            postNDataNameSpace: undefined,
            close: expectedLToken('>'),
         });
      });

      it('returns if stops after NDATA: <!ENTITY entityName SYSTEM "foo" NDATA', () => {
         literal.parse.and.callFake((_1, _2, callback) => { callback(false); });
         const mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('e'),
            'entityName',
            ' ',
               // externalId
            ' ',
            MockLTokenSource.PEEK('NDATA'),
            'NDATA',
            undefined,
            undefined,
            undefined,
            undefined,
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         const expectedLToken = makeLTokenMaker(undefined, 11, 0, 11);
         expect(callback).toContainParsedProps({
            postExternalIdSpace: expectedLToken(' '),
            nData: expectedLToken('NDATA'),
            postNDataSpace: undefined,
            nDataName: undefined,
            postNDataNameSpace: undefined,
            close: undefined,
         });
      });

      describe('terminators', () => {

         it('passes quotes and > as terminators for getting the name', () => {
            const mockSource = new MockLTokenSource([
               MockLTokenSource.PEEK('e'),
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
      let expectedLToken;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         expectedLToken = makeLTokenMaker();
         pToken = {
            open: expectedLToken('<!'),
            declType: expectedLToken('ENTITY'),
            postDeclTypeSpace: expectedLToken('\t'),
            name: expectedLToken('entityName'),
            postNameSpace: expectedLToken(' '),
            literalOpenQuote: expectedLToken('"'),
            literalValue: expectedLToken('entityValue'),
            literalCloseQuote: expectedLToken('"'),
            postEntityValueSpace: undefined,
            close: expectedLToken('>'),
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

         expect(literal.checkWellFormed).toHaveBeenCalledWith('literal', pToken, mockErrorCollector, emd,
            WellFormedError.ID.NOUN_ENTITYVALUE);
      });

      it('reports an error if % is not followed by a space', () => {
         pToken.parameter = expectedLToken('%');

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
         delete pToken.literalOpenQuote;
         delete pToken.literalValue;
         delete pToken.literalCloseQuote;
         pToken.externalId = { externalId: true };
         const emd = new EntityMetaData();

         entityDeclaration.checkWellFormed(pToken, mockErrorCollector, emd);

         expect(externalId.checkWellFormed).toHaveBeenCalledWith(pToken.externalId,
            mockErrorCollector, emd);
      });

      it('reports an error if NDATA is the wrong case', () => {
         pToken.externalId = { externalId: true };
         pToken.nData = expectedLToken('nData');
         pToken.nDataName = expectedLToken('foo');

         entityDeclaration.checkWellFormed(pToken, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ENTITYDECL_NDATA_INVALID_CASE,
            params: [ 'entityName', 'nData' ],
            position: pToken.nData,
         });
      });

      it('reports an error if there is no NDATA value', () => {
         pToken.externalId = { externalId: true };
         pToken.nData = expectedLToken('nData');

         entityDeclaration.checkWellFormed(pToken, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ENTITYDECL_NDATA_NO_NAME,
            params: [ 'entityName' ],
            lastPosition: pToken.nData,
         });
      });

      it('calls checkWellFormedText() to check on the ndata value', () => {
         pToken.externalId = { externalId: true };
         pToken.nData = expectedLToken('NDATA');
         pToken.nDataName = expectedLToken('foo');
         const emd = new EntityMetaData();

         entityDeclaration.checkWellFormed(pToken, mockErrorCollector, emd);

         expect(misc.checkWellFormedText).toHaveBeenCalledWith(pToken.nDataName,
            mockErrorCollector, emd);
      });

      it('reports an error if there is no EnitytValue or ExternalID', () => {
         delete pToken.literalOpenQuote;
         delete pToken.literalValue;
         delete pToken.literalCloseQuote;

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

   describe('makeToken()', () => {
      let pToken;

      beforeEach(() => {
         const expectedLToken = makeLTokenMaker();
         spyOn(literal, 'makeTokenCompatible');
         spyOn(literal, 'appendLTokens');
         spyOn(externalId, 'makeTokenCompatible');
         spyOn(externalId, 'appendLTokens');
         pToken = {
            parameter: expectedLToken('%'),
            name: expectedLToken('entityName'),
            literalValue: [ expectedLToken('value') ],
         };
      });

      it('calls literal.makeTokenCompatible()', () => {
         delete pToken.paramater;

         entityDeclaration.makeToken(pToken);

         expect(literal.makeTokenCompatible).toHaveBeenCalledWith('literal', pToken);
      });

      it('calls literal.appendLTokens()', () => {
         delete pToken.parameter;

         const token = entityDeclaration.makeToken(pToken);

         expect(literal.appendLTokens).toHaveBeenCalledWith('literal', token.lTokens, pToken);
      });

      it('calls externalId.makeTokenCompatible()', () => {
         delete pToken.parameter;
         delete pToken.literalValue;
         pToken.externalId = { externalId: true };

         entityDeclaration.makeToken(pToken);

         expect(externalId.makeTokenCompatible).toHaveBeenCalledWith(pToken.externalId);
      });

      it('calls externalId.appendLTokens()', () => {
         delete pToken.parameter;
         delete pToken.literalValue;
         pToken.externalId = { externalId: true };

         const xToken = entityDeclaration.makeToken(pToken);

         expect(externalId.appendLTokens).toHaveBeenCalledWith(xToken.lTokens, pToken.externalId);
      });

      it('returns an entity declaration token with the name and value found in the parsing', () => {
         delete pToken.parameter;

         const token = entityDeclaration.makeToken(pToken);

         expect(token).toEqual(new entityDeclaration.Token('entityName', undefined,
            undefined, '', [
               pToken.name,
            ]));
      });

      it('returns a parameter entity declaration token with the name and value found in the parsing', () => {
         const xToken = entityDeclaration.makeToken(pToken);

         expect(xToken).toEqual(new entityDeclaration.ParamToken('entityName', undefined,
            undefined, '', [
               pToken.parameter,
               pToken.name,
            ]));
      });

      it('returns a entity declaration with a blank name if there is no name', () => {
         delete pToken.parameter;
         delete pToken.name;

         const xToken = entityDeclaration.makeToken(pToken);

         expect(xToken).toEqual(new entityDeclaration.Token('', undefined, undefined, '', []));
      });

      it('returns a entity declaration with an undefined value if there is no value', () => {
         delete pToken.parameter;
         delete pToken.literalValue;

         const xToken = entityDeclaration.makeToken(pToken);

         expect(xToken).toEqual(new entityDeclaration.Token('entityName', undefined, undefined, '', [
            pToken.name,
         ]));
      });

   });

});
