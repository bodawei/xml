/* Copyright ® 2016-2017 by David John Burrowes. All rights reserved. */

import stream from 'readable-stream';

import { comment } from '../token';

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
class CommentFixer extends stream.Transform {

   constructor() {
      super({
         objectMode: true,
      });
   }

   _transform(token, encoding, callback) {
      if (token instanceof comment.XToken && token.text.indexOf('&#') !== -1) {
         adjustCommentContent(token);
      }

      this.push(token);

      callback();
   }

}

function adjustCommentContent(token) {
   const contentParts = token.text.split('&#');
   const results = [];

   results.push(contentParts[0]);

   for (let index = 1; index < contentParts.length; index++) {
      const part = contentParts[index];
      let numberAndMore;
      let number;

      if (part[0] === 'x') {
         numberAndMore = HEX_REGEX.exec(part);
         number = parseInt(numberAndMore[1], 16);
      } else {
         numberAndMore = DEC_REGEX.exec(part);
         number = parseInt(numberAndMore[1], 10);
      }

      results.push(String.fromCharCode(number));
      results.push(numberAndMore[2]);
   }

   token.text = results.join('');
}

export default CommentFixer;
