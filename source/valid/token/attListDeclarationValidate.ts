/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ErrorCollector } from 'basic';
import { AttListDeclarationPToken, AttDefinitionP } from 'pToken';
import { strOrBlank } from 'sToken';

import { ValidityError } from '../error/ValidityError';
import { ValidateState } from '../validateState';

const VID = ValidityError.ID;

function checkEnumeration(
   attDef: AttDefinitionP,
   elName: string,
   attName: string,
   attType: string,
   state: ValidateState,
   ec: ErrorCollector,
): void {
   if (!attDef.enumeration) {
      return;
   }

   const isVer1Ed1Or2 = state.confVer.version === 1.0 && state.confVer.edition <= 2;
   const seenWords: Record<string, boolean> = {};
   const code =
      attType === 'NOTATION'
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
      ec.check(!isVer1Ed1Or2 && seenWords[word], code, [elName, attName, word]);

      seenWords[word] = true;
   }
}

function attListDeclarationValidate(
   token: AttListDeclarationPToken,
   state: ValidateState,
   ec: ErrorCollector,
): void {
   const elName = strOrBlank(token.elementName);

   ec.setPos(token.open);

   // §2.8.0: Validity Constraint: Proper Declaration/PE Nesting
   //    Parameter-entity replacement text must be properly nested with markup declarations.
   //    That is to say, if ... the last character of a markup declaration (markupdecl above)
   //    is contained in the replacement text for a parameter-entity reference,
   //    both [first and last char] must be contained in the same replacement text.
   // In this case, the first character was not, so make sure the last is not.
   if (token.unexpanded && token.extra) {
      const extraText = strOrBlank(token.extra);

      ec.check(extraText.indexOf('>') !== -1, VID.PEREF_INVALID_END_NESTING, ['ATTLIST']);
   }

   ec.setPos(token.elementName);

   for (const attDef of token.attDefs) {
      const attType = strOrBlank(attDef.type).toUpperCase();
      const attName = strOrBlank(attDef.name);
      const isId = attType.toUpperCase() === 'ID';

      ec.setPos(attDef.name);
      ec.setPos(attDef.type);

      checkEnumeration(attDef, elName, attName, attType, state, ec);

      if (isId) {
         const defaultType = strOrBlank(attDef.defaultType).toUpperCase();

         ec.setPos(attDef.defaultType);

         ec.check(
            defaultType !== '#REQUIRED' && defaultType !== '#IMPLIED',
            VID.ATTLISTDECL_ID_BAD_DEFAULT,
            [elName, attName, defaultType],
         );
      }
   }
}

export { attListDeclarationValidate };
