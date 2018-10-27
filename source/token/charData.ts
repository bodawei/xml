/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import {
   textOrBlank,
} from './common/misc';
import misc from './common/misc';
import base from './base';
import { STokenSource } from 'sToken';
import { ErrorCollector } from 'error';
import { EntityMetaData } from 'basic';

const CHARDATA = 'CHARDATA';
const CHARDATA_XTOKEN = 'CHARDATA_XTOKEN';

/**********************************************************************\
 The charData namespace contains the usual tools for processing
 a run of CharData
\**********************************************************************/

class CharData extends base.XToken {
   public text: string;

   /* istanbul ignore next */ // Istanbul is confused by node transpilation
   constructor(text: string, pToken?: CharDataPToken) {
      super(CHARDATA_XTOKEN, pToken);

      this.text = text;
   }

}

class CharDataPToken extends base.PToken {
   /* istanbul ignore next */ // Istanbul is confused by node transpilation
   constructor(props?: Object) {
      super(CHARDATA, props);
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
 otherTerminators: (optional) An array of strings that can serve
   as terminators for the character data
 deliverPToken: Callback to deliver the PToken

 SYNTAX
   [14] CharData ::= [^<&]* - ([^<&]* ']]>' [^<&]*)
\**********************************************************************/

function parse(source: STokenSource, otherTerminators: Array<string>, deliverPToken: (result: CharDataPToken) => void) {
   let terminators = [ '<', '&', ']]>' ];
   if (typeof otherTerminators === 'function') {
      deliverPToken = otherTerminators;
   } else {
      terminators = terminators.concat(otherTerminators);
   }

   const pToken = new CharDataPToken();

   source.extract('all', terminators, (sToken) => {
      pToken.text = sToken;
      deliverPToken(pToken);
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(pToken: CharDataPToken, ec: ErrorCollector, entityMetaData: EntityMetaData) {
   ec.setPos(pToken.text);
   misc.checkWellFormedText(pToken.text, ec, entityMetaData);
}

/**********************************************************************\
 pTokenToXToken() converts a PToken into an XToken.
\**********************************************************************/

function pTokenToXToken(pToken: CharDataPToken) {
   return new CharData(textOrBlank(pToken.text), pToken);
}

export {
   CHARDATA as PTYPE,
   CHARDATA_XTOKEN as XTYPE,
   CharData as XToken,
   CharDataPToken as PToken,
   parse,
   checkWellFormed,
   pTokenToXToken,

   CharDataPToken,
};
