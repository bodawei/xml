/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { isAugmentedAttribute } from 'attFixer';
import { ErrorCollector, isName, isNmToken } from 'basic';
import { AttDefinitionP, pTokenArrayToString } from 'pToken';
import { SToken, strOrBlank } from 'sToken';
import { ElementStartPToken, ElementEmptyPToken, GENERAL_ENTITY_START_PTOKEN } from 'token';

import { validityConstraint } from '../error/validityConstraint';
import { ElDeclType, ValidateState } from '../validateState';
import { ancestorPERefsValidate } from './ancestorPERefsValidate';

const VID = validityConstraint.id;
const PREDEFINED_ENTITIES = ['amp', 'lt', 'gt', 'apos', 'quot'];

type LocalDetials = Record<string, AttInfo | undefined>;
interface AttInfo {
   elName: string;
   attName: string;
}

function enumeratedValueCheck(
   elName: string,
   attName: string,
   attValue: string,
   attDef: AttDefinitionP,
   nameSToken: SToken,
   ec: ErrorCollector,
): void {
   const isNotation = strOrBlank(attDef.type).toUpperCase() === 'NOTATION';
   const code = isNotation
      ? VID.ELEMENTSTART_NOTATION_NOT_DECLARED
      : VID.ELEMENTSTART_ENUMERATION_NOT_DECLARED;
   let foundDeclaration = false;
   const allWords: Array<string> = [];
   // If this is a notation att OR we have an enumeration, then do the check.
   // This protects against malformed attrDef's that have no type and no enumeration being evaluated as an enumeration
   const shouldEval = isNotation || attDef.enumeration;

   if (attDef.enumeration) {
      for (const wordInfo of attDef.enumeration.words) {
         const word = strOrBlank(wordInfo.word);
         allWords.push(word);

         if (word === attValue) {
            foundDeclaration = true;
         }
      }
   }

   // §3.3.1: Validity Constraint: Notation Attributes
   //    Values of this type must match one of the notation names included in the declaration;
   // §3.3.1: Validity Constraint: Enumeration
   //    Values of this type must match one of the Nmtoken tokens in the declaration.
   ec.check(
      shouldEval && !foundDeclaration,
      code,
      [elName, attName, allWords.join('|'), attValue],
      nameSToken,
   );
}

function entityCheck(
   elName: string,
   attName: string,
   attValue: string,
   isPlural: boolean,
   nameSToken: SToken,
   ec: ErrorCollector,
   state: ValidateState,
): void {
   const names = isPlural ? attValue.trim().split(/ +/) : [attValue];
   const notNameId = isPlural
      ? VID.ELEMENTSTART_ENTITIES_NOT_NAME
      : VID.ELEMENTSTART_ENTITY_NOT_NAME;
   const undeclId = isPlural
      ? VID.ELEMENTSTART_ENTITIES_NO_ENTITY
      : VID.ELEMENTSTART_ENTITY_NO_ENTITY;
   const parsedId = isPlural
      ? VID.ELEMENTSTART_ENTITIES_PARSED_ENTITY
      : VID.ELEMENTSTART_ENTITY_PARSED_ENTITY;
   const badNames: Array<string> = [];
   const undeclared: Array<string> = [];
   const parsed: Array<string> = [];

   // §3.3.1: Validity Constraint: Entity Name
   //    Values of type ENTITY must match the Name production, values of type ENTITIES
   //    must match Names; each Name must match the name of an unparsed entity
   //    declared in the DTD.
   for (const name of names) {
      const token = state.generalEntities[name]?.token;

      if (!isName(name, state.confVer.version, state.confVer.edition)) {
         badNames.push(name);
      }

      if (!token) {
         undeclared.push(name);
      } else if (!token.nDataName) {
         parsed.push(name);
      }
   }

   ec.check(badNames.length > 0, notNameId, [badNames.join(', '), elName, attName], nameSToken);
   ec.check(undeclared.length > 0, undeclId, [undeclared.join(', '), elName, attName], nameSToken);
   ec.check(parsed.length > 0, parsedId, [parsed.join(', '), elName, attName], nameSToken);
}

function idCheck(
   elName: string,
   attName: string,
   attValue: string,
   nameSToken: SToken,
   ec: ErrorCollector,
   state: ValidateState,
   localInfo: Record<string, AttInfo | undefined>,
): Record<string, AttInfo | undefined> {
   const idDetails = state.ids[attValue];
   const local = localInfo[attValue];

   // §3.3.1: Validity Constraint: ID
   //    Values of type **ID** must match the Name production.
   ec.check(
      !isName(attValue),
      VID.ELEMENTSTART_ID_NAME_INVALID,
      [elName, attName, attValue],
      nameSToken,
   );

   // §3.3.1: Validity Constraint: ID
   //    A name must not appear more than once in an XML document
   //    as a value of this type; i.e., ID values must uniquely
   //    identify the elements which bear them.
   if (idDetails || local) {
      ec.report(
         VID.ELEMENTSTART_ID_DUPLICATE,
         [
            elName,
            attName,
            (idDetails?.elName || local?.elName) as string,
            (idDetails?.attName || local?.attName) as string,
            attValue,
         ],
         nameSToken,
      );
   }

   localInfo[attValue] = localInfo[attValue] ?? { attName, elName };

   return localInfo;
}

function nmtokenCheck(
   elName: string,
   attName: string,
   attValue: string,
   isPlural: boolean,
   nameSToken: SToken,
   ec: ErrorCollector,
   state: ValidateState,
): void {
   const names = isPlural ? attValue.trim().split(/ +/) : [attValue];
   const code = isPlural
      ? VID.ELEMENTSTART_NMTOKENS_NOT_NMTOKEN
      : VID.ELEMENTSTART_NMTOKEN_NOT_NMTOKEN;
   const badNames: Array<string> = [];

   // §3.3.1: Validity Constraint: Name Token
   //    Values of type NMTOKEN must match the Nmtoken production;
   //    values of type NMTOKENS must match Nmtokens.
   for (const name of names) {
      if (!isNmToken(name, state.confVer.version, state.confVer.edition)) {
         badNames.push(name);
      }
   }

   ec.check(badNames.length > 0, code, [badNames.join(', '), elName, attName], nameSToken);
}

function idRefCheck(
   elName: string,
   attName: string,
   attValue: string,
   isPlural: boolean,
   nameSToken: SToken,
   ec: ErrorCollector,
   state: ValidateState,
): void {
   const names = isPlural ? attValue.trim().split(/ +/) : [attValue];
   const code = isPlural ? VID.ELEMENTSTART_IDREFS_NOT_NAME : VID.ELEMENTSTART_IDREF_NOT_NAME;
   const badNames: Array<string> = [];

   // §3.3.1: Validity Constraint: IDREF
   //    Values of type IDREF must match the Name production,
   //    and values of type IDREFS must match Names
   for (const name of names) {
      if (!isName(name, state.confVer.version, state.confVer.edition)) {
         badNames.push(name);
      }
   }

   ec.check(badNames.length > 0, code, [elName, attName, badNames.join(', ')], nameSToken);
}

function requiredAttributesCheck(
   attNames: Record<string, boolean>,
   elName: string,
   state: ValidateState,
   ec: ErrorCollector,
): void {
   const attrs = state.attributeDefs[elName] ?? {};
   const attNameAndDetails = Object.entries(attrs);

   // §3.3.2: Validity Constraint: Required Attribute
   //    If the default declaration is the keyword #REQUIRED, then
   //    the attribute must be specified for all elements of the
   //    type in the attribute-list declaration.
   for (const pair of attNameAndDetails) {
      const [name, details] = pair;

      if (strOrBlank(details?.def.defaultType).toLowerCase() === '#required') {
         ec.check(!attNames[name], VID.ELEMENTSTART_NO_REQUIRED, [elName, name]);
      }
   }
}

function fixedAttributesCheck(
   elName: string,
   attName: string,
   attValue: string,
   state: ValidateState,
   ec: ErrorCollector,
): void {
   const attrs = state.attributeDefs[elName] ?? {};
   const attDetails = attrs[attName];

   // §3.3.2: Validity Constraint: Fixed Attribute Default**
   //    If an attribute has a default value declared with the #FIXED keyword, instances
   //    of that attribute must match the default value.
   if (strOrBlank(attDetails?.def.defaultType).toUpperCase() === '#FIXED') {
      const defValue = pTokenArrayToString(attDetails?.def.value);

      ec.check(defValue.trim() !== attValue.trim(), VID.ELEMENTSTART_INVALID_FIXED, [
         elName,
         attName,
         defValue,
         attValue,
      ]);
   }
}

function checkValue(
   el: ElementStartPToken | ElementEmptyPToken,
   state: ValidateState,
   ec: ErrorCollector,
): void {
   for (const att of el.attributes) {
      for (const element of att.value) {
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
   }
}

function checkAttributes(
   el: ElementStartPToken | ElementEmptyPToken,
   elName: string,
   state: ValidateState,
   ec: ErrorCollector,
): void {
   const attributes = el.attributes;
   let localAtts: LocalDetials = {};
   const attrNames: Record<string, boolean> = {};

   for (const attr of attributes) {
      const attName = strOrBlank(attr.name);
      const details = state.attributeDefs[elName]?.[attName];
      attrNames[attName] = true;

      if (!details) {
         // §3.1.0: Validity constraint: Attribute Value Type
         //    The attribute must have been declared; ...
         ec.report(VID.ELEMENTSTART_UNDECLARED_ATTRIBUTE, [elName, attName], attr.name);
         continue;
      }

      const type = strOrBlank(details.def.type).toUpperCase();
      const attValue = pTokenArrayToString(attr.value);

      ec.setPos(attr.name);

      if (state.isStandalone && isAugmentedAttribute(attr)) {
         if (!details.isExternalMarkupDeclaration) {
            continue;
         }

         // §2.9 Validity constraint: Standalone Document Declaration
         // The standalone document declaration must have the value "no" if any external markup
         // declarations contain declarations of:
         // - attributes with default values, if elements to which these attributes apply appear
         // in the document without specifications of values for these attributes, ...
         //
         // Translation: If this was marked as standalone="yes", and we find an element without
         // an attribute that was declared as having a default value, and that declaration was
         // an external declaration, then we have a validity error. (We can't just check this
         // at declaration time, since if it isn't used it is not an error).
         ec.check(attr.defaulted, VID.ELEMENTSTART_DEFAULT_EXTERNAL_DECLARED, [elName, attName]);

         // §2.9 Validity constraint: Standalone Document Declaration
         // The standalone document declaration must have the value "no" if any external markup
         // declarations contain declarations of:
         // - attributes with tokenized types, where the attribute appears in the document
         //   with a value such that normalization will produce a different value from that
         //   which would be produced in the absence of the declaration

         ec.check(
            attr.normalized && attr.dtdChangedNormalization,
            VID.ATTLISTDECL_TYPE_EXTERNAL_DECLARED,
            [elName, attName],
         );
      }

      ec.setPos(attr.openQuote);

      fixedAttributesCheck(elName, attName, attValue, state, ec);

      switch (type) {
         case 'ID':
            localAtts = idCheck(elName, attName, attValue, attr.name, ec, state, localAtts);
            break;
         case 'NMTOKEN':
            nmtokenCheck(elName, attName, attValue, false, attr.name, ec, state);
            break;
         case 'NMTOKENS':
            nmtokenCheck(elName, attName, attValue, true, attr.name, ec, state);
            break;
         case 'IDREF':
            idRefCheck(elName, attName, attValue, false, attr.name, ec, state);
            break;
         case 'IDREFS':
            idRefCheck(elName, attName, attValue, true, attr.name, ec, state);
            break;
         case 'ENTITY':
            entityCheck(elName, attName, attValue, false, attr.name, ec, state);
            break;
         case 'ENTITIES':
            entityCheck(elName, attName, attValue, true, attr.name, ec, state);
            break;
         case 'NOTATION':
            enumeratedValueCheck(elName, attName, attValue, details.def, attr.name, ec);
            break;
         // Enumerations have no type
         case '':
            enumeratedValueCheck(elName, attName, attValue, details.def, attr.name, ec);
            break;
      }
   }

   checkValue(el, state, ec);

   ec.setPos(el.close);

   requiredAttributesCheck(attrNames, elName, state, ec);
}

function elementStartValidate(
   el: ElementStartPToken | ElementEmptyPToken,
   state: ValidateState,
   ec: ErrorCollector,
): void {
   const elName = strOrBlank(el.name);
   const context = state.elementContext.activeContext;

   ec.setPos(el.open);

   ec.setPos(el.name);

   // §3.0.0 Validity Constraint: Element Valid
   //     An element is valid if there is a declaration matching elementdecl where
   //     the Name matches the element type, ...
   ec.check(!state.elementDeclarations[elName], VID.ELEMENT_UNDECLARED, [elName]);

   // If we aren't in any context, then there's nothing to validate
   if (!state.elementContext.pastEnd) {
      // §2.8.0 Validity Constraint: Root Element Type
      //   The Name in the document type declaration must match
      //   the element type of the root element.
      if (state.docType && !state.elementContext.activeContext) {
         ec.check(
            state.docType !== elName,
            VID.ELEMENT_MISMATCH_ROOT_TYPE,
            [state.docType, elName],
            el.name,
         );
      }

      if (context) {
         switch (context.declDetails.type) {
            case ElDeclType.EMPTY:
            // §3.0.0 No validity concerned handled here. These are handled in contentValidate
            case ElDeclType.ANY:
               // §3.0.0 Validity Constraint: Element Valid
               //     4. The declaration matches ANY, and the types of any child
               //     elements have been declared.
               break;
            case ElDeclType.MIXED:
               // §3.0.0 Validity Constraint: Element Valid
               //     3. The declaration matches Mixed and the content consists of
               //     character data and child elements whose types match names in the
               //     content model.
               const allowedChild = context.declDetails.names.includes(elName);

               ec.check(!allowedChild, VID.CONTENT_MIXED_CONTAINS_INVALID_ELEMENT, [
                  context.parentName,
                  elName,
               ]);
               break;
            case ElDeclType.ELEMENT:
               // §3.0.0 Validity Constraint: Element Valid
               //     2. The declaration matches children and the sequence of child elements
               //     belongs to the language generated by the regular expression in the content
               //     model, ...
               const currentState = context.declDetails.graph.states[context.stateId];
               const destState = currentState.trans[elName];

               ec.check(!destState, VID.CONTENT_CONTAINS_INVALID_ELEMENT, [
                  context.parentName,
                  elName,
               ]);
               break;
         }
      }
   }

   checkAttributes(el, elName, state, ec);
}

export { elementStartValidate };
