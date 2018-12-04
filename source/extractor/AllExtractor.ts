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
         terminatorChars = terminatorChars.replace(/\]/g, '\\]');
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

      // Find all the text in the segment up to terminators or the end of the segment.
      this.terminatorRegEx.lastIndex = segment.index;
      const result = this.terminatorRegEx.exec(segment.text);

      if (result && result[0].length > 0) {
         this._processText(result[0], info);
         segment.index += result[0].length;

         // If we've consumed the segment, update it to reflect that it is consumed
         if (segment.atEnd()) {
            info.segment = { range: segment.range };
         }
      }

      // We're not done with the segument, which means we hit a terminator.
      if (!segment.atEnd()) {
         const nextChar = segment.text[segment.index];

         // Figure out which possible terminators start with the next character
         const terminators = this.terminatorArray.reduce((all, term) => {
            if (term[0] === nextChar) {
               all.push(term);
            }
            return all;
         }, [] as Array<string>);

         let matcher;

         // Set up a sub-matcher to determine which terminator we matched.
         if (terminators.length > 1) {
            matcher = new MultiMatchExtractor(this._version, terminators);
         } else {
            matcher = new MatchExtractor(this._version, terminators[0]);
         }

         // And make this a peek so we don't consume it.
         this._terminatorMatcher = new PeekExtractor(this._version, matcher);
         this._processTerminatorMatcher(segment);
      }
   }

   finish() {
      // If we still have a terminator matcher, we are in error or working state.
      if (this._terminatorMatcher) {
         const result = this._terminatorMatcher.finish();
         const terminatorStatus = this._terminatorMatcher.state;
         delete this._terminatorMatcher;

         if (terminatorStatus !== Extractor.STATE.SUCCESS) {
            result.segments.shift();
            result.segments.unshift(this._segInfo[this._segInfo.length - 1]);

            // Add all the segments, since we didn't use them after all.
            for (const info of result.segments) {
               this.addRemainderOfSegment(info);
            }
         }
      }

      this.state = this._text.length > 0 ? Extractor.STATE.SUCCESS : Extractor.STATE.FAILURE;

      return this._finish();
   }

   private addRemainderOfSegment(info: SegmentInfo): void {
      const segment: Segment = info.segment as Segment;
      const remainderOfSegment = segment.text.substr(segment.index)

      this._processText(remainderOfSegment, info);
      segment.index = segment.text.length;
   }

   // Try to match the terminator, using the specified segment.
   // Remember, the terminator might span multiple segments, so it may take a couple
   // iterations to do this.
   _processTerminatorMatcher(segment: Segment) {
      this._terminatorMatcher!.process(segment); // typeHack

      switch (this._terminatorMatcher!.state) {
         case Extractor.STATE.WORKING:
            // Not done (and evidently reached the end of the segment)
            break;
         case Extractor.STATE.SUCCESS:
            // Or we matched the terminator, in which case we're done.
            this._terminatorMatcher!.finish();
            delete this._terminatorMatcher;
            this.state = Extractor.STATE.SUCCESS;
            break;
         default:
            // Or we didn't find a terminator afterall.
            this._cleanupTerminatorMatcher();
            break;
      }
   }

   _cleanupTerminatorMatcher() {
      const result = this._terminatorMatcher!.finish(); // typeHack
      delete this._terminatorMatcher;
      const lastInfo = this._segInfo.pop();

      // We now know that the next character was a false match. So, skip over the character
      // and re-process the segment we just saw.
      this._addCharAndContinue(lastInfo!.segment as Segment, lastInfo!); // typeHack
      this.process(lastInfo!.segment as Segment); // typeHack

      // Note that we might be at this point in this routine many times.

      const newLastInfo = this._segInfo[this._segInfo.length - 1];
      newLastInfo.chars += lastInfo!.chars;

      if (newLastInfo.rows !== 0) {
         newLastInfo.rows += lastInfo!.rows;
      } else {
         newLastInfo.columns += lastInfo!.columns;
      }

      // Now reprocess all the segments that might have been passed to the terminatorMatcher
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
