/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { WellFormedError } from '../error';
import { XmlWarning } from '../error';

import { Token as XmlToken } from './xmlToken.js';
import * as misc from './misc.js';
import * as externalId from './externalId.js';
import * as quotedValue from './quotedValue.js';
import {
   pushNonBottom,
   textOrBlank,
   toLocalParsing,
} from './util.js';

/**********************************************************************\
 The entityDeclaration namespace contains the usual functionality for
 parsing, validating and tokenizing an XML Entity and ParameterEntity
 declaration.
\**********************************************************************/

const ENTITYDECL = 'ENTITYDECL';
const WFEID = WellFormedError.ID;
const WARN = XmlWarning.ID;

class EntityDeclaration extends XmlToken {

   constructor(name, value, externalLoc, notationDataName, lTokens) {
      super(lTokens);

      this.name = name;
      this.value = value;
      this.externalLoc = externalLoc;
      this.notationDataName = notationDataName;
      this.isParameter = false;
   }

}

class ParameterEntityDeclaration extends EntityDeclaration {
   constructor(name, value, externalLoc, notationDataName, lTokens) {
      super(name, value, externalLoc, notationDataName, lTokens);
      this.isParameter = true;
   }
}

/**********************************************************************\
 parse() extracts extracts the LTokens that make up a general or
 parameteter entity declaration.

 As is common with all declaration things, the LTokens for the
 "<!DOCTYPE S" part are passed in as the second argument.

 PARAM
   source: A LTokenSource to read from
   declarationParsing: A map with the LTokens from parsing "<!DOCTYPE S"
   deliverParsed: Callback to deliver the parsed lTokens

 SYNTAX
   [70] EntityDecl  ::= GEDecl | PEDecl
   [71] GEDecl      ::= '<!ENTITY' S Name S EntityDef S? '>'
   [72] PEDecl      ::= '<!ENTITY' S '%' S Name S PEDef S? '>'
   [73] EntityDef   ::= EntityValue | (ExternalID NDataDecl?)
   [74] PEDef       ::= EntityValue | ExternalID
   [76] NDataDecl   ::= S 'NDATA' S Name
    [9] EntityValue ::= '"' ([^%&"] | PEReference | Reference)* '"' |
                        "'" ([^%&'] | PEReference | Reference)* "'"
\**********************************************************************/

function parse(source, declarationParsing, deliverParsed) {
   const parsed = toLocalParsing(ENTITYDECL, declarationParsing);

   source.extract('peekChar', (lToken) => {
      if (!lToken) {
         deliverParsed(parsed);
         return;
      }

      if (lToken.text === '%') {
         source.extractToObject('char', parsed, 'parameter');
         source.extractToObject('space', parsed, 'postParameterSpace');
      }

      source.extractToObject('word', [ '>', '"', '\'' ], parsed, 'name');
      source.extractToObject('space', parsed, 'postNameSpace');

      source.extract('peekChar', (lToken) => {
         if (!lToken) {
            deliverParsed(parsed);
            return;
         }

         if (lToken.text === '"' || lToken.text === '\'') {
            quotedValue.parse(source, (result) => {
               parsed.entityValue = result;
               parseClose(source, parsed, 'postEntityValueSpace', deliverParsed);
            });
         } else {
            externalId.parse(source, [ '>' ], (externalId) => {
               parsed.externalId = externalId;
               if (!externalId) {
                  parseClose(source, parsed, undefined, deliverParsed);
                  return;
               }

               source.extractToObject('space', parsed, 'postExternalIdSpace');
               source.extract('peekWord', [ '>' ], (lToken) => {
                  if (lToken && lToken.text.toLocaleUpperCase() === 'NDATA') {
                     source.extractToObject('word', [ '>' ], parsed, 'nData');
                     source.extractToObject('space', parsed, 'postNDataSpace');
                     source.extractToObject('word', [ '>' ], parsed, 'nDataName');
                     parseClose(source, parsed, 'postNDataNameSpace', deliverParsed);
                  } else {
                     parseClose(source, parsed, undefined, deliverParsed);
                  }
               });
            });
         }
      });
   });
}

function parseClose(source, parsed, propName, deliverParsed) {
   if (propName) {
      source.extractToObject('space', parsed, propName);
   }
   source.extract('match', '>', (lToken) => {
      parsed.close = lToken;
      deliverParsed(parsed);
   });
}

/**********************************************************************\
 checkWellFormed() does normal validation.
\**********************************************************************/

function checkWellFormed(parsed, ec, entityMetaData) {
   const enNameText = textOrBlank(parsed.name);
   ec.setPos(parsed.open);

   // 1. Do general check on a declaration here. including space after entity

   ec.setPos(parsed.parameter);
   if (parsed.parameter) {
      ec.setPos(parsed.postParameterSpace);
      ec.check(!parsed.postParameterSpace, WFEID.ENTITYDECL_PERCENT_NO_TRAILING_SPACE, [ enNameText ]);
   }

   ec.setPos(parsed.name);
   ec.check(!parsed.name, WFEID.ENTITYDECL_NO_NAME);
   ec.checkName(parsed.name, WFEID.ENTITYDECL_NAME_INVALID, parsed.open);
   misc.checkWellFormedNameRecommendation(parsed.name, ec, entityMetaData,
      WARN.ENTITYDECL_NAME_XMLDASH_RESERVED, WARN.ENTITYDECL_NAME_XML_RESERVED);
   ec.setPos(parsed.postNameSpace);
   ec.check(!parsed.postNameSpace, WFEID.ENTITYDECL_NAME_NO_TRAILING_SPACE, [ enNameText ]);

   if (parsed.externalId) {
      this._validateExternalId(parsed.externalId, ec, true);

      if (parsed.nData) {
         ec.check(parsed.nData.text !== 'NDATA', WFEID.ENTITYDECL_NDATA_INVALID_CASE,
            [ enNameText, parsed.nData.text ]);
         ec.check(!parsed.nDataName, WFEID.ENTITYDECL_NDATA_NO_NAME, [ enNameText ]);
      // 3. XmlText.validateText(parsed.nDataName, this._entityMd, parsed.start, this);
      }
   } else if (parsed.entityValue) {
      // 4. this._validateParsedQuotedValue(parsed.value, {
      //    validateEntityValue: true
      // });
   } else {
      ec.report(WFEID.ENTITYDECL_NO_VALUE, [ enNameText ]);
   }

   ec.setPos(parsed.close);
   ec.check(!parsed.close, WFEID.ENTITYDECL_NO_CLOSE, [ enNameText ]);
}

/**********************************************************************\
 makeToken() makes either a general or parmaeter entity token based
 on the parsed value.
\**********************************************************************/

function makeToken(parsed) {
   const entityClass = parsed.parameter ? ParameterEntityDeclaration : EntityDeclaration;

   return new entityClass(textOrBlank(parsed.name),
      textOrBlank(parsed.entityValue ? parsed.entityValue.value : undefined),
      {},
      textOrBlank(parsed.nDataName),
      getLTokens(parsed));
}

function getLTokens(parsed) {
   const results = [];

   pushNonBottom(results, parsed.open);
   pushNonBottom(results, parsed.postOpenSpace);
   pushNonBottom(results, parsed.declType);
   pushNonBottom(results, parsed.postDeclTypeSpace);
   pushNonBottom(results, parsed.parameter);
   pushNonBottom(results, parsed.postParameterSpace);
   pushNonBottom(results, parsed.name);
   pushNonBottom(results, parsed.postNameSpace);
   quotedValue.getChunks(results, parsed.entityValue);
   externalId.getLTokens(results, parsed.externalId);
   pushNonBottom(results, parsed.postEntityValueSpace);
   pushNonBottom(results, parsed.postExternalIdSpace);

   pushNonBottom(results, parsed.nData);
   pushNonBottom(results, parsed.postNDataSpace);
   pushNonBottom(results, parsed.nDataName);
   pushNonBottom(results, parsed.postNDataNameSpace);

   pushNonBottom(results, parsed.close);

   return results;
}

export {
   ENTITYDECL as TYPE,
   EntityDeclaration as Token,
   ParameterEntityDeclaration as ParamToken,
   parse,
   checkWellFormed,
   makeToken,
};
