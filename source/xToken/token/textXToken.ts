/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { TextPToken } from 'pToken';
import { strOrBlank } from 'sToken';

const TEXT_XTOKEN = 'TEXT_XTOKEN';

class TextXToken {
   public readonly type: typeof TEXT_XTOKEN = TEXT_XTOKEN;

   public readonly text: string;

   public pToken?: TextPToken;

   constructor(textOrPToken: string | TextPToken) {
      this.text = typeof textOrPToken === 'string' ? textOrPToken : strOrBlank(textOrPToken.text);
   }
}

function isTextXToken(item: unknown): item is TextXToken {
   if (!item) {
      return false;
   }

   const obj = typeof item === 'object' ? (item as { type: string }) : undefined;

   return !!obj && obj.type === TEXT_XTOKEN;
}

export { TEXT_XTOKEN, TextXToken, isTextXToken };
