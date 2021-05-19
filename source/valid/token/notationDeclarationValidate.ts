/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ErrorCollector } from 'basic';
import { NotationDeclarationPToken } from 'pToken';
import { strOrBlank } from 'sToken';

import { ValidateState } from '../validateState';
import { validityConstraint } from '../error/validityConstraint';

const VID = validityConstraint.id;

function notationDeclarationValidate(
   token: NotationDeclarationPToken,
   state: ValidateState,
   ec: ErrorCollector,
): void {
   const mustEnforce = state.confVer.version === 1.1 || state.confVer.edition >= 2;
   const notationName = strOrBlank(token.name);

   ec.setPos(token.open);
   ec.setPos(token.name);
   /*
    * §4.7.0: Validity constraint: Unique Notation Name ( >= 1.0/2)
    *    A given Name must not be declared in more than one notation declaration.
    */
   ec.check(
      mustEnforce && state.notationDeclarations[notationName],
      VID.NOTATION_XTRA_DECLARATION,
      [notationName],
   );
}

export { notationDeclarationValidate };
