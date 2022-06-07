/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { Collector } from 'basic';
import { GENERAL_ENTITY_REFERENCE_PTOKEN } from 'pToken';
import { GENERAL_ENTITY_START_PTOKEN, LiteralValuePToken } from 'token';

import { geRefValidate } from './geRefValidate';
import { ValidityState } from './validityState';

function attributeValueValidate(
   attValue: LiteralValuePToken,
   state: ValidityState,
   coll: Collector,
): void {
   if ((!state.hasExternalSubset && !state.hasPeRefs) || state.isStandalone) {
      return;
   }

   for (const element of attValue) {
      if (element.type === GENERAL_ENTITY_REFERENCE_PTOKEN) {
         geRefValidate(element, state, coll);
      } else if (element.type === GENERAL_ENTITY_START_PTOKEN) {
         geRefValidate(element.referencePToken, state, coll);
      }
   }
}

export { attributeValueValidate };
