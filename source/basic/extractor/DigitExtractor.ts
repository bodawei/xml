/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { Extractor } from './Extractor';
import { PseudoSpace, DONE_SEGMENT, PSEUDO_SPACE, Segment } from './Segment';

const DIGITS_REGEX = /[0-9]+/g;
const HEX_DIGITS_REGEX = /[0-9A-Fa-f]+/g;

/**********************************************************************\
  If decimal or hexadecimal digits are to be found from the current
  location in the current segment, consume as many digits across as
  many segments as available.
\**********************************************************************/

class DigitExtractor extends Extractor {
   private foundDigit = false;

   private base: 10 | 16;

   constructor(version: number, processLineEndings: boolean, base: 10 | 16) {
      super(version, processLineEndings);

      this.base = base;
   }

   process(segment: Segment | PseudoSpace) {
      const info = this.makeInfo(segment);
      this.segInfo.push(info);
      const regex = this.base === 10 ? DIGITS_REGEX : HEX_DIGITS_REGEX;

      // Spaces never match digits, so terminate or fail
      if (segment.type === PSEUDO_SPACE) {
         this.state = this.foundDigit ? Extractor.STATE.SUCCESS : Extractor.STATE.FAILURE;
         return;
      }

      /*
       * First checks whether the next character is a digit.
       * This does not do the allDigits (as below) check first since
       * that could match digits that start 1Meg chars afther the
       * current index. That is, make sure the nexxt char is a digit,
       * and if so, we can then do a more general scan knowing it
       * won't go wandering off before it starts finding digits.
       */
      regex.lastIndex = 0;
      const foundDigit = regex.test(segment.text[segment.index]);

      if (foundDigit) {
         this.foundDigit = foundDigit;
      } else {
         this.state = this.foundDigit ? Extractor.STATE.SUCCESS : Extractor.STATE.FAILURE;
         return;
      }

      regex.lastIndex = segment.index;
      const result = regex.exec(segment.text);
      const allDigits = result!; // typeHack

      this.processText(allDigits[0], info);

      const digitsLength = allDigits[0].length;
      segment.index += digitsLength;

      if (!segment.atEnd()) {
         this.state = Extractor.STATE.SUCCESS;
      } else {
         info.segment = {
            type: DONE_SEGMENT,
            range: segment.range,
         };
      }
   }

   finish() {
      this.state = this.foundDigit ? Extractor.STATE.SUCCESS : Extractor.STATE.FAILURE;
      return this.innerFinish();
   }
}

export { DigitExtractor };
