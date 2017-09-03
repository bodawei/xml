/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import { Token as XmlToken } from './xmlToken.js';

/**********************************************************************\
 The text namespace provides the Text XToken type.  This is used
 to contain plain text. It is much like a CharData, except without the
 potential limitations of a CharData. Most notably, a Text is never
 directly parsed, but is instead the result of other processing
 (most notably used to contain text in an Entity or Attribute value
 which was already parsed in some other way).
\**********************************************************************/

const TEXT = 'TEXT';

class Text extends XmlToken {

   constructor(text, lTokens) {
      super(lTokens);

      this.text = text;
   }

}

export {
   TEXT as TYPE,
   Text as Token,
};
