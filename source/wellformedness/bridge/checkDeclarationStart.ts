/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ErrorCollector } from 'basic';
import { WellFormedError } from 'error';
import { DeclarationStart } from 'token';
import { strOrBlank } from 'sToken';

const WFEID = WellFormedError.ID;
const DECLARATION_TYPES = ['ATTLIST', 'DOCTYPE', 'ELEMENT', 'ENTITY', 'NOTATION'];

function checkDeclarationStart(pToken: DeclarationStart, ec: ErrorCollector): void {
   const declTypeString = strOrBlank(pToken.declType);
   ec.setPos(pToken.open);

   ec.setPos(pToken.openSpace);
   ec.check(pToken.openSpace, WFEID.DECL_OPEN_XTRA_SPACE_AFTER);

   ec.setPos(pToken.declType);

   if (pToken.declType) {
      const upperCase = pToken.declType.str.toLocaleUpperCase();

      if (!DECLARATION_TYPES.includes(upperCase)) {
         ec.check(!pToken.declTypeSpace, WFEID.DECL_UNKNOWN, [strOrBlank(pToken.declType)]);
      } else {
         ec.check(pToken.declType.str !== upperCase, WFEID.DECL_DECLTYPE_INVALID_CASE, [
            upperCase,
            declTypeString,
         ]);
      }
   } else {
      ec.report(WFEID.DECL_NO_DECLTYPE);
   }

   ec.check(!pToken.declTypeSpace, WFEID.DECL_TYPE_NO_SPACE_AFTER, [strOrBlank(pToken.declType)]);
}

export { checkDeclarationStart };
