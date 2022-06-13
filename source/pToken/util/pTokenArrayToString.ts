/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { CHARREF_PTOKEN } from 'pToken';
import { strOrBlank } from 'basic';

import { ParseToken } from '../index';
import { TEXT_PTOKEN } from '../token/text';

/*
 * General purpose utility routine that takes an array of PTokens
 * and returns just the text content from
 * the TEXT_PTOKENs and CHARREF_PTOKENs
 */
function pTokenArrayToString(value: Array<ParseToken> = []): string {
   const pieces = [];

   for (const piece of value) {
      switch (piece.type) {
         case TEXT_PTOKEN:
            pieces.push(strOrBlank(piece.text));
            break;
         case CHARREF_PTOKEN:
            pieces.push(piece.char); // Reminder: It may be multiple utf16 codepoints
            break;
         default:
         // ignore the others
      }
   }

   return pieces.join('');
}

export { pTokenArrayToString };
