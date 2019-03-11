/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */

import { SToken, STokenSource, strOrBlank, STokenArrayBuilder } from 'sToken';

type DeliverPToken = (token: TextPToken|void) => void;

/**********************************************************************\
 The text namespace provides the Text XToken type.  This is used
 to contain plain text. It is much like a CharData, except without the
 potential limitations of a CharData. A Text is often not directly
 parse()'d, but is instead the result of other processing (most notably
 used to contain text in an Entity or Attribute value which was already
 processed in some other way).
\**********************************************************************/

const TEXT_PTOKEN = 'TEXT_PTOKEN';
const TEXT_XTOKEN = 'TEXT_XTOKEN';

class TextXToken {
   public readonly type: typeof TEXT_XTOKEN = TEXT_XTOKEN;
   public readonly text: string;
   public pToken?: TextPToken;

   constructor(text: string, pToken?: TextPToken) {
      this.text = text;
      this.pToken = pToken;
   }

}

class TextPToken {
   public readonly type: typeof TEXT_PTOKEN = TEXT_PTOKEN;
   public readonly text: SToken;

   constructor(props: TextPToken | { text: SToken }) {
      this.text = props.text;
   }

   toXToken() {
      return pTokenToXToken(this);
   }

   toSTokenArray() {
      return sTokensFromPToken(this);
   }
}

function isTextPToken(item: any): item is TextPToken {
   return item.type === TEXT_PTOKEN;
}

function isTextXToken(item: any): item is TextXToken {
   return item.type === TEXT_XTOKEN;
}

/**********************************************************************\
 parse() extracts a series of char data.

 PARAM
 source: A STokenSource to read from
 terminators: An array of characters that should be used to terminate
   the text.
 deliverPToken: Callback to deliver the PToken
\**********************************************************************/

function parseText(source: STokenSource, terminators: Array<string>, deliverPToken: DeliverPToken) {
   source.extract('all', terminators, (sToken) => {
      deliverPToken(sToken ? new TextPToken({ text: sToken }) : undefined);
   });
}

/**********************************************************************\
 pTokenToXToken
\**********************************************************************/

function pTokenToXToken(pToken: TextPToken) {
   return new TextXToken(strOrBlank(pToken.text), pToken);
}

/**********************************************************************\
 sTokensFromPToken() Returns the ordered array of the component STokens
\**********************************************************************/

function sTokensFromPToken(pToken: TextPToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(pToken.text);

   return builder.sTokenArray;
}

export {
   TEXT_PTOKEN,
   TEXT_XTOKEN,
   TextPToken,
   TextXToken,

   parseText,
   isTextPToken,
   isTextXToken
};