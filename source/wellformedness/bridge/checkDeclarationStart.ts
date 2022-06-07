/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { Collector } from 'basic';
import { DeclarationStart } from 'token';
import { strOrBlank } from 'sToken';

import { wellFormedErrorCodes } from '../error/wellFormedError';

const WFEID = wellFormedErrorCodes.id;
const DECLARATION_TYPES = ['ATTLIST', 'DOCTYPE', 'ELEMENT', 'ENTITY', 'NOTATION'];

function checkDeclarationStart(pToken: DeclarationStart, collector: Collector): void {
   const declTypeString = strOrBlank(pToken.declType);
   collector.setPos(pToken.open);

   collector.setPos(pToken.openSpace);
   collector.check(pToken.openSpace, WFEID.DECL_OPEN_XTRA_SPACE_AFTER);

   collector.setPos(pToken.declType);

   if (pToken.declType) {
      const upperCase = pToken.declType.str.toLocaleUpperCase();

      if (!DECLARATION_TYPES.includes(upperCase)) {
         collector.check(!pToken.declTypeSpace, WFEID.DECL_UNKNOWN, [strOrBlank(pToken.declType)]);
      } else {
         collector.check(pToken.declType.str !== upperCase, WFEID.DECL_DECLTYPE_INVALID_CASE, [
            upperCase,
            declTypeString,
         ]);
      }
   } else {
      collector.report(WFEID.DECL_NO_DECLTYPE);
   }

   collector.check(!pToken.declTypeSpace, WFEID.DECL_TYPE_NO_SPACE_AFTER, [
      strOrBlank(pToken.declType),
   ]);
}

export { checkDeclarationStart };
