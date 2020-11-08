/* Copyright ® 2020 by 柏大衛. All rights reserved. */

//ick
import { ConditionalClosePToken } from 'token';

const CONDITIONAL_SECTION_END_XTOKEN = 'CONDITIONAL_SECTION_END_XTOKEN';

class ConditionalSectionEndXToken {
   public readonly type: typeof CONDITIONAL_SECTION_END_XTOKEN = CONDITIONAL_SECTION_END_XTOKEN;

   public readonly pToken?: ConditionalClosePToken;

   constructor(pToken?: ConditionalClosePToken) {
      this.pToken = pToken;
   }
}

export { CONDITIONAL_SECTION_END_XTOKEN, ConditionalSectionEndXToken };
