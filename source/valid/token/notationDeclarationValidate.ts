/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ErrorCollector } from 'basic';
import { NotationDeclarationPToken } from 'pToken';
import { strOrBlank } from 'sToken';

import { ValidateState } from '../validateState';
import { validCodes } from '../error/validCodes';

const VID = validCodes.id;

function notationDeclarationValidate(
   token: NotationDeclarationPToken,
   state: ValidateState,
   ec: ErrorCollector,
): void {
   const mustEnforce = state.confVer.version === 1.1 || state.confVer.edition >= 2;
   const notationName = strOrBlank(token.name);

   ec.setPos(token.open);

   // §2.8.0: Validity Constraint: Proper Declaration/PE Nesting
   //    Parameter-entity replacement text must be properly nested with markup declarations.
   //    That is to say, if ... the last character of a markup declaration (markupdecl above)
   //    is contained in the replacement text for a parameter-entity reference,
   //    both [first and last char] must be contained in the same replacement text.
   // In this case, the first character was not, so make sure the last is not.
   if (token.unexpanded && token.extra) {
      const extraText = strOrBlank(token.extra);

      ec.check(extraText.indexOf('>') !== -1, VID.PEREF_INVALID_END_NESTING, ['NOTATION']);
   }

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
