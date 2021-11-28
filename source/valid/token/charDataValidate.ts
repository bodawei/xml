/* Copyright ® 2020-2021 by 柏大衛. All rights reserved. */

import { ErrorCollector, isSpace } from 'basic';
import { strOrBlank } from 'sToken';
import { CharDataPToken } from 'token';

import { ElDeclType, ElementContext, ValidityState } from '../common/validityState';
import { validCodes } from '../error/validCodes';

const VID = validCodes.id;

function charDataValidate(token: CharDataPToken, state: ValidityState, ec: ErrorCollector): void {
   const stack = state.elementContext.contextStack;
   const curContext = stack[stack.length - 1] as ElementContext | undefined;
   const details = curContext?.details;

   // §3.0.0: An element type has element content when elements of that type must
   //    contain only child elements (no character data), optionally separated by
   //    white space (characters matching the nonterminal S).]
   if (details?.type !== ElDeclType.ELEMENT) {
      return;
   }

   ec.setPos(token.text);

   if (isSpace(strOrBlank(token.text))) {
      // §2.9.0 Validity constraint: Standalone Document Declaration
      //    The standalone document declaration must have the value "no" if any external markup
      //    declarations contain declarations of:
      //       - element types with element content, if white space occurs directly within any instance of those types
      // Note: This is because in this circumstance, something parsing this as non-validated will not know
      // whether those spaces are content or throwaway S.

      ec.check(
         state.isStandalone && details.isExternalMarkupDeclaration,
         VID.CONTENTELEMENT_AMBIGUOUS_SPACE,
         [strOrBlank(details.token.name)],
      );
   }
}

export { charDataValidate };
