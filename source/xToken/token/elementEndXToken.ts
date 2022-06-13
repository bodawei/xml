/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { ElementEndPToken } from 'token';
import { strOrBlank } from 'basic';

const ELEMENT_END_XTOKEN = 'ELEMENT_END_XTOKEN';

class ElementEndXToken {
   public readonly type: typeof ELEMENT_END_XTOKEN = ELEMENT_END_XTOKEN;

   public readonly name: string;

   public pToken?: ElementEndPToken;

   constructor(nameOrPToken: string | ElementEndPToken) {
      if (typeof nameOrPToken === 'string') {
         this.name = nameOrPToken;
      } else {
         this.name = strOrBlank(nameOrPToken.name);
         this.pToken = nameOrPToken;
      }
   }
}

export { ELEMENT_END_XTOKEN, ElementEndXToken };
