/* Copyright ® 2017 by David John Burrowes. All rights reserved. */

'use strict';

const Extractor = require('./Extractor.js');

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
      this._incrementSegment(segment, info);
      this._text.push(currentChar);
      this._normalizedText.push(this._normalizeText(currentChar, info));

      if (currentChar === '\r') {
         if (segment.atEnd()) {
            this._foundCR = true;
            return; // We don't know if we're done, so just bail out.
         }
         this._checkEOL(segment, info);
      }

      this.state = Extractor.STATE.SUCCESS;
   }

   done() {
      // The only way we can get here is if we've seen nothing, or have only seen a CR
      this.state = this._foundCR ? Extractor.STATE.SUCCESS : Extractor.STATE.FAILURE;
   }

   _incrementSegment(segment, info) {
      segment.index ++;
      if (segment.atEnd()) {
         info.segment = {
            range: segment.range
         };
      }
   }

   _checkEOL(segment, info) {
      const candidate = segment.text[segment.index];

      if (candidate === '\n' || (candidate === '\u0085' && this._version === 1.1)) {
         this._text.push(candidate);
         info.chars ++;
         this._incrementSegment(segment, info);
      }
   }

}

module.exports = CharExtractor;
