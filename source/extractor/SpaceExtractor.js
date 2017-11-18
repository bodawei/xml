/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import Extractor from './Extractor.js';

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

   process(segment) {
      const spaceRegexp = this._version === 1.0 ? SPACE_10_REGEX : SPACE_11_REGEX;
      const info = this._makeInfo(segment);
      this._segInfo.push(info);

      spaceRegexp.lastIndex = 0;
      this._foundSpace = spaceRegexp.exec(segment.text[segment.index]);

      if (!this._foundSpace) {
         this.state = Extractor.STATE.FAILURE;
         return;
      }

      spaceRegexp.lastIndex = segment.index;
      const allSpace = spaceRegexp.exec(segment.text);
      const spaceLength = allSpace[0].length;

      this._processText(allSpace[0], info);

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
      this.state = this._foundSpace ? Extractor.STATE.SUCCESS : Extractor.STATE.FAILURE;
      return this._finish();
   }

}

module.exports = SpaceExtractor;
