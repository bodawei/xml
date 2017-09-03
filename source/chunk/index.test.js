/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

const Chunk = require('../chunk/Chunk.js');
const Range = require('../basic/Range.js');

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
