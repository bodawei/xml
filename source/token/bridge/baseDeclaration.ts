/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { SToken, STokenSource } from 'sToken';
import base from '../base';

/**********************************************************************\
 The declaration namespace contains a "bridge" parser which will
 start parsing a declaration (<!) far enough to determine what kind
 of declaration this is, and then hands it off to the appropriate
 other parsers.
\**********************************************************************/

const UNKNOWNDECL_PTOKEN = 'UNKNOWNDECL';

class DeclarationPToken extends base.PToken {
   public type: typeof UNKNOWNDECL_PTOKEN = UNKNOWNDECL_PTOKEN;
   public open: SToken;
   public postOpenSpace?: SToken;
   public declType?: SToken;
   public postDeclTypeSpace?: SToken;

   constructor(type?: string, props?: any) {
      super(type || UNKNOWNDECL_PTOKEN, props);

      if (props && 'open' in props) {
         this.open = props.open;
      } else {
         this.open = SToken.fromString('');
      }
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

const declaration = {
   PTYPE: UNKNOWNDECL_PTOKEN,
   PToken: DeclarationPToken,
   parse,
};

export default declaration;
export { UNKNOWNDECL_PTOKEN, DeclarationPToken };