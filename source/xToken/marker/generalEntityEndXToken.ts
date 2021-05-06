/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { GeneralEntityEndPToken } from 'token';
import { strOrBlank } from 'sToken';

const GENERAL_ENTITY_END_XTOKEN = 'GENERAL_ENTITY_END_XTOKEN';

class GeneralEntityEndXToken {
   public readonly type: typeof GENERAL_ENTITY_END_XTOKEN = GENERAL_ENTITY_END_XTOKEN;

   public readonly name: string;

   public readonly pToken?: GeneralEntityEndPToken;

   constructor(nameOrToken: string | GeneralEntityEndPToken) {
      if (typeof nameOrToken === 'string') {
         this.name = nameOrToken;
      } else {
         this.name = strOrBlank(nameOrToken.referencePToken.name);
         this.pToken = nameOrToken;
      }
   }
}

export { GENERAL_ENTITY_END_XTOKEN, GeneralEntityEndXToken };
