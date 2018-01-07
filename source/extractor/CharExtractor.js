/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import Extractor from './Extractor.js';

/**********************************************************************\
 Extract the next character from the specified segment. This seemingly
 trivial extractor gets a bit tricky if there is a \r at the end of one
 segment, since the first character of the next segment might be a \n
 or a \u0085, which means it should be treated as part of the single
 \n that all line endings get turned into. The complexity here comes
 from coping with that situation.
\**********************************************************************/

class CharExtractor extends Extractor {

   process(segment) {
      const info = this._makeInfo(segment);
      this._segInfo.push(info);

      if (this._foundCR) {
         this._checkEOL(segment, info);
         this.state = Extractor.STATE.SUCCESS;
         return;
      }

      const currentChar = segment.text[segment.index];
      this._incrementSegment(segment, info, currentChar);

      if (!currentChar) {
         return;
      }

      this._processText(currentChar, info);

      if (currentChar === '\r') {
         if (segment.atEnd()) {
            this._foundCR = true;
            return; // We don't know if we're done, so just bail out.
         }
         this._checkEOL(segment, info);
      }

      this.state = Extractor.STATE.SUCCESS;
   }

   finish() {
      this.state = this._text.length > 0 ? Extractor.STATE.SUCCESS : Extractor.STATE.FAILURE;
      return this._finish();
   }

   _incrementSegment(segment, info, foundChar) {
      // do not increment if no character
      if (foundChar) {
         segment.index ++;
      }

      if (segment.atEnd()) {
         info.segment = {
            range: segment.range,
         };
      }
   }

   _checkEOL(segment, info) {
      const candidate = segment.text[segment.index];

      if (candidate === '\n' || (candidate === '\u0085' && this._version === 1.1)) {
         this._text.push(candidate);
         info.chars ++;
         this._incrementSegment(segment, info, candidate);
      }
   }

}

export default CharExtractor;
