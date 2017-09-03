/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { Chunk } from '../chunk';
import { Range, EntityLocation } from '../basic';
import { WellFormedError } from '../error';

import util from '../chunk/index.test.js';

import docTypeStart from './docTypeStart.js';

describe('docTypeStart', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;
      let sourceRm;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         mockSource = new util.MockChunkSource([
            new Chunk('a', 'a', new Range(1, 0, 0, 0, 1, 0, 1)),
            new Chunk(' ', ' ', new Range(1, 0, 0, 0, 1, 0, 1)),
            undefined,
            undefined,
         ]);
         sourceRm = new util.RangeMaker(new EntityLocation());
      });

      it('returns simple values', () => {
         mockSource = new util.MockChunkSource([
            util.makeChunk('a', sourceRm),
            util.makeChunk(' ', sourceRm),
            undefined,
            undefined,
         ]);

         docTypeStart.parse(mockSource, {}, callback);

         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            type: 'DOCTYPE_START',
            openChunk: undefined,
            postOpenSpaceChunk: undefined,
            declTypeChunk: undefined,
            postDeclTypeSpaceChunk: undefined,
            nameChunk: new Chunk('a', 'a', new Range(new EntityLocation(), 0, 0, 0, 1, 0, 1)),
            postNameSpaceChunk: new Chunk(' ', ' ', new Range(new EntityLocation(), 1, 0, 1, 2, 0, 2)),
            postExternalIdSpaceChunk: undefined,
            startInternalSubsetChunk: undefined,
         } ] ]);
      });

      it('uses whatever preliminary declaration values were passed in', () => {
         docTypeStart.parse(mockSource, {
            openChunk: 'a',
            postOpenSpaceChunk: 'b',
            declTypeChunk: 'c',
            postDeclTypeSpaceChunk: 'd',
         }, callback);

         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ jasmine.objectContaining({
            openChunk: 'a',
            postOpenSpaceChunk: 'b',
            declTypeChunk: 'c',
            postDeclTypeSpaceChunk: 'd',
         }) ] ]);
      });

      it('returns all values', () => {
         const expectedRm = new util.RangeMaker(new EntityLocation());
         const declStart = {
            openChunk: util.makeChunk('<!', sourceRm),
            postOpenSpaceChunk: util.makeChunk(' ', sourceRm),
            declTypeChunk: util.makeChunk('DOCTYPE', sourceRm),
            postDeclTypeSpaceChunk: util.makeChunk('\t', sourceRm),
         };

         mockSource = new util.MockChunkSource([
            util.makeChunk('elemType', sourceRm),
            util.makeChunk('  ', sourceRm),
            util.makeChunk('\t', sourceRm),
            util.makeChunk('[', sourceRm),
         ]);

         docTypeStart.parse(mockSource, declStart, callback);

         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            type: 'DOCTYPE_START',
            openChunk: util.makeChunk('<!', expectedRm),
            postOpenSpaceChunk: util.makeChunk(' ', expectedRm),
            declTypeChunk: util.makeChunk('DOCTYPE', expectedRm),
            postDeclTypeSpaceChunk: util.makeChunk('\t', expectedRm),
            nameChunk: util.makeChunk('elemType', expectedRm),
            postNameSpaceChunk: util.makeChunk('  ', expectedRm),
            postExternalIdSpaceChunk: util.makeChunk('\t', expectedRm),
            startInternalSubsetChunk: util.makeChunk('[', expectedRm),
         } ] ]);
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let expectedRm;
      let parsed;

      beforeEach(() => {
         mockErrorCollector = {
            setPos: jasmine.createSpy('setPosSpy'),
            getErrors: jasmine.createSpy('getErrorsSpy'),
            check: jasmine.createSpy('checkSpy'),
            checkName: jasmine.createSpy('checkNameSpy'),
            report: jasmine.createSpy('reportSpy'),
         };

         expectedRm = new util.RangeMaker(new EntityLocation());
         parsed = {
            openChunk: util.makeChunk('<!', expectedRm),
            declTypeChunk: util.makeChunk('DOCTYPE', expectedRm),
            postDeclTypeSpaceChunk: util.makeChunk('\t', expectedRm),
            nameChunk: util.makeChunk('elmentName', expectedRm),
         };
      });

      it('returns an an error collector', () => {
         const errors = docTypeStart.checkWellFormed(parsed, mockErrorCollector);

         expect(errors).toEqual(mockErrorCollector);
      });

      it('sets the position before checking the name', () => {
         parsed.nameChunk = undefined;

         docTypeStart.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector.setPos).toHaveBeenCalledWith(parsed.nameChunk);
         expect(mockErrorCollector.setPos).toHaveBeenCalledBefore(mockErrorCollector.check);
         expect(mockErrorCollector.setPos).toHaveBeenCalledTimes(1);
      });

      it('reports an error if there is no elment name', () => {
         parsed.nameChunk = undefined;

         docTypeStart.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector.check).toHaveBeenCalledWith(true, WellFormedError.ID.DOCTYPE_NO_NAME);
      });

      it('reports no error if there is an elment name', () => {
         docTypeStart.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector.check).toHaveBeenCalledWith(false, WellFormedError.ID.DOCTYPE_NO_NAME);
      });

      it('does not reset the position before checking the name validity', () => {
         parsed.nameChunk = undefined;

         docTypeStart.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector.setPos).toHaveBeenCalledTimes(1);
      });

      it('checks whether the name is valid', () => {
         docTypeStart.checkWellFormed(parsed, mockErrorCollector, true, 1, 2);

         expect(mockErrorCollector.checkName)
            .toHaveBeenCalledWith(parsed.nameChunk, WellFormedError.ID.DOCTYPE_NAME_INVALID, 1, 2);
      });

   });

   describe('makeToken()', () => {

      it('returns a token with the name found in the parsing', () => {
         const parsed = {
            nameChunk: util.makeChunk('elementName', new util.RangeMaker(new EntityLocation())),
         };

         const token = docTypeStart.makeToken(parsed);

         expect(token.name).toEqual('elementName');
      });

      it('returns a token with an empty string if no name was found', () => {
         const parsed = {
            nameChunk: undefined,
         };

         const token = docTypeStart.makeToken(parsed);

         expect(token.name).toEqual('');
      });

   });

});
