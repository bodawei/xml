/* Copyright ® 2016-2019 by 柏大衛. All rights reserved. */

import { EntityMetaData } from 'basic';
import { ErrorCollector } from 'error';
import { strOrBlank } from 'sToken';
import { GeneralEntityReferencePToken } from '../generalEntityReference';

/**********************************************************************\
 Defines a simple token that tracks the start of an entity expansion.
\**********************************************************************/

const GENERAL_ENTITY_START_PTOKEN = 'GENERAL_ENTITY_START_PTOKEN';
const GENERAL_ENTITY_START_XTOKEN = 'GENERAL_ENTITY_START_XTOKEN';

class GeneralEntityStartPToken {
   public readonly type: typeof GENERAL_ENTITY_START_PTOKEN = GENERAL_ENTITY_START_PTOKEN;
   public readonly referencePToken: GeneralEntityReferencePToken;

   constructor(geReferencePToken: GeneralEntityReferencePToken) {
      this.referencePToken = geReferencePToken;
   }

   checkWellFormed(ec: ErrorCollector, entityMetaData: EntityMetaData): void {
      this.referencePToken.checkWellFormed(ec, entityMetaData);
   }

   toXToken() {
      return new GeneralEntityStartXToken(strOrBlank(this.referencePToken.name), this);
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
