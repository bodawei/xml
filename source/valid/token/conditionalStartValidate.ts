/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ErrorCollector } from 'basic';
import { strOrBlank } from 'sToken';
import { ConditionalPToken } from 'token';
import { validCodes } from '../error/validCodes';

import { ValidityState } from '../common/validityState';

const VID = validCodes.id;

function conditionalStartValidate(
   token: ConditionalPToken,
   state: ValidityState,
   ec: ErrorCollector,
): void {
   if (!token.unexpanded) {
      return;
   }

   // §3.4.0 Proper Conditional Section/PE Nesting
   //    If any of the "<![", "[", or "]]>" of a conditional section is
   //    contained in the replacement text for a parameter-entity
   //    reference, all of them must be contained in the same
   //    replacement text.
   ec.setPos(token.unexpanded.peRef.open);

   ec.check(token.unexpanded.includedBracket, VID.CONDITIONALSECTION_PEREF_INVALID_BRACKET, [
      strOrBlank(token.unexpanded.peRef.name),
   ]);
}

export { conditionalStartValidate };
