/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import Extractor, { SegmentInfo } from './Extractor';
import {PseudoSpace, DONE_SEGMENT, PSEUDO_SPACE, Segment} from './Segment';

/**********************************************************************\
 Extract the next character from the specified segment. This seemingly
 trivial extractor gets a bit tricky if there is a \r at the end of one
 segment, since the first character of the next segment might be a \n
 or a \u0085, which means it should be treated as part of the single
 \n that all line endings get turned into. The complexity here comes
 from coping with that situation.
\**********************************************************************/

class CharExtractor extends Extractor {
   private foundCR = false;

   process(segment: Segment  | PseudoSpace): void {
      const info = this.makeInfo(segment);
      this.segInfo.push(info);

      if (segment.type === PSEUDO_SPACE) {
         this.processPseudoText();
         this.state = Extractor.STATE.SUCCESS;
         info.segment = {
            type: DONE_SEGMENT,
         };
         return;
      }

      if (this.foundCR) {
         this._checkEOL(segment, info);
         this.state = Extractor.STATE.SUCCESS;
         return;
      }

      const currentChar = segment.text[segment.index];
      this._incrementSegment(segment, info, currentChar);

      if (!currentChar) {
         return;
      }

      this.processText(currentChar, info);

      if (currentChar === '\r') {
         if (segment.atEnd()) {
            this.foundCR = true;
            return; // We don't know if we're done, so just bail out.
         }
         this._checkEOL(segment, info);
      }

      this.state = Extractor.STATE.SUCCESS;
   }

   finish() {
      this.state = this.text.length > 0 ? Extractor.STATE.SUCCESS : Extractor.STATE.FAILURE;
      return this.innerFinish();
   }

   _incrementSegment(segment: Segment, info: SegmentInfo, foundChar: string): void {
      // do not increment if no character
      if (foundChar) {
         segment.index++;
      }

      if (segment.atEnd()) {
         info.segment = {
            type: DONE_SEGMENT,
            range: segment.range,
         };
      }
   }

   _checkEOL(segment: Segment, info: SegmentInfo): void {
      const candidate = segment.text[segment.index];

      if (candidate === '\n' || (candidate === '\u0085' && this.version === 1.1)) {
         this.text.push(candidate);
         info.chars++;
         this._incrementSegment(segment, info, candidate);
      }
   }

}

export default CharExtractor;
