/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ErrorCollector } from 'basic';
import { strOrBlank } from 'sToken';
import { SpacePToken } from 'token';

import { ValidityError } from '../error/ValidityError';
import { ElDeclType, ValidateState } from '../validateState';

const VID = ValidityError.ID;
const S_REGEXP = /^[\t\n\r ]*$/;

function spaceValidate(token: SpacePToken, state: ValidateState, ec: ErrorCollector): void {
   if (
      !state.elementContext.activeContext ||
      state.elementContext.activeContext.declDetails.type !== ElDeclType.ELEMENT
   ) {
      return;
   }
   const spaceText = strOrBlank(token.text);
   const details = state.elementContext.activeContext.declDetails;

   ec.setPos(token.text);

   /*
    * §3.0.0: An element type has element content when elements of that type must
    *    contain only child elements (no character data), optionally separated by
    *    white space (characters matching the nonterminal S).]
    */
   if (!S_REGEXP.test(spaceText)) {
      const chars = spaceText.split('');

      for (const char of chars) {
         if (!S_REGEXP.test(char)) {
            ec.report(VID.ELEMENT_CONTENT_BAD_SPACE, [char]);
         }
      }
   } else {
      // §2.9.0 Validity constraint: Standalone Document Declaration
      //    The standalone document declaration must have the value "no" if any external markup
      //    declarations contain declarations of:
      //       - element types with element content, if white space occurs directly within any instance of those types
      // Note: This is because in this circumstance, something parsing this as non-validated will not know
      // whether those spaces are content or throwaway S.

      ec.check(
         state.isStandalone && details.isExternalMarkupDeclaration,
         VID.ELEMENT_CONTENT_SPACE_EXTERNAL_DECLARED,
         [strOrBlank(details.token.name)],
      );
   }
}

export { spaceValidate };
