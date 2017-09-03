/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { WellFormedError } from '../error';

import {
   pushNonBottom,
   textOrBlank,
   textOrUndef,
 } from './util.js';
import { Token as XmlToken } from './xmlToken.js';

/**********************************************************************\
 The xmlDeclaration namespace contains the usual routines for parsing,
 validating and tokenizing an XML Declaration.
\**********************************************************************/

const WFEID = WellFormedError.ID;
const XMLDECL = 'XMLDECL';
const XMLDECL_NAME_TERMINATORS = [ '=', '?>' ];
const XMLDECL_PARAMS = {
   version: 'version',
   encoding: 'encoding',
   standalone: 'standalone',
};

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

   getParams(source, (params) => {
      parsed.params = params;
      source.extract('match', '?>', (lToken) => {
         parsed.close = lToken;
         deliverParsed(parsed);
      });
   });
}

function getParams(source, deliverResults) {
   const params = [];
   source.extract('word', XMLDECL_NAME_TERMINATORS, (lToken) => {
      addParam(source, params, lToken, deliverResults);
   });
}

function addParam(source, params, name, deliverResults) {
   if (!name) {
      deliverResults(params);
      return;
   }
   const param = {
      name,
   };
   params.push(param);

   source.extractToObject('space', param, 'postNameSpace');
   source.extractToObject('match', '=', param, 'equal');
   source.extractToObject('space', param, 'postEqualSpace');
   source.extract('peekChar', (quote) => {
      const gotQuote = quote && (quote.text === '"' || quote.text === '\'');

      if (gotQuote) {
         source.extractToObject('char', param, 'openQuote');
         source.extractToObject('all', [ quote.text ], param, 'value');
         source.extractToObject('match', quote.text, param, 'closeQuote');
         source.extractToObject('space', param, 'trailingSpace');
      }

      source.extract('word', XMLDECL_NAME_TERMINATORS, (lToken) => {
         addParam(source, params, lToken, deliverResults);
      });
   });
}

/**********************************************************************\
 Do well formed checking on the parsed results from the parse().
\**********************************************************************/

function checkWellFormed(parsed, err, isDocEntity) {
   let foundEncoding;
   let foundVersion;
   let seenStandalone;

   // check that the parameters are in the right order and have the right values
   for (let index = 0; index < parsed.params.length; index++) {
      const param = parsed.params[index];
      const nameText = textOrBlank(param.name);
      const lcName = nameText.toLocaleLowerCase();

      err.setPos(param.name);

      if (index === 0) {
         err.check(!parsed.postTargetSpace, WFEID.ATTRIBUTE_NO_SPACE_BEFORE_NAME, [ nameText ]);
      } else {
         err.check(!parsed.params[index - 1].trailingSpace, WFEID.ATTRIBUTE_NO_SPACE_BEFORE_NAME, [ nameText ]);
      }

//         err.checkNameInvalid(param.name, WFEID.ATTRIBUTE_INVALID_NAME);
      if (XMLDECL_PARAMS[lcName]) {
         err.check(param.name.text !== lcName, WFEID.XMLDECL_ATTR_INVALID_CASE, [ lcName, nameText ]);
      }

      switch (lcName) {
         case 'version':
            foundVersion = true;
            err.check(index !== 0, WFEID.XMLDECL_VERSION_INVALID_ORDER, [ index ]);
            break;
         case 'encoding':
            foundEncoding = true;
            if (isDocEntity) {
               err.check(!foundVersion || seenStandalone, WFEID.XMLDECL_ENCODING_INVALID_ORDER);
            }
            break;
         case 'standalone':
            seenStandalone = true;
            if (!isDocEntity) {
               err.report(WFEID.TEXTDECL_XTRA_STANDALONE);
            }

            err.check(!foundVersion, WFEID.XMLDECL_STANDALONE_INVALID_ORDER, param.name);
            break;
         default:
            err.report(WFEID.XMLDECL_ATTR_UNKNOWN, [ param.name.text ]);
      }

      err.setPos(param.equal);
      err.check(!param.equal, WFEID.ATTRIBUTE_NO_EQUAL, [ nameText ]);
      err.setPos(param.openQuote);
      err.check(!param.openQuote, WFEID.ATTRIBUTE_NO_QUOTE, [ nameText ]);

      err.setPos(param.value);
      const valueText = textOrBlank(param.value);
      const lcValue = valueText.toLocaleLowerCase();
      err.check(!param.value, WFEID.ATTRIBUTE_NO_VALUE, [ nameText ]);
//         err.add(XmlText.validateText(param.value, version, parsed.open));

      switch (lcName) {
         case 'version':
            err.check(valueText !== '1.1' && valueText !== '1.0', WFEID.XMLDECL_VERSION_INVALD, [ valueText ]);
            break;
         case 'encoding':
            if (valueText) {
               err.check(!valueText.match(/^[A-Za-z][-A-Za-z0-9._]*$/), WFEID.XMLDECL_ENCODING_INVALID,
                  [ valueText ]);
            }
            break;
         case 'standalone':
            err.check(lcValue !== 'no' && lcValue !== 'yes', WFEID.XMLDECL_STANDALONE_INVALID, [ valueText ]);
            err.check(valueText !== lcValue, WFEID.XMLDECL_STANDALONE_INVALID_CASE, [ lcValue, valueText ]);
            break;
      }
   }

   err.setPos(parsed.close);
   err.check(parsed.params.length === 0, WFEID.XMLDECL_NO_ATTRIBUTES,
      [ isDocEntity ? WFEID.NOUN_XMLDECL : WFEID.NOUN_TEXTDECL ]);

   if (!isDocEntity) {
      err.check(!foundEncoding, WFEID.TEXTDECL_NO_ENCODING);
   }

   err.check(!parsed.close, WFEID.XMLDECL_NO_CLOSE);
}

/**********************************************************************\
 Convert a parsed value into a token.
\**********************************************************************/

function makeToken(parsed) {
   return new XmlDeclaration(extractParams(parsed), getChunks(parsed));
}

function extractParams(parsed) {
   const params = [];

   for (let index = 0; index < parsed.params.length; index++) {
      const param = parsed.params[index];

      params.push({
         name: textOrBlank(param.name),
         value: textOrUndef(param.value),
      });
   }

   return params;
}

function getChunks(parsed) {
   const results = [];

   pushNonBottom(results, parsed.open);
   pushNonBottom(results, parsed.postOpenSpace);
   pushNonBottom(results, parsed.target);
   pushNonBottom(results, parsed.postTargetSpace);

   for (let index = 0; index < parsed.params.length; index++) {
      const param = parsed.params[index];

      pushNonBottom(results, param.name);
      pushNonBottom(results, param.postNameSpace);
      pushNonBottom(results, param.equal);
      pushNonBottom(results, param.postEqualSpace);
      pushNonBottom(results, param.openQuote);
      pushNonBottom(results, param.value);
      pushNonBottom(results, param.closeQuote);
      pushNonBottom(results, param.trailingSpace);
   }
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
