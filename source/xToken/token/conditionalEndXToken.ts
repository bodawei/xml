/* Copyright ® 2020-2021 by 柏大衛. All rights reserved. */

import { ConditionalClosePToken } from 'token';

const CONDITIONAL_SECTION_END_XTOKEN = 'CONDITIONAL_SECTION_END_XTOKEN';

class ConditionalEndXToken {
   public readonly type: typeof CONDITIONAL_SECTION_END_XTOKEN = CONDITIONAL_SECTION_END_XTOKEN;

   public pToken?: ConditionalClosePToken;

   constructor(pToken?: ConditionalClosePToken) {
      this.pToken = pToken;
   }
}

export { CONDITIONAL_SECTION_END_XTOKEN, ConditionalEndXToken };
