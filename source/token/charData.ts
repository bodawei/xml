/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { ErrorCollector } from 'error';
import { strOrBlank, STokenSource, SToken, STokenArrayBuilder } from 'sToken';

import misc from './common/misc';

const CHARDATA_PTOKEN = 'CHARDATA_PTOKEN';
const CHARDATA_XTOKEN = 'CHARDATA_XTOKEN';

/**********************************************************************\
 The charData namespace contains the usual tools for processing
 a run of CharData
\**********************************************************************/

class CharDataXToken {
   public readonly type: typeof CHARDATA_XTOKEN = CHARDATA_XTOKEN;
   public readonly text: string;
   public readonly pToken?: CharDataPToken;

   constructor(text: string, pToken?: CharDataPToken) {
      this.text = text;
      this.pToken = pToken;
   }

}

class CharDataPToken {
   public readonly type: typeof CHARDATA_PTOKEN = CHARDATA_PTOKEN;
   public readonly text: SToken;

   constructor(props: { text: SToken }) {
      this.text = props.text;
   }

   checkWellFormed(ec: ErrorCollector, confVer: ConformanceVersion) {
      return checkWellFormed(this, ec, confVer);
   }

   toXToken() {
      return pTokenToXToken(this);
   }

   toSTokenArray(): Array<SToken> {
      return sTokensFromPToken(this);
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
   let terminators = [ '<', '&', ']]>' ].concat(otherTerminators);

   source.extract('all', terminators, (sToken) => {
      if (!sToken) {
         deliverPToken(undefined);
         return;
      }

      deliverPToken(new CharDataPToken({ text: sToken }));
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(pToken: CharDataPToken, ec: ErrorCollector, confVer: ConformanceVersion) {
   ec.setPos(pToken.text);
   misc.checkCharWellFormed(pToken.text, ec, confVer);
}

/**********************************************************************\
 pTokenToXToken() converts a PToken into an XToken.
\**********************************************************************/

function pTokenToXToken(pToken: CharDataPToken) {
   return new CharDataXToken(strOrBlank(pToken.text), pToken);
}

/**********************************************************************\
 sTokensFromPToken() Returns the ordered array of the STokens
\**********************************************************************/

function sTokensFromPToken(pToken: CharDataPToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

   builder.add(pToken.text);

   return builder.sTokenArray;
}

export {
   CHARDATA_PTOKEN,
   CHARDATA_XTOKEN,

   CharDataPToken,
   CharDataXToken,

   parseCharData,
};
