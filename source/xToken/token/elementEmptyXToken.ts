/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { strOrBlank } from 'sToken';
import { ElementEmptyPToken } from 'token';

import attribute, { AttributeXToken } from '../../token/common/attribute';

const ELEMENT_EMPTY_XTOKEN = 'ELEMENT_EMPTY_XTOKEN';

class ElementEmptyXToken {
   public readonly type: typeof ELEMENT_EMPTY_XTOKEN = ELEMENT_EMPTY_XTOKEN;

   public readonly name: string;

   public readonly attributes: ReadonlyArray<AttributeXToken>;

   public pToken?: ElementEmptyPToken;

   constructor(pToken: ElementEmptyPToken);
   constructor(name: string, attributes: Array<AttributeXToken>);
   constructor(nameOrPToken: string | ElementEmptyPToken, attributes?: Array<AttributeXToken>) {
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

export { ELEMENT_EMPTY_XTOKEN, ElementEmptyXToken };
