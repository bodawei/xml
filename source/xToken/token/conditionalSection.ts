/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ConditionalPToken } from 'token';

const CONDITIONAL_XTOKEN = 'CONDITIONAL_XTOKEN';

/**********************************************************************\
 The cdata namespace contains the usual tools for processing
 a Conditional Section element
\**********************************************************************/

class ConditionalXToken {
   public readonly type: typeof CONDITIONAL_XTOKEN = CONDITIONAL_XTOKEN;
   public readonly pToken?: ConditionalPToken;

   constructor(pToken?: ConditionalPToken) {
      this.pToken = pToken;
   }
}

/**********************************************************************\
 pTokenToXToken() converts a PToken into an XToken.
\**********************************************************************/

function conditionalSectionPTokenToXToken(pToken: ConditionalPToken) {
   const token = new ConditionalXToken(pToken);

   return token;
}

export { CONDITIONAL_XTOKEN, ConditionalXToken, conditionalSectionPTokenToXToken };
