/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ErrorCollector } from 'basic';
import { GENERAL_ENTITY_REFERENCE_PTOKEN } from 'pToken';
import { GENERAL_ENTITY_START_PTOKEN, LiteralValuePToken } from 'token';

import { geRefValidate } from './geRefValidate';
import { ValidityState } from './validityState';

function attributeValueValidate(
   attValue: LiteralValuePToken,
   state: ValidityState,
   ec: ErrorCollector,
): void {
   if ((!state.hasExternalSubset && !state.hasPeRefs) || state.isStandalone) {
      return;
   }

   for (const element of attValue) {
      if (element.type === GENERAL_ENTITY_REFERENCE_PTOKEN) {
         geRefValidate(element, state, ec);
      } else if (element.type === GENERAL_ENTITY_START_PTOKEN) {
         geRefValidate(element.referencePToken, state, ec);
      }
   }
}

export { attributeValueValidate };
