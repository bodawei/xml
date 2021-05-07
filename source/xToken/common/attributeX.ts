/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { strOrBlank } from 'sToken';
import {
   GeneralEntityEndXToken,
   GeneralEntityStartXToken,
   ParameterEntityEndXToken,
   ParameterEntityStartXToken,
   TextXToken,
   LiteralValueX,
   makeLiteralValueX,
} from 'xToken';

import {
   CharRefXToken,
   ParameterEntityReferenceXToken,
   GeneralEntityReferenceXToken,
} from 'xToken';
import { AttributePToken } from 'token';

type AttributeValueXToken = Array<
   | TextXToken
   | CharRefXToken
   | GeneralEntityReferenceXToken
   | ParameterEntityReferenceXToken
   | GeneralEntityStartXToken
   | GeneralEntityEndXToken
   | ParameterEntityStartXToken
   | ParameterEntityEndXToken
>;

class AttributeX {
   public readonly name: string;

   public readonly value: LiteralValueX;

   constructor(name: string, valueX: LiteralValueX);
   constructor(pToken: AttributePToken);
   constructor(nameOrPToken: string | AttributePToken, valueX?: LiteralValueX) {
      if (typeof nameOrPToken === 'string') {
         this.name = nameOrPToken;
         this.value = valueX ?? [];
      } else {
         this.name = strOrBlank(nameOrPToken.name);
         this.value = makeLiteralValueX(nameOrPToken.value);
      }
   }
}

export { AttributeX, AttributeValueXToken };
