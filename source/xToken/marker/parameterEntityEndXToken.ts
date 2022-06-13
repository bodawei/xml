/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { ParameterEntityEndPToken } from 'token';
import { strOrBlank } from 'basic';

const PARAMETER_ENTITY_END_XTOKEN = 'PARAMETER_ENTITY_END_XTOKEN';

class ParameterEntityEndXToken {
   public readonly type: typeof PARAMETER_ENTITY_END_XTOKEN = PARAMETER_ENTITY_END_XTOKEN;

   public readonly name: string;

   public pToken?: ParameterEntityEndPToken;

   constructor(nameOrToken: string | ParameterEntityEndPToken) {
      if (typeof nameOrToken === 'string') {
         this.name = nameOrToken;
      } else {
         this.name = strOrBlank(nameOrToken.referencePToken.name);
         this.pToken = nameOrToken;
      }
   }
}

export { PARAMETER_ENTITY_END_XTOKEN, ParameterEntityEndXToken };
