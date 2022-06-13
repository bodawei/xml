/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { ParameterEntityStartPToken } from 'token';
import { strOrBlank } from 'basic';

const PARAMETER_ENTITY_START_XTOKEN = 'PARAMETER_ENTITY_START_XTOKEN';

class ParameterEntityStartXToken {
   public readonly type: typeof PARAMETER_ENTITY_START_XTOKEN = PARAMETER_ENTITY_START_XTOKEN;

   public readonly name: string;

   public pToken?: ParameterEntityStartPToken;

   constructor(nameOrToken: string | ParameterEntityStartPToken) {
      if (typeof nameOrToken === 'string') {
         this.name = nameOrToken;
      } else {
         this.name = strOrBlank(nameOrToken.referencePToken.name);
         this.pToken = nameOrToken;
      }
   }
}

export { PARAMETER_ENTITY_START_XTOKEN, ParameterEntityStartXToken };
