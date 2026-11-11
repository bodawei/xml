/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, Collector, isChar } from 'basic';
import { strOrBlank } from 'basic';
import { CharRefPToken } from 'pToken';

import { wellFormedErrorCodes } from '../error/wellFormedError';

const WFEID = wellFormedErrorCodes.id;

function charRefCheck(
   pToken: CharRefPToken,
   collector: Collector,
   confVer: ConformanceVersion,
): void {
   collector.setPos(pToken.open);

   collector.setPos(pToken.openSpace);
   collector.check(pToken.openSpace, WFEID.CHARREF_XTRA_POST_OPEN_SPACE);

   collector.setPos(pToken.hexMarker);
   const xMarker = strOrBlank(pToken.hexMarker);
   collector.check(
      pToken.hexMarker && (xMarker.toLowerCase() !== xMarker || xMarker.toLowerCase() !== 'x'),
      WFEID.CHARREF_INVALID_HEX_CASE,
   );

   collector.setPos(pToken.hexMarkerSpace);
   collector.check(pToken.hexMarkerSpace, WFEID.CHARREF_XTRA_POST_HEX_SPACE);

   collector.setPos(pToken.digits);
   collector.check(!pToken.digits, WFEID.CHARREF_NO_DIGITS);

   /*
    * §4.1.0: Well-Formedness Constraint: Legal Character
    *    Characters referred to using character references must match the production for Char.
    */
   if (pToken.digits) {
      const char = pToken.char;
      let charInfo = strOrBlank(pToken.digits);

      if (pToken.hexMarker) {
         charInfo = `x${charInfo}`;
      }

      collector.check(!isChar(char, confVer.version), WFEID.CHARREF_INVALID_CHAR, [charInfo]);

      collector.check(
         pToken.charCode >= 0xd800 && pToken.charCode <= 0xdfff,
         WFEID.CHARDATA_INVALID_CHAR,
         [String(pToken.digits.ranges[0]?.startIndex - 1)],
      );
   }

   collector.setPos(pToken.digitsSpace);
   collector.check(pToken.digitsSpace, WFEID.CHARREF_XTRA_POST_DIGITS_SPACE);

   collector.setPos(pToken.close);
   collector.check(!pToken.close, WFEID.CHARREF_NO_CLOSE);
}

export { charRefCheck };
