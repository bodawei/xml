/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector, isChar } from 'basic';
import { CharRefPToken } from 'pToken';
import { strOrBlank } from 'sToken';

import { WellFormedError } from '../error/WellFormedError';

const WFEID = WellFormedError.ID;

function charRefCheck(
   pToken: CharRefPToken,
   ec: ErrorCollector,
   confVer: ConformanceVersion,
): void {
   ec.setPos(pToken.open);

   ec.setPos(pToken.openSpace);
   ec.check(pToken.openSpace, WFEID.CHARREF_XTRA_POST_OPEN_SPACE);

   ec.setPos(pToken.hexMarker);
   const xMarker = strOrBlank(pToken.hexMarker);
   ec.check(
      pToken.hexMarker && (xMarker.toLowerCase() !== xMarker || xMarker.toLowerCase() !== 'x'),
      WFEID.CHARREF_INVALID_HEX_CASE,
   );

   ec.setPos(pToken.hexMarkerSpace);
   ec.check(pToken.hexMarkerSpace, WFEID.CHARREF_XTRA_POST_HEX_SPACE);

   ec.setPos(pToken.digits);
   ec.check(!pToken.digits, WFEID.CHARREF_NO_DIGITS);

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

      ec.check(!isChar(char, confVer.version), WFEID.CHARREF_INVALID_CHAR, [charInfo]);

      ec.check(
         pToken.charCode >= 0xd800 && pToken.charCode <= 0xdfff,
         WFEID.CHARDATA_INVALID_CHAR,
         [String(pToken.digits.ranges[0]?.startIndex - 1)],
      );
   }

   ec.setPos(pToken.digitsSpace);
   ec.check(pToken.digitsSpace, WFEID.CHARREF_XTRA_POST_DIGITS_SPACE);

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.CHARREF_NO_CLOSE);
}

export { charRefCheck };
