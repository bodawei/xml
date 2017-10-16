/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { WellFormedError } from '../error';

import { Token as XmlToken } from './xmlToken.js';
import {
   pushNonBottom,
   textOrBlank,
 } from './common/util.js';

/**********************************************************************\
 The entityReference namespace has routines for processing general
 and parameter entity reference.
\**********************************************************************/

const ENTITYREF = 'ENTITYREF';
const PARAMETERENTITYREF = 'PARAMETERENTITYREF';
const WFEID = WellFormedError.ID;

class EntityReference extends XmlToken {

   constructor(name, lTokens) {
      super(lTokens);

      this.name = name;
   }

}

class ParameterEntityReference extends EntityReference {
}

/**********************************************************************\
 parse() extracts the LToken's that make up a general entity reference.

 This assumes that the initial & has not been extracted yet.

 PARAM
 source: A LTokenSource to read from
 deliverParsed: Callback to deliver the parsed lTokens

 SYNTAX
    [67] Reference   ::= EntityRef | CharRef
    [68] EntityRef   ::= '&' Name ';'
\**********************************************************************/

function parse(source, deliverParsed) {
   const parsed = {
      type: ENTITYREF,
   };

   source.extractToObject('match', '&', parsed, 'open');
   parseRef(source, parsed, deliverParsed);
}

/**********************************************************************\
 parse() extracts the LToken's that make up a parameter entity ref.

 This assumes that the initial % has not been extracted yet.

 PARAM
 source: A LTokenSource to read from
 deliverParsed: Callback to deliver the parsed lTokens

 SYNTAX
    [69] PEReference ::= '%' Name ';'
\**********************************************************************/

function paramParse(source, deliverParsed) {
   const parsed = {
      type: PARAMETERENTITYREF,
   };

   source.extractToObject('match', '%', parsed, 'open');
   parseRef(source, parsed, deliverParsed);
}

function parseRef(source, parsed, deliverParsed) {
   source.extractToObject('space', parsed, 'postOpenSpace');
   source.extractToObject('word', [ ';' ], parsed, 'name');
   source.extractToObject('space', parsed, 'postEntityNameSpace');
   source.extract('match', ';', (lToken) => {
      parsed.close = lToken;
      deliverParsed(parsed);
   });
}

/**********************************************************************\
 checkWellFormed() does a well formed check on the parsed value.
\**********************************************************************/

function checkWellFormed(parsed, ec) {
   const entityName = textOrBlank(parsed.name);

   ec.setPos(parsed.open);
   ec.setPos(parsed.postOpenSpace);
   ec.check(parsed.postOpenSpace, WFEID.REFERENCE_XTRA_SPACE, [ entityName ]);

   ec.setPos(parsed.name);
   ec.check(!parsed.name, WFEID.REFERENCE_NO_NAME);

   ec.setPos(parsed.postEntityNameSpace);
   ec.check(parsed.postEntityNameSpace, WFEID.REFERENCE_XTRA_TRAILING_SPACE, [ entityName ]);

   ec.setPos(parsed.close);
   ec.check(!parsed.close, WFEID.REFERENCE_NO_SEMICOLON, [ entityName ]);
}

/**********************************************************************\
 makeToken() converts a parsed into a token.
\**********************************************************************/

function makeToken(parsed) {
   let refClass = EntityReference;

   if (parsed.open && parsed.open.text === '%') {
      refClass = ParameterEntityReference;
   }

   return new refClass(textOrBlank(parsed.name), getChunks(parsed));
}

function getChunks(parsed) {
   const results = [];

   pushNonBottom(results, parsed.open);
   pushNonBottom(results, parsed.postOpenSpace);
   pushNonBottom(results, parsed.name);
   pushNonBottom(results, parsed.postEntityNameSpace);
   pushNonBottom(results, parsed.close);

   return results;
}

export {
   ENTITYREF as TYPE,
   PARAMETERENTITYREF as PARAM_TYPE,
   EntityReference as Token,
   ParameterEntityReference as ParamToken,
   parse,
   paramParse,
   checkWellFormed,
   makeToken,
};
