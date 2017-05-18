/* Copyright ® 2017 by David John Burrowes. All rights reserved. */

'use strict';

const Extractor = require('./Extractor.js');

const SPACE_10_REGEX = /[ \t\n\r]+/g;
const SPACE_11_REGEX = /[ \t\n\r\u0085\u2028]+/g;

/**********************************************************************\
 [3] S ::= (#x20 | #x9 | #xD | #xA)+
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

      this._normalizedText.push(this._normalizeText(allSpace[0], info));
      this._text.push(allSpace[0]);

      segment.index += spaceLength;

      if (!segment.atEnd()) {
         this.state = Extractor.STATE.SUCCESS;
      } else {
         info.segment = {
            range: segment.range
         };
      }
   }

   done() {
      this.state = this._foundSpace ? Extractor.STATE.SUCCESS : Extractor.STATE.FAILURE;
   }

}

module.exports = SpaceExtractor;
