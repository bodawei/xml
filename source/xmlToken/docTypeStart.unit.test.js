/* Copyright ® 2017 by 柏大衛. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const Chunk = require('../chunk/Chunk.js');
const Range = require('../basic/Range.js');
const EntityLocation = require('../basic/EntityLocation.js');

import docTypeStart from './docTypeStart.js';

describe('docTypeStart', () => {
   let mockSource;
   let callback;
   let sourceRm;

   beforeEach(() => {
      callback = jasmine.createSpy('callbackSpy');
      mockSource = new MockChunkSource([
         new Chunk('a', 'a', new Range(1, 0, 0, 0, 1, 0, 1)),
         new Chunk(' ', ' ', new Range(1, 0, 0, 0, 1, 0, 1)),
         undefined,
         undefined
      ]);
      sourceRm = new RangeMaker(new EntityLocation());
   });

   describe('parse()', () => {

      it('returns simple values', () => {
         mockSource = new MockChunkSource([
            makeChunk('a', sourceRm),
            makeChunk(' ', sourceRm),
            undefined,
            undefined
         ]);

         docTypeStart.parse(mockSource, {}, callback);

         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith({
            type: 'DOCTYPE_START',
            openChunk: undefined,
            postOpenSpaceChunk: undefined,
            declTypeChunk: undefined,
            postDeclTypeSpaceChunk: undefined,
            nameChunk: new Chunk('a', 'a', new Range(new EntityLocation(), 0, 0, 0, 1, 0, 1)),
            postNameSpaceChunk: new Chunk(' ', ' ', new Range(new EntityLocation(), 1, 0, 1, 2, 0, 2)),
            postExternalIdSpaceChunk: undefined,
            startInternalSubsetChunk: undefined
         });
      });

      it('uses whatever preliminary declaration values were passed in', () => {
         docTypeStart.parse(mockSource, {
            openChunk: 'a',
            postOpenSpaceChunk: 'b',
            declTypeChunk: 'c',
            postDeclTypeSpaceChunk: 'd',
         }, callback);

         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({
            openChunk: 'a',
            postOpenSpaceChunk: 'b',
            declTypeChunk: 'c',
            postDeclTypeSpaceChunk: 'd'
         }));
      });

      it('returns all values', () => {
         const expectedRm = new RangeMaker(new EntityLocation());
         const declStart = {
            openChunk: makeChunk('<!', sourceRm),
            postOpenSpaceChunk: makeChunk(' ', sourceRm),
            declTypeChunk: makeChunk('DOCTYPE', sourceRm),
            postDeclTypeSpaceChunk: makeChunk('\t', sourceRm),
         };

         mockSource = new MockChunkSource([
            makeChunk('elemType', sourceRm),
            makeChunk('  ', sourceRm),
            makeChunk('\t', sourceRm),
            makeChunk('[', sourceRm)
         ]);

         docTypeStart.parse(mockSource, declStart, callback);

         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith({
            type: 'DOCTYPE_START',
            openChunk: makeChunk('<!', expectedRm),
            postOpenSpaceChunk: makeChunk(' ', expectedRm),
            declTypeChunk: makeChunk('DOCTYPE', expectedRm),
            postDeclTypeSpaceChunk: makeChunk('\t', expectedRm),
            nameChunk: makeChunk('elemType', expectedRm),
            postNameSpaceChunk: makeChunk('  ', expectedRm),
            postExternalIdSpaceChunk: makeChunk('\t', expectedRm),
            startInternalSubsetChunk: makeChunk('[', expectedRm)
         });
      });

   });

});

function makeChunk(text, rangeMaker) {
   return new Chunk(text, text, rangeMaker.makeRange(text));
}

class RangeMaker {

   constructor(location) {
      this.location = location;
      this.index = 0;
      this.column = 0;
      this.row = 0;
   }

   makeRange(text) {
      const oldIndex = this.index;
      const oldRow = this.row;
      const oldColumn = this.column;

      this.index += text.length;
      this.column += text.length;

      return new Range(this.location, oldIndex, oldRow, oldColumn, this.index, this.row, this.column);
   }
}

class MockChunkSource {

   constructor(returnValues) {
      this.returnValues = returnValues.concat([ '<< fewer values provided to MockChunkSource than were needed >>' ]);
      this.queuedCalls = [];

      this.extractToObject = spyOn(this, 'extractToObject').and.callThrough();
      this.extract = spyOn(this, 'extract').and.callThrough();
   }

   extractToObject(type, params, obj, name) {
      this.queuedCalls.push({
         type,
         params,
         obj,
         name
      });
   }

   extract(type, params, callback) {
      this.queuedCalls.push({
         callback
      });
   }

   respondInAsyncTime() {
      this.queuedCalls.forEach((qc) => {
         if (qc.obj) {
            qc.obj[qc.name] = this.returnValues.shift();
         } else if (qc.callback) {
            qc.callback(this.returnValues.shift())
         } else {
            throw new Error('Got an unknown queued value in MockChunkSource: ', JSON.stringify(qc));
         }
      });
   }
}
