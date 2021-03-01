/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { strOrBlank, STokenSource, SToken, STokenArrayBuilder } from 'sToken';

const SPACE_PTOKEN = 'SPACE_PTOKEN';
const SPACE_XTOKEN = 'SPACE_XTOKEN';

/**********************************************************************\
 The comment namespace contains the usual tools for processing XML
 comments
\**********************************************************************/

class SpaceXToken {
   public readonly type: typeof SPACE_XTOKEN = SPACE_XTOKEN;
   public readonly text: string;
   public pToken?: SpacePToken;

   constructor(text: string, pToken?: SpacePToken) {
      this.text = text;
      this.pToken = pToken;
   }
}

class SpacePToken {
   public readonly type: typeof SPACE_PTOKEN = SPACE_PTOKEN;
   public readonly text: SToken;

   constructor(props: { text: SToken }) {
      this.text = props.text;
   }

   toXToken() {
      return pTokenToXToken(this);
   }

   toSTokenArray(): Array<SToken> {
      return sTokensFromPToken(this);
   }
}

/**********************************************************************\
 parse() extracts a space, or undefined if no spaces.

 PARAM
 source: A STokenSource to read from
 deliverPToken: Callback to deliver the PToken

 SYNTAX
   §2.3
      [3] S ::= (#x20 | #x9 | #xD | #xA)+
\**********************************************************************/

function parseSpace(source: STokenSource, deliverPToken: (result: SpacePToken|void) => void) {
   source.extractNoParams('space', (sToken) => {
      if (!sToken) {
         deliverPToken(undefined);
         return;
      }

      deliverPToken(new SpacePToken({ text: sToken }));
   });
}

/**********************************************************************\
 pTokenToXToken() converts a PToken into an XToken.
\**********************************************************************/

function pTokenToXToken(pToken: SpacePToken) {
   return new SpaceXToken(strOrBlank(pToken.text), pToken);
}

/**********************************************************************\
 sTokensFromPToken() Returns the ordered array of the STokens
\**********************************************************************/

function sTokensFromPToken(pToken: SpacePToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(pToken.text);

   return builder.sTokenArray;
}

export {
   SPACE_PTOKEN,
   SPACE_XTOKEN,
   SpacePToken,
   SpaceXToken,

   parseSpace,
};
