/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */

import { STokenSource, SToken } from 'sToken';


const CHARDATA_PTOKEN = 'CHARDATA_PTOKEN';


class CharDataPToken {
   public readonly type: typeof CHARDATA_PTOKEN = CHARDATA_PTOKEN;
   public readonly text: SToken;

   constructor(props: { text: SToken }) {
      this.text = props.text;
   }
}

/**********************************************************************\
 parse() extracts a series of char data.

 PARAM
 source: A STokenSource to read from
 otherTerminators: (optional) An array of strings that can serve
   as terminators for the character data
 deliverPToken: Callback to deliver the PToken

 SYNTAX
   §2.4:
      [14] CharData ::= [^<&]* - ([^<&]* ']]>' [^<&]*)
\**********************************************************************/

function parseCharData(source: STokenSource, otherTerminators: Array<string>, deliverPToken: (result: CharDataPToken|undefined) => void) {
   const terminators = [ '<', '&', ']]>' ].concat(otherTerminators);

   source.extract('all', terminators, (sToken) => {
      if (!sToken) {
         deliverPToken(undefined);
         return;
      }

      deliverPToken(new CharDataPToken({ text: sToken }));
   });
}

export {
   CHARDATA_PTOKEN,

   CharDataPToken,

   parseCharData,
};
