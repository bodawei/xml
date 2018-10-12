/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { EntityReferencePToken } from './entityReference';

/**********************************************************************\
 Defines a simple token that tracks the end of an entity expansion.
\**********************************************************************/

const GENERAL_ENTITY_END_PTOKEN = 'GENERAL_ENTITY_END_PTOKEN';
const GENERAL_ENTITY_END_XTOKEN = 'GENERAL_ENTITY_END_XTOKEN';

class GeneralEntityEndPToken {
   public readonly type: typeof GENERAL_ENTITY_END_PTOKEN = GENERAL_ENTITY_END_PTOKEN;
   public readonly referencePToken: EntityReferencePToken;

   constructor(entityReferencePToken: EntityReferencePToken) {
      this.referencePToken = entityReferencePToken;
   }

   toXToken() {
      return new GeneralEntityEndXToken(this.referencePToken.name.str, this);
   }
}

class GeneralEntityEndXToken {
   public readonly type: typeof GENERAL_ENTITY_END_XTOKEN = GENERAL_ENTITY_END_XTOKEN;
   public readonly name: string;
   public readonly pToken?: GeneralEntityEndPToken;

   constructor(name: string, pToken?: GeneralEntityEndPToken) {
      this.name = name;
      this.pToken = pToken;
   }
}

export {
   GENERAL_ENTITY_END_PTOKEN,
   GENERAL_ENTITY_END_XTOKEN,
   GeneralEntityEndPToken,
   GeneralEntityEndXToken
};
