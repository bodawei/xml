/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import { Token as XmlToken } from './xmlToken.js';

/**********************************************************************\
 The text namespace provides the Text XToken type.  This is used
 to contain plain text. It is much like a CharData, except without the
 potential limitations of a CharData.A Text is often not directly
 parsed, but is instead the result of other processing (most notably
 used to contain text in an Entity or Attribute value which was already
 parsed in some other way).
\**********************************************************************/

const TEXT = 'TEXT';

class Text extends XmlToken {

   constructor(text, lTokens) {
      super(lTokens);

      this.text = text;
   }

}

/**********************************************************************\
 parse() extracts a series of char data.

 PARAM
 source: A LTokenSource to read from
 terminators: An array of characters that should be used to terminate
   the text.
 deliverPToken: Callback to deliver the parsed LTokens
\**********************************************************************/

function parse(source, terminators, deliverPToken) {
   const pToken = {
      type: TEXT,
   };

   source.extract('all', terminators, (lToken) => {
      pToken.text = lToken;
      deliverPToken(pToken);
   });
}

function makeXToken(pToken) {
   return new Text(pToken.text.text, [ pToken.text ]);
}

export {
   TEXT as TYPE,
   Text as Token,
   parse,
   makeXToken,
};
