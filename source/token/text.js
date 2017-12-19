/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import * as base from './base.js';

/**********************************************************************\
 The text namespace provides the Text XToken type.  This is used
 to contain plain text. It is much like a CharData, except without the
 potential limitations of a CharData. A Text is often not directly
 parse()'d, but is instead the result of other processing (most notably
 used to contain text in an Entity or Attribute value which was already
 processed in some other way).
\**********************************************************************/

const TEXT = 'TEXT';

class Text extends base.XToken {

   constructor(text, pToken) {
      super(pToken);

      this.text = text;
   }

}

class TextPToken extends base.PToken {
   constructor(props) {
      super(TEXT, props);
   }

   getSTokenArray() {
      const results = super.getSTokenArray();

      results.pushSTokens(this.text);

      return results;
   }
}
/**********************************************************************\
 parse() extracts a series of char data.

 PARAM
 source: A STokenSource to read from
 terminators: An array of characters that should be used to terminate
   the text.
 deliverPToken: Callback to deliver the PToken
\**********************************************************************/

function parse(source, terminators, deliverPToken) {
   const pToken = new TextPToken();

   source.extract('all', terminators, (sToken) => {
      pToken.text = sToken;
      deliverPToken(pToken);
   });
}

function makeXToken(pToken) {
   return new Text(pToken.text.text, pToken);
}

export {
   TEXT as PTYPE,
   TextPToken as PToken,
   Text as XToken,
   parse,
   makeXToken,
};
