/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { ParameterEntityReferencePToken } from '../parameterEntityReference';
import { textOrBlank } from '../common/misc';

/**********************************************************************\
 Defines a simple token that tracks the start of an entity expansion.
\**********************************************************************/

const PARAMETER_ENTITY_START_PTOKEN = 'PARAMETER_ENTITY_START_PTOKEN';
const PARAMETER_ENTITY_START_XTOKEN = 'PARAMETER_ENTITY_START_XTOKEN';

class ParameterEntityStartPToken {
   public readonly type: typeof PARAMETER_ENTITY_START_PTOKEN = PARAMETER_ENTITY_START_PTOKEN;
   public readonly referencePToken: ParameterEntityReferencePToken;

   constructor(peReferencePToken: ParameterEntityReferencePToken) {
      this.referencePToken = peReferencePToken;
   }

   toXToken() {
      return new ParameterEntityStartXToken(textOrBlank(this.referencePToken.name), this);
   }
}

class ParameterEntityStartXToken {
   public readonly type: typeof PARAMETER_ENTITY_START_XTOKEN = PARAMETER_ENTITY_START_XTOKEN;
   public readonly name: string;
   public readonly pToken?: ParameterEntityStartPToken;

   constructor(name: string, pToken?: ParameterEntityStartPToken) {
      this.name = name;
      this.pToken = pToken;
   }
}

export {
   PARAMETER_ENTITY_START_PTOKEN,
   PARAMETER_ENTITY_START_XTOKEN,
   ParameterEntityStartPToken,
   ParameterEntityStartXToken,
};
