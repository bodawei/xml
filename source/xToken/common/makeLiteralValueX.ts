/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import {
   GENERAL_ENTITY_END_PTOKEN,
   GENERAL_ENTITY_START_PTOKEN,
   PARAMETER_ENTITY_END_PTOKEN,
   PARAMETER_ENTITY_START_PTOKEN,
   LiteralValuePToken,
} from 'token';
import {
   CHARREF_PTOKEN,
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
   isTextPToken,
} from 'pToken';
import {
   CharRefXToken,
   GeneralEntityReferenceXToken,
   GeneralEntityEndXToken,
   GeneralEntityStartXToken,
   ParameterEntityReferenceXToken,
   ParameterEntityEndXToken,
   ParameterEntityStartXToken,
   TextXToken,
} from 'xToken';

type LiteralValueX = Array<
   | TextXToken
   | CharRefXToken
   | GeneralEntityEndXToken
   | GeneralEntityReferenceXToken
   | GeneralEntityStartXToken
   | ParameterEntityEndXToken
   | ParameterEntityStartXToken
   | ParameterEntityReferenceXToken
>;

function makeLiteralValueX(pToken: LiteralValuePToken): LiteralValueX {
   const value: LiteralValueX = [];

   for (let index = 0; index < pToken.length; index++) {
      const item = pToken[index];

      if (isTextPToken(item)) {
         value.push(new TextXToken(item));
      } else if (item.type === CHARREF_PTOKEN) {
         value.push(new CharRefXToken(item));
      } else if (item.type === PARAMETER_ENTITY_REFERENCE_PTOKEN) {
         value.push(new ParameterEntityReferenceXToken(item));
      } else if (item.type === PARAMETER_ENTITY_START_PTOKEN) {
         value.push(new ParameterEntityStartXToken(item));
      } else if (item.type === PARAMETER_ENTITY_END_PTOKEN) {
         value.push(new ParameterEntityEndXToken(item));
      } else if (item.type === GENERAL_ENTITY_REFERENCE_PTOKEN) {
         value.push(new GeneralEntityReferenceXToken(item));
      } else if (item.type === GENERAL_ENTITY_END_PTOKEN) {
         value.push(new GeneralEntityEndXToken(item));
      } else if (item.type === GENERAL_ENTITY_START_PTOKEN) {
         value.push(new GeneralEntityStartXToken(item));
      }
   }

   return value;
}

export { makeLiteralValueX, LiteralValueX };
