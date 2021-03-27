/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { strOrBlank } from 'sToken';
import { ElementStartPToken } from 'token';

import attribute, { AttributeXToken } from '../../token/common/attribute';

const ELEMENT_START_XTOKEN = 'ELEMENT_START_XTOKEN';

class ElementStartXToken {
   public readonly type: typeof ELEMENT_START_XTOKEN = ELEMENT_START_XTOKEN;

   public readonly name: string;

   public readonly attributes: ReadonlyArray<AttributeXToken>;

   public pToken?: ElementStartPToken;

   constructor(pToken: ElementStartPToken);
   constructor(name: string, attributes: Array<AttributeXToken>);
   constructor(nameOrPToken: string | ElementStartPToken, attributes?: Array<AttributeXToken>) {
      if (typeof nameOrPToken === 'string') {
         this.name = nameOrPToken;
         this.attributes = attributes ?? [];
      } else {
         this.name = strOrBlank(nameOrPToken.name);
         this.attributes = attribute.makeTokenCompatible(nameOrPToken.attributes);
         this.pToken = nameOrPToken;
      }
   }
}

export { ELEMENT_START_XTOKEN, ElementStartXToken };
