/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ConditionalClosePToken } from 'token';

const CONDITIONAL_CLOSE_XTOKEN = 'CONDITIONAL_CLOSE_XTOKEN';

class ConditionalCloseXToken {
   public readonly type: typeof CONDITIONAL_CLOSE_XTOKEN = CONDITIONAL_CLOSE_XTOKEN;
   public readonly pToken?: ConditionalClosePToken;

   constructor(pToken?: ConditionalClosePToken) {
      this.pToken = pToken;
   }
}

function conditionalClosePTokenToXToken(pToken: ConditionalClosePToken) {
   const token = new ConditionalCloseXToken(pToken);

   return token;
}

export { CONDITIONAL_CLOSE_XTOKEN, ConditionalCloseXToken, conditionalClosePTokenToXToken };
