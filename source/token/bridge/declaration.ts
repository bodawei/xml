/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { EntityMetaData } from '../../basic';
import { ErrorCollector, WellFormedError } from '../../error';
import { SToken, STokenSource } from '../../sToken';

import {
   textOrBlank,
} from '../common/misc';
import base, { STokenArray } from '../base';

/**********************************************************************\
 The declaration namespace contains a "bridge" parser which will
 start parsing a declaration (<!) far enough to determine what kind
 of declaration this is, and then hands it off to the appropriate
 other parsers.
\**********************************************************************/

const UNKNOWNDECL = 'UNKNOWNDECL';
const UNKNOWNDECL_XTOKEN = 'UNKNOWNDECL_XTOKEN';
const WFEID = WellFormedError.ID;

class UnknownDeclaration {
   public readonly type = UNKNOWNDECL_XTOKEN;
   public pToken?: DeclarationPToken;

   constructor(pToken?: DeclarationPToken) {
      this.pToken = pToken;
   }
}

class DeclarationPToken extends base.PToken {
   public open: SToken;
   public postOpenSpace?: SToken;
   public declType?: SToken;
   public postDeclTypeSpace?: SToken;
   
   constructor(type?: string, props?: any) {
      super(type || UNKNOWNDECL, props);

      if (props && 'open' in props) {
         this.open = props.open;
      } else {
         this.open = SToken.fromString('');
      }
   }

   getSTokenArray(): STokenArray {
      const results: STokenArray = super.getSTokenArray();

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

function parse(source: STokenSource, openSToken: SToken, deliverPToken: (value: DeclarationPToken) => void) {
   const results = new DeclarationPToken();
   results.open = openSToken;

   source.extractToObjectNoParams('space', results, 'postOpenSpace');
   source.extractToObject('word', [ '>' ], results, 'declType');

   source.extractNoParams('space', (sToken) => {
      results.postDeclTypeSpace = sToken;

      deliverPToken(results);
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(pToken: DeclarationPToken, ec: ErrorCollector, entityMetaData: EntityMetaData) {
   ec.setPos(pToken.open);


   ec.setPos(pToken.postOpenSpace);
   ec.check(pToken.postOpenSpace, WFEID.DECL_OPEN_XTRA_SPACE_AFTER);

   ec.setPos(pToken.declType);

   if (pToken.declType) {
      const upperCase = pToken.declType.str.toLocaleUpperCase();
      ec.check(pToken.declType.str !== upperCase,
         WFEID.DECL_DECLTYPE_INVALID_CASE, [ upperCase, pToken.declType.str ]);
   } else {
      ec.report(WFEID.DECL_NO_DECLTYPE);
   }

   ec.check(pToken.declType && pToken.type === UNKNOWNDECL, WFEID.DECL_UNKNOWN, [ textOrBlank(pToken.declType) ]);

   return ec;
}

/**********************************************************************\
 pTokenToXToken() converts a PToken into an XToken.
\**********************************************************************/

function pTokenToXToken(pToken: DeclarationPToken): UnknownDeclaration {
   return new UnknownDeclaration(pToken);
}

const declaration = {
   PTYPE: UNKNOWNDECL,
   XTYPE: UNKNOWNDECL_XTOKEN,
   XToken: UnknownDeclaration,
   PToken: DeclarationPToken,
   parse,
   checkWellFormed,
   pTokenToXToken,
};

export default declaration;
export { DeclarationPToken };