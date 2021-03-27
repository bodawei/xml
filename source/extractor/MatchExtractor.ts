/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import Extractor from './Extractor';
import {PseudoSpace, DONE_SEGMENT, PSEUDO_SPACE, Segment} from './Segment';

/**********************************************************************\
 A MatchExtractor will look for the specified candidate string starting
 at the index in the first segment this is passed until either the
 candidate is found, or something is found that does not match the
 part of the candidate being examined at that time.

 Note: This is an optimistic extractor, which means that it gathers
 text and segments as long as it thinks it is potentially going to find
 the candidate text, only "unwinding" at the end if it does not find
 that.  Thus, if asked to find "supercalifragilistic" across [s][u][p]
 etc, it will add info's unti it finds a non-match, in which case it
 will clear those out.
\**********************************************************************/

class MatchExtractor extends Extractor {
   private _candidate: string;
   private _candIndex: number;
   private _firstSegment: Segment | PseudoSpace | undefined;
   private _firstIndex: number;

   /* istanbul ignore next */ // Istanbul is confused by node transpilation
   constructor(version: number, processLineEndings: boolean, candidate: string) {
      super(version, processLineEndings);

      this._candidate = candidate;

      this._candIndex = 0;
      this._firstIndex = 0;
      this._firstSegment = undefined;
   }

   process(segment: Segment | PseudoSpace) {
      const info = this.makeInfo(segment);
      this._firstSegment = this._firstSegment || segment;
      this._firstIndex = this._firstIndex || segment.index;
      this.segInfo.push(info);

      if (segment.type === PSEUDO_SPACE) {
         const candText = this._candidate.substr(this._candIndex, 1);

         if (candText === ' ') {
            this.processPseudoText();
            this._candIndex += 1;

            if (this._candIndex >= this._candidate.length) {
               this.cleanupOnSuccess();
            }
         } else {
            this.state = Extractor.STATE.FAILURE;
         }

         return;
      }

      const segmentRemainder = segment.text.length - segment.index;
      const candidateRemainder = this._candidate.length - this._candIndex;
      const lengthToCompare = Math.min(segmentRemainder, candidateRemainder);
      const segmentText = segment.text.substr(segment.index, lengthToCompare);
      const candText = this._candidate.substr(this._candIndex, lengthToCompare);

      if (segmentText !== candText) {
         this.state = Extractor.STATE.FAILURE;
      } else {
         this.processText(segmentText, info);

         this._candIndex += lengthToCompare;
         segment.index += lengthToCompare;

         if (this._candIndex >= this._candidate.length) {
            this.cleanupOnSuccess();
         }
      }
   }

   private cleanupOnSuccess() {
      // Remove the segments that we are now certain we have consumed.
      this.segInfo.forEach((info) => {
         if (info.segment.type === PSEUDO_SPACE) {
            info.segment = { type: DONE_SEGMENT };
            return;
         }
         if ((info.segment as Segment).atEnd()) { // typeHack
            info.segment = { type: DONE_SEGMENT, range: info.segment.range };
         }
      });
      this.state = Extractor.STATE.SUCCESS;
   }

   finish() {
      switch (this.state) {
         case Extractor.STATE.WORKING:
         case Extractor.STATE.FAILURE:
            this.state = Extractor.STATE.FAILURE;
            this.text = [];
            this.normalizedText = [];

            if (this._firstSegment) {
               this._firstSegment.index = this._firstIndex;
            }

            this.segInfo.forEach((info) => {
               info.chars = 0;
               info.columns = 0;
               info.rows = 0;
            });
            return this.innerFinish();
         case Extractor.STATE.SUCCESS:
            return this.innerFinish();
      }
   }

}

export default MatchExtractor;
