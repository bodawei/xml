/* Copyright ® 2020 by 柏大衛. All rights reserved. */

// ick
import { ConditionalPToken } from 'token';

const CONDITIONAL_SECTION_START_XTOKEN = 'CONDITIONAL_SECTION_START_XTOKEN';

class ConditionalSectionStartXToken {
   public readonly type: typeof CONDITIONAL_SECTION_START_XTOKEN = CONDITIONAL_SECTION_START_XTOKEN;

   public readonly pToken?: ConditionalPToken;

   constructor(pToken?: ConditionalPToken) {
      this.pToken = pToken;
   }
}

export { CONDITIONAL_SECTION_START_XTOKEN, ConditionalSectionStartXToken };
