/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { EntityReferencePToken } from '../entityReference';

/**********************************************************************\
 Defines a simple token that tracks the start of an entity expansion.
\**********************************************************************/

const GENERAL_ENTITY_START_PTOKEN = 'GENERAL_ENTITY_START_PTOKEN';
const GENERAL_ENTITY_START_XTOKEN = 'GENERAL_ENTITY_START_XTOKEN';

class GeneralEntityStartPToken {
   public readonly type: typeof GENERAL_ENTITY_START_PTOKEN = GENERAL_ENTITY_START_PTOKEN;
   public readonly referencePToken: EntityReferencePToken;

   constructor(entityReferencePToken: EntityReferencePToken) {
      this.referencePToken = entityReferencePToken;
   }

   toXToken() {
      return new GeneralEntityStartXToken(this.referencePToken.name.str, this);
   }
}

class GeneralEntityStartXToken {
   public readonly type: typeof GENERAL_ENTITY_START_XTOKEN = GENERAL_ENTITY_START_XTOKEN;
   public readonly name: string;
   public readonly pToken?: GeneralEntityStartPToken;

   constructor(name: string, pToken?: GeneralEntityStartPToken) {
      this.name = name;
      this.pToken = pToken;
   }
}

export {
   GENERAL_ENTITY_START_PTOKEN,
   GENERAL_ENTITY_START_XTOKEN,
   GeneralEntityStartPToken,
   GeneralEntityStartXToken,
};
