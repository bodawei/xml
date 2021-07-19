/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ErrorCollector } from 'basic';
import { ConditionalClosePToken, CONDITIONAL_PTOKEN } from 'token';

import { validityConstraint } from '../error/validityConstraint';
import { ValidateState } from '../validateState';

const VID = validityConstraint.id;

function conditionalEndValidate(
   token: ConditionalClosePToken,
   state: ValidateState,
   ec: ErrorCollector,
): void {
   ec.setPos(token.open);
   // §2.8.0 733 Proper Declaration/PE nesting
   //   Parameter-entity replacement text must be properly nested
   //   with markup declarations. That is to say, if either
   //   the first character or the last character of a markup declaration
   //   (markupdecl above) is contained in the replacement text for
   //   a parameter-entity reference, both must be contained in the
   //   same replacement text.
   const item = state.dtdContext.enclosingStack[state.dtdContext.enclosingStack.length - 1];

   if (item.type !== CONDITIONAL_PTOKEN) {
      ec.report(VID.PEREF_INVALID_CONDITIONAL_END_NESTING, []);
   }
}

export { conditionalEndValidate };
