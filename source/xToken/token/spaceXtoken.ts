/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { strOrBlank } from 'basic';
import { SpacePToken } from 'token';

const SPACE_XTOKEN = 'SPACE_XTOKEN';

class SpaceXToken {
   public readonly type: typeof SPACE_XTOKEN = SPACE_XTOKEN;

   public readonly text: string;

   public pToken?: SpacePToken;

   constructor(text: string | SpacePToken) {
      if (typeof text === 'string') {
         this.text = text;
      } else {
         this.text = strOrBlank(text.text);
         this.pToken = text;
      }
   }
}

export { SPACE_XTOKEN, SpaceXToken };
