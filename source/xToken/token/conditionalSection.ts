/* Copyright ® 2020 by 柏大衛. All rights reserved. */

// ick
import { ConditionalPToken } from 'token';

const CONDITIONAL_XTOKEN = 'CONDITIONAL_XTOKEN';

class ConditionalXToken {
   public readonly type: typeof CONDITIONAL_XTOKEN = CONDITIONAL_XTOKEN;

   public readonly pToken?: ConditionalPToken;

   constructor(pToken?: ConditionalPToken) {
      this.pToken = pToken;
   }
}

function conditionalSectionPTokenToXToken(pToken: ConditionalPToken): ConditionalXToken {
   const token = new ConditionalXToken(pToken);

   return token;
}

export { CONDITIONAL_XTOKEN, ConditionalXToken, conditionalSectionPTokenToXToken };
