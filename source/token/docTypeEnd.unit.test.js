/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { Range, EntityLocation } from '../basic';
import { MockErrorCollector } from '../basic/test';
import { Chunk } from '../chunk';
import chunkUtil from '../chunk/test';
import { WellFormedError } from '../error';

import docTypeEnd from './docTypeEnd.js';

describe('docTypeEnd', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;
      let sourceRm;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         sourceRm = new chunkUtil.RangeMaker(new EntityLocation());
      });

      it('returns after parsing a mundane "]>"', () => {
         mockSource = new chunkUtil.MockChunkSource([
            chunkUtil.makeChunk(']', sourceRm),
            undefined,
            chunkUtil.makeChunk('>', sourceRm),
         ]);

         docTypeEnd.parse(mockSource, callback);

         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'DOCTYPE_END',
            closeInternalSubsetChunk: new Chunk(']', ']', new Range(new EntityLocation(), 0, 0, 0, 1, 0, 1)),
            postCloseInternalSubsetSpaceChunk: undefined,
            closeChunk: new Chunk('>', '>', new Range(new EntityLocation(), 1, 0, 1, 2, 0, 2)),
         });
      });

      it('returns after parsing a "]\\t>"', () => {
         mockSource = new chunkUtil.MockChunkSource([
            chunkUtil.makeChunk(']', sourceRm),
            chunkUtil.makeChunk('\t', sourceRm),
            chunkUtil.makeChunk('>', sourceRm),
         ]);

         docTypeEnd.parse(mockSource, callback);

         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'DOCTYPE_END',
            closeInternalSubsetChunk: new Chunk(']', ']', new Range(new EntityLocation(), 0, 0, 0, 1, 0, 1)),
            postCloseInternalSubsetSpaceChunk: new Chunk('\t', '\t', new Range(new EntityLocation(), 1, 0, 1, 2, 0, 2)),
            closeChunk: new Chunk('>', '>', new Range(new EntityLocation(), 2, 0, 2, 3, 0, 3)),
         });
      });

      it('returns after parsing an incomplete input', () => {
         mockSource = new chunkUtil.MockChunkSource([
            undefined, 
            undefined,
            undefined,
         ]);

         docTypeEnd.parse(mockSource, callback);

         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'DOCTYPE_END',
            closeInternalSubsetChunk: undefined,
            postCloseInternalSubsetSpaceChunk: undefined,
            closeChunk: undefined,
         });
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let sourceRm;
      let parsed;
      let startParsed;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();

         sourceRm = new chunkUtil.RangeMaker(new EntityLocation());
         startParsed = {
            startInternalSubsetChunk: chunkUtil.makeChunk('[', sourceRm),
         };
         parsed = {
            closeInternalSubsetChunk: chunkUtil.makeChunk(']', sourceRm),
            postCloseInternalSubsetSpaceChunk: chunkUtil.makeChunk(' ', sourceRm),
            closeChunk: chunkUtil.makeChunk('>', sourceRm),
         };
      });

      it('returns an an error collector', () => {
         const errors = docTypeEnd.checkWellFormed(parsed, startParsed, mockErrorCollector);

         expect(errors).toEqual(mockErrorCollector);
      });

      it('returns no errors if no problems ', () => {
         const errors = docTypeEnd.checkWellFormed(parsed, startParsed, mockErrorCollector);

         expect(errors.report).not.toHaveBeenCalled();
      });

      it('reports an error if there is no close', () => {
         parsed.closeChunk = undefined;

         docTypeEnd.checkWellFormed(parsed, startParsed, mockErrorCollector);

         expect(mockErrorCollector.report).toHaveBeenCalledWith(WellFormedError.ID.DOCTYPE_NO_CLOSE);
      });

      it('reports an error if there is a "]", but there was no opening "["', () => {
         delete startParsed.startInternalSubsetChunk;

         docTypeEnd.checkWellFormed(parsed, startParsed, mockErrorCollector);

         expect(mockErrorCollector.report).toHaveBeenCalledWith(WellFormedError.ID.DOCTYPE_INVALID_SUBSET_CLOSE);
      });

   });

   describe('makeToken()', () => {
      let sourceRm;

      beforeEach(() => {
         sourceRm = new chunkUtil.RangeMaker(new EntityLocation());
      });

      it('returns a token given a good parsing', () => {
         const parsed = {
            closeInternalSubsetChunk: chunkUtil.makeChunk(']', sourceRm),
            postCloseInternalSubsetSpaceChunk: chunkUtil.makeChunk(' ', sourceRm),
            closeChunk: chunkUtil.makeChunk('>', sourceRm),
         };

         const token = docTypeEnd.makeToken(parsed);

         expect(token instanceof docTypeEnd.Token).toEqual(true);
      });

      it('returns a token given an empty parsing', () => {
         const parsed = {
            closeInternalSubsetChunk: undefined,
            postCloseInternalSubsetSpaceChunk: undefined,
            closeChunk: undefined,
         };
         const token = docTypeEnd.makeToken(parsed);

         expect(token instanceof docTypeEnd.Token).toEqual(true);
      });

   });

});
