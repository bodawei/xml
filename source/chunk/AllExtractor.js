/* Copyright ® 2017 by David John Burrowes. All rights reserved. */

'use strict';

const Extractor = require('./Extractor.js');
const MatchExtractor = require('./MatchExtractor.js');
const MultiMatchExtractor = require('./MultiMatchExtractor.js');
const PeekExtractor = require('./PeekExtractor.js');

const regexMemo = {};

/**********************************************************************\
 A AllExtractor will look for the specified candidate string starting
\**********************************************************************/

class AllExtractor extends Extractor {
   constructor(version, terminators = []) {
      super(version);

      const terminatorChars = terminators.map((term) => term[0]).join('');
      this.terminatorRegEx = regexMemo[terminatorChars];

      if (!this.terminatorRegEx) {
         const regexString = '[^' + terminatorChars + ']*';
         this.terminatorRegEx = new RegExp(regexString, 'g');
         regexMemo[terminatorChars] = this.terminatorRegEx;
      }

      this.terminatorArray = terminators;
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

      if (result && result[0].length > 0) {
         this._processText(result[0], info);
         segment.index += result[0].length;
         if (segment.atEnd()) {
            info.segment = { range: segment.range };
         }
      }

      if (!segment.atEnd()) {
         const nextChar = segment.text[segment.index];

         const terminators = this.terminatorArray.reduce((all, term) => {
            if (term[0] === nextChar) {
               all.push(term);
            }
            return all;
         }, []);

         let matcher;

         if (terminators.length > 1) {
            matcher = new MultiMatchExtractor(this._version, terminators);
         } else {
            matcher = new MatchExtractor(this._version, terminators[0]);
         }

         this._terminatorMatcher = new PeekExtractor(this._version, matcher);
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
         this._terminatorMatcher.finish();
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
