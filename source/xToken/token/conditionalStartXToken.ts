/* Copyright ® 2020-2021 by 柏大衛. All rights reserved. */

import { ConditionalStartPToken } from 'token';

const CONDITIONAL_SECTION_START_XTOKEN = 'CONDITIONAL_SECTION_START_XTOKEN';

class ConditionalStartXToken {
   public readonly type: typeof CONDITIONAL_SECTION_START_XTOKEN = CONDITIONAL_SECTION_START_XTOKEN;

   public pToken?: ConditionalStartPToken;

   constructor(pToken?: ConditionalStartPToken) {
      this.pToken = pToken;
   }
}

export { CONDITIONAL_SECTION_START_XTOKEN, ConditionalStartXToken };
