/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { Collector, strOrBlank } from 'basic';
import { GeneralEntityDeclarationPToken, ParameterEntityDeclarationPToken } from 'pToken';

import { entityDeclarationValueValidate } from '../common/entityDeclarationValueValidate';
import { ValidityState } from '../common/validityState';
import { validityErrorCodes } from '../error/validityErrorCodes';

const VID = validityErrorCodes.id;

function entityDeclarationValidate(
   token: GeneralEntityDeclarationPToken | ParameterEntityDeclarationPToken,
   state: ValidityState,
   coll: Collector,
): void {
   coll.setPos(token.open);

   // §2.8.0: Validity Constraint: Proper Declaration/PE Nesting
   //    Parameter-entity replacement text must be properly nested with markup declarations.
   //    That is to say, if ... the last character of a markup declaration (markupdecl above)
   //    is contained in the replacement text for a parameter-entity reference,
   //    both [first and last char] must be contained in the same replacement text.
   // In this case, the first character was not, so make sure the last is not.
   if (token.unexpanded && token.extra) {
      const extraText = strOrBlank(token.extra);

      coll.check(extraText.indexOf('>') !== -1, VID.PEREF_INVALID_END_NESTING, ['ENTITY']);
   }

   entityDeclarationValueValidate(token, state, coll);
}

export { entityDeclarationValidate };
