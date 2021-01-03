/* Copyright ® 2020 by 柏大衛. All rights reserved. */

// ick
import { strOrBlank } from 'sToken';
import {
   CHARREF_PTOKEN,
   GENERAL_ENTITY_END_PTOKEN,
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   GENERAL_ENTITY_START_PTOKEN,
   PARAMETER_ENTITY_END_PTOKEN,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
   PARAMETER_ENTITY_START_PTOKEN,
} from 'token';
import { LiteralValuePToken } from '../..//token/common/literal';
import { TEXT_PTOKEN } from '../token/text';

function attValueToString(value: LiteralValuePToken = []): string {
   const pieces = [];

   for (const piece of value) {
      switch (piece.type) {
         case TEXT_PTOKEN:
            pieces.push(strOrBlank(piece.text));
            break;
         case CHARREF_PTOKEN:
            pieces.push(piece.char);
            break;
         case GENERAL_ENTITY_START_PTOKEN:
         case GENERAL_ENTITY_END_PTOKEN:
         case GENERAL_ENTITY_REFERENCE_PTOKEN:
         // Note: These 3 can't actually happen here. This is a typehack problem
         case PARAMETER_ENTITY_START_PTOKEN:
         case PARAMETER_ENTITY_END_PTOKEN:
         case PARAMETER_ENTITY_REFERENCE_PTOKEN:
         // do nothing
      }
   }

   return pieces.join('');
}

export { attValueToString };
