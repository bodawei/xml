/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ErrorCollector } from 'basic';
import { strOrBlank } from 'sToken';
import { CharDataPToken } from 'token';

import { ValidityError } from '../error/ValidityError';
import { ElDeclType, ValidateState } from '../validateState';

const VID = ValidityError.ID;
const S_REGEXP = /^[\t\n\r ]*$/;

function charDataValidate(token: CharDataPToken, state: ValidateState, ec: ErrorCollector): void {
   if (
      !state.elementContext.activeContext ||
      state.elementContext.activeContext.declDetails.type !== ElDeclType.CHILDREN
   ) {
      return;
   }

   ec.setPos(token.text);

   /*
    * §3.2.1: An element type has element content when elements of that type must
    *    contain only child elements (no character data), optionally separated by
    *    white space (characters matching the nonterminal S).]
    */
   if (!S_REGEXP.test(strOrBlank(token.text))) {
      ec.report(VID.CHILDREN_BAD_SPACE, [strOrBlank(token.text)]);
   }
}

export { charDataValidate };
