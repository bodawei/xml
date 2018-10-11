/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import { WellFormedError } from '../error';

import misc from './common/misc.js';
import * as envelope from './bridge/envelope.js';
import base from './base';

const CDATA = 'CDATA';
const CDATA_XTOKEN = 'CDATA_XTOKEN';
const WFEID = WellFormedError.ID;

/**********************************************************************\
 The cdata namespace contains the usual tools for processing
 a CDATA element
\**********************************************************************/

class Cdata extends base.XToken {

   constructor(text, sTokens) {
      super(CDATA_XTOKEN, sTokens);

      this.text = text;
   }

}

class CdataPToken extends envelope.PToken {
   constructor(props) {
      /* istanbul ignore next */ // Istanbul is confused by transpilation
      super(CDATA, props);
   }

   getSTokenArray() {
      const results = super.getSTokenArray(this);

      results.pushSTokens(this.text, this.close);

      return results;
   }
}

/**********************************************************************\
 parse() extracts a cdata.

 PARAM
 source: An STokenSource to read from
 deliverPToken: Callback to deliver the PToken

 SYNTAX
   [18] CDSect  ::= CDStart CData CDEnd
   [19] CDStart ::= '<![CDATA['
   [20] CData   ::= (Char* - (Char* ']]>' Char*))
   [21] CDEnd   ::= ']]>'
\**********************************************************************/

function parse(source, envelopePToken, deliverPToken) {
   const cDataPToken = new CdataPToken(envelopePToken);

   source.extractToObject('all', [ ']]>' ], cDataPToken, 'text');

   source.extract('match', ']]>', (sToken) => {
      cDataPToken.close = sToken;
      deliverPToken(cDataPToken);
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(pToken, ec, entityMetaData) {
   envelope.checkWellFormed(pToken, false, ec, entityMetaData);

   ec.setPos(pToken.text);
   misc.checkWellFormedText(pToken.text, ec, entityMetaData);

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.CDATA_NO_CLOSE);
}

/**********************************************************************\
 pTokenToXToken() converts a PToken into an XToken.
\**********************************************************************/

function pTokenToXToken(pToken) {
   const token = new Cdata(misc.textOrBlank(pToken.text), pToken);

   return token;
}

export {
   CDATA as PTYPE,
   CDATA_XTOKEN as XTYPE,
   Cdata as XToken,
   CdataPToken as PToken,
   parse,
   checkWellFormed,
   pTokenToXToken,
};
