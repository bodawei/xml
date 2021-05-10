/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { strOrBlank } from 'sToken';
import { AttributePToken } from 'token';

import { LiteralValueX, cloneLiteralValueX, makeLiteralValueX } from './literalValueX';

class AttributeX {
   public readonly name: string;

   public readonly value: LiteralValueX;

   constructor(name: string, valueX?: LiteralValueX);
   constructor(pToken: AttributePToken);
   constructor(nameOrPToken: string | AttributePToken, valueX?: LiteralValueX) {
      if (typeof nameOrPToken === 'string') {
         this.name = nameOrPToken;
         this.value = cloneLiteralValueX(valueX);
      } else {
         this.name = strOrBlank(nameOrPToken.name);
         this.value = makeLiteralValueX(nameOrPToken.value);
      }
   }
}

function cloneAttributeX(source: AttributeX): AttributeX {
   return new AttributeX(source.name, source.value);
}

export { AttributeX, cloneAttributeX };
