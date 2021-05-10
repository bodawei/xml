/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { TextPToken } from 'pToken';
import { strOrBlank } from 'sToken';

const TEXT_XTOKEN = 'TEXT_XTOKEN';

class TextXToken {
   public readonly type: typeof TEXT_XTOKEN = TEXT_XTOKEN;

   public readonly text: string;

   public pToken?: TextPToken;

   constructor(textOrPToken: string | TextPToken) {
      if (typeof textOrPToken === 'string') {
         this.text = textOrPToken;
      } else {
         this.text = strOrBlank(textOrPToken.text);
         this.pToken = textOrPToken;
      }
   }
}

function isTextXToken(item: unknown): item is TextXToken {
   if (!item) {
      return false;
   }

   return typeof item === 'object' && (item as { type: string }).type === TEXT_XTOKEN;
}

export { TEXT_XTOKEN, TextXToken, isTextXToken };
