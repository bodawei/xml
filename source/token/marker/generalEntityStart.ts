/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { GeneralEntityReferencePToken } from 'pToken';

import { EntityValuePToken } from '../EntityValuePToken';

/**********************************************************************\
 Defines a simple token that tracks the start of an entity expansion.
\**********************************************************************/

const GENERAL_ENTITY_START_PTOKEN = 'GENERAL_ENTITY_START_PTOKEN';

class GeneralEntityStartPToken {
   public readonly type: typeof GENERAL_ENTITY_START_PTOKEN = GENERAL_ENTITY_START_PTOKEN;
   public readonly referencePToken: GeneralEntityReferencePToken;

   constructor(
      geReferencePToken: GeneralEntityReferencePToken,
      preparsedValue?: EntityValuePToken | void,
   ) {
      this.referencePToken = geReferencePToken;
   }
}

export { GENERAL_ENTITY_START_PTOKEN, GeneralEntityStartPToken };
