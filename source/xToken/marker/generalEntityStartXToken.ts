/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { GeneralEntityStartPToken } from 'token';
import { strOrBlank } from 'basic';

const GENERAL_ENTITY_START_XTOKEN = 'GENERAL_ENTITY_START_XTOKEN';

class GeneralEntityStartXToken {
   public readonly type: typeof GENERAL_ENTITY_START_XTOKEN = GENERAL_ENTITY_START_XTOKEN;

   public readonly name: string;

   public pToken?: GeneralEntityStartPToken;

   constructor(nameOrToken: string | GeneralEntityStartPToken) {
      if (typeof nameOrToken === 'string') {
         this.name = nameOrToken;
      } else {
         this.name = strOrBlank(nameOrToken.referencePToken.name);
         this.pToken = nameOrToken;
      }
   }
}

export { GENERAL_ENTITY_START_XTOKEN, GeneralEntityStartXToken };
