/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ParseToken, TEXTDECL_PTOKEN } from 'pToken';
import { GENERAL_ENTITY_END_PTOKEN, GENERAL_ENTITY_START_PTOKEN } from 'token';

import { isXmlData } from './isXmlData';
import { ElDeclType, ElementContext, ValidityState } from './validityState';

function contentUpdateState(token: ParseToken, state: ValidityState): ValidityState {
   const stack = state.elementContext.contextStack;
   const curContext = stack[stack.length - 1] as ElementContext | undefined;
   const details = curContext?.details;

   // §3.0.0 Validity Constraint: Element Valid
   /*
    * Do state setup for a 1.0/1 oddball condition for the CONTENTELEMENT_XTRA_SPACE error
    * in the contentValidate() routine.
    */
   if (details?.type === ElDeclType.ELEMENT) {
      const isXml = isXmlData(token);
      const isIgnoredToken =
         token.type == GENERAL_ENTITY_START_PTOKEN ||
         token.type == GENERAL_ENTITY_END_PTOKEN ||
         token.type === TEXTDECL_PTOKEN;

      if (isXml && !isIgnoredToken) {
         const lastIndex = state.elementContext.contextStack.length - 1;
         const lastContext = state.elementContext.contextStack[lastIndex];
         const partialStack = state.elementContext.contextStack.slice(0, lastIndex);
         const newContext: ElementContext = {
            ...lastContext,
            lastToken: token,
         };

         return {
            ...state,
            elementContext: {
               ...state.elementContext,
               contextStack: [...partialStack, newContext],
            },
         };
      }
   }

   return state;
}

export { contentUpdateState };
