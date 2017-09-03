/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { MockErrorCollector } from '../basic/test';
import chunkUtil from '../chunk/test';
import { WellFormedError } from '../error';

import entityDeclaration from './entityDeclaration.js';
import externalId from './externalId.js';
import quotedValue from './quotedValue.js';

const NO_PARAMS = [ 'char', 'space', 'peekChar', 'peekSpace' ];

describe('entityDeclaration', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         mockSource = new chunkUtil.MockChunkSource([
            chunkUtil.makeChunk('e'),
            chunkUtil.makeChunk('entityName'),
            chunkUtil.makeChunk(' '),
            chunkUtil.makeChunk('S'),
            undefined,
            undefined,
            chunkUtil.makeChunk('>'),
         ]);

         spyOn(externalId, 'parse');
         externalId.parse.and.callFake((source, terminators, cb) => {
            cb({ externalId: true });
         });
      });

      it('does a simple parse', () => {
         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'ENTITY_DECL',
            openChunk: undefined,
            postOpenSpaceChunk: undefined,
            declTypeChunk: undefined,
            postDeclTypeSpaceChunk: undefined,
            nameChunk: chunkUtil.makeChunk('entityName'),
            postNameSpaceChunk: chunkUtil.makeChunk(' '),
            externalId: { externalId: true },
            postExternalIdSpaceChunk: undefined,
            closeChunk: chunkUtil.makeChunk('>'),
         });
      });

      it('uses whatever preliminary declaration values were passed in', () => {
         entityDeclaration.parse(mockSource, {
            openChunk: 'a',
            postOpenSpaceChunk: 'b',
            declTypeChunk: 'c',
            postDeclTypeSpaceChunk: 'd',
         }, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            openChunk: 'a',
            postOpenSpaceChunk: 'b',
            declTypeChunk: 'c',
            postDeclTypeSpaceChunk: 'd',
         });
      });

      it('returns nothing if the first peek return undefined. That is: <!ENTITY', () => {
         mockSource = new chunkUtil.MockChunkSource([
            undefined,
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            type: 'ENTITY_DECL',
            openChunk: undefined,
            postOpenSpaceChunk: undefined,
            declTypeChunk: undefined,
            postDeclTypeSpaceChunk: undefined,
         } ] ]);
      });

      it('returns parameter entity info if this is a parameter entity: <!ENTITY % entityName ...', () => {
         mockSource = new chunkUtil.MockChunkSource([
            chunkUtil.makeChunk('%'),
            chunkUtil.makeChunk('%'),
            chunkUtil.makeChunk(' '),
            chunkUtil.makeChunk('entityName'),
            chunkUtil.makeChunk(' '),
            chunkUtil.makeChunk('S'),
            undefined,
            undefined,
            chunkUtil.makeChunk('>'),
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'ENTITY_DECL',
            parameterChunk: chunkUtil.makeChunk('%'),
            postParameterSpaceChunk: chunkUtil.makeChunk(' '),
            nameChunk: chunkUtil.makeChunk('entityName'),
         });
      });

      it('returns parameter entity without the trailing space if none present: <!ENTITY %entityName...', () => {
         mockSource = new chunkUtil.MockChunkSource([
            chunkUtil.makeChunk('%'),
            chunkUtil.makeChunk('%'),
            undefined,
            chunkUtil.makeChunk('entityName'),
            chunkUtil.makeChunk(' '),
            chunkUtil.makeChunk('S'),
            undefined,
            undefined,
            chunkUtil.makeChunk('>'),
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            parameterChunk: chunkUtil.makeChunk('%'),
            postParameterSpaceChunk: undefined,
            nameChunk: chunkUtil.makeChunk('entityName'),
         });
      });

      it('returns nothing if there is no name, space, or start of value: <!ENTITY %', () => {
         mockSource = new chunkUtil.MockChunkSource([
            chunkUtil.makeChunk('%'),
            chunkUtil.makeChunk('%'),
            undefined,
            undefined,
            undefined,
            undefined,
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            parameterChunk: chunkUtil.makeChunk('%'),
            postParameterSpaceChunk: undefined,
            nameChunk: undefined,
            postNameSpaceChunk: undefined,
         });
      });

      it('returns the quoted value if present: <!ENTITY entityName "foo" >', () => {
         mockSource = new chunkUtil.MockChunkSource([
            chunkUtil.makeChunk('e'),
            chunkUtil.makeChunk('entityName'),
            chunkUtil.makeChunk(' '),
            chunkUtil.makeChunk('"'),
            undefined,
            chunkUtil.makeChunk('>'),
         ]);
         spyOn(quotedValue, 'parse').and.callFake((source, options, cb) => {
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
         mockSource = new chunkUtil.MockChunkSource([
            chunkUtil.makeChunk('e'),
            chunkUtil.makeChunk('entityName'),
            undefined,
            chunkUtil.makeChunk('"'),
            undefined,
            chunkUtil.makeChunk('>'),
         ]);
         spyOn(quotedValue, 'parse').and.callFake((source, options, cb) => {
            cb({ quotedValue: true });
         });

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            nameChunk: chunkUtil.makeChunk('entityName'),
            postNameSpaceChunk: undefined,
            entityValue: {
               quotedValue: true,
            },
         });
      });

      it('adds trailing space after quoted value if present: <!ENTITY entityName "foo" >', () => {
         mockSource = new chunkUtil.MockChunkSource([
            chunkUtil.makeChunk('e'),
            chunkUtil.makeChunk('entityName'),
            chunkUtil.makeChunk(' '),
            chunkUtil.makeChunk('"'),
            chunkUtil.makeChunk(' '),
            chunkUtil.makeChunk('>'),
         ]);
         spyOn(quotedValue, 'parse').and.callFake((source, options, cb) => {
            cb({ quotedValue: true });
         });

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            entityValue: {
               quotedValue: true,
            },
            postEntityValueSpaceChunk: chunkUtil.makeChunk(' '),
            closeChunk: chunkUtil.makeChunk('>'),
         });
      });

      it('stops if externalId returns nothing: <!ENTITY entityName >', () => {
         mockSource = new chunkUtil.MockChunkSource([
            chunkUtil.makeChunk('e'),
            chunkUtil.makeChunk('entityName'),
            chunkUtil.makeChunk(' '),
            chunkUtil.makeChunk('>'),
            chunkUtil.makeChunk('>'),
         ]);
         externalId.parse.and.callFake((source, terminators, cb) => {
            cb(undefined);
         });

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            nameChunk: chunkUtil.makeChunk('entityName'),
            postNameSpaceChunk: chunkUtil.makeChunk(' '),
            externalId: undefined,
         });
      });

      it('returns a space after the externalID: <!ENTITY entityName SYSTEM "foo" >', () => {
         mockSource = new chunkUtil.MockChunkSource([
            chunkUtil.makeChunk('e'),
            chunkUtil.makeChunk('entityName'),
            chunkUtil.makeChunk(' '),
            chunkUtil.makeChunk('S'),
            chunkUtil.makeChunk(' '),
            undefined, // peekWord
            chunkUtil.makeChunk('>'),
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            externalId: {
               externalId: true,
            },
            postExternalIdSpaceChunk: chunkUtil.makeChunk(' '),
            closeChunk: chunkUtil.makeChunk('>'),
         });
      });

      it('returns an NDATA clause if found: <!ENTITY entityName SYSTEM "foo" NDATA testNData >', () => {
         mockSource = new chunkUtil.MockChunkSource([
            chunkUtil.makeChunk('e'),
            chunkUtil.makeChunk('entityName'),
            chunkUtil.makeChunk(' '),
            chunkUtil.makeChunk('S'),
               // externalId
            chunkUtil.makeChunk(' '),
            chunkUtil.makeChunk('NDATA'),
            chunkUtil.makeChunk('NDATA'),
            chunkUtil.makeChunk(' '),
            chunkUtil.makeChunk('testNData'),
            chunkUtil.makeChunk(' '),
            chunkUtil.makeChunk('>'),
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            postExternalIdSpaceChunk: chunkUtil.makeChunk(' '),
            nDataChunk: chunkUtil.makeChunk('NDATA'),
            postNDataSpaceChunk: chunkUtil.makeChunk(' '),
            nDataNameChunk: chunkUtil.makeChunk('testNData'),
            postNDataNameSpaceChunk: chunkUtil.makeChunk(' '),
            closeChunk: chunkUtil.makeChunk('>'),
         });
      });

      it('recognizes a non-all caps NDATA: <!ENTITY entityName SYSTEM "foo" ndaTa testNData >', () => {
         mockSource = new chunkUtil.MockChunkSource([
            chunkUtil.makeChunk('e'),
            chunkUtil.makeChunk('entityName'),
            chunkUtil.makeChunk(' '),
            chunkUtil.makeChunk('S'),
               // externalId
            chunkUtil.makeChunk(' '),
            chunkUtil.makeChunk('ndaTa'),
            chunkUtil.makeChunk('ndaTa'),
            chunkUtil.makeChunk(' '),
            chunkUtil.makeChunk('testNData'),
            chunkUtil.makeChunk(' '),
            chunkUtil.makeChunk('>'),
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            nDataChunk: chunkUtil.makeChunk('ndaTa'),
         });
      });

      it('does not mind no space after the ndata value: <!ENTITY entityName SYSTEM "foo" ndaTa testNData>', () => {
         mockSource = new chunkUtil.MockChunkSource([
            chunkUtil.makeChunk('e'),
            chunkUtil.makeChunk('entityName'),
            chunkUtil.makeChunk(' '),
            chunkUtil.makeChunk('S'),
               // externalId
            chunkUtil.makeChunk(' '),
            chunkUtil.makeChunk('ndaTa'),
            chunkUtil.makeChunk('ndaTa'),
            chunkUtil.makeChunk(' '),
            chunkUtil.makeChunk('testNData'),
            undefined,
            chunkUtil.makeChunk('>'),
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            nDataChunk: chunkUtil.makeChunk('ndaTa'),
            postNDataSpaceChunk: chunkUtil.makeChunk(' '),
            nDataNameChunk: chunkUtil.makeChunk('testNData'),
            postNDataNameSpaceChunk: undefined,
            closeChunk: chunkUtil.makeChunk('>'),
         });
      });

      it('returns if stops after NDATA: <!ENTITY entityName SYSTEM "foo" NDATA', () => {
         mockSource = new chunkUtil.MockChunkSource([
            chunkUtil.makeChunk('e'),
            chunkUtil.makeChunk('entityName'),
            chunkUtil.makeChunk(' '),
            chunkUtil.makeChunk('S'),
               // externalId
            chunkUtil.makeChunk(' '),
            chunkUtil.makeChunk('NDATA'),
            chunkUtil.makeChunk('NDATA'),
            undefined,
            undefined,
            undefined,
            undefined,
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            postExternalIdSpaceChunk: chunkUtil.makeChunk(' '),
            nDataChunk: chunkUtil.makeChunk('NDATA'),
            postNDataSpaceChunk: undefined,
            nDataNameChunk: undefined,
            postNDataNameSpaceChunk: undefined,
            closeChunk: undefined,
         });
      });

      describe('terminators', () => {

         it('passes quotes and > as terminators for getting the name', () => {
            mockSource = new chunkUtil.MockChunkSource([
               chunkUtil.makeChunk('e'),
               chunkUtil.makeChunk('entityName'),
               chunkUtil.makeChunk(' '),
               chunkUtil.makeChunk('S'),
               undefined,
               undefined,
               chunkUtil.makeChunk('>'),
            ]);

            entityDeclaration.parse(mockSource, {}, callback);
            mockSource.respondInAsyncTime();

            expect(mockSource.extractToObject.calls.argsFor(0)[1]).toEqual([ '>', '"', '\'' ]);
         });

         it('passes > as terminators all other requests', () => {
            mockSource = new chunkUtil.MockChunkSource([
               chunkUtil.makeChunk('e'),
               chunkUtil.makeChunk('entityName'),
               chunkUtil.makeChunk(' '),
               chunkUtil.makeChunk('S'),
               undefined,
               undefined,
               chunkUtil.makeChunk('>'),
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

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         parsed = {
            openChunk: chunkUtil.makeChunk('<!'),
            declTypeChunk: chunkUtil.makeChunk('ENTITY'),
            postDeclTypeSpaceChunk: chunkUtil.makeChunk('\t'),
            nameChunk: chunkUtil.makeChunk('entityName'),
            postNameSpaceChunk: chunkUtil.makeChunk(' '),
            entityValue: {},
            postEntityValueSpaceChunk: undefined,
            closeChunk: chunkUtil.makeChunk('>'),
         };
      });

      it('reports an error if % is not followed by a space', () => {
         parsed.parameterChunk = chunkUtil.makeChunk('%');

         entityDeclaration.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector.report)
            .toHaveBeenCalledWith(WellFormedError.ID.ENTITYDECL_PERCENT_NO_TRAILING_SPACE);
      });

      it('reports an error if there is no name', () => {
         delete parsed.nameChunk;

         entityDeclaration.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector.report).toHaveBeenCalledWith(WellFormedError.ID.ENTITYDECL_NO_NAME);
      });

      it('checks the name validity', () => {
         entityDeclaration.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector.checkName)
            .toHaveBeenCalledWith(parsed.nameChunk, WellFormedError.ID.ENTITYDECL_NAME_INVALID, parsed.openChunk);
      });

      it('reports an error if there is no space after the name', () => {
         delete parsed.postNameSpaceChunk;

         entityDeclaration.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector.report)
            .toHaveBeenCalledWith(WellFormedError.ID.ENTITYDECL_NAME_NO_TRAILING_SPACE, [ 'entityName' ]);
      });

      it('reports an error if there is EnitytValue or ExternalID', () => {
         delete parsed.entityValue;

         entityDeclaration.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector.report)
            .toHaveBeenCalledWith(WellFormedError.ID.ENTITYDECL_NO_VALUE, [ 'entityName' ]);
      });

      it('reports an error if there was no closing', () => {
         delete parsed.closeChunk;

         entityDeclaration.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector.report)
            .toHaveBeenCalledWith(WellFormedError.ID.ENTITYDECL_NO_CLOSE, [ 'entityName' ]);
      });

   });

   describe('makeToken()', () => {

      it('returns an entity declaration token with the name and value found in the parsing', () => {
         const parsed = {
            nameChunk: chunkUtil.makeChunk('entityName'),
            entityValue: {
               valueChunk: chunkUtil.makeChunk('value'),
            },
         };

         const token = entityDeclaration.makeToken(parsed);

         expect(token).toEqual(new entityDeclaration.Token('entityName', 'value', {}, '', []));
      });

      it('returns a parameter entity declaration token with the name and value found in the parsing', () => {
         const parsed = {
            parameterChunk: chunkUtil.makeChunk('%'),
            nameChunk: chunkUtil.makeChunk('entityName'),
            entityValue: {
               valueChunk: chunkUtil.makeChunk('value'),
            },
         };

         const token = entityDeclaration.makeToken(parsed);

         expect(token).toEqual(new entityDeclaration.ParamToken('entityName', 'value', {}, '', []));
      });

      it('returns a entity declaration with a blank value if there is no name', () => {
         const parsed = {
            nameChunk: undefined,
            entityValue: {
               valueChunk: chunkUtil.makeChunk('value'),
            },
         };

         const token = entityDeclaration.makeToken(parsed);

         expect(token).toEqual(new entityDeclaration.Token('', 'value', {}, '', []));
      });

      it('returns a entity declaration with a blank value if there is no value', () => {
         const parsed = {
            parameterChunk: chunkUtil.makeChunk('%'),
            nameChunk: chunkUtil.makeChunk('entityName'),
         };

         const token = entityDeclaration.makeToken(parsed);

         expect(token).toEqual(new entityDeclaration.ParamToken('entityName', '', {}, '', []));
      });

   });

});
