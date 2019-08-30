/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import Extractor from './Extractor';
import Segment from './Segment';

const SPACE_10_REGEX = /[ \t\n\r]+/g;
const SPACE_11_REGEX = /[ \t\n\r\u0085\u2028]+/g;

/**********************************************************************\
 A SpaceExtractor extracts an SToken made up of a series of whitespace
 characters.  This is sensitifce to the differences between 1.0 and 1.1
 of the XML standard.

 Note that while the XML standard defines whitespace as:
  [3] S ::= (#x20 | #x9 | #xD | #xA)+
 that syntax is posed line endint normalization
\**********************************************************************/

class SpaceExtractor extends Extractor {
   private foundSpace: boolean = false;

   process(segment: Segment) {
      const spaceRegexp = this.version === 1.0 ? SPACE_10_REGEX : SPACE_11_REGEX;
      const info = this.makeInfo(segment);
      this.segInfo.push(info);

      /*
       * Check if the next char is a space before doing the full-on search
       * for spaces. If we don't do this, the full-on check could scan
       * megabytes of text before finding a space, so we would then both
       * pay for the full scan, and need to check whether the match started
       * at the current index, anyway.
       */
      spaceRegexp.lastIndex = 0;
      this.foundSpace = spaceRegexp.test(segment.text[segment.index]);

      if (!this.foundSpace) {
         this.state = Extractor.STATE.FAILURE;
         return;
      }

      spaceRegexp.lastIndex = segment.index;
      const result = spaceRegexp.exec(segment.text);
      const allSpace = result!; // typeHack Because above check garantues this is not null.
      const spaceLength = allSpace[0].length;

      this.processText(allSpace[0], info);

      segment.index += spaceLength;

      if (!segment.atEnd()) {
         this.state = Extractor.STATE.SUCCESS;
      } else {
         info.segment = {
            range: segment.range,
         };
      }
   }

   finish() {
      this.state = this.foundSpace ? Extractor.STATE.SUCCESS : Extractor.STATE.FAILURE;
      return this.innerFinish();
   }

}

export default SpaceExtractor;
