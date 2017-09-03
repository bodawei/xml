/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { WellFormedError } from '../error';

import util from '../chunk/index.test.js';

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
         mockSource = new util.MockChunkSource([
            util.makeChunk('&'),
            util.makeChunk(' '),
            util.makeChunk('entityName'),
            util.makeChunk(' '),
            util.makeChunk(';'),
         ]);

         entityReference.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'ENTITY_REFERENCE',
            openChunk: util.makeChunk('&'),
            postOpenSpaceChunk: util.makeChunk(' '),
            entityNameChunk: util.makeChunk('entityName'),
            postEntityNameSpaceChunk: util.makeChunk(' '),
            closeChunk: util.makeChunk(';'),
         });
      });

      it('accepts no spaces within reference', () => {
         mockSource = new util.MockChunkSource([
            util.makeChunk('&'),
            undefined,
            util.makeChunk('entityName'),
            undefined,
            util.makeChunk(';'),
         ]);

         entityReference.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'ENTITY_REFERENCE',
            openChunk: util.makeChunk('&'),
            postOpenSpaceChunk: undefined,
            entityNameChunk: util.makeChunk('entityName'),
            postEntityNameSpaceChunk: undefined,
            closeChunk: util.makeChunk(';'),
         });
      });

      describe('terminators', () => {

         it('passes quotes and > as terminators for getting the name', () => {
            mockSource = new util.MockChunkSource([
               util.makeChunk('&'),
               undefined,
               util.makeChunk('entityName'),
               undefined,
               util.makeChunk(';'),
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
         mockErrorCollector = {
            setPos: jasmine.createSpy('setPosSpy'),
            getErrors: jasmine.createSpy('getErrorsSpy'),
            check: function mockCheck(condition, id, params) {
               if (condition) {
                  if (params) {
                     this.report(id, params);
                  } else {
                     this.report(id);
                  }
               }
            },
            checkName: jasmine.createSpy('checkNameSpy'),
            report: jasmine.createSpy('reportSpy'),
         };

         parsed = {
            openChunk: util.makeChunk('&'),
            postOpenSpaceChunk: undefined,
            entityNameChunk: util.makeChunk('theName'),
            postEntityNameSpaceChunk: undefined,
            closeChunk: util.makeChunk(';'),
         };
      });

      it('reports an error if there is a space after the opening &', () => {
         parsed.postOpenSpaceChunk = util.makeChunk(' ');

         entityReference.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector.report).toHaveBeenCalledWith(WellFormedError.ID.REFERENCE_XTRA_SPACE, [ 'theName' ]);
      });

      it('reports an error if there is no name', () => {
         delete parsed.entityNameChunk;

         entityReference.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector.report).toHaveBeenCalledWith(WellFormedError.ID.REFERENCE_NO_NAME);
      });

      it('reports an error if there is a space after the entity name', () => {
         parsed.postEntityNameSpaceChunk = util.makeChunk(' ');

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
            nameChunk: util.makeChunk('entityName'),
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
