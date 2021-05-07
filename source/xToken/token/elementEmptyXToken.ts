/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { strOrBlank } from 'sToken';
import { ElementEmptyPToken } from 'token';

import { AttributeX } from '../common/attributeX';

const ELEMENT_EMPTY_XTOKEN = 'ELEMENT_EMPTY_XTOKEN';

class ElementEmptyXToken {
   public readonly type: typeof ELEMENT_EMPTY_XTOKEN = ELEMENT_EMPTY_XTOKEN;

   public readonly name: string;

   public readonly attributes: ReadonlyArray<AttributeX>;

   public pToken?: ElementEmptyPToken;

   constructor(pToken: ElementEmptyPToken);
   constructor(name: string, attributes: ReadonlyArray<AttributeX>);
   constructor(nameOrPToken: string | ElementEmptyPToken, attributes?: ReadonlyArray<AttributeX>) {
      if (typeof nameOrPToken === 'string') {
         this.name = nameOrPToken;
         this.attributes = attributes ?? [];
      } else {
         const attributesX = [];

         for (const item of nameOrPToken.attributes) {
            attributesX.push(new AttributeX(item));
         }

         this.name = strOrBlank(nameOrPToken.name);
         this.attributes = attributesX;
         this.pToken = nameOrPToken;
      }
   }
}

export { ELEMENT_EMPTY_XTOKEN, ElementEmptyXToken };
