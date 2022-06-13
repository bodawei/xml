/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { Transform } from 'stream';
import { ParseToken } from 'pToken';
import { COMMENT_PTOKEN, CommentPToken } from 'token';
import { SToken } from 'basic';

const CHARREF_REGEX = /(&#(x?)([a-fA-F0-9]+);)/g;

function replaceCharRefsInComment(token: CommentPToken): CommentPToken {
   const commentTexts = token.text;
   const newText = [];

   for (const part of commentTexts) {
      CHARREF_REGEX.lastIndex = 0;

      let match = CHARREF_REGEX.exec(part.str);
      let newStr = part.str;

      while (match) {
         const isHex = match[2];
         const digits = match[3];
         let number: number;

         if (isHex) {
            number = parseInt(digits, 16);
         } else {
            number = parseInt(digits, 10);
         }

         newStr = newStr.replace(match[1], String.fromCharCode(number));
         match = CHARREF_REGEX.exec(part.str);
      }

      newText.push(new SToken(newStr, part.originalStr, part.ranges));
   }

   return new CommentPToken({
      ...token,
      text: newText,
   });
}

/**********************************************************************\
 A trivial transforming stream that decodes any character references
 in comments.  Thus a comment like
   <!-- This is &#97; test -->
 would emerge as
   <!-- This is a test -->
 All other tokens are passed through unchanged
\**********************************************************************/

class CommentExpanderStream extends Transform {
   constructor() {
      super({ objectMode: true });
   }

   _transform(token: ParseToken, encoding: string, done: () => void) {
      if (token.type === COMMENT_PTOKEN) {
         this.push(replaceCharRefsInComment(token));
      } else {
         this.push(token);
      }

      done();
   }
}

export { CommentExpanderStream };
