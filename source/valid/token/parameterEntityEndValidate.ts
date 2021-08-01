/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ErrorCollector } from 'basic';
import {
   ATTLIST_DECLARATION_PTOKEN,
   ELEMENT_DECLARATION_PTOKEN,
   GENERAL_ENTITY_DECLARATION_PTOKEN,
   NOTATION_DECLARATION_PTOKEN,
   PARAMETER_ENTITY_DECLARATION_PTOKEN,
   PROCESSING_INSTRUCTION_PTOKEN,
} from 'pToken';
import { COMMENT_PTOKEN, CONDITIONAL_PTOKEN, ParameterEntityEndPToken } from 'token';

import { ValidateState } from '../validateState';
import { validityConstraint } from '../error/validityConstraint';
import { SToken } from 'sToken';

const VID = validityConstraint.id;

function parameterEntityEndValidate(
   endPToken: ParameterEntityEndPToken,
   state: ValidateState,
   ec: ErrorCollector,
): void {
   const lastPToken = state.dtdContext.lastPToken;

   if (lastPToken) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-explicit-any
      const hasClose = (lastPToken as any).close as SToken | undefined;

      if (lastPToken.type === ATTLIST_DECLARATION_PTOKEN) {
         ec.check(!hasClose, VID.PEREF_INVALID_START_NESTING, ['ATTLIST'], lastPToken.open);
      } else if (lastPToken.type === ELEMENT_DECLARATION_PTOKEN) {
         ec.check(!hasClose, VID.PEREF_INVALID_START_NESTING, ['ELEMENT'], lastPToken.open);
      } else if (
         lastPToken.type === GENERAL_ENTITY_DECLARATION_PTOKEN ||
         lastPToken.type === PARAMETER_ENTITY_DECLARATION_PTOKEN
      ) {
         ec.check(!hasClose, VID.PEREF_INVALID_START_NESTING, ['ENTITY'], lastPToken.open);
      } else if (lastPToken.type === NOTATION_DECLARATION_PTOKEN) {
         ec.check(!hasClose, VID.PEREF_INVALID_START_NESTING, ['NOTATION'], lastPToken.open);
      } else if (lastPToken.type === COMMENT_PTOKEN) {
         ec.check(!hasClose, VID.PEREF_INVALID_START_NESTING, ['comment'], lastPToken.open);
      } else if (lastPToken.type === PROCESSING_INSTRUCTION_PTOKEN) {
         ec.check(
            !hasClose,
            VID.PEREF_INVALID_START_NESTING,
            ['processing instruction'],
            lastPToken.open,
         );
      }
   }

   ec.setPos(endPToken.referencePToken.open);

   // §3.4.0 Proper Conditional Section/PE Nesting
   //    If any of the "<![", "[", or "]]>" of a conditional section is
   //    contained in the replacement text for a parameter-entity
   //    reference, all of them must be contained in the same
   //    replacement text.
   const item = state.dtdContext.enclosingStack[state.dtdContext.enclosingStack.length - 1];

   if (item.type === CONDITIONAL_PTOKEN) {
      ec.report(VID.PEREF_INVALID_CONDITIONAL_START_NESTING, [], item.open);
   }
}

export { parameterEntityEndValidate };
