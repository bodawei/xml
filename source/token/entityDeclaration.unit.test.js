/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { MockErrorCollector } from '../basic/test';
import { XmlWarning } from '../error';
import { makeLTokenMaker, MockLTokenSource } from '../lToken/test';
import { WellFormedError } from '../error';

import * as declaration from './declaration.js';
import * as entityDeclaration from './entityDeclaration.js';
import * as externalId from './externalId.js';
import * as misc from './misc.js';
import * as quotedValue from './quotedValue.js';

const NO_PARAMS = [ 'char', 'space', 'peekChar', 'peekSpace' ];

describe('entityDeclaration', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;
      let expectedLToken;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         expectedLToken = makeLTokenMaker();
         spyOn(externalId, 'parse');
         externalId.parse.and.callFake((source, terminators, cb) => {
            cb({ externalId: true });
         });
      });

      it('does a simple parse', () => {
         mockSource = new MockLTokenSource([
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

         expect(callback).toContainParsedProps({
            type: 'ENTITYDECL',
            open: undefined,
            postOpenSpace: undefined,
            declType: undefined,
            postDeclTypeSpace: undefined,
            name: expectedLToken('entityName'),
            postNameSpace: expectedLToken(' '),
            externalId: { externalId: true },
            postExternalIdSpace: expectedLToken(' '),
            close: expectedLToken('>'),
         });
      });

      it('uses whatever preliminary declaration values were passed in', () => {
         mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('e'),
            'entityName',
            ' ',
            MockLTokenSource.PEEK('S'),
            // Skipping externalId parsing here
            ' ',
            undefined,
            '>',
         ]);
         entityDeclaration.parse(mockSource, {
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

      it('returns nothing if the first peek return undefined. That is: <!ENTITY', () => {
         mockSource = new MockLTokenSource([
            undefined,
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            type: 'ENTITYDECL',
            open: undefined,
            postOpenSpace: undefined,
            declType: undefined,
            postDeclTypeSpace: undefined,
         } ] ]);
      });

      it('returns parameter entity info if this is a parameter entity: <!ENTITY % entityName ...', () => {
         mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('%'),
            '%',
            ' ',
            'entityName',
            ' ',
            'S',
            undefined,
            undefined,
            '>',
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'ENTITYDECL',
            parameter: expectedLToken('%'),
            postParameterSpace: expectedLToken(' '),
            name: expectedLToken('entityName'),
         });
      });

      it('returns parameter entity without the trailing space if none present: <!ENTITY %entityName...', () => {
         mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('%'),
            '%',
            undefined,
            'entityName',
            ' ',
            'S',
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
         mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('%'),
            '%',
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

      it('returns the quoted value if present: <!ENTITY entityName "foo" >', () => {
         mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('e'),
            'entityName',
            ' ',
            '"',
            undefined,
            '>',
         ]);
         spyOn(quotedValue, 'parse').and.callFake((source, cb) => {
            cb({ quotedValue: true });
         });

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            entityValue: {
               quotedValue: true,
            },
         });
      });

      it('returns no space between entity name and value: <!ENTITY entityName"foo" >', () => {
         mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('e'),
            'entityName',
            undefined,
            '"',
            undefined,
            '>',
         ]);
         spyOn(quotedValue, 'parse').and.callFake((source, cb) => {
            cb({ quotedValue: true });
         });

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            name: expectedLToken('entityName'),
            postNameSpace: undefined,
            entityValue: {
               quotedValue: true,
            },
         });
      });

      it('adds trailing space after quoted value if present: <!ENTITY entityName "foo" >', () => {
         mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('e'),
            'entityName',
            ' ',
            '"',
            ' ',
            '>',
         ]);
         spyOn(quotedValue, 'parse').and.callFake((source, cb) => {
            cb({ quotedValue: true });
         });

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         const expectedLToken = makeLTokenMaker(undefined, 12, 0, 12);
         expect(callback).toContainParsedProps({
            entityValue: {
               quotedValue: true,
            },
            postEntityValueSpace: expectedLToken(' '),
            close: expectedLToken('>'),
         });
      });

      it('stops if externalId returns nothing: <!ENTITY entityName >', () => {
         mockSource = new MockLTokenSource([
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
         mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('e'),
            'entityName',
            ' ',
            'S',
            ' ',
            undefined, // peekWord
            '>',
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         const expectedLToken = makeLTokenMaker(undefined, 12, 0, 12);
         expect(callback).toContainParsedProps({
            externalId: {
               externalId: true,
            },
            postExternalIdSpace: expectedLToken(' '),
            close: expectedLToken('>'),
         });
      });

      it('returns an NDATA clause if found: <!ENTITY entityName SYSTEM "foo" NDATA testNData >', () => {
         mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('e'),
            'entityName',
            ' ',
            'S',
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

         const expectedLToken = makeLTokenMaker(undefined, 12, 0, 12);
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
         mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('e'),
            'entityName',
            ' ',
            'S',
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

         const expectedLToken = makeLTokenMaker(undefined, 13, 0, 13);
         expect(callback).toContainParsedProps({
            nData: expectedLToken('ndaTa'),
         });
      });

      it('does not mind no space after the ndata value: <!ENTITY entityName SYSTEM "foo" ndaTa testNData>', () => {
         mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('e'),
            'entityName',
            ' ',
            'S',
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

         const expectedLToken = makeLTokenMaker(undefined, 13, 0, 13);
         expect(callback).toContainParsedProps({
            nData: expectedLToken('ndaTa'),
            postNDataSpace: expectedLToken(' '),
            nDataName: expectedLToken('testNData'),
            postNDataNameSpace: undefined,
            close: expectedLToken('>'),
         });
      });

      it('returns if stops after NDATA: <!ENTITY entityName SYSTEM "foo" NDATA', () => {
         mockSource = new MockLTokenSource([
            MockLTokenSource.PEEK('e'),
            'entityName',
            ' ',
            'S',
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

         const expectedLToken = makeLTokenMaker(undefined, 12, 0, 12);
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
            mockSource = new MockLTokenSource([
               MockLTokenSource.PEEK('e'),
               'entityName',
               ' ',
               'S',
               undefined,
               undefined,
               '>',
            ]);

            entityDeclaration.parse(mockSource, {}, callback);
            mockSource.respondInAsyncTime();

            expect(mockSource.extractToObject.calls.argsFor(0)[1]).toEqual([ '>', '"', '\'' ]);
         });

         it('passes > as terminators all other requests', () => {
            mockSource = new MockLTokenSource([
               MockLTokenSource.PEEK('e'),
               'entityName',
               ' ',
               'S',
               undefined,
               undefined,
               '>',
            ]);

            entityDeclaration.parse(mockSource, {}, callback);
            mockSource.respondInAsyncTime();

            const allArgs = mockSource.extractToObject.calls.allArgs().concat(mockSource.extract.calls.allArgs());
            allArgs.forEach((args) => {
               if (NO_PARAMS.indexOf(args[0]) !== -1) {
                  return;
               }
               // skip the  name call
               if (args[1].length === 3 && args[0] === 'word') {
                  return;
               }
               // skip the match one
               if (args[1] === '>' && args[0] === 'match') {
                  return;
               }

               expect(args[1]).toEqual([ '>' ]);
            });
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
            entityValue: {},
            postEntityValueSpace: undefined,
            close: expectedLToken('>'),
         };
         spyOn(misc, 'checkWellFormedNameRecommendation');
         spyOn(misc, 'checkWellFormedText');
      });

      it('asks the declaration module to look for problems in the declaration part', () => {
         const emd = new EntityMetaData();
         spyOn(declaration, 'checkWellFormed');

         entityDeclaration.checkWellFormed(parsed, mockErrorCollector, emd);

         expect(declaration.checkWellFormed).toHaveBeenCalledWith(parsed, mockErrorCollector, emd);
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
            lastPosition: undefined,
         });
      });

      it('checks the name validity', () => {
         entityDeclaration.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector.checkName)
            .toHaveBeenCalledWith(parsed.name, WellFormedError.ID.ENTITYDECL_NAME_INVALID, parsed.open);
      });

      it('calls checkWellFormedNameRecommendation() to report on bad names', () => {
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
         delete parsed.entityValue;
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

      it('calls quotedValue.checkWellFormed() to check on the entity value', () => {
         spyOn(quotedValue, 'checkWellFormed');
         const emd = new EntityMetaData();

         entityDeclaration.checkWellFormed(parsed, mockErrorCollector, emd);

         expect(quotedValue.checkWellFormed).toHaveBeenCalledWith(parsed.entityValue,
            mockErrorCollector, emd);
      });

      it('reports an error if there is no EnitytValue or ExternalID', () => {
         delete parsed.entityValue;

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
      });

      it('returns an entity declaration token with the name and value found in the parsing', () => {
         const parsed = {
            name: expectedLToken('entityName'),
            entityValue: {
               value: expectedLToken('value'),
            },
         };

         const token = entityDeclaration.makeToken(parsed);

         expect(token).toEqual(new entityDeclaration.Token('entityName', 'value', {}, '', [
            parsed.name,
            parsed.entityValue.value,
         ]));
      });

      it('returns a parameter entity declaration token with the name and value found in the parsing', () => {
         const parsed = {
            parameter: expectedLToken('%'),
            name: expectedLToken('entityName'),
            entityValue: {
               value: expectedLToken('value'),
            },
         };

         const token = entityDeclaration.makeToken(parsed);

         expect(token).toEqual(new entityDeclaration.ParamToken('entityName', 'value', {}, '', [
            parsed.parameter,
            parsed.name,
            parsed.entityValue.value,
         ]));
      });

      it('returns a entity declaration with a blank value if there is no name', () => {
         const parsed = {
            name: undefined,
            entityValue: {
               value: expectedLToken('value'),
            },
         };

         const token = entityDeclaration.makeToken(parsed);

         expect(token).toEqual(new entityDeclaration.Token('', 'value', {}, '', [
            parsed.entityValue.value,
         ]));
      });

      it('returns a entity declaration with a blank value if there is no value', () => {
         const parsed = {
            parameter: expectedLToken('%'),
            name: expectedLToken('entityName'),
         };

         const token = entityDeclaration.makeToken(parsed);

         expect(token).toEqual(new entityDeclaration.ParamToken('entityName', '', {}, '', [
            parsed.parameter,
            parsed.name,
         ]));
      });

   });

});
