/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { MockErrorCollector } from '../error/test';
import { makeLTokenMaker, MockLTokenSource } from '../lToken/test';
import { WellFormedError, XmlWarning } from '../error';

import * as declaration from './declaration.js';
import * as entityDeclaration from './entityDeclaration.js';
import * as text from './text.js';
import * as externalId from './common/externalId.js';
import * as misc from './common/misc.js';
import * as quotedValue from './common/quotedValue.js';

describe('entityDeclaration (unit)', () => {
   let parsedEntityDeclaration;
   let parsedParamEntityDeclaration;

   beforeEach(() => {
      const expectedLToken = makeLTokenMaker();
      parsedEntityDeclaration = {
         type: 'ENTITYDECL',
         name: expectedLToken('anEntity'),
         postNameSpace: expectedLToken(' '),
         postExternalIdSpace: expectedLToken(' '),
         close: expectedLToken('>'),
      };

      const makeToken = makeLTokenMaker();
      parsedParamEntityDeclaration = {
         type: 'ENTITYDECL',
         parameter: makeToken('%'),
         postParameterSpace: makeToken(' '),
         name: makeToken('anEntity'),
         postNameSpace: makeToken(' '),
         close: makeToken('>'),
      };
   });

   describe('parse()', () => {
      let mockSource;
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         spyOn(externalId, 'parse');
         externalId.parse.and.callFake((source, terminators, cb) => {
            cb({ externalId: true });
         });
         spyOn(quotedValue, 'parse');
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

      it('calls quotedValue.parse()', () => {
         const makeToken = makeLTokenMaker();
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
         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(quotedValue.parse.calls.argsFor(0)[0]).toEqual('literal');
         expect(quotedValue.parse.calls.argsFor(0)[1]).toEqual(mockSource);
         expect(quotedValue.parse.calls.argsFor(0)[2].type).toEqual('ENTITYDECL');
         expect(quotedValue.parse.calls.argsFor(0)[3] instanceof Function).toEqual(true);
      });

      it('calls externalId.parse()', () => {
         quotedValue.parse.and.callFake((_1, _2, _3, callback) => { callback(false); });
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
         quotedValue.parse.and.callFake((_1, _2, _3, callback) => { callback(false); });
         const mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('e'),
            [ 'anEntity', 'word', [ '>' ] ],
            [ ' ', 'space' ],
            // Skipping quotedValue parsing here
            // Skipping externalId parsing here
            [ ' ', 'space' ],
            [ undefined, 'peekWord', [ '>' ] ],
            [ '>', 'match', '>' ],
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps(parsedEntityDeclaration);
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
         quotedValue.parse.and.callFake((_1, _2, _3, callback) => { callback(false); });
         const mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('%'),
            [ '%', 'char' ],
            [ ' ', 'space' ],
            [ 'anEntity', 'word', [ '>' ] ],
            [ ' ', 'space' ],
            // Skipping quotedValue parsing here
            // Skipping externalId parsing here
            [ undefined, 'space' ],
            [ undefined, 'peekWord', [ '>' ] ],
            [ '>', 'match', '>' ],
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps(parsedParamEntityDeclaration);
      });

      it('returns parameter entity without the trailing space if none present: <!ENTITY %entityName...', () => {
         const expectedLToken = makeLTokenMaker();
         quotedValue.parse.and.callFake((_1, _2, _3, callback) => { callback(false); });
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
         quotedValue.parse.and.callFake((_1, _2, _3, callback) => { callback(false); });
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
         quotedValue.parse.and.callFake((_1, _2, _3, callback) => { callback(true); });
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
         quotedValue.parse.and.callFake((_1, _2, _3, callback) => { callback(true); });
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
         quotedValue.parse.and.callFake((_1, _2, _3, callback) => { callback(false); });
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
         quotedValue.parse.and.callFake((_1, _2, _3, callback) => { callback(false); });
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
         quotedValue.parse.and.callFake((_1, _2, _3, callback) => { callback(false); });
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
         quotedValue.parse.and.callFake((_1, _2, _3, callback) => { callback(false); });
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
         quotedValue.parse.and.callFake((_1, _2, _3, callback) => { callback(false); });
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
         quotedValue.parse.and.callFake((_1, _2, _3, callback) => { callback(false); });
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
      let parsed;
      let expectedLToken;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         expectedLToken = makeLTokenMaker();
         parsed = {
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
         spyOn(quotedValue, 'checkWellFormed');
      });

      it('asks the declaration module to look for problems in the declaration part', () => {
         const emd = new EntityMetaData();

         entityDeclaration.checkWellFormed(parsed, mockErrorCollector, emd);

         expect(declaration.checkWellFormed).toHaveBeenCalledWith(parsed, mockErrorCollector, emd);
      });

      it('asks the quotedValue module to look for problems in the declaration part', () => {
         const emd = new EntityMetaData();

         entityDeclaration.checkWellFormed(parsed, mockErrorCollector, emd);

         expect(quotedValue.checkWellFormed).toHaveBeenCalledWith('literal', parsed, mockErrorCollector, emd,
            WellFormedError.ID.NOUN_ENTITYVALUE);
      });

      it('reports an error if % is not followed by a space', () => {
         parsed.parameter = expectedLToken('%');

         entityDeclaration.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector.report)
            .toHaveBeenCalledWith(WellFormedError.ID.ENTITYDECL_PERCENT_NO_TRAILING_SPACE, [ 'entityName' ]);
      });

      it('reports an error if there is no name', () => {
         delete parsed.name;

         entityDeclaration.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ENTITYDECL_NO_NAME,
            params: undefined,
            position: undefined,
            lastPosition: undefined,   // normally would be the space after ENTITY, but it is mocked out
         });
      });

      it('calls misc.checkName() to report on name validity', () => {
         const emd = new EntityMetaData();

         entityDeclaration.checkWellFormed(parsed, mockErrorCollector, emd);

         expect(misc.checkName).toHaveBeenCalledWith(parsed.name,
            mockErrorCollector, emd, WellFormedError.ID.ENTITYDECL_NAME_INVALID);
      });

      it('calls misc.checkWellFormedNameRecommendation() to report on bad names', () => {
         const emd = new EntityMetaData();

         entityDeclaration.checkWellFormed(parsed, mockErrorCollector, emd);

         expect(misc.checkWellFormedNameRecommendation).toHaveBeenCalledWith(parsed.name,
            mockErrorCollector, emd, XmlWarning.ID.ENTITYDECL_NAME_XMLDASH_RESERVED,
            XmlWarning.ID.ENTITYDECL_NAME_XML_RESERVED);
      });

      it('reports an error if there is no space after the name', () => {
         delete parsed.postNameSpace;

         entityDeclaration.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ENTITYDECL_NAME_NO_TRAILING_SPACE,
            params: [ 'entityName' ],
            position: undefined,
            lastPosition: parsed.name,
         });
      });

      it('calls externalId.checkWellFormed() to check on the externalId', () => {
         spyOn(externalId, 'checkWellFormed');
         delete parsed.literalOpenQuote;
         delete parsed.literalValue;
         delete parsed.literalCloseQuote;
         parsed.externalId = { externalId: true };
         const emd = new EntityMetaData();

         entityDeclaration.checkWellFormed(parsed, mockErrorCollector, emd);

         expect(externalId.checkWellFormed).toHaveBeenCalledWith(parsed.externalId,
            mockErrorCollector, emd);
      });

      it('reports an error if NDATA is the wrong case', () => {
         parsed.externalId = { externalId: true };
         parsed.nData = expectedLToken('nData');
         parsed.nDataName = expectedLToken('foo');

         entityDeclaration.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ENTITYDECL_NDATA_INVALID_CASE,
            params: [ 'entityName', 'nData' ],
            position: parsed.nData,
         });
      });

      it('reports an error if there is no NDATA value', () => {
         parsed.externalId = { externalId: true };
         parsed.nData = expectedLToken('nData');

         entityDeclaration.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ENTITYDECL_NDATA_NO_NAME,
            params: [ 'entityName' ],
            lastPosition: parsed.nData,
         });
      });

      it('calls checkWellFormedText() to check on the ndata value', () => {
         parsed.externalId = { externalId: true };
         parsed.nData = expectedLToken('NDATA');
         parsed.nDataName = expectedLToken('foo');
         const emd = new EntityMetaData();

         entityDeclaration.checkWellFormed(parsed, mockErrorCollector, emd);

         expect(misc.checkWellFormedText).toHaveBeenCalledWith(parsed.nDataName,
            mockErrorCollector, emd);
      });

      it('reports an error if there is no EnitytValue or ExternalID', () => {
         delete parsed.literalOpenQuote;
         delete parsed.literalValue;
         delete parsed.literalCloseQuote;

         entityDeclaration.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ENTITYDECL_NO_VALUE,
            params: [ 'entityName' ],
            lastPosition: parsed.postNameSpace,
         });
      });

      it('reports an error if there was no closing', () => {
         delete parsed.close;

         entityDeclaration.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ENTITYDECL_NO_CLOSE,
            params: [ 'entityName' ],
            position: undefined,
            lastPosition: parsed.postNameSpace,
         });
      });

   });

   describe('makeToken()', () => {
      let expectedLToken;

      beforeEach(() => {
         expectedLToken = makeLTokenMaker();
         spyOn(quotedValue, 'appendLTokens');
         spyOn(externalId, 'makeTokenCompatible');
         spyOn(externalId, 'appendLTokens');
      });

      it('calls quotedValue.appendLTokens()', () => {
         const parsed = {
            name: expectedLToken('entityName'),
            literalValue: expectedLToken('value'),
         };

         const token = entityDeclaration.makeToken(parsed);

         expect(quotedValue.appendLTokens).toHaveBeenCalledWith('literal', token.lTokens, parsed);
      });

      it('calls externalId.makeTokenCompatible()', () => {
         const parsed = {
            name: expectedLToken('entityName'),
            externalId: { externalId: true },
         };

         entityDeclaration.makeToken(parsed);

         expect(externalId.makeTokenCompatible).toHaveBeenCalledWith(parsed.externalId);
      });

      it('calls externalId.appendLTokens()', () => {
         const parsed = {
            name: expectedLToken('entityName'),
            externalId: { externalId: true },
         };

         const token = entityDeclaration.makeToken(parsed);

         expect(externalId.appendLTokens).toHaveBeenCalledWith(token.lTokens, parsed.externalId);
      });

      it('returns an entity declaration token with the name and value found in the parsing', () => {
         const parsed = {
            name: expectedLToken('entityName'),
            literalValue: expectedLToken('value'),
         };
         const expectedText = new text.Token('value', [ parsed.literalValue ]);

         const token = entityDeclaration.makeToken(parsed);

         expect(token).toEqual(new entityDeclaration.Token('entityName', [ expectedText ],
            undefined, '', [
               parsed.name,
            ]));
      });

      it('returns a parameter entity declaration token with the name and value found in the parsing', () => {
         const parsed = {
            parameter: expectedLToken('%'),
            name: expectedLToken('entityName'),
            literalValue: expectedLToken('value'),
         };
         const expectedText = new text.Token('value', [ parsed.literalValue ]);

         const token = entityDeclaration.makeToken(parsed);

         expect(token).toEqual(new entityDeclaration.ParamToken('entityName', [ expectedText ],
            undefined, '', [
               parsed.parameter,
               parsed.name,
            ]));
      });

      it('returns a entity declaration with a blank name if there is no name', () => {
         const parsed = {
            name: undefined,
            literalValue: expectedLToken('value'),
         };
         const expectedText = new text.Token('value', [ parsed.literalValue ]);

         const token = entityDeclaration.makeToken(parsed);

         expect(token).toEqual(new entityDeclaration.Token('', [ expectedText ], undefined, '', []));
      });

      it('returns a entity declaration with an undefined value if there is no value', () => {
         const parsed = {
            name: expectedLToken('aName'),
         };

         const token = entityDeclaration.makeToken(parsed);

         expect(token).toEqual(new entityDeclaration.Token('aName', undefined, undefined, '', [
            parsed.name,
         ]));
      });

   });

});
