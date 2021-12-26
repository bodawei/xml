/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { STokenSource, SToken } from 'sToken';

const SPACE_PTOKEN = 'SPACE_PTOKEN';

/**********************************************************************\
 The comment namespace contains the usual tools for processing XML
 comments
\**********************************************************************/
class SpacePToken {
   public readonly type: typeof SPACE_PTOKEN = SPACE_PTOKEN;
   public readonly text: SToken;

   constructor(props: { text: SToken }) {
      this.text = props.text;
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

function parseSpace(source: STokenSource, deliverPToken: (result: SpacePToken|undefined) => void) {
   source.extractNoParams('space', (sToken) => {
      if (!sToken) {
         deliverPToken(undefined);
         return;
      }

      deliverPToken(new SpacePToken({ text: sToken }));
   });
}

export {
   SPACE_PTOKEN,
   SpacePToken,

   parseSpace,
};
