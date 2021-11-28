/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ErrorCollector } from 'basic';
import { ConditionalEndPToken, CONDITIONAL_START_PTOKEN } from 'token';

import { validCodes } from '../error/validCodes';
import { ValidityState } from '../common/validityState';

const VID = validCodes.id;

function conditionalEndValidate(
   token: ConditionalEndPToken,
   state: ValidityState,
   ec: ErrorCollector,
): void {
   const stack = state.dtdContext.enclosingStack;

   ec.setPos(token.open);

   // §3.4.0 Proper Conditional Section/PE Nesting
   //    If any of the "<![", "[", or "]]>" of a conditional section is
   //    contained in the replacement text for a parameter-entity
   //    reference, all of them must be contained in the same
   //    replacement text.
   const item = stack[stack.length - 1];

   // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- it actually could be undefined if the stack is empty
   if (item?.type !== CONDITIONAL_START_PTOKEN) {
      ec.report(VID.PEREF_INVALID_CONDITIONALSECTION_END_NESTING, []);
   }
}

export { conditionalEndValidate };
