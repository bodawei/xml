/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import Extractor from './Extractor.js';

const DIGITS_REGEX = /[0-9A-Fa-f]+/g;

/**********************************************************************\
  If decimal or hexadecimal digits are to be found from the current
  location in the current segment, consume as many digits across as
  many segments as available.
\**********************************************************************/

class DigitExtractor extends Extractor {

   process(segment) {
      const info = this._makeInfo(segment);
      this._segInfo.push(info);

      DIGITS_REGEX.lastIndex = 0;
      this._foundDigits = DIGITS_REGEX.exec(segment.text[segment.index]);

      if (!this._foundDigits) {
         this.state = Extractor.STATE.FAILURE;
         return;
      }

      DIGITS_REGEX.lastIndex = segment.index;
      const allDigits = DIGITS_REGEX.exec(segment.text);

      this._processText(allDigits[0], info);

      const digitsLength = allDigits[0].length;
      segment.index += digitsLength;

      if (!segment.atEnd()) {
         this.state = Extractor.STATE.SUCCESS;
      } else {
         info.segment = {
            range: segment.range,
         };
      }
   }

   finish() {
      this.state = this._foundDigits ? Extractor.STATE.SUCCESS : Extractor.STATE.FAILURE;
      return this._finish();
   }

}

module.exports = DigitExtractor;
