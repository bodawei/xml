/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { Collector } from 'basic';
import { strOrBlank } from 'sToken';
import { ConditionalStartPToken } from 'token';

import { ValidityState } from '../common/validityState';
import { validityErrorCodes } from '../error/validityErrorCodes';

const VID = validityErrorCodes.id;

function conditionalStartValidate(
   token: ConditionalStartPToken,
   state: ValidityState,
   coll: Collector,
): void {
   if (!token.unexpanded) {
      return;
   }

   // §3.4.0 Proper Conditional Section/PE Nesting
   //    If any of the "<![", "[", or "]]>" of a conditional section is
   //    contained in the replacement text for a parameter-entity
   //    reference, all of them must be contained in the same
   //    replacement text.
   coll.setPos(token.unexpanded.peRef.open);

   coll.check(token.unexpanded.includedBracket, VID.CONDITIONALSECTION_PEREF_INVALID_BRACKET, [
      strOrBlank(token.unexpanded.peRef.name),
   ]);
}

export { conditionalStartValidate };
