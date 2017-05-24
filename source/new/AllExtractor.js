/* Copyright ® 2017 by David John Burrowes. All rights reserved. */

'use strict';

const Extractor = require('./Extractor.js');
const MultiMatchExtractor = require('./MultiMatchExtractor.js');
const PeekExtractor = require('./PeekExtractor.js');

const SPACE_TERMINATOR_CHARS_10 = [ ' ', '\t', '\n', '\r' ];
const SPACE_TERMINATOR_CHARS_11 = [ ' ', '\t', '\n', '\r', '\u0085', '\u2028' ];

const regexMemo = {};

/**********************************************************************\
 A AllExtractor will look for the specified candidate string starting
\**********************************************************************/

class AllExtractor extends Extractor {
   constructor(context, terminators, spaceTerminators = []) {
      super(context);
      this.spaceTerminators = spaceTerminators;
      this.terminators = terminators;

      const terminatorCharsArray = this.spaceTerminators.concat(this.terminators.map((term) => (term[0])));
      const terminatorChars = terminatorCharsArray.join('');
      this.terminatorRegEx = regexMemo[terminatorChars];

      if (!this.terminatorRegEx) {
         const regexString = '[^' + terminatorChars + ']*';
         this.terminatorRegEx = new RegExp(regexString, 'g');
         regexMemo[terminatorChars] = this.terminatorRegEx;
      }

      const spaceTerminatorChars = this._version === 1.0 ? SPACE_TERMINATOR_CHARS_10 :
         SPACE_TERMINATOR_CHARS_11;

      this.terminatorArray = this.terminators;
      if (this.spaceTerminators.length > 0) {
         this.terminatorArray = spaceTerminatorChars.concat(this.terminators);  // ick
      }
   }

   process(segment) {
      const info = this._makeInfo(segment);
      this._segInfo.push(info);
      if (this._matchTerminator) {
         this._processSubExtractor(segment);
         return;
      }

      this.terminatorRegEx.lastIndex = segment.index;
      const result = this.terminatorRegEx.exec(segment.text);
      // should do what we do in chars

      if (result && result[0].length > 0) {
         this._processText(result[0], info);
         segment.index += result[0].length;
      }

      if (!segment.atEnd()) {
         this._matchTerminator =
            new PeekExtractor(this.context, new MultiMatchExtractor(this.context, this.terminatorArray));
         this._processSubExtractor(segment);
      }
   }

   finish() {
      if (this._matchTerminator) {
         // we might have succeeded nope
         // We found no match up to this point. so ask peek to wrap up and continue
         //mthis.subExtractor.finish();
         //we need to continue consuming the segment
         this.state = Extractor.STATE.FAILURE;
         delete this._matchTerminagor;
      } else {
         this.state = Extractor.STATE.SUCCESS;
      }

      return this._finish();
   }

   _processSubExtractor(segment) {
      this.subExtractor.process(segment);
      if (this.subExtractor.state === Extractor.STATE.WORKING) {
         return;
      }

      if (this.subExtractor.state === Extractor.STATE.SUCCESS) {
         delete this.subExtractor;
         this.state = Extractor.STATE.SUCCESS;
      } else {
         delete this.subExtractor;
         this._addCharAndContinue(segment);
         // need to somehow return the segments that were passed to subextractor
      }
   }

   _addCharAndContinue(origSegment) {
      this._processText(origSegment.text[origSegment.index]);
      origSegment.index ++;
   }

}

module.exports = AllExtractor;
