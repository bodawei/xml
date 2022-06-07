/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { Collector } from 'basic';
import {
   ATTLIST_DECLARATION_PTOKEN,
   ELEMENT_DECLARATION_PTOKEN,
   GENERAL_ENTITY_DECLARATION_PTOKEN,
   NOTATION_DECLARATION_PTOKEN,
   PARAMETER_ENTITY_DECLARATION_PTOKEN,
   PROCESSING_INSTRUCTION_PTOKEN,
} from 'pToken';
import { COMMENT_PTOKEN, CONDITIONAL_START_PTOKEN, ParameterEntityEndPToken } from 'token';

import { ValidityState } from '../common/validityState';
import { validityErrorCodes } from '../error/validityErrorCodes';

const VID = validityErrorCodes.id;

function parameterEntityEndValidate(
   endPToken: ParameterEntityEndPToken,
   state: ValidityState,
   coll: Collector,
): void {
   const lastPToken = state.dtdContext.lastPToken;

   if (lastPToken) {
      // §2.8.0 Proper Declaration/PE Nesting
      //    Parameter-entity replacement text must be properly nested with markup declarations.
      //    That is to say, if either the first character ... of a markup declaration
      //    (markupdecl above) is contained in the replacement text for a parameter-entity
      //    reference, both must be contained in the same replacement text.
      if (lastPToken.type === ATTLIST_DECLARATION_PTOKEN) {
         coll.check(
            !lastPToken.close,
            VID.PEREF_INVALID_START_NESTING,
            ['ATTLIST'],
            lastPToken.open,
         );
      } else if (lastPToken.type === ELEMENT_DECLARATION_PTOKEN) {
         coll.check(
            !lastPToken.close,
            VID.PEREF_INVALID_START_NESTING,
            ['ELEMENT'],
            lastPToken.open,
         );
      } else if (
         lastPToken.type === GENERAL_ENTITY_DECLARATION_PTOKEN ||
         lastPToken.type === PARAMETER_ENTITY_DECLARATION_PTOKEN
      ) {
         coll.check(
            !lastPToken.close,
            VID.PEREF_INVALID_START_NESTING,
            ['ENTITY'],
            lastPToken.open,
         );
      } else if (lastPToken.type === NOTATION_DECLARATION_PTOKEN) {
         coll.check(
            !lastPToken.close,
            VID.PEREF_INVALID_START_NESTING,
            ['NOTATION'],
            lastPToken.open,
         );
      } else if (lastPToken.type === COMMENT_PTOKEN) {
         coll.check(
            !lastPToken.close,
            VID.PEREF_INVALID_START_NESTING,
            ['comment'],
            lastPToken.open,
         );
      } else if (lastPToken.type === PROCESSING_INSTRUCTION_PTOKEN) {
         coll.check(
            !lastPToken.close,
            VID.PEREF_INVALID_START_NESTING,
            ['processing instruction'],
            lastPToken.open,
         );
      }
   }

   coll.setPos(endPToken.referencePToken.open);

   // §3.4.0 Proper Conditional Section/PE Nesting
   //    If any of the "<![", "[", or "]]>" of a conditional section is
   //    contained in the replacement text for a parameter-entity
   //    reference, all of them must be contained in the same
   //    replacement text.
   const item = state.dtdContext.enclosingStack[state.dtdContext.enclosingStack.length - 1];

   if (item.type === CONDITIONAL_START_PTOKEN) {
      coll.report(VID.PEREF_INVALID_CONDITIONALSECTION_START_NESTING, [], item.open);
   }
}

export { parameterEntityEndValidate };
