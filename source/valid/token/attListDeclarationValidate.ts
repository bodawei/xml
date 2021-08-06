/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ErrorCollector, isName, isNmToken } from 'basic';
import { AttListDeclarationPToken, AttDefinitionP, pTokenArrayToString } from 'pToken';
import { strOrBlank } from 'sToken';
import { GENERAL_ENTITY_START_PTOKEN, getFirstSToken } from 'token';
import { attributeValueValidate } from '../common/attributeValueValidate';

import { validityConstraint } from '../error/validityConstraint';
import { ValidityError } from '../error/ValidityError';
import { ValidateState } from '../validateState';
import { ancestorPERefsValidate } from './ancestorPERefsValidate';
import { xmlSpaceValidate } from './xmlSpaceValidate';

const OLD_VID = ValidityError.ID;
const VID = validityConstraint.id;
const PREDEFINED_ENTITIES = ['amp', 'lt', 'gt', 'apos', 'quot'];

const CODEMAP: Record<string, string> = {
   ENTITIES: VID.ATTLISTDECL_BAD_ENTITIES_DEFAULT,
   ENTITY: VID.ATTLISTDECL_BAD_ENTITY_DEFAULT,
   ENUMERATION: VID.ATTLISTDECL_BAD_ENUMERATION_DEFAULT,
   IDREF: VID.ATTLISTDECL_BAD_IDREF_DEFAULT,
   IDREFS: VID.ATTLISTDECL_BAD_IDREFS_DEFAULT,
   NMTOKEN: VID.ATTLISTDECL_BAD_NMTOKEN_DEFAULT,
   NMTOKENS: VID.ATTLISTDECL_BAD_NMTOKENS_DEFAULT,
   NOTATION: VID.ATTLISTDECL_BAD_NOTATION_DEFAULT,
};

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
         ? OLD_VID.ATTLISTDECL_DUPLICATE_NOTATION
         : OLD_VID.ATTLISTDECL_DUPLICATE_ENUMERATION;

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

function checkDefaultValue(
   attDef: AttDefinitionP,
   elName: string,
   attName: string,
   attType: string,
   state: ValidateState,
   ec: ErrorCollector,
): void {
   for (const element of attDef.value) {
      if (element.type === GENERAL_ENTITY_START_PTOKEN) {
         const name = strOrBlank(element.referencePToken.name);
         const isPredefined = PREDEFINED_ENTITIES.includes(name);
         const details = state.generalEntities[name];

         ec.setPos(element.referencePToken.open);

         // §2.9.0 Validity Constraint: Standalone Document Declaration
         //    ...entities (other than amp, lt, gt, apos, quot), if references to
         //    those entities appear in the document...
         ec.check(
            details?.isExternalMarkupDeclaration && state.isStandalone && !isPredefined,
            VID.ENTITYREF_EXTERNALLY_DECLARED,
            [name],
         );

         ancestorPERefsValidate(element, state, ec);
      }
   }

   attributeValueValidate(attDef.value, state, ec);

   const actualType = attType === '' ? 'ENUMERATION' : attType;
   if (attDef.value.length === 0 || !CODEMAP[actualType]) {
      return;
   }

   const value = pTokenArrayToString(attDef.value);
   let isValid = true;
   const code = CODEMAP[actualType];
   let valueSet: Array<string> = [value];
   const words: Array<string> = [];

   switch (actualType) {
      case 'IDREFS':
      case 'ENTITIES':
      case 'NMTOKENS':
         valueSet = value.trim().split(/[ \t\n]+/); // eek . need version
         break;
      case 'ENUMERATION':
      case 'NOTATION':
         for (const word of attDef.enumeration?.words ?? []) {
            const wordString = strOrBlank(word.word);

            if (wordString !== '') {
               words.push(wordString);
            }
         }
         break;
   }

   const badItems: Array<string> = [];

   switch (actualType) {
      case 'IDREF':
      case 'IDREFS':
      case 'ENTITY':
      case 'ENTITIES':
         for (const element of valueSet) {
            const thisIsValid = isName(element, state.confVer.version, state.confVer.edition);
            isValid = isValid && thisIsValid;

            if (!thisIsValid) {
               badItems.push(element);
            }
         }
         break;
      case 'NMTOKEN':
      case 'NMTOKENS':
         for (const element of valueSet) {
            const thisIsValid = isNmToken(element, state.confVer.version, state.confVer.edition);
            isValid = isValid && thisIsValid;

            if (!thisIsValid) {
               badItems.push(element);
            }
         }
         break;
      case 'ENUMERATION':
      case 'NOTATION':
         isValid = words.includes(value);

         if (!isValid) {
            badItems.push(value);
         }
         break;
   }

   ec.setPos(getFirstSToken(attDef.value[0]));

   // §3.3.2: (1.0/1-2) Validity constraint: Attribute Default Legal
   //    The declared default value must meet the lexical constraints
   //    of the declared attribute type.
   // §3.3.2: (1.0/3) Validity constraint: Attribute Default Value Syntactically Correct
   //    The declared default value must meet the syntactic constraints
   //    of the declared attribute type.
   //    Note that only the syntactic constraints of the type are required here;
   //    other constraints (e.g. that the value be the name of a declared unparsed
   //    entity, for an attribute of type ENTITY) may come into play if the declared
   //    default value is actually used (an element without a specification
   //    for this attribute occurs).
   // §3.3.2: (1.0/4+) Validity constraint: Attribute Default Value Syntactically Correct
   //    The declared default value must meet the syntactic constraints
   //    of the declared attribute type. That is, the default value of an attribute:
   //    - of type IDREF or ENTITY must match the Name production;
   //    - of type IDREFS or ENTITIES must match the Names production;
   //    - of type NMTOKENS must match the Nmtokens production;
   //    - of an enumerated type (either a NOTATION type or an enumeration)
   //      must match one of the enumerated values.
   //    Note that only the syntactic constraints of the type are required here;
   //    other constraints (e.g. that the value be the name of a declared unparsed
   //    entity, for an attribute of type ENTITY) will be reported by a validating
   //    parser only if an element without a specification for this attribute
   //    actually occurs.

   if (actualType === 'ENUMERATION' || actualType === 'NOTATION') {
      ec.check(!isValid, code, [elName, attName, words.join(','), badItems.join(',')]);
   } else {
      ec.check(!isValid, code, [elName, attName, badItems.join(',')]);
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

      ec.check(extraText.indexOf('>') !== -1, OLD_VID.PEREF_INVALID_END_NESTING, ['ATTLIST']);
   }

   ec.setPos(token.elementName);

   for (const attDef of token.attDefs) {
      const attType = strOrBlank(attDef.type).toUpperCase();
      const attName = strOrBlank(attDef.name);
      const isId = attType === 'ID';

      ec.setPos(attDef.name);
      ec.setPos(attDef.type);

      checkEnumeration(attDef, elName, attName, attType, state, ec);
      xmlSpaceValidate(attDef, elName, attName, ec);

      if (isId) {
         const defaultType = strOrBlank(attDef.defaultType).toUpperCase();

         ec.setPos(attDef.defaultType);

         ec.check(
            defaultType !== '#REQUIRED' && defaultType !== '#IMPLIED',
            OLD_VID.ATTLISTDECL_ID_BAD_DEFAULT,
            [elName, attName, defaultType],
         );
      }

      checkDefaultValue(attDef, elName, attName, attType, state, ec);
   }
}

export { attListDeclarationValidate };
