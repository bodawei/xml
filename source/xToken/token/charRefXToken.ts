/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { extractSurrogatePair } from 'basic';
import { CharRefPToken } from 'token';

const CHARREF_XTOKEN = 'CHARREF_XTOKEN';

class CharRefXToken {
   public readonly type: typeof CHARREF_XTOKEN = CHARREF_XTOKEN;
   public readonly char: string;
   public readonly pToken?: CharRefPToken;

   constructor(character: string);
   constructor(pToken: CharRefPToken);
   constructor(characterOrPToken: string | CharRefPToken) {
      if (typeof characterOrPToken === 'string') {
         this.char = characterOrPToken;
      } else {
         let charCode = characterOrPToken.charCode;
         let character = String.fromCharCode(0);
         let pToken = characterOrPToken;

         if (charCode > 0xFFFF) {
            const [high, low] = extractSurrogatePair(charCode);
            character = String.fromCharCode(high) + String.fromCharCode(low);
         } else {
            character = String.fromCharCode(charCode);
         }
         
         this.char = character;
         this.pToken = characterOrPToken;
      }
   }
}


export { CHARREF_XTOKEN, CharRefXToken };
