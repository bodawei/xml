/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ErrorCollector } from 'basic';
import { AttListDeclarationPToken } from 'pToken';
import { strOrBlank } from 'sToken';

import { ValidityError } from '../error/ValidityError';
import { ValidateState } from '../validateState';

const VID = ValidityError.ID;

function attListDeclarationValidate(
   token: AttListDeclarationPToken,
   state: ValidateState,
   ec: ErrorCollector,
): void {
   const isVer1Ed3OrLater = state.confVer.version === 1.1 || state.confVer.edition >= 3;
   const elName = strOrBlank(token.elementName);

   if (!isVer1Ed3OrLater) {
      return;
   }

   ec.setPos(token.open);
   ec.setPos(token.elementName);

   for (const attDef of token.attDefs) {
      ec.setPos(attDef.name);

      if (!attDef.enumeration) {
         continue;
      }

      const seenWords: Record<string, boolean> = {};
      const type = strOrBlank(attDef.type).toUpperCase();
      const attName = strOrBlank(attDef.name);
      const code =
         type === 'NOTATION'
            ? VID.ATTLISTDECL_DUPLICATE_NOTATION
            : VID.ATTLISTDECL_DUPLICATE_ENUMERATION;

      ec.setPos(attDef.enumeration.open);

      for (const wordInfo of attDef.enumeration.words) {
         ec.setPos(wordInfo.word);
         const word = strOrBlank(wordInfo.word);

         // §3.3.1: (1.0/3+) Validity constraint: No Duplicate Tokens
         //    The notation names in a single NotationType attribute declaration,
         //    as well as the NmTokens in a single Enumeration attribute declaration,
         //    must all be distinct.
         ec.check(seenWords[word], code, [elName, attName, word]);

         seenWords[word] = true;
      }
   }
}

export { attListDeclarationValidate };
