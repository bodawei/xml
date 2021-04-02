/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ErrorCollector } from 'basic';
import { strOrBlank } from 'sToken';
import { ConditionalPToken } from 'token';

import { ValidityError } from '../error/ValidityError';
import { ValidateState } from '../validateState';

const VID = ValidityError.ID;

function conditionalValidate(
   token: ConditionalPToken,
   state: ValidateState,
   ec: ErrorCollector,
): void {
   if (!token.unexpanded) {
      return;
   }

   /*
    * §3.4.0:
    */
   ec.setPos(token.unexpanded.peRef.open);

   ec.check(token.unexpanded.includedBracket, VID.CONDITIONAL_BAD_NESTING, [
      strOrBlank(token.unexpanded.peRef.name),
   ]);
}

export { conditionalValidate };
