/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { ParameterEntityReferencePToken } from 'pToken';

/**********************************************************************\
 Defines a simple token that tracks the start of an entity expansion.
\**********************************************************************/

const PARAMETER_ENTITY_START_PTOKEN = 'PARAMETER_ENTITY_START_PTOKEN';

class ParameterEntityStartPToken {
   public readonly type: typeof PARAMETER_ENTITY_START_PTOKEN = PARAMETER_ENTITY_START_PTOKEN;
   public readonly referencePToken: ParameterEntityReferencePToken;

   constructor(peReferencePToken: ParameterEntityReferencePToken) {
      this.referencePToken = peReferencePToken;
   }
}

export { PARAMETER_ENTITY_START_PTOKEN, ParameterEntityStartPToken };
