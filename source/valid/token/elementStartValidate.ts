/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { isAugmentedAttribute } from 'attFixer';
import { ErrorCollector, isNmToken } from 'basic';
import { pTokenArrayToString } from 'pToken';
import { strOrBlank } from 'sToken';
import { ElementStartPToken, ElementEmptyPToken } from 'token';

import { ValidityError } from '../error/ValidityError';
import { ElDeclType, ValidateState } from '../validateState';

const VID = ValidityError.ID;

function nmtokenCheck(
   elName: string,
   attName: string,
   attType: string,
   attValue: string,
   ec: ErrorCollector,
   state: ValidateState,
): void {
   let names: Array<string> = [];
   const badNames: Array<string> = [];
   let code: string;

   if (attType === 'NMTOKEN') {
      names.push(attValue);
      code = ValidityError.ID.ELEMENTSTART_NMTOKEN_NOT_NMTOKEN;
   } else {
      names = attValue.trim().split(/ +/);
      code = ValidityError.ID.ELEMENTSTART_NMTOKENS_NOT_NMTOKEN;
   }

   // §3.3.1: Validity Constraint: Name Token
   //    Values of type NMTOKEN must match the Nmtoken production;
   //    values of type NMTOKENS must match Nmtokens.
   for (let index = 0; index < names.length; index++) {
      if (!isNmToken(names[index], state.confVer.version, state.confVer.edition)) {
         badNames.push(names[index]);
      }
   }

   if (badNames.length > 0) {
      ec.report(code, [badNames.join(', '), elName, attName]);
   }
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
         case 'NMTOKENS':
            nmtokenCheck(elName, attName, type, attrValue, ec, state);
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
   if (context && !state.elementContext.pastEnd) {
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

   checkAttributes(el, elName, state, ec);
}

export { elementStartValidate };
