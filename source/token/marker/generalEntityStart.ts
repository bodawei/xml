/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector } from 'basic';
import { GeneralEntityReferencePToken } from 'pToken';
import { strOrBlank } from 'sToken';

import { EntityValuePToken } from '../EntityValuePToken';

/**********************************************************************\
 Defines a simple token that tracks the start of an entity expansion.
\**********************************************************************/

const GENERAL_ENTITY_START_PTOKEN = 'GENERAL_ENTITY_START_PTOKEN';
const GENERAL_ENTITY_START_XTOKEN = 'GENERAL_ENTITY_START_XTOKEN';

class GeneralEntityStartPToken {
   public readonly type: typeof GENERAL_ENTITY_START_PTOKEN = GENERAL_ENTITY_START_PTOKEN;
   public readonly referencePToken: GeneralEntityReferencePToken;

   constructor(geReferencePToken: GeneralEntityReferencePToken, preparsedValue?: EntityValuePToken | void) {
      this.referencePToken = geReferencePToken;
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
