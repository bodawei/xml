/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { WellFormedError } from '../error';

import {
   textOrBlank,
} from './common/misc.js';
import * as instruction from './bridge/instruction.js';
import * as attribute from './common/attribute.js';
import * as base from './base.js';

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

class XmlDeclaration extends base.XToken {

   constructor(params, sTokens) {
      super(sTokens);
      this.params = params;
   }

}

class XmlDeclarationPToken extends instruction.PToken {
   constructor(props) {
      super(XMLDECL, props);
   }

   getSTokenArray() {
      const results = super.getSTokenArray();
      const sTokens = attribute.getSTokens(this.params);

      results.pushSTokens.apply(results, sTokens); // eslint-disable-line prefer-spread
      results.pushSTokens(this.close);

      return results;
   }
}

/**********************************************************************\
 parse() extracts the STokens of an XML Declaration.

 This assumes that the "<?xml " has already been processed, and those
 STokens are passed in through piParsing.

 PARAM
 source: A STokenSource to read from
 piPToken: An processing instruction PToken
 deliverPToken: Callback to deliver the PToken

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

function parse(source, piPToken, deliverPToken) {
   const pToken = new instruction.PToken(XMLDECL, piPToken);

   attribute.parse(source, { terminators: XMLDECL_NAME_TERMINATORS}, (params) => {
      pToken.params = params;
      source.extract('match', '?>', (sToken) => {
         pToken.close = sToken;
         deliverPToken(pToken);
      });
   });
}

/**********************************************************************\
 Do well formed checking on the PToken from the parse().
\**********************************************************************/

function checkWellFormed(pToken, ec, entityMetaData) {
   const checks = makeNameCheckClosure();

   instruction.checkWellFormed(pToken, ec, entityMetaData, true);

   // check that the parameters are in the right order and have the right values
   attribute.checkWellFormed(pToken.params, ec, entityMetaData,
      pToken.postTargetSpace, WFEID.NOUN_XMLDECL_PARAM, checks.checkName, checkValue);

   ec.setPos(pToken.close);
   if (entityMetaData.isDocumentKind) {
      ec.check(pToken.params.length === 0, WFEID.XMLDECL_NO_ATTRIBUTES);
   } else {
      ec.check(pToken.params.length === 0, WFEID.TEXTDECL_NO_ATTRIBUTES);
      ec.check(!checks.foundEncoding(), WFEID.TEXTDECL_NO_ENCODING);
   }

   ec.check(!pToken.close, WFEID.XMLDECL_NO_CLOSE);
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
   const valueText = textOrBlank(value[0] ? value[0].text : undefined);
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
 Convert a PToken into an XToken.
\**********************************************************************/

function pTokenToXToken(pToken) {
   return new XmlDeclaration(attribute.makeOneTokenCompatible(pToken.params), pToken);
}

export {
   XMLDECL as PTYPE,
   XmlDeclarationPToken as PToken,
   XmlDeclaration as XToken,
   parse,
   checkWellFormed,
   pTokenToXToken,
};
