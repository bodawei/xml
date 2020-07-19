/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { EntityMetaData, isChar, extractSurrogatePair } from 'basic';
import { ErrorCollector, WellFormedError } from 'error';
import { CharRefPToken } from 'token';
import { strOrBlank } from 'sToken';

const WFEID = WellFormedError.ID;

function charRefCheck(
   pToken: CharRefPToken,
   ec: ErrorCollector,
   entityMetaData: EntityMetaData,
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
      const charNumber = pToken.charCode;
      let char;

      if (charNumber > 0xffff) {
         const chars = extractSurrogatePair(charNumber);
         char = String.fromCharCode(chars[0]) + String.fromCharCode(chars[1]);
      } else {
         char = String.fromCharCode(charNumber);
      }

      ec.check(!isChar(char, entityMetaData.version), WFEID.CHARREF_INVALID_CHAR, [
         strOrBlank(pToken.digits),
      ]);
   }

   ec.setPos(pToken.digitsSpace);
   ec.check(pToken.digitsSpace, WFEID.CHARREF_XTRA_POST_DIGITS_SPACE);

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.CHARREF_NO_CLOSE);
}

export { charRefCheck };
