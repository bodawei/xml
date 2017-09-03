/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import util from '../chunk/index.test.js';

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
         mockSource = new util.MockChunkSource([
            util.makeChunk('e'),
            util.makeChunk('entityName'),
            util.makeChunk(' '),
            util.makeChunk('S'),
            undefined,
            undefined,
            util.makeChunk('>'),
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
            nameChunk: util.makeChunk('entityName'),
            postNameSpaceChunk: util.makeChunk(' '),
            externalId: { externalId: true },
            postExternalIdSpaceChunk: undefined,
            closeChunk: util.makeChunk('>'),
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
         mockSource = new util.MockChunkSource([
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
         mockSource = new util.MockChunkSource([
            util.makeChunk('%'),
            util.makeChunk('%'),
            util.makeChunk(' '),
            util.makeChunk('entityName'),
            util.makeChunk(' '),
            util.makeChunk('S'),
            undefined,
            undefined,
            util.makeChunk('>'),
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'ENTITY_DECL',
            parameterChunk: util.makeChunk('%'),
            postParameterSpaceChunk: util.makeChunk(' '),
            nameChunk: util.makeChunk('entityName'),
         });
      });

      it('returns parameter entity without the trailing space if none present: <!ENTITY %entityName...', () => {
         mockSource = new util.MockChunkSource([
            util.makeChunk('%'),
            util.makeChunk('%'),
            undefined,
            util.makeChunk('entityName'),
            util.makeChunk(' '),
            util.makeChunk('S'),
            undefined,
            undefined,
            util.makeChunk('>'),
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            parameterChunk: util.makeChunk('%'),
            postParameterSpaceChunk: undefined,
            nameChunk: util.makeChunk('entityName'),
         });
      });

      it('returns nothing if there is no name, space, or start of value: <!ENTITY %', () => {
         mockSource = new util.MockChunkSource([
            util.makeChunk('%'),
            util.makeChunk('%'),
            undefined,
            undefined,
            undefined,
            undefined,
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            parameterChunk: util.makeChunk('%'),
            postParameterSpaceChunk: undefined,
            nameChunk: undefined,
            postNameSpaceChunk: undefined,
         });
      });

      it('returns the quoted value if present: <!ENTITY entityName "foo" >', () => {
         mockSource = new util.MockChunkSource([
            util.makeChunk('e'),
            util.makeChunk('entityName'),
            util.makeChunk(' '),
            util.makeChunk('"'),
            undefined,
            util.makeChunk('>'),
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
         mockSource = new util.MockChunkSource([
            util.makeChunk('e'),
            util.makeChunk('entityName'),
            undefined,
            util.makeChunk('"'),
            undefined,
            util.makeChunk('>'),
         ]);
         spyOn(quotedValue, 'parse').and.callFake((source, options, cb) => {
            cb({ quotedValue: true });
         });

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            nameChunk: util.makeChunk('entityName'),
            postNameSpaceChunk: undefined,
            entityValue: {
               quotedValue: true,
            },
         });
      });

      it('adds trailing space after quoted value if present: <!ENTITY entityName "foo" >', () => {
         mockSource = new util.MockChunkSource([
            util.makeChunk('e'),
            util.makeChunk('entityName'),
            util.makeChunk(' '),
            util.makeChunk('"'),
            util.makeChunk(' '),
            util.makeChunk('>'),
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
            postEntityValueSpaceChunk: util.makeChunk(' '),
            closeChunk: util.makeChunk('>'),
         });
      });

      it('stops if externalId returns nothing: <!ENTITY entityName >', () => {
         mockSource = new util.MockChunkSource([
            util.makeChunk('e'),
            util.makeChunk('entityName'),
            util.makeChunk(' '),
            util.makeChunk('>'),
            util.makeChunk('>'),
         ]);
         externalId.parse.and.callFake((source, terminators, cb) => {
            cb(undefined);
         });

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            nameChunk: util.makeChunk('entityName'),
            postNameSpaceChunk: util.makeChunk(' '),
            externalId: undefined,
         });
      });

      it('returns a space after the externalID: <!ENTITY entityName SYSTEM "foo" >', () => {
         mockSource = new util.MockChunkSource([
            util.makeChunk('e'),
            util.makeChunk('entityName'),
            util.makeChunk(' '),
            util.makeChunk('S'),
            util.makeChunk(' '),
            undefined, // peekWord
            util.makeChunk('>'),
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            externalId: {
               externalId: true,
            },
            postExternalIdSpaceChunk: util.makeChunk(' '),
            closeChunk: util.makeChunk('>'),
         });
      });

      it('returns an NDATA clause if found: <!ENTITY entityName SYSTEM "foo" NDATA testNData >', () => {
         mockSource = new util.MockChunkSource([
            util.makeChunk('e'),
            util.makeChunk('entityName'),
            util.makeChunk(' '),
            util.makeChunk('S'),
               // externalId
            util.makeChunk(' '),
            util.makeChunk('NDATA'),
            util.makeChunk('NDATA'),
            util.makeChunk(' '),
            util.makeChunk('testNData'),
            util.makeChunk(' '),
            util.makeChunk('>'),
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            postExternalIdSpaceChunk: util.makeChunk(' '),
            nDataChunk: util.makeChunk('NDATA'),
            postNDataSpaceChunk: util.makeChunk(' '),
            nDataNameChunk: util.makeChunk('testNData'),
            postNDataNameSpaceChunk: util.makeChunk(' '),
            closeChunk: util.makeChunk('>'),
         });
      });

      it('recognizes a non-all caps NDATA: <!ENTITY entityName SYSTEM "foo" ndaTa testNData >', () => {
         mockSource = new util.MockChunkSource([
            util.makeChunk('e'),
            util.makeChunk('entityName'),
            util.makeChunk(' '),
            util.makeChunk('S'),
               // externalId
            util.makeChunk(' '),
            util.makeChunk('ndaTa'),
            util.makeChunk('ndaTa'),
            util.makeChunk(' '),
            util.makeChunk('testNData'),
            util.makeChunk(' '),
            util.makeChunk('>'),
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            nDataChunk: util.makeChunk('ndaTa'),
         });
      });

      it('does not mind no space after the ndata value: <!ENTITY entityName SYSTEM "foo" ndaTa testNData>', () => {
         mockSource = new util.MockChunkSource([
            util.makeChunk('e'),
            util.makeChunk('entityName'),
            util.makeChunk(' '),
            util.makeChunk('S'),
               // externalId
            util.makeChunk(' '),
            util.makeChunk('ndaTa'),
            util.makeChunk('ndaTa'),
            util.makeChunk(' '),
            util.makeChunk('testNData'),
            undefined,
            util.makeChunk('>'),
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            nDataChunk: util.makeChunk('ndaTa'),
            postNDataSpaceChunk: util.makeChunk(' '),
            nDataNameChunk: util.makeChunk('testNData'),
            postNDataNameSpaceChunk: undefined,
            closeChunk: util.makeChunk('>'),
         });
      });

      it('returns if stops after NDATA: <!ENTITY entityName SYSTEM "foo" NDATA', () => {
         mockSource = new util.MockChunkSource([
            util.makeChunk('e'),
            util.makeChunk('entityName'),
            util.makeChunk(' '),
            util.makeChunk('S'),
               // externalId
            util.makeChunk(' '),
            util.makeChunk('NDATA'),
            util.makeChunk('NDATA'),
            undefined,
            undefined,
            undefined,
            undefined,
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            postExternalIdSpaceChunk: util.makeChunk(' '),
            nDataChunk: util.makeChunk('NDATA'),
            postNDataSpaceChunk: undefined,
            nDataNameChunk: undefined,
            postNDataNameSpaceChunk: undefined,
            closeChunk: undefined,
         });
      });

      describe('terminators', () => {

         it('passes quotes and > as terminators for getting the name', () => {
            mockSource = new util.MockChunkSource([
               util.makeChunk('e'),
               util.makeChunk('entityName'),
               util.makeChunk(' '),
               util.makeChunk('S'),
               undefined,
               undefined,
               util.makeChunk('>'),
            ]);

            entityDeclaration.parse(mockSource, {}, callback);
            mockSource.respondInAsyncTime();

            expect(mockSource.extractToObject.calls.argsFor(0)[1]).toEqual([ '>', '"', '\'' ]);
         });

         it('passes > as terminators all other requests', () => {
            mockSource = new util.MockChunkSource([
               util.makeChunk('e'),
               util.makeChunk('entityName'),
               util.makeChunk(' '),
               util.makeChunk('S'),
               undefined,
               undefined,
               util.makeChunk('>'),
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

});
