/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ErrorCollector } from 'basic';
import { GeneralEntityDeclarationPToken, ParameterEntityDeclarationPToken } from 'pToken';
import { strOrBlank } from 'sToken';

import { ValidityState } from '../common/validityState';
import { entityDeclarationValueValidate } from '../common/entityDeclarationValueValidate';
import { validCodes } from '../error/validCodes';

const VID = validCodes.id;

function entityDeclarationValidate(
   token: GeneralEntityDeclarationPToken | ParameterEntityDeclarationPToken,
   state: ValidityState,
   ec: ErrorCollector,
): void {
   ec.setPos(token.open);

   // §2.8.0: Validity Constraint: Proper Declaration/PE Nesting
   //    Parameter-entity replacement text must be properly nested with markup declarations.
   //    That is to say, if ... the last character of a markup declaration (markupdecl above)
   //    is contained in the replacement text for a parameter-entity reference,
   //    both [first and last char] must be contained in the same replacement text.
   // In this case, the first character was not, so make sure the last is not.
   if (token.unexpanded && token.extra) {
      const extraText = strOrBlank(token.extra);

      ec.check(extraText.indexOf('>') !== -1, VID.PEREF_INVALID_END_NESTING, ['ENTITY']);
   }

   entityDeclarationValueValidate(token, state, ec);
}

export { entityDeclarationValidate };
