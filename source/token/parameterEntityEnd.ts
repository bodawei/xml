/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { ParameterEntityReferencePToken } from './entityReference';

/**********************************************************************\
 Defines a simple token that tracks the end of an entity expansion.
\**********************************************************************/

const PARAMETER_ENTITY_END_PTOKEN = 'PARAMETER_ENTITY_END_PTOKEN';
const PARAMETER_ENTITY_END_XTOKEN = 'PARAMETER_ENTITY_END_XTOKEN';

class ParameterEntityEndPToken {
   public readonly type: typeof PARAMETER_ENTITY_END_PTOKEN = PARAMETER_ENTITY_END_PTOKEN;
   public readonly referencePToken: ParameterEntityReferencePToken;

   constructor(entityReferencePToken: ParameterEntityReferencePToken) {
      this.referencePToken = entityReferencePToken;
   }

   toXToken() {
      return new ParameterEntityEndXToken(this);
   }
}

class ParameterEntityEndXToken {
   public readonly type: typeof PARAMETER_ENTITY_END_XTOKEN = PARAMETER_ENTITY_END_XTOKEN;
   public readonly pToken?: ParameterEntityEndPToken;

   constructor(pToken: ParameterEntityEndPToken) {
      this.pToken = pToken;
   }
}

export {
   PARAMETER_ENTITY_END_PTOKEN,
   PARAMETER_ENTITY_END_XTOKEN,
   ParameterEntityEndPToken,
   ParameterEntityEndXToken
};
