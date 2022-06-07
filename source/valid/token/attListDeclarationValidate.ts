/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { SPACE_REGEX, Collector, isName, isNmToken } from 'basic';
import { AttListDeclarationPToken, AttDefinitionP, pTokenArrayToString } from 'pToken';
import { strOrBlank } from 'sToken';
import { GENERAL_ENTITY_START_PTOKEN, getFirstSToken, WordListEntryPToken } from 'token';

import { ancestorPERefsValidate } from '../common/ancestorPERefsValidate';
import { attributeValueValidate } from '../common/attributeValueValidate';
import { PREDEFINED_ENTITIES } from '../common/constants';
import { ValidityState } from '../common/validityState';
import { xmlSpaceValidate } from '../common/xmlSpaceValidate';
import { validityErrorCodes } from '../error/validityErrorCodes';

const VID = validityErrorCodes.id;

const CODEMAP: Record<string, string> = {
   ENTITIES: VID.ATTLISTDECL_ATT_INVALID_ENTITIES_DEFAULT,
   ENTITY: VID.ATTLISTDECL_ATT_INVALID_ENTITY_DEFAULT,
   ENUMERATION: VID.ATTLISTDECL_ATT_INVALID_ENUMERATION_DEFAULT,
   IDREF: VID.ATTLISTDECL_ATT_INVALID_IDREF_DEFAULT,
   IDREFS: VID.ATTLISTDECL_ATT_INVALID_IDREFS_DEFAULT,
   NMTOKEN: VID.ATTLISTDECL_ATT_INVALID_NMTOKEN_DEFAULT,
   NMTOKENS: VID.ATTLISTDECL_ATT_INVALID_NMTOKENS_DEFAULT,
   NOTATION: VID.ATTLISTDECL_ATT_INVALID_NOTATION_DEFAULT,
};

function checkEnumeration(
   attDef: AttDefinitionP,
   elName: string,
   attName: string,
   attType: string,
   state: ValidityState,
   coll: Collector,
): void {
   if (!attDef.enumeration) {
      return;
   }

   const isVer1Ed1Or2 = state.confVer.version === 1.0 && state.confVer.edition <= 2;
   const seenWords: Record<string, boolean> = {};
   const code =
      attType === 'NOTATION'
         ? VID.ATTLISTDECL_ATT_XTRA_NOTATION_VALUE
         : VID.ATTLISTDECL_ATT_XTRA_ENUMERATION_VALUE;

   coll.setPos(attDef.enumeration.open);

   for (const wordInfo of attDef.enumeration.words) {
      coll.setPos(wordInfo.word);
      const word = strOrBlank(wordInfo.word);

      // §3.3.1: (1.0/3+) Validity constraint: No Duplicate Tokens
      //    The notation names in a single NotationType attribute declaration,
      //    as well as the NmTokens in a single Enumeration attribute declaration,
      //    must all be distinct.
      coll.check(!isVer1Ed1Or2 && seenWords[word], code, [elName, attName, word]);

      seenWords[word] = true;
   }
}

function checkEnumOrNotation(
   value: string,
   entries: ReadonlyArray<WordListEntryPToken>,
): [boolean, Array<string>, string] {
   const words: Array<string> = [];
   let isValid = true;

   for (const word of entries) {
      const wordString = strOrBlank(word.word);

      if (wordString !== '') {
         words.push(wordString);
      }
   }

   isValid = words.includes(value);

   return [isValid, words, value];
}

function checkValue(
   value: string,
   attType: string,
   state: ValidityState,
): [boolean, Array<string>] {
   const badItems: Array<string> = [];
   const checkFn = attType === 'NMTOKEN' || attType === 'NMTOKENS' ? isNmToken : isName;
   let isValid = true;
   let valueSet: Array<string> = [value];

   if (attType === 'IDREFS' || attType === 'ENTITIES' || attType === 'NMTOKENS') {
      valueSet = value.trim().split(SPACE_REGEX);
   }

   for (const element of valueSet) {
      const thisIsValid = checkFn(element, state.confVer.version, state.confVer.edition);
      isValid = isValid && thisIsValid;

      if (!thisIsValid) {
         badItems.push(element);
      }
   }

   return [isValid, badItems];
}

function checkDefaultValue(
   attDef: AttDefinitionP,
   elName: string,
   attName: string,
   attType: string,
   state: ValidityState,
   coll: Collector,
): void {
   for (const element of attDef.value) {
      if (element.type === GENERAL_ENTITY_START_PTOKEN) {
         const name = strOrBlank(element.referencePToken.name);
         const isPredefined = PREDEFINED_ENTITIES.includes(name);
         const details = state.generalEntities[name];

         coll.setPos(element.referencePToken.open);

         // §2.9.0 Validity Constraint: Standalone Document Declaration
         //    ...entities (other than amp, lt, gt, apos, quot), if references to
         //    those entities appear in the document...
         coll.check(
            details?.isExternalMarkupDeclaration && state.isStandalone && !isPredefined,
            VID.ENTITYREF_EXTERNAL,
            [name],
         );

         ancestorPERefsValidate(element, state, coll);
      }
   }

   attributeValueValidate(attDef.value, state, coll);

   if (attDef.value.length === 0 || !CODEMAP[attType]) {
      return;
   }

   const value = pTokenArrayToString(attDef.value);
   const code = CODEMAP[attType];

   coll.setPos(getFirstSToken(attDef.value[0]));

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

   if (attType === 'ENUMERATION' || attType === 'NOTATION') {
      const wordList = attDef.enumeration?.words ?? [];
      const [isValid, words, badItem] = checkEnumOrNotation(value, wordList);

      coll.check(!isValid, code, [elName, attName, words.join(','), badItem]);
   } else {
      const [isValid, badItems] = checkValue(value, attType, state);

      coll.check(!isValid, code, [elName, attName, badItems.join(',')]);
   }
}

function attListDeclarationValidate(
   token: AttListDeclarationPToken,
   state: ValidityState,
   coll: Collector,
): void {
   const elName = strOrBlank(token.elementName);

   coll.setPos(token.open);

   // §2.8.0: Validity Constraint: Proper Declaration/PE Nesting
   //    Parameter-entity replacement text must be properly nested with markup declarations.
   //    That is to say, if ... the last character of a markup declaration (markupdecl above)
   //    is contained in the replacement text for a parameter-entity reference,
   //    both [first and last char] must be contained in the same replacement text.
   // In this case, the first character was not, so make sure the last is not.
   if (token.unexpanded && token.extra) {
      const extraText = strOrBlank(token.extra);

      coll.check(extraText.indexOf('>') !== -1, VID.PEREF_INVALID_END_NESTING, ['ATTLIST']);
   }

   coll.setPos(token.elementName);

   for (const attDef of token.attDefs) {
      const attType = strOrBlank(attDef.type).toUpperCase();
      const actualType = attType === '' ? 'ENUMERATION' : attType;
      const attName = strOrBlank(attDef.name);
      const isId = actualType === 'ID';

      coll.setPos(attDef.name);
      coll.setPos(attDef.type);

      checkEnumeration(attDef, elName, attName, actualType, state, coll);
      xmlSpaceValidate(attDef, elName, attName, state, coll);

      if (isId) {
         const defaultType = strOrBlank(attDef.defaultType).toUpperCase();

         coll.setPos(attDef.defaultType);

         // §3.3.1: Validity Constraint: ID Attribute Default
         //    An ID attribute must have a declared default of #IMPLIED or #REQUIRED.
         coll.check(
            defaultType !== '#REQUIRED' && defaultType !== '#IMPLIED',
            VID.ATTLISTDECL_ATT_INVALID_ID_DEFAULT,
            [elName, attName, defaultType],
         );
      }

      checkDefaultValue(attDef, elName, attName, actualType, state, coll);
   }
}

export { attListDeclarationValidate };
