/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { Range } from '../basic';

import Chunk from './Chunk.js';

/**********************************************************************\
  Miscellaneous utilities for use in testing.
\**********************************************************************/

/**********************************************************************\
  makeChunk() will return a Chunk using the specified text and
  RangeMaker
\**********************************************************************/

function makeChunk(text, rangeMaker) {
   return new Chunk(text, text, rangeMaker.makeRange(text));
}

/**********************************************************************\
  RangeMaker makes it easy to generate new ranges. Given a string
  it will increment counters it has to produce a Range that comes
  right after the previous one this has returned.  This makes it easy
  to generate ordinary ranges (no newline normalization) in tests.
\**********************************************************************/

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

/**********************************************************************\
  MockChunkSource is passed a set of value to return, and then gathers
  calls that would be made to a ChunkSource and will respond to them
  when respondInAsyncTime() is called. This allows one to simulate
  the asynchronous behavior of a ChunkSource more tersely in tests.
\**********************************************************************/

class MockChunkSource {

   constructor(returnValues) {
      this.returnValues = returnValues.concat([ '<< fewer values provided to MockChunkSource than were needed >>' ]);
      this.queuedCalls = [];

      this.extractToObject = spyOn(this, 'extractToObject').and.callThrough();
      this.extract = spyOn(this, 'extract').and.callThrough();
   }

   extractToObject(type, params, obj, name) {
      if (!name) {
         name = obj;
         obj = params;
         params = undefined;
      }

      this.queuedCalls.push({
         type,
         params,
         obj,
         name,
      });
   }

   extract(type, params, callback) {
      if (!callback) {
         callback = params;
         params = undefined;
      }

      this.queuedCalls.push({
         callback,
      });
   }

   respondInAsyncTime() {
      while (this.queuedCalls.length > 0) {
         const calls = this.queuedCalls;
         this.queuedCalls = [];

         calls.forEach((qc) => {
            if (qc.obj) {
               qc.obj[qc.name] = this.returnValues.shift();
            } else if (qc.callback) {
               qc.callback(this.returnValues.shift());
            } else {
               throw new Error('Got an unknown queued value in MockChunkSource: ', JSON.stringify(qc));
            }
         });
      }
   }
}

module.exports = {
   MockChunkSource,
   RangeMaker,
   makeChunk,
};
