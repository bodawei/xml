/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { ParameterEntityReferencePToken } from './entityReference';

/**********************************************************************\
 Defines a simple token that tracks the end of an entity expansion.
\**********************************************************************/

const PARAMETER_ENTITY_END_PTOKEN = 'PARAMETER_ENTITY_END_PTOKEN';
const PARAMETER_ENTITY_END_XTOKEN = 'PARAMETER_ENTITY_END_XTOKEN';

class ParameterEntityEndPToken {
   public readonly type: typeof PARAMETER_ENTITY_END_PTOKEN = PARAMETER_ENTITY_END_PTOKEN;
   public readonly refPToken: ParameterEntityReferencePToken;

   constructor(entityReferencePToken: ParameterEntityReferencePToken) {
      this.refPToken = entityReferencePToken;
   }

   toXToken() {
      return new ParameterEntityEndXToken(this.refPToken.name.str, this);
   }
}

class ParameterEntityEndXToken {
   public readonly type: typeof PARAMETER_ENTITY_END_XTOKEN = PARAMETER_ENTITY_END_XTOKEN;
   public readonly name: string;
   public readonly pToken?: ParameterEntityEndPToken;

   constructor(name: string, pToken?: ParameterEntityEndPToken) {
      this.name = name;
      this.pToken = pToken;
   }
}

export {
   PARAMETER_ENTITY_END_PTOKEN,
   PARAMETER_ENTITY_END_XTOKEN,
   ParameterEntityEndPToken,
   ParameterEntityEndXToken,
};
