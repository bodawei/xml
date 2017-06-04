/* Copyright ® 2017 by David John Burrowes. All rights reserved. */

'use strict';

const EntityMetaData = require('../shared/EntityMetaData.js');
const Range = require('../Basic/Range.js');

const Chunk = require('./Chunk.js');
const Extractor = require('./Extractor.js');
const Segment = require('./Segment.js');

/*
  extractors is a hash, with keys being a type of extractor,
  and the value being one of the following:
      name: ConstructorFunction
      name: {
         extractor: ConstructorFunction
         subType: name
      }
*/
class ChunkSource {

   constructor(extractorInfo, info) {
      if (typeof extractorInfo !== 'object') {
         throw new Error('Must pass a hash of extractor types to constructor functions to ChunkSource().');
      }
      if (!(info instanceof EntityMetaData)) {
         throw new Error('Must pass an EntityMetaData, or something that can become one, into ChunkSource.');
      }

      this._info = info;
      this._extractorInfo = extractorInfo;

      this._segments = [];
      this._extractors = [];

      this._version = this._info.isVersion1dot0 ? 1.0 : 1.1;

      this._lastRange = new Range(info.location, 0, 0, 0, 0, 0, 0);
   }

   addText(text, range) {
      if (this._allTextAdded) {
         throw new Error('Can not add text after endText() has been called.');
      }

      if (text.length === 0) {
         this._orphanedRange = range;
         return;
      }

      if (range) {
         range.endIndex = range.startIndex;
         range.endRow = range.startRow;
         range.endColumn = range.startColumn;
      }

      this._segments.push(new Segment(text, range || this._orphanedRange));
      delete this._orphanedRange;

      this._resumeOperation();
   }

   endText() {
      this._allTextAdded = true;
      this._resumeOperation();
   }

   extractToObject(type, params, obj, name) {
      this.extract(type, params, (chunk) => {
         obj[name] = chunk;
      });
   }

   extract(type, params, deliverChunk) {
      if (typeof params === 'function') {
         deliverChunk = params;
         params = undefined;
      }
      const extractorDefinition = this._extractorInfo[type];
      let extractorConstructor;

      if (!extractorDefinition) {
         throw new Error(`"${type}" is not a known extractor type.`);
      }
      if (typeof deliverChunk !== 'function') {
         throw new Error('Must pass a callback function of the form function(chunk|undefined):void to extract().');
      }

      /*
       * The extractor definition can be:
       *    * An extractor constructor function
       *    * an object like: {
       *       extractorConstructor,
       *       params (overwride whatever passed to this function)
       *      }
       *    * an object like: {
       *       extractorConstructor,
       *       params: { extractorConstructor }
       *      }
       */
      if (typeof extractorDefinition === 'object') {
         extractorConstructor = extractorDefinition.extractorConstructor;

         if (extractorDefinition.params.extractorConstructor) {
            params = new extractorDefinition.params.extractorConstructor(params);
         } else {
            params = extractorDefinition.params;
         }
      } else {
         extractorConstructor = extractorDefinition;
      }

      const instance = new extractorConstructor(this._version, params);

      this._extractors.push({
         extractor: instance,
         callback: deliverChunk
      });

      this._resumeOperation();
   }

   _resumeOperation() {
      while ((this._segments.length !== 0 || this._allTextAdded) && this._extractors.length > 0) {
         const extContext = this._extractors[0];
         const extractor = extContext.extractor;
         const nextSegment = this._segments.shift();

         if (nextSegment) {
            if (extContext.startIndex === undefined) {
               extContext.startIndex = nextSegment.index;
            }
            extractor.process(nextSegment);

            if (extractor.state === Extractor.STATE.WORKING) {
               continue;
            }
         }

         const results = extractor.finish();

         this._extractors.shift();

         const segInfo = results.segments;
         const ranges = [];
         const returnedSegments = [];
         let currentRange;
         let unchanged;

         if (segInfo.length === 0) {
            unchanged = true;
         } else {
            unchanged = segInfo[0].segment.index === extContext.startIndex;
            currentRange = segInfo[0].segment.range || this._lastRange;
            currentRange = currentRange.clone();

            ranges.push(currentRange);
         }

         for (let index = 0; index < segInfo.length; index++) {
            const item = segInfo[index];

            if (item.segment.text) {
               returnedSegments.push(item.segment);
            }

            let range = item.segment.range;

            if (!range) {
               range = currentRange;
            }

            if (!currentRange || currentRange.location !== range.location) {
               currentRange = new Range(range.location, range.startIndex, range.startRow, range.startColumn,
                  range.startIndex, range.startRow, range.startColumn);
               ranges.push(currentRange);
            }

            currentRange.endIndex += item.chars;
            currentRange.endRow += item.rows;
            currentRange.endColumn += item.columns;
         }

         if (returnedSegments.length > 0) {
            this._segments = returnedSegments.concat(this._segments);
         }

         if (!unchanged) {
            this._lastRange = ranges[ranges.length - 1].clone();
            this._lastRange.startIndex = this._lastRange.endIndex;
            this._lastRange.startRow = this._lastRange.endRow;
            this._lastRange.startColumn = this._lastRange.endColumn;
         }

         if (extractor.state === Extractor.STATE.SUCCESS) {
            extContext.callback(new Chunk(results.text, results.original, ranges));
         } else {
            extContext.callback();
         }
      }
   }
}

module.exports = ChunkSource;
