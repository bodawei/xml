/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { WellFormedError } from '../../error';

import {
   textOrBlank,
} from '../common/misc.js';
import * as base from '../base.js';

/**********************************************************************\
 The declaration namespace contains a "bridge" parser which will
 start parsing a declaration (<!) far enough to determine what kind
 of declaration this is, and then hands it off to the appropriate
 other parsers.
\**********************************************************************/

const UNKNOWNDECL = 'UNKNOWNDECL';
const WFEID = WellFormedError.ID;

class UnknownDeclaration extends base.XToken {
}

class DeclarationPToken extends base.PToken {
   constructor(type, props) {
      super(type || UNKNOWNDECL, props);
   }

   getSTokenArray() {
      const results = super.getSTokenArray();

      results.pushSTokens(this.open,
         this.postOpenSpace,
         this.declType,
         this.postDeclTypeSpace);

      return results;
   }
}

/**********************************************************************\
 parse() starts extracting a declaration (<!NAME...) and then hands
 off to a parser for 'NAME'.  If there is no handler for this name,
 then this will produce a parsing for a UNKNOWNDECL, which can be
 tokenized into a generally useless token.

 PARAM
 source: A STokenSource to read from
 openSToken: the SToken for <!
 deliverPToken: Callback to deliver the PToken

 SYNTAX
   declaration ::= '<!' name S
\**********************************************************************/

function parse(source, openSToken, deliverPToken) {
   const results = new DeclarationPToken();
   results.open = openSToken;

   source.extractToObject('space', results, 'postOpenSpace');
   source.extractToObject('word', [ '>' ], results, 'declType');

   source.extract('space', (sToken) => {
      results.postDeclTypeSpace = sToken;

      deliverPToken(results);
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(pToken, ec) {
   ec.setPos(pToken.open);

   ec.setPos(pToken.postOpenSpace);
   ec.check(pToken.postOpenSpace, WFEID.DECL_OPEN_XTRA_SPACE_AFTER);

   ec.setPos(pToken.declType);

   if (pToken.declType) {
      const upperCase = pToken.declType.text.toLocaleUpperCase();
      ec.check(pToken.declType.text !== upperCase,
         WFEID.DECL_DECLTYPE_INVALID_CASE, [ upperCase, pToken.declType.text ]);
   } else {
      ec.report(WFEID.DECL_NO_DECLTYPE);
   }

   ec.check(pToken.declType && pToken.type === UNKNOWNDECL, WFEID.DECL_UNKNOWN, [ textOrBlank(pToken.declType) ]);

   return ec;
}

/**********************************************************************\
 pTokenToXToken() converts a PToken into an XToken.
\**********************************************************************/

function pTokenToXToken(pToken) {
   return new UnknownDeclaration(pToken);
}

export {
   UNKNOWNDECL as PTYPE,
   UnknownDeclaration as XToken,
   DeclarationPToken as PToken,
   parse,
   checkWellFormed,
   pTokenToXToken,
};
