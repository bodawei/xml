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
         this.char = characterOrPToken.char;
         this.pToken = characterOrPToken;
      }
   }
}


export { CHARREF_XTOKEN, CharRefXToken };
