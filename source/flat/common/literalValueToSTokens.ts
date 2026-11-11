/* Copyright ® 2018-2026 by 柏大衛. All rights reserved. */

import { SToken } from 'basic';
import {
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
   TEXT_PTOKEN,
   CHARREF_PTOKEN,
} from 'pToken';
import { LiteralValuePToken } from 'token';

import { charRefToSTokens } from '../token/charRefToSTokens';
import { generalEntityReferenceToSTokens } from '../token/generalEntityReferenceToSTokens';
import { parameterEntityReferenceToSTokens } from '../token/parameterEntityReferenceToSTokens';
import { textToSTokens } from '../token/textToSTokens';
import { STokenArrayBuilder } from '../util/STokenArrayBuilder';

function literalValueToSTokens(pToken: LiteralValuePToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

   for (const item of pToken) {
      if (item.type === CHARREF_PTOKEN) {
         builder.add(charRefToSTokens(item));
      } else if (item.type === TEXT_PTOKEN) {
         builder.add(textToSTokens(item));
      } else if (item.type === PARAMETER_ENTITY_REFERENCE_PTOKEN) {
         builder.add(parameterEntityReferenceToSTokens(item));
      } else if (item.type === GENERAL_ENTITY_REFERENCE_PTOKEN) {
         builder.add(generalEntityReferenceToSTokens(item));
      }
   }

   return builder.sTokenArray;
}

export { literalValueToSTokens };
