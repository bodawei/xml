/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { Collector, strOrBlank } from 'basic';
import { NotationDeclarationPToken } from 'pToken';

import { ValidityState } from '../common/validityState';
import { validityErrorCodes } from '../error/validityErrorCodes';

const VID = validityErrorCodes.id;

function notationDeclarationValidate(
   token: NotationDeclarationPToken,
   state: ValidityState,
   coll: Collector,
): void {
   const mustEnforce = state.confVer.version === 1.1 || state.confVer.edition >= 2;
   const notationName = strOrBlank(token.name);

   coll.setPos(token.open);

   // §2.8.0: Validity Constraint: Proper Declaration/PE Nesting
   //    Parameter-entity replacement text must be properly nested with markup declarations.
   //    That is to say, if ... the last character of a markup declaration (markupdecl above)
   //    is contained in the replacement text for a parameter-entity reference,
   //    both [first and last char] must be contained in the same replacement text.
   // In this case, the first character was not, so make sure the last is not.
   if (token.unexpanded && token.extra) {
      const extraText = strOrBlank(token.extra);

      coll.check(extraText.indexOf('>') !== -1, VID.PEREF_INVALID_END_NESTING, ['NOTATION']);
   }

   coll.setPos(token.name);
   /*
    * §4.7.0: Validity constraint: Unique Notation Name ( >= 1.0/2)
    *    A given Name must not be declared in more than one notation declaration.
    */
   coll.check(mustEnforce && state.notations[notationName], VID.NOTATION_XTRA_DECLARATION, [
      notationName,
   ]);
}

export { notationDeclarationValidate };
