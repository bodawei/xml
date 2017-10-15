/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { EntityMetaData, Offset, Range } from '../basic';

import LToken from './LToken.js';
import Extractor from './Extractor.js';
import Segment from './Segment.js';

/**********************************************************************\
 A LTokenSource combines three things, and returns LToken using them.

 1. A hash of extractor definitions (see below) which
    define what this can respond to.
 2. a series of 1 or more strings (with addText()) each of which will
    be turned into a Segment.
 3. A series of calls to extract(), which will used the specified
    extractor to carve off a lToken from the current segment.

 Text and extract calls can be made independently of one another (e.g.
 you can call extract() multipled times before providing any text).
 The text or calls will be queued until they can be used.

 Text can come from different entities. When ever text comes from a
 new entity, a Range must be provided to addText() so it can
 continue to build the correct ranges in the lTokens that are produced.

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

class LTokenSource {

   constructor(extractorInfo, info) {
      if (typeof extractorInfo !== 'object') {
         throw new Error('Must pass a hash of extractor types to constructor functions to LTokenSource().');
      }
      if (!(info instanceof EntityMetaData)) {
         throw new Error('Must pass an EntityMetaData, or something that can become one, into LTokenSource.');
      }

      this._info = info;
      this._extractorInfo = extractorInfo;

      this._segments = [];
      this._extractors = [];

      this._version = this._info.isVersion1dot0 ? 1.0 : 1.1;
      this._lastOffset = undefined;
   }

   get metaData() {
      return this._info;
   }

   addText(text, range) {
      if (this._allTextAdded) {
         throw new Error('Can not add text after endText() has been called.');
      }

      if (text.length === 0) {
         this._orphanedRange = range;
         return;
      }

      const rangeToUse = range || this._orphanedRange;
      delete this._orphanedRange;

      // If this is the first segment we are adding, then make sure lastOffset contains
      // the starting range which will either be the range associated with this
      // first segment, or a default range that starts at 0
      if (this._segments.length === 0) {
         if (rangeToUse) {
            this._lastOffset = rangeToUse.getStartOffset();
         } else {
            this._lastOffset = new Offset(this._info.location, 0, 0, 0);
         }
      }

      this._segments.push(new Segment(text, rangeToUse));

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

      this.extract(type, params, (lToken) => {
         obj[name] = lToken;
      });
   }

   extract(type, params, deliverLToken) {
      if (typeof params === 'function') {
         deliverLToken = params;
         params = undefined;
      }
      const extractorDefinition = this._extractorInfo[type];
      let extractorConstructor;

      if (typeof deliverLToken !== 'function') {
         throw new Error('Must pass a callback function of the form function(lToken|undefined):void to extract().');
      }

      if (typeof extractorDefinition === 'object') {
         extractorConstructor = extractorDefinition.extractorConstructor;

         if (extractorDefinition.params.extractorConstructor) {
            params = new extractorDefinition.params.extractorConstructor(this._version, params);
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
         callback: deliverLToken,
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

         // Extractor has finished extraction (either through SUCCESS or FAILURE)
         this._extractors.shift();
         const results = extractor.finish();
         const ranges = this._computeRanges(results.segments);

         this._restorePartiallyAndUnusedSegments(results.segments);

         // Store where we left off, unless we got no ranges, or we didn't actually consume any segments
         if (results.segments.length > 0 &&
            results.segments[0].segment.index !== extContext.startIndex) {
            this._lastOffset = ranges[ranges.length - 1].getEndOffset();
         }

         this._reportResults(extContext, results.text, results.original, ranges);
      }
   }

   _restorePartiallyAndUnusedSegments(segInfos) {
      const returnedSegments = [];

      for (let index = 0; index < segInfos.length; index++) {
         const info = segInfos[index];

         if (info.segment.text) {
            returnedSegments.push(info.segment);
         }
      }

      this._segments = returnedSegments.concat(this._segments);
   }

   _computeRanges(segInfos) {
      if (segInfos.length === 0) {
         return [];
      }

      const ranges = [];
      let currentRange = new Range(this._lastOffset);  // start off where we left off

      // Just iterate through the segInfos, and accumulate the chars consumed
      for (let index = 0; index < segInfos.length; index++) {
         const info = segInfos[index];
         const segment = info.segment;

         // If we seem to have changed which entity we are reading from, create a new range.
         if (segment.range && !currentRange.location.equals(segment.range.location)) {
            // store the range if it actually has changed
            if (!currentRange.getEndOffset().equals(this._lastOffset)) {
               ranges.push(currentRange);
            }

            currentRange = segment.range.clone();
            currentRange.endIndex = segment.range.startIndex;
            currentRange.endRow = segment.range.startRow;
            currentRange.endColumn = segment.range.startColumn;
         }

         currentRange.endIndex += info.chars;
         currentRange.endRow += info.rows;
         currentRange.endColumn += info.columns;
      }

      ranges.push(currentRange);

      return ranges;
   }

   _reportResults(extractorContext, text, originalText, ranges) {
      if (extractorContext.extractor.state === Extractor.STATE.SUCCESS) {
         extractorContext.callback(new LToken(text, originalText, ranges));
      } else {
         extractorContext.callback();
      }
   }
}

export default LTokenSource;
