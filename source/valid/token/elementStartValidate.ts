/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { isAugmentedAttribute } from 'attFixer';
import { ErrorCollector, isName, isNmToken } from 'basic';
import { pTokenArrayToString } from 'pToken';
import { SToken, strOrBlank } from 'sToken';
import { ElementStartPToken, ElementEmptyPToken } from 'token';

import { ValidityError } from '../error/ValidityError';
import { validityConstraint } from '../error/validityConstraint';
import { ElDeclType, ValidateState } from '../validateState';

const NVID = validityConstraint.id;
const VID = ValidityError.ID;

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
      ? NVID.ELEMENTSTART_ENTITIES_NOT_NAME
      : NVID.ELEMENTSTART_ENTITY_NOT_NAME;
   const undeclId = isPlural
      ? NVID.ELEMENTSTART_ENTITIES_NO_ENTITY
      : NVID.ELEMENTSTART_ENTITY_NO_ENTITY;
   const parsedId = isPlural
      ? NVID.ELEMENTSTART_ENTITIES_PARSED_ENTITY
      : NVID.ELEMENTSTART_ENTITY_PARSED_ENTITY;
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
      ? NVID.ELEMENTSTART_NMTOKENS_NOT_NMTOKEN
      : NVID.ELEMENTSTART_NMTOKEN_NOT_NMTOKEN;
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

function checkAttributes(
   el: ElementStartPToken | ElementEmptyPToken,
   elName: string,
   state: ValidateState,
   ec: ErrorCollector,
): void {
   const attributes = el.attributes;

   for (const attr of attributes) {
      const attName = strOrBlank(attr.name);
      const details = state.attributeDefs[elName]?.[attName];

      if (!details) {
         // §3.1.0: Validity constraint: Attribute Value Type
         //    The attribute must have been declared; ...
         ec.report(VID.ELEMENTSTART_UNDECLARED_ATTRIBUTE, [elName, attName], attr.name);
         continue;
      }

      const type = strOrBlank(details.def.type).toUpperCase();
      const attrValue = pTokenArrayToString(attr.value);

      ec.setPos(attr.name);

      if (state.isStandalone && isAugmentedAttribute(attr)) {
         if (!details.isExternal) {
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

      switch (type) {
         case 'NMTOKEN':
            nmtokenCheck(elName, attName, attrValue, false, attr.name, ec, state);
            break;
         case 'NMTOKENS':
            nmtokenCheck(elName, attName, attrValue, true, attr.name, ec, state);
            break;
         case 'ENTITY':
            entityCheck(elName, attName, attrValue, false, attr.name, ec, state);
            break;
         case 'ENTITIES':
            entityCheck(elName, attName, attrValue, true, attr.name, ec, state);
            break;
      }
   }
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

   ec.check(!state.elementDeclarations[elName], VID.UNDECLARED_ELEMENT, [elName]);

   // If we aren't in any context, then there's nothing to validate
   if (!state.elementContext.pastEnd) {
      // §2.8.0 Validity Constraint: Root Element Type
      //   The Name in the document type declaration must match
      //   the element type of the root element.
      if (state.docType && !state.elementContext.activeContext) {
         ec.check(
            state.docType !== elName,
            NVID.ELEMENT_MISMATCH_ROOT_TYPE,
            [state.docType, elName],
            el.name,
         );
      }

      if (context) {
         switch (context.declDetails.type) {
            case ElDeclType.EMPTY:
               ec.report(VID.CONTENT_IN_EMPTY_ELEMENT, [context.parentName]);
               break;
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

               ec.check(!allowedChild, VID.INVALID_ELEMENT_IN_MIXED, [context.parentName, elName]);
               break;
            case ElDeclType.ELEMENT:
               // §3.0.0 Validity Constraint: Element Valid
               //     2. The declaration matches children and the sequence of child elements
               //     belongs to the language generated by the regular expression in the content
               //     model, with optional white space (characters matching the nonterminal S)
               //     between each pair of child elements.
               const currentState = context.declDetails.graph.states[context.stateId];
               const destState = currentState.trans[elName];

               ec.check(!destState, VID.INVALID_ELEMENT_IN_CONTENT, [context.parentName, elName]);
               break;
         }
      }
   }

   checkAttributes(el, elName, state, ec);
}

export { elementStartValidate };
