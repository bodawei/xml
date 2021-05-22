/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ErrorCollector } from 'basic';
import { strOrBlank } from 'sToken';

import { ValidateState } from '../validateState';
import { validityConstraint } from '../error/validityConstraint';

const VID = validityConstraint.id;

function attListValidate(state: ValidateState, ec: ErrorCollector): void {
   const attlists = Object.entries(state.attributeDefs);

   // §3.3.1 (1.0/2+): Validity constraint: No Notation on Empty Element
   //    For compatibility, an attribute of type NOTATION must
   //    not be declared on an element declared EMPTY.
   if (state.confVer.version !== 1.1 && state.confVer.edition === 1) {
      return;
   }

   for (const [elName, details] of attlists) {
      const elementDetails = state.elementDeclarations[elName];
      const elType = strOrBlank(elementDetails?.token.contentSpec);
      const elementIsEmpty = elType.toLocaleLowerCase() === 'empty';

      if (details && elementIsEmpty) {
         const attrsInfo = Object.entries(details);

         for (const [attName, attInfo] of attrsInfo) {
            ec.check(
               strOrBlank(attInfo?.def.type).toLowerCase() === 'notation',
               VID.ATTLISTDECL_EMPTY_NOTATION,
               [elName, attName],
               attInfo?.def.type,
            );
         }
      }
   }
}

function dtdEndValidate(state: ValidateState, ec: ErrorCollector): void {
   attListValidate(state, ec);

   const generalEntityDetails = Object.entries(state.generalEntities);

   for (const [geDeclName, info] of generalEntityDetails) {
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
