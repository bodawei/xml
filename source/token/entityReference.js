/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { WellFormedError } from '../error';

import { Token as XmlToken } from './xmlToken.js';
import {
   pushNonBottom,
   textOrBlank,
 } from './util.js';

/**********************************************************************\
 The entityReference namespace has routines for processing general
 and parameter entity reference.
\**********************************************************************/

const ENTITY_REFERENCE = 'ENTITY_REFERENCE';
const WFEID = WellFormedError.ID;

class EntityReference extends XmlToken {

   constructor(name, lTokens) {
      super(lTokens);

      this.name = name;
   }

}

/**********************************************************************\
 parse() extracts the LToken's that make up an entity reference.

 This assumes that the initial & has not been extracted yet.

 PARAM
 source: A LTokenSource to read from
 deliverParsed: Callback to deliver the parsed lTokens

 SYNTAX
    [67] Reference   ::= EntityRef | CharRef
    [68] EntityRef   ::= '&' Name ';'
    [69] PEReference ::= '%' Name ';'
\**********************************************************************/

function parse(source, deliverParsed) {
   const parsed = {
      type: ENTITY_REFERENCE,
   };

   source.extractToObject('match', '&', parsed, 'open');
   source.extractToObject('space', parsed, 'postOpenSpace');
   source.extractToObject('word', [ ';' ], parsed, 'entityName');
   source.extractToObject('space', parsed, 'postEntityNameSpace');
   source.extract('match', [ ';' ], (lToken) => {
      parsed.close = lToken;
      deliverParsed(parsed);
   });
}

/**********************************************************************\
 checkWellFormed() does a well formed check on the parsed value.
\**********************************************************************/

function checkWellFormed(parsed, ec) {
   const entityName = textOrBlank(parsed.entityName);

   ec.setPos(parsed.open);
   ec.setPos(parsed.postOpenSpace);
   ec.check(parsed.postOpenSpace, WFEID.REFERENCE_XTRA_SPACE, [ entityName ]);

   ec.setPos(parsed.entityName);
   ec.check(!parsed.entityName, WFEID.REFERENCE_NO_NAME);

   ec.setPos(parsed.postEntityNameSpace);
   ec.check(parsed.postEntityNameSpace, WFEID.REFERENCE_XTRA_TRAILING_SPACE, [ entityName ]);

   ec.setPos(parsed.close);
   ec.check(!parsed.close, WFEID.REFERENCE_NO_SEMICOLON, [ entityName ]);
}

/**********************************************************************\
 makeToken() converts a parsed into a token.
\**********************************************************************/

function makeToken(parsed) {
   return new EntityReference(textOrBlank(parsed.name), getChunks(parsed));
}

function getChunks(parsed) {
   const results = [];

   pushNonBottom(results, parsed.open);
   pushNonBottom(results, parsed.postOpenSpace);
   pushNonBottom(results, parsed.entityName);
   pushNonBottom(results, parsed.postEntityNameSpace);
   pushNonBottom(results, parsed.close);

   return results;
}

export {
   ENTITY_REFERENCE as TYPE,
   EntityReference as Token,
   parse,
   checkWellFormed,
   makeToken,
};
