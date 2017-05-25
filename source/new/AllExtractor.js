/* Copyright ® 2017 by David John Burrowes. All rights reserved. */

'use strict';

const Extractor = require('./Extractor.js');
const MultiMatchExtractor = require('./MultiMatchExtractor.js');
const PeekExtractor = require('./PeekExtractor.js');

//const SPACE_TERMINATOR_CHARS_10 = [ ' ', '\t', '\n', '\r' ];
//const SPACE_TERMINATOR_CHARS_11 = [ ' ', '\t', '\n', '\r', '\u0085', '\u2028' ];

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

//      const spaceTerminatorChars = this._version === 1.0 ? SPACE_TERMINATOR_CHARS_10 :
//         SPACE_TERMINATOR_CHARS_11;

      this.terminatorArray = this.terminators;
//      if (this.spaceTerminators.length > 0) {
//         this.terminatorArray = spaceTerminatorChars.concat(this.terminators);  // ick
//      }
   }

   process(segment) {
      if (this._terminatorMatcher) {
         this._processTerminatorMatcher(segment);
         return;
      }

      const info = this._makeInfo(segment);
      this._segInfo.push(info);
      this.terminatorRegEx.lastIndex = segment.index;
      const result = this.terminatorRegEx.exec(segment.text);
      // should do what we do in chars

      if (result && result[0].length > 0) {
         this._processText(result[0], info);
         segment.index += result[0].length;
         if (segment.atEnd()) {
            info.segment = { range: segment.range };
         }
      }

      if (!segment.atEnd()) {
         this._terminatorMatcher =
            new PeekExtractor(this.context, new MultiMatchExtractor(this.context, this.terminatorArray));
         this._processTerminatorMatcher(segment);
      }
   }

   finish() {
      if (this._terminatorMatcher) {
         this._cleanupTerminatorMatcher();
      } else {
         this.state = this._text.length > 0 ? Extractor.STATE.SUCCESS : Extractor.STATE.FAILURE;
      }

      return this._finish();
   }

   _processTerminatorMatcher(segment) {
      this._terminatorMatcher.process(segment);
      if (this._terminatorMatcher.state === Extractor.STATE.WORKING) {
         return;
      }

      if (this._terminatorMatcher.state === Extractor.STATE.SUCCESS) {
         delete this._terminatorMatcher;
         this.state = Extractor.STATE.SUCCESS;
      } else {
         this._cleanupTerminatorMatcher();
      }
   }

   _cleanupTerminatorMatcher() {
      const result = this._terminatorMatcher.finish();
      delete this._terminatorMatcher;
      const lastInfo = this._segInfo.pop();

      this._addCharAndContinue(lastInfo.segment, lastInfo);
      this.process(lastInfo.segment);
      const newLastInfo = this._segInfo[this._segInfo.length - 1];
      newLastInfo.chars += lastInfo.chars;

      if (newLastInfo.rows !== 0) {
         newLastInfo.rows += lastInfo.rows;
      } else {
         newLastInfo.columns += lastInfo.columns;
      }

      result.segments.shift();
      result.segments.forEach((info) => {
         this.process(info.segment);
      });
   }

   _addCharAndContinue(origSegment, info) {
      this._processText(origSegment.text[origSegment.index], info);
      origSegment.index ++;
   }

}

module.exports = AllExtractor;
