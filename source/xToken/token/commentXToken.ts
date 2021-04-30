/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { CommentPToken } from 'token';

const COMMENT_XTOKEN = 'COMMENT_XTOKEN';

class CommentXToken {
   public readonly type: typeof COMMENT_XTOKEN = COMMENT_XTOKEN;

   public readonly text: string;

   public pToken?: CommentPToken;

   constructor(textOrPToken: string | CommentPToken) {
      if (typeof textOrPToken === 'string') {
         this.text = textOrPToken;
      } else {
         const texts = textOrPToken.text;
         const combinedTexts = texts.map((item) => item.str);

         this.text = combinedTexts.join('');
         this.pToken = textOrPToken;
      }
   }
}

export { COMMENT_XTOKEN, CommentXToken };
