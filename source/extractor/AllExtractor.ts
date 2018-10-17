/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { Extractor, SegmentInfo } from './Extractor';
import MatchExtractor from './MatchExtractor';
import MultiMatchExtractor from './MultiMatchExtractor';
import PeekExtractor from './PeekExtractor';
import Segment from './Segment';

const regexMemo: { [terminators: string]: RegExp } = {};

/**********************************************************************\
 An AllExtractor extracts a SToken from the current position until
 either the end of all input, or one of the specified terminators is
 encountered.

 This uses the MatchExtractor, MultiMatchExtractor and/or PeekExtractor
 to help identify whether this has encountered a terminator.
\**********************************************************************/

class AllExtractor extends Extractor {
   private terminatorRegEx: RegExp;
   private terminatorArray: Array<string>;
   private _terminatorMatcher?: PeekExtractor;

   /* istanbul ignore next */ // Istanbul is confused by node transpilation
   constructor(version: number, terminators: Array<string> = []) {
      super(version);

      let terminatorChars = terminators.map((term) => term[0]).join('');
      this.terminatorRegEx = regexMemo[terminatorChars];

      if (!this.terminatorRegEx) {
         terminatorChars = terminatorChars.replace(']', '\\]');
         const regexString = '[^' + terminatorChars + ']*';
         this.terminatorRegEx = new RegExp(regexString, 'g');
         regexMemo[terminatorChars] = this.terminatorRegEx;
      }

      this.terminatorArray = terminators;
   }

   process(segment: Segment) {
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
         }, [] as Array<string>);

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

   _processTerminatorMatcher(segment: Segment) {
      this._terminatorMatcher!.process(segment); // typeHack
      if (this._terminatorMatcher!.state === Extractor.STATE.WORKING) {
         return;
      }

      if (this._terminatorMatcher!.state === Extractor.STATE.SUCCESS) {
         this._terminatorMatcher!.finish();
         delete this._terminatorMatcher;
         this.state = Extractor.STATE.SUCCESS;
      } else {
         this._cleanupTerminatorMatcher();
      }
   }

   _cleanupTerminatorMatcher() {
      const result = this._terminatorMatcher!.finish(); // typeHack
      delete this._terminatorMatcher;
      const lastInfo = this._segInfo.pop();

      this._addCharAndContinue(lastInfo!.segment as Segment, lastInfo!); // typeHack
      this.process(lastInfo!.segment as Segment); // typeHack
      const newLastInfo = this._segInfo[this._segInfo.length - 1];
      newLastInfo.chars += lastInfo!.chars;

      if (newLastInfo.rows !== 0) {
         newLastInfo.rows += lastInfo!.rows;
      } else {
         newLastInfo.columns += lastInfo!.columns;
      }

      result.segments.shift();
      result.segments.forEach((info) => {
         this.process(info!.segment as Segment); // typeHack
      });
   }

   _addCharAndContinue(origSegment: Segment, info: SegmentInfo) {
      this._processText(origSegment.text[origSegment.index], info);
      origSegment.index ++;
   }

}

export default AllExtractor;
