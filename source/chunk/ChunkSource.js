/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { EntityMetaData, Range } from '../basic';

import Chunk from './Chunk.js';
import Extractor from './Extractor.js';
import Segment from './Segment.js';

/**********************************************************************\
 A ChunkSource combines three things, and returns Chunks using them.

 1. A hash of extractor definitions (see below) which
    define what this can respond to.
 2. a series of 1 or more strings (with addText()) each of which will
    be turned into a Segment.
 3. A series of calls to extract(), which will used the specified
    extractor to carve off a chunk from the current segment.

 Text and extract calls can be made independently of one another (e.g.
 you can call extract() multipled times before providing any text).
 The text or calls will be queued until they can be used.

 Text can come from different entities. When ever text comes from a
 new entity, a Range must be provided to addText() so it can
 continue to build the correct ranges in the chunks that are produced.

 Extractor protocol:
 Crucially, this defines a very strict pattern of interaction with
 each extractor:
   * Extractor.process() will never be passed a zero-length segment.
   * Extractor.process() will never be passed the same segment twice.
   * Extractor.finish() will be called once Extractor.state is no
     longer WORKING, or when end of input is reached.
   * Extractors must update Extractor.state after each call to
     process() so this can determine whether to keep feeding it
     segments or call finish()
   * finish() must return a data structure containing:
       text : The final text extracted
       originalText: The text extracted, before newline normalization
       segments: An array of information about each segment that this
          had been passed.  Each entry must have:
             chars: The number of characters consumed from this segment
             rows:  The number of newlines encountered
             columns: The number of chars after the last newline
             segment: Either the segment this had been passed, if this
                did not fully consume it, OR a simple hash with just
                the range from the segment that was fully consumed.

 Extractor definitions:
 There are three ways to specify an extractor:
   name: An extractor constructor function
   name: {
      extractorConstructor: An Extractor constructor,
      params: A value to be passed to the extractorConstructor
         (this overrides whatever might be passed to the
         extract functions)
   }
   name: {
      extractorConstructor: An Extractor constructor,
      params: {
         extractorConstructor: : An Extractor constructor which
            will receive the params passed to the extract function
   }

 The second is used to provide a predefined way of calling an
 extractor like MultiMatchExtractor.
 The third is primarily for use where the first extractorConstructor
 is the PeekExtractor, which simply wraps the next extractor.
\**********************************************************************/

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
      if (typeof name === 'undefined') {
         name = obj;
         obj = params;
         params = undefined;
      }

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

      if (typeof deliverChunk !== 'function') {
         throw new Error('Must pass a callback function of the form function(chunk|undefined):void to extract().');
      }

      if (typeof extractorDefinition === 'object') {
         extractorConstructor = extractorDefinition.extractorConstructor;

         if (extractorDefinition.params.extractorConstructor) {
            params = new extractorDefinition.params.extractorConstructor(params);
         } else {
            params = extractorDefinition.params;
         }
      } else {
         // put this check here to make code coverage happier. babel turns typeof object into a check for undef.
         if (!extractorDefinition) {
            throw new Error(`"${type}" is not a known extractor type.`);
         }
         extractorConstructor = extractorDefinition;
      }

      const instance = new extractorConstructor(this._version, params);

      this._extractors.push({
         extractor: instance,
         callback: deliverChunk,
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
