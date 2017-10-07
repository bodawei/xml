/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import { WellFormedError } from '../error';

import {
   textOrBlank,
} from './common/util.js';
import * as misc from './common/misc.js';
import * as envelope from './envelope.js';
import { Token as XmlToken } from './xmlToken.js';

const CDATA = 'CDATA';
const WFEID = WellFormedError.ID;

/**********************************************************************\
 The cdata namespace contains the usual tools for processing
 a CDATA element
\**********************************************************************/

class Cdata extends XmlToken {

   constructor(text, lTokens) {
      super(lTokens);

      this.text = text;
   }

}

/**********************************************************************\
 parse() extracts a cdata.

 PARAM
 source: A LTokenSource to read from
 deliverParsed: Callback to deliver the parsed LTokens

 SYNTAX
   [14] CharData ::= [^<&]* - ([^<&]* ']]>' [^<&]*)
\**********************************************************************/

function parse(source, parsedEnvelope, deliverParsed) {
   const parsed = envelope.makeTypedEnvelope(CDATA, parsedEnvelope);

   source.extractToObject('all', [ ']]>' ], parsed, 'text');

   source.extract('match', ']]>', (lToken) => {
      parsed.close = lToken;
      deliverParsed(parsed);
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(parsed, ec, entityMetaData) {
   envelope.checkWellFormed(parsed, false, ec, entityMetaData);

   ec.setPos(parsed.text);
   misc.checkWellFormedText(parsed.text, ec, entityMetaData);

   ec.setPos(parsed.close);
   ec.check(!parsed.close, WFEID.CDATA_NO_CLOSE);
}

/**********************************************************************\
 makeToken() converts a parsed into a token.
\**********************************************************************/

function makeToken(parsed) {
   const token = new Cdata(textOrBlank(parsed.text), []);
   token.parsed = parsed;

   return token;
}

export {
   CDATA as TYPE,
   Cdata as Token,
   parse,
   checkWellFormed,
   makeToken,
};
