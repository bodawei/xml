/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { strOrBlank } from 'sToken';
import { CharDataPToken } from 'token';

const CHARDATA_XTOKEN = 'CHARDATA_XTOKEN';

class CharDataXToken {
   public readonly type: typeof CHARDATA_XTOKEN = CHARDATA_XTOKEN;

   public readonly text: string;

   public readonly pToken?: CharDataPToken;

   constructor(textOrPToken: string | CharDataPToken) {
      if (typeof textOrPToken === 'string') {
         this.text = textOrPToken;
      } else {
         this.text = strOrBlank(textOrPToken.text);
         this.pToken = textOrPToken;
      }
   }
}

export { CHARDATA_XTOKEN, CharDataXToken };
