/* Copyright ® 2017 by David John Burrowes. All rights reserved. */

'use strict';

const Extractor = require('./Extractor.js');

const DIGITS_REGEX = /[0-9A-Fa-f]+/g;

/**********************************************************************\
  If decimal or hexadecimal digits are to be found from the current
  location in the current segment, consume as many digits across as
  many segments as available.
\**********************************************************************/

class DigitExtractor extends Extractor {

   process(segment) {
      DIGITS_REGEX.lastIndex = 0;
      this._foundDigits = DIGITS_REGEX.exec(segment.text[segment.index]);

      if (!this._foundDigits) {
         this.state = Extractor.STATE.FAILURE;
         return;
      }

      DIGITS_REGEX.lastIndex = segment.index;
      const allDigits = DIGITS_REGEX.exec(segment.text);

      const digitsLength = allDigits[0].length;
      const info = {
         chars: digitsLength,
         rows: 0,
         columns: digitsLength
      };

      this._text.push(allDigits[0]);
      this._segInfo.push(info);

      segment.index += digitsLength;

      if (!segment.atEnd()) {
         this.state = Extractor.STATE.SUCCESS;
         info.segment = segment;
      } else {
         info.range = segment.range;
      }
   }

   done() {
      this.state = this._foundDigits ? Extractor.STATE.SUCCESS : Extractor.STATE.FAILURE;
   }

   getExtraction() {
      if (this.state === Extractor.STATE.WORKING) {
         return;
      }

      const combinedText = this._text.join('');
      return {
         text: combinedText,
         original: combinedText,
         segments: this._segInfo
      };
   }

}

module.exports = DigitExtractor;
