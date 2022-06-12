/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import {
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
   TEXT_PTOKEN,
   CHARREF_PTOKEN,
} from 'pToken';
import { SToken } from 'sToken';
import { LiteralValuePToken } from 'token';
import { STokenArrayBuilder } from '../util/STokenArrayBuilder';

import { generalEntityReferenceToSTokens } from '../token/generalEntityReferenceToSTokens';
import { parameterEntityReferenceToSTokens } from '../token/parameterEntityReferenceToSTokens';
import { textToSTokens } from '../token/textToSTokens';
import { charRefToSTokens } from '../token/charRefToSTokens';

function literalValueToSTokens(pToken: LiteralValuePToken): Array<SToken> {
   const builder = new STokenArrayBuilder();

   for (let index = 0; index < pToken.length; index++) {
      const item = pToken[index];

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
