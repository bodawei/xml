/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { strOrBlank } from 'basic';
import { GeneralEntityReferencePToken } from 'pToken';

const GENERAL_ENTITY_REFERENCE_XTOKEN = 'GENERAL_ENTITY_REFERENCE_XTOKEN';

class GeneralEntityReferenceXToken {
   public readonly type: typeof GENERAL_ENTITY_REFERENCE_XTOKEN = GENERAL_ENTITY_REFERENCE_XTOKEN;

   public readonly name: string;

   public pToken?: GeneralEntityReferencePToken;

   constructor(nameOrToken: string | GeneralEntityReferencePToken) {
      if (typeof nameOrToken === 'string') {
         this.name = nameOrToken;
      } else {
         this.name = strOrBlank(nameOrToken.name);
         this.pToken = nameOrToken;
      }
   }
}

export { GENERAL_ENTITY_REFERENCE_XTOKEN, GeneralEntityReferenceXToken };
