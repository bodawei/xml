/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { strOrBlank } from 'sToken';
// ick
import { ParameterEntityReferencePToken } from 'token';

const PARAMETER_ENTITY_REFERENCE_XTOKEN = 'PARAMETER_ENTITY_REFERENCE_XTOKEN';

class ParameterEntityReferenceXToken {
   public readonly type: typeof PARAMETER_ENTITY_REFERENCE_XTOKEN = PARAMETER_ENTITY_REFERENCE_XTOKEN;

   public readonly name: string;

   public pToken?: ParameterEntityReferencePToken;

   constructor(nameOrToken: string | ParameterEntityReferencePToken) {
      if (typeof nameOrToken === 'string') {
         this.name = nameOrToken;
      } else {
         this.name = strOrBlank(nameOrToken.name);
         this.pToken = nameOrToken;
      }
   }
}

export { PARAMETER_ENTITY_REFERENCE_XTOKEN, ParameterEntityReferenceXToken };
