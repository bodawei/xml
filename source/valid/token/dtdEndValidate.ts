/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ErrorCollector } from 'basic';
import { strOrBlank } from 'sToken';

import { ValidateState } from '../validateState';
import { validityConstraint } from '../error/validityConstraint';

const VID = validityConstraint.id;

function dtdEndValidate(state: ValidateState, ec: ErrorCollector): void {
   const generalEntityDetails = Object.entries(state.generalEntities);

   for (const details of generalEntityDetails) {
      const [geDeclName, info] = details;
      const nDataName = strOrBlank(info?.token.nDataName);

      if (nDataName !== '') {
         const notationDeclared = state.notationDeclarations[nDataName];

         ec.setPos(info?.token.name);
         ec.setPos(info?.token.nDataName);

         /*
          * §4.2.2: Validity constraint: Notation Declared
          *    The Name must match the declared name of a notation.
          */
         ec.check(!notationDeclared, VID.ENTITYDECL_UNDECLARED_NOTATION, [geDeclName, nDataName]);
      }
   }
}

export { dtdEndValidate };
