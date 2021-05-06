/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { ParameterEntityReferencePToken } from 'pToken';

/**********************************************************************\
 Defines a simple token that tracks the end of an entity expansion.
\**********************************************************************/

const PARAMETER_ENTITY_END_PTOKEN = 'PARAMETER_ENTITY_END_PTOKEN';

class ParameterEntityEndPToken {
   public readonly type: typeof PARAMETER_ENTITY_END_PTOKEN = PARAMETER_ENTITY_END_PTOKEN;
   public readonly referencePToken: ParameterEntityReferencePToken;

   constructor(peReferencePToken: ParameterEntityReferencePToken) {
      this.referencePToken = peReferencePToken;
   }
}


export {
   PARAMETER_ENTITY_END_PTOKEN,
   ParameterEntityEndPToken,
};
