/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { Collector } from 'basic';
import { strOrBlank } from 'sToken';
import { SpacePToken } from 'token';

import { ElDeclType, ElementContext, ValidityState } from '../common/validityState';
import { validityErrorCodes } from '../error/validityErrorCodes';

const VID = validityErrorCodes.id;

function spaceValidate(token: SpacePToken, state: ValidityState, coll: Collector): void {
   const stack = state.elementContext.contextStack;
   const curContext = stack[stack.length - 1] as ElementContext | undefined;
   const details = curContext?.details;

   /*
    * §3.0.0: An element type has element content when elements of that type must
    *    contain only child elements (no character data), optionally separated by
    *    white space (characters matching the nonterminal S).]
    */
   if (details?.type !== ElDeclType.ELEMENT) {
      return;
   }

   coll.setPos(token.text);

   // §2.9.0 Validity constraint: Standalone Document Declaration
   //    The standalone document declaration must have the value "no" if any external markup
   //    declarations contain declarations of:
   //       - element types with element content, if white space occurs directly within any instance of those types
   // Note: This is because in this circumstance, something parsing this as non-validated will not know
   // whether those spaces are content or throwaway S.

   coll.check(
      state.isStandalone && details.isExternalMarkupDeclaration,
      VID.CONTENTELEMENT_AMBIGUOUS_SPACE,
      [strOrBlank(details.token.name)],
   );
}

export { spaceValidate };
