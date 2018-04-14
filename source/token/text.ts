/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

import base from './base';
import { SToken, STokenSource } from '../sToken/';

type DeliverPToken = (token: TextPToken) => void;

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
   public text: string;

   constructor(text: string, pToken: TextPToken) {
      super(pToken);

      this.text = text;
   }

}

class TextPToken extends base.PToken {
   public text: SToken;

   constructor(props?: Object) {
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

function parse(source: STokenSource, terminators: Array<string>, deliverPToken: DeliverPToken) {
   const pToken = new TextPToken();

   source.extract('all', terminators, (sToken) => {
      pToken.text = sToken;
      deliverPToken(pToken);
   });
}

function makeXToken(pToken: TextPToken) {
   return new Text(pToken.text.str, pToken);
}

const text = {
   PTYPE: TEXT,
   PToken: TextPToken,
   XToken: Text,
   parse,
   makeXToken,
};

export default text;
export { TextPToken };