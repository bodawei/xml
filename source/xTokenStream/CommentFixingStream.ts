/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { Transform } from 'stream';

import { COMMENT_XTOKEN, CommentXToken } from 'xToken';

const HEX_REGEX = /^x([A-Fa-f0-9]+);(.*)$/;
const DEC_REGEX = /^([0-9]+);(.*)$/;

/**********************************************************************\
 A trivial transforming stream that decodes any character references
 in comments.  Thus a comment like
   <!-- This is &#97; test -->
 would emerge as
   <!-- This is a test -->
 all other XmlTokens and errors are passed through without alteration.
\**********************************************************************/
class CommentFixingStream extends Transform {

   /* istanbul ignore next */ // Istanbul is confused by node transpilation
   constructor() {
      super({
         objectMode: true,
      });
   }

   _transform(token: any, encoding: string, callback: () => void) {
      if (token.type === COMMENT_XTOKEN && token.text.indexOf('&#') !== -1) {
         token = replaceCharRefsInComment(token);
      }

      this.push(token);

      callback();
   }

}

function replaceCharRefsInComment(token: CommentXToken) {
   const contentParts = token.text.split('&#');
   const results = [];

   /*
    * Content parts now is the (possibly empty) text before the first &#,
    * then each segment after the &# up to the next
    */

   results.push(contentParts[0]);

   for (let index = 1; index < contentParts.length; index++) {
      const part = contentParts[index];
      const isHex = part[0] === 'x';
      let numberAndFollowingText;

      if (isHex) {
         numberAndFollowingText = HEX_REGEX.exec(part);
      } else {
         numberAndFollowingText = DEC_REGEX.exec(part);
      }

      if (!numberAndFollowingText) {
         // didn't match (digits);(other)
         results.push(`&#${part}`);
      } else {
         let number;

         if (isHex) {
            number = parseInt(numberAndFollowingText[1], 16);
         } else {
            number = parseInt(numberAndFollowingText[1], 10);
         }

         results.push(String.fromCharCode(number));
         results.push(numberAndFollowingText[2]);
      }
   }

   return new CommentXToken(results.join(''));
}

export default CommentFixingStream;
