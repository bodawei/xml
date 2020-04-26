/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { strOrBlank } from 'sToken';
import { EntityValuePToken } from '../entityDeclaration';
import { GeneralEntityReferencePToken } from '../generalEntityReference';

/**********************************************************************\
 Defines a simple token that tracks the end of an entity expansion.
\**********************************************************************/

const GENERAL_ENTITY_END_PTOKEN = 'GENERAL_ENTITY_END_PTOKEN';
const GENERAL_ENTITY_END_XTOKEN = 'GENERAL_ENTITY_END_XTOKEN';

class GeneralEntityEndPToken {
   public readonly type: typeof GENERAL_ENTITY_END_PTOKEN = GENERAL_ENTITY_END_PTOKEN;
   public readonly referencePToken: GeneralEntityReferencePToken;

   constructor(geReferencePToken: GeneralEntityReferencePToken, preparsedValue?: EntityValuePToken | void) {
      this.referencePToken = geReferencePToken;
   }

   toXToken() {
      return new GeneralEntityEndXToken(strOrBlank(this.referencePToken.name), this);
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
