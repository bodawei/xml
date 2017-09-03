/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { WellFormedError } from '../error';

import {
   pushNonBottom,
   textOrBlank,
} from './common/util.js';
import * as docTypeStart from './docTypeStart.js';
import * as entityDeclaration from './entityDeclaration.js';
import { Token as XmlToken } from './xmlToken.js';

/**********************************************************************\
 The declaration namespace contains a "bridge" parser which will
 start parsing a declaration (<!) far enough to determine what kind
 of declaration this is, and then hands it off to the appropriate
 other parsers.
\**********************************************************************/

const UNKNOWNDECL = 'UNKNOWNDECL';
const WFEID = WellFormedError.ID;

class UnknownDeclaration extends XmlToken {
}

/**********************************************************************\
 parse() starts extracting a declaration (<!NAME...) and then hands
 off to a parser for 'NAME'.  If there is no handler for this name,
 then this will produce a parsing for a UNKNOWNDECL, which can be
 tokenized into a generally useless token.

 PARAM
 source: A LTokenSource to read from
 openLToken: the LToken for <!
 deliverParsed: Callback to deliver the parsed lTokens

 SYNTAX
   declaration ::= '<!' name S
\**********************************************************************/

function parse(source, openLToken, deliverParsed) {
   const results = {
      type: UNKNOWNDECL,
      open: openLToken,
   };
   source.extractToObject('space', results, 'postOpenSpace');
   source.extractToObject('word', [ '>' ], results, 'declType');

   source.extract('space', (lToken) => {
      results.postDeclTypeSpace = lToken;

      if (!results.declType) {
         deliverParsed(results);
         return;
      }

      switch (results.declType.text.toLocaleUpperCase()) {
         case 'DOCTYPE':
            docTypeStart.parse(source, results, deliverParsed);
            break;
         case 'ENTITY':
            entityDeclaration.parse(source, results, deliverParsed);
            break;
         default:
            deliverParsed(results);
            break;
      }
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(parsed, ec) {
   ec.setPos(parsed.open);

   ec.setPos(parsed.postOpenSpace);
   ec.check(parsed.postOpenSpace, WFEID.BANGITEM_OPEN_XTRA_SPACE_AFTER);

   ec.setPos(parsed.declType);

   if (parsed.declType) {
      const upperCase = parsed.declType.text.toLocaleUpperCase();
      ec.check(parsed.declType.text !== upperCase,
         WFEID.BANGITEM_DECLTYPE_INVALID_CASE, [ upperCase, parsed.declType.text ]);
   } else {
      ec.report(WFEID.BANGITEM_NO_DECLTYPE);
   }

   ec.check(parsed.declType && parsed.type === UNKNOWNDECL, WFEID.BANGITEM_UNKNOWN, [ textOrBlank(parsed.declType) ]);

   return ec;
}

/**********************************************************************\
 makeToken() converts a parsed into a token.
\**********************************************************************/

function makeToken(parsed) {
   const results = [];

   appendLTokens(results, parsed);
   return new UnknownDeclaration(results);
}

function appendLTokens(results, parsed) {
   pushNonBottom(results, parsed.open);
   pushNonBottom(results, parsed.postOpenSpace);
   pushNonBottom(results, parsed.declType);
   pushNonBottom(results, parsed.postDeclTypeSpace);
}

export {
   UNKNOWNDECL as TYPE,
   UnknownDeclaration as Token,
   parse,
   checkWellFormed,
   makeToken,
   appendLTokens,
};
