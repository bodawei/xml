/* Copyright ® 2017 by David John Burrowes. All rights reserved. */

'use strict';

const Chunk = require('./Chunk.js');
const EntityMetaData = require('../shared/EntityMetaData.js');
const Extractor = require('./Extractor.js');
const Range = require('./Range.js');
const Segment = require('./Segment.js');

class ChunkSource {

   /*
     extractors is a hash, with keys being a type of extractor,
     and the value being one of the following:
         name: ConstructorFunction
         name: {
            extractor: ConstructorFunction
            subType: name
         }
   */
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

      this._segments.push(new Segment(text, range || this._orphanedRange));

      this._resumeOperation();
   }

   endText() {
      this._allTextAdded = true;
      this._resumeOperation();
   }

   extract(type, deliverChunk, params) {
      const extractorConstructor = this._extractorInfo[type];

      if (!extractorConstructor) {
         throw new Error(`"${type}" is not a known extractor type.`);
      }
      if (typeof deliverChunk !== 'function') {
         throw new Error('Must pass a callback function of the form function(chunk|undefined):void to extract().');
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
            extractor.process(nextSegment);
         } else {
            extractor.done();
         }

         if (extractor.state === Extractor.STATE.WORKING) {
            continue;
         } else {
            this._extractors.shift();
         }

         let chunk;
         const results = extractor.getExtraction();
         const segInfo = results.segments;
         const ranges = [];
         const returnedSegments = [];
         let current;

         for (let index = 0; index < segInfo.length; index++) {
            const item = segInfo[index];

            if (item.segment.text) {
               returnedSegments.push(item.segment);
            } else {
               let range = item.segment.range;

               if (!range) {
                  if (current) {
                     range = current;
                  } else {
                     range = this._lastRange;
                  }
               }

               if (!current || current.location !== range.location) {
                  current = new Range(range.location, range.startIndex, range.startRow, range.startColumn,
                     range.startIndex, range.startRow, range.startColumn);
                  ranges.push(current);
               }

               current.endIndex += item.chars;
               current.endRow += item.rows;
               current.endColumn += item.columns;
            }
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

            // if startseg and index have not changed, then don't do this
//               if (!(extractor.extractor instanceof Peek)) {
//                  this._lastRange = current;
//               }

//            delete this._didReturn;

//         if (extractor.extractor.unusedSegments.length > 0) {
//            const segmentArray = extractor.extractor.unusedSegments;
//            if (segmentArray[segmentArray.length - 1] === this._segments[0]) {
//               this._segments.shift();
//            }
//            this._segments = segmentArray.concat(this._segments);
//            extractor.extractor.unusedSegments = [];
//         }

//      if (typeof extractor === 'object') {
//         params = this._prepParams(extractor, params);
//         extractor = extractor.extractor;
//      }
//
//            this._addExtractor(new Peek(this, new CharExtractor(this)), deliverChunk);
//            const spaceTerminators = this._version === 1.0 ? SPACE_TERMINATORS_10 : SPACE_TERMINATORS_11;
//            this._addExtractor(new AllExtractor(this, params, spaceTerminators), deliverChunk);

//            this._addExtractor(new AllExtractor(this, params), deliverChunk);
//            this._addExtractor(new Peek(this, new MatchExtractor(this, params), true), deliverChunk);
//            this._addExtractor(new MultiMatchExtractor(this, [ '<!--', '<?', '<!', '</', '&', '<' ]), deliverChunk);
//            this._addExtractor(new MultiMatchExtractor(this, [ ']]>', ']' ]), deliverChunk);

//   _prepParams(extractorInfo, params) {
//      const type = extractorInfo.subType;
//
//      if (!this._extractors[type]) {
//         // throw some error
//      }
//
//      const extractor = this._extractors[type];
//
//      if (typeof extractor === 'object') {
//         params = this._prepParams(extractor, params);
//         extractor = extractor.extractor;
//      }
//
//      return extractor;
//   }
