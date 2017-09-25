/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { WellFormedError } from '../error';

import {
   pushNonBottom,
   textOrBlank,
} from './common/util.js';
import * as instruction from './instruction.js';
import * as attribute from './common/attribute.js';
import { Token as XmlToken } from './xmlToken.js';

/**********************************************************************\
 The xmlDeclaration namespace contains the usual routines for parsing,
 validating and tokenizing an XML Declaration.
\**********************************************************************/

const WFEID = WellFormedError.ID;
const XMLDECL = 'XMLDECL';
const XMLDECL_NAME_TERMINATORS = [ '?>' ];
const XMLDECL_PARAMS = {
   version: 'version',
   encoding: 'encoding',
   standalone: 'standalone',
};
const ENCODING_REGEXP = /^[A-Za-z][-A-Za-z0-9._]*$/;

class XmlDeclaration extends XmlToken {

   constructor(params, lTokens) {
      super(lTokens);
      this.params = params;
   }

}

/**********************************************************************\
 parse() extracts the LTokens of an XML Declaration.

 This assumes that the "<?xml " has already been parsed, and those
 lTokens are passed in through piParsing.

 PARAM
 source: A LTokenSource to read from
 piParsing: A map of values already parsed in the process of consuming
      a processing instruction
 deliverParsed: Callback to deliver the parsed lTokens

 SYNTAX
   [23] XMLDecl      ::= '<?xml' VersionInfo EncodingDecl?
                         SDDecl? S? '?>'
   [24] VersionInfo  ::= S 'version' Eq ("'" VersionNum "'" |
                         '"' VersionNum '"')
   [25] Eq           ::= S? '=' S?
   [26] VersionNum   ::= '1.' [0-9]+
   [32] SDDecl       ::= S 'standalone' Eq (("'" ('yes' | 'no')"'") |
                         ('"' ('yes' | 'no') '"'))
   [80] EncodingDecl ::= S 'encoding' Eq ('"' EncName '"' |
                         "'" EncName "'" )
   [81] EncName      ::= [A-Za-z] ([A-Za-z0-9._] | '-')*
\**********************************************************************/

function parse(source, piParsing, deliverParsed) {
   const parsed = {
      type: XMLDECL,
      open: piParsing.open,
      postOpenSpace: piParsing.postOpenSpace,
      target: piParsing.target,
      postTargetSpace: piParsing.postTargetSpace,
   };

   attribute.parse(source, { terminators: XMLDECL_NAME_TERMINATORS}, (params) => {
      parsed.params = params;
      source.extract('match', '?>', (lToken) => {
         parsed.close = lToken;
         deliverParsed(parsed);
      });
   });
}

/**********************************************************************\
 Do well formed checking on the parsed results from the parse().
\**********************************************************************/

function checkWellFormed(parsed, ec, entityMetaData) {
   const checks = makeNameCheckClosure();

   instruction.checkWellFormed(parsed, ec, entityMetaData, true);

   // check that the parameters are in the right order and have the right values
   attribute.checkWellFormed(parsed.params, ec, entityMetaData,
      parsed.postTargetSpace, WFEID.NOUN_XMLDECL_PARAM, checks.checkName, checkValue);

   ec.setPos(parsed.close);
   if (entityMetaData.isDocumentKind) {
      ec.check(parsed.params.length === 0, WFEID.XMLDECL_NO_ATTRIBUTES);
   } else {
      ec.check(parsed.params.length === 0, WFEID.TEXTDECL_NO_ATTRIBUTES);
      ec.check(!checks.foundEncoding(), WFEID.TEXTDECL_NO_ENCODING);
   }

   ec.check(!parsed.close, WFEID.XMLDECL_NO_CLOSE);
}

/*
 * This odd function exists because we need a checkName() function to pass
 * to attribute.checkWellFormed() which maintains state across calls, as
 * well as a flag whether an ancoding was found.
 */
function makeNameCheckClosure() {
   let foundEncoding;
   let foundVersion;
   let seenStandalone;

   // Inner function as we need to have closure over a couple variables that exist across calls.
   function checkName(name, index, ec, entityMetaData) {
      const nameText = textOrBlank(name);
      const lcName = nameText.toLocaleLowerCase();

      if (XMLDECL_PARAMS[lcName]) {
         ec.check(nameText !== lcName, WFEID.XMLDECL_ATTR_INVALID_CASE, [ lcName, nameText ]);
      }

      switch (lcName) {
         case 'version':
            foundVersion = true;
            ec.check(index !== 0, WFEID.XMLDECL_VERSION_INVALID_ORDER, [ index ]);
            break;
         case 'encoding':
            foundEncoding = true;
            if (entityMetaData.isDocumentKind) {
               ec.check(!foundVersion || seenStandalone, WFEID.XMLDECL_ENCODING_INVALID_ORDER);
            }
            break;
         case 'standalone':
            seenStandalone = true;
            if (!entityMetaData.isDocumentKind) {
               ec.report(WFEID.TEXTDECL_XTRA_STANDALONE);
            }

            ec.check(!foundVersion, WFEID.XMLDECL_STANDALONE_INVALID_ORDER);
            break;
         default:
            ec.report(WFEID.XMLDECL_ATTR_UNKNOWN, [ nameText ]);
      }
   }

   function getFoundEncoding() {
      return foundEncoding;
   }

   return {
      checkName,
      foundEncoding: getFoundEncoding,
   };
}

function checkValue(name, value, ec) {
   const nameText = textOrBlank(name);
   const lcName = nameText.toLocaleLowerCase();
   const valueText = textOrBlank(value);
   const lcValue = valueText.toLocaleLowerCase();

   switch (lcName) {
      case 'version':
         ec.check(valueText !== '1.1' && valueText !== '1.0', WFEID.XMLDECL_VERSION_INVALD, [ valueText ]);
         break;
      case 'encoding':
         ec.check(!valueText.match(ENCODING_REGEXP), WFEID.XMLDECL_ENCODING_INVALID, [ valueText ]);
         break;
      case 'standalone':
         ec.check(lcValue !== 'no' && lcValue !== 'yes', WFEID.XMLDECL_STANDALONE_INVALID, [ valueText ]);
         ec.check(valueText !== lcValue, WFEID.XMLDECL_STANDALONE_INVALID_CASE, [ lcValue, valueText ]);
         break;
   }
}

/**********************************************************************\
 Convert a parsed value into a token.
\**********************************************************************/

function makeToken(parsed) {
   return new XmlDeclaration(attribute.makeTokenCompatible(parsed.params), getChunks(parsed));
}

function getChunks(parsed) {
   const results = [];

   pushNonBottom(results, parsed.open);
   pushNonBottom(results, parsed.postOpenSpace);
   pushNonBottom(results, parsed.target);
   pushNonBottom(results, parsed.postTargetSpace);
   attribute.appendLTokens(results, parsed.params);
   pushNonBottom(results, parsed.close);

   return results;
}

export {
   XMLDECL as TYPE,
   XmlDeclaration as Token,
   parse,
   checkWellFormed,
   makeToken,
};
