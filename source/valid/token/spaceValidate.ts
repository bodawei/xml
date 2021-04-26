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

   ec.setPos(token.text);

   /*
    * §3.2.1: An element type has element content when elements of that type must
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
   }
}

export { spaceValidate };
