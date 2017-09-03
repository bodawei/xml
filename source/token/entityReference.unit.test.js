/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { MockErrorCollector } from '../basic/test';
import chunkUtil from '../chunk/test';
import { WellFormedError } from '../error';

import entityReference from './entityReference.js';

const NO_PARAMS = [ 'char', 'space', 'peekChar', 'peekSpace' ];

describe('entityReference', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does a simple parse', () => {
         mockSource = new chunkUtil.MockChunkSource([
            chunkUtil.makeChunk('&'),
            chunkUtil.makeChunk(' '),
            chunkUtil.makeChunk('entityName'),
            chunkUtil.makeChunk(' '),
            chunkUtil.makeChunk(';'),
         ]);

         entityReference.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'ENTITY_REFERENCE',
            openChunk: chunkUtil.makeChunk('&'),
            postOpenSpaceChunk: chunkUtil.makeChunk(' '),
            entityNameChunk: chunkUtil.makeChunk('entityName'),
            postEntityNameSpaceChunk: chunkUtil.makeChunk(' '),
            closeChunk: chunkUtil.makeChunk(';'),
         });
      });

      it('accepts no spaces within reference', () => {
         mockSource = new chunkUtil.MockChunkSource([
            chunkUtil.makeChunk('&'),
            undefined,
            chunkUtil.makeChunk('entityName'),
            undefined,
            chunkUtil.makeChunk(';'),
         ]);

         entityReference.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'ENTITY_REFERENCE',
            openChunk: chunkUtil.makeChunk('&'),
            postOpenSpaceChunk: undefined,
            entityNameChunk: chunkUtil.makeChunk('entityName'),
            postEntityNameSpaceChunk: undefined,
            closeChunk: chunkUtil.makeChunk(';'),
         });
      });

      describe('terminators', () => {

         it('passes quotes and > as terminators for getting the name', () => {
            mockSource = new chunkUtil.MockChunkSource([
               chunkUtil.makeChunk('&'),
               undefined,
               chunkUtil.makeChunk('entityName'),
               undefined,
               chunkUtil.makeChunk(';'),
            ]);

            entityReference.parse(mockSource, callback);
            mockSource.respondInAsyncTime();

            // TODO Generalize this
            const params = mockSource.extractToObject.calls.allArgs().reduce((assembled, args) => {
               if (NO_PARAMS.indexOf(args[0]) === -1) {
                  assembled.push(args[1]);
               }
               return assembled;
            }, []);
            mockSource.extract.calls.allArgs().reduce((assembled, args) => {
               if (NO_PARAMS.indexOf(args[0]) === -1) {
                  assembled.push(args[1]);
               }
               return assembled;
            }, params);

            expect(params).toEqual([
               '&',
               [ ';' ],
               [ ';' ],
            ]);
         });

      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let parsed;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();

         parsed = {
            openChunk: chunkUtil.makeChunk('&'),
            postOpenSpaceChunk: undefined,
            entityNameChunk: chunkUtil.makeChunk('theName'),
            postEntityNameSpaceChunk: undefined,
            closeChunk: chunkUtil.makeChunk(';'),
         };
      });

      it('reports an error if there is a space after the opening &', () => {
         parsed.postOpenSpaceChunk = chunkUtil.makeChunk(' ');

         entityReference.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector.report).toHaveBeenCalledWith(WellFormedError.ID.REFERENCE_XTRA_SPACE, [ 'theName' ]);
      });

      it('reports an error if there is no name', () => {
         delete parsed.entityNameChunk;

         entityReference.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector.report).toHaveBeenCalledWith(WellFormedError.ID.REFERENCE_NO_NAME);
      });

      it('reports an error if there is a space after the entity name', () => {
         parsed.postEntityNameSpaceChunk = chunkUtil.makeChunk(' ');

         entityReference.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector.report)
            .toHaveBeenCalledWith(WellFormedError.ID.REFERENCE_XTRA_TRAILING_SPACE, [ 'theName' ]);
      });

      it('reports an error if there was no closing', () => {
         delete parsed.closeChunk;

         entityReference.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector.report)
            .toHaveBeenCalledWith(WellFormedError.ID.REFERENCE_NO_SEMICOLON, [ 'theName' ]);
      });

   });

   describe('makeToken()', () => {

      it('returns an entity reference token with the entity name', () => {
         const parsed = {
            nameChunk: chunkUtil.makeChunk('entityName'),
         };

         const token = entityReference.makeToken(parsed);

         expect(token).toEqual(new entityReference.Token('entityName', []));
      });

      it('returns an entity reference token with a blank name when the name could not be found', () => {
         const parsed = {
            nameChunk: undefined,
         };

         const token = entityReference.makeToken(parsed);

         expect(token).toEqual(new entityReference.Token('', []));
      });

   });

});
