/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import Extractor from './Extractor';
import Segment from './Segment';

const DIGITS_REGEX = /[0-9A-Fa-f]+/g;

/**********************************************************************\
  If decimal or hexadecimal digits are to be found from the current
  location in the current segment, consume as many digits across as
  many segments as available.
\**********************************************************************/

class DigitExtractor extends Extractor {
   private foundDigit?: boolean;

   process(segment: Segment) {
      const info = this._makeInfo(segment);
      this._segInfo.push(info);

      /*
       * First checks whether the next character is a digit.
       * This does not do the allDigits (as below) check first since
       * that could match digits that start 1Meg chars afther the
       * current index. That is, make sure the nexxt char is a digit,
       * and if so, we can then do a more general scan knowing it
       * won't go wandering off before it starts finding digits.
       */
      DIGITS_REGEX.lastIndex = 0;
      this.foundDigit = DIGITS_REGEX.test(segment.text[segment.index]);

      if (!this.foundDigit) {
         this.state = Extractor.STATE.FAILURE;
         return;
      }

      DIGITS_REGEX.lastIndex = segment.index;
      const result = DIGITS_REGEX.exec(segment.text);
      const allDigits = result!; // typeHack

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
      this.state = this.foundDigit ? Extractor.STATE.SUCCESS : Extractor.STATE.FAILURE;
      return this._finish();
   }

}

export default DigitExtractor;
