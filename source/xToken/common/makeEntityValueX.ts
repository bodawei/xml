/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { CHARREF_PTOKEN, PARAMETER_ENTITY_REFERENCE_PTOKEN, TEXT_PTOKEN } from 'pToken';
import { strOrBlank } from 'sToken';
import {
   PARAMETER_ENTITY_END_PTOKEN,
   PARAMETER_ENTITY_START_PTOKEN,
   LiteralValuePToken,
} from 'token';

import { ParameterEntityReferenceXToken } from '../token/parameterEntityReferenceXToken';

type MutableExntityValueX = Array<string | ParameterEntityReferenceXToken>;
type ExntityValueX = ReadonlyArray<string | ParameterEntityReferenceXToken>;

function makeEntityValueX(value: LiteralValuePToken): ExntityValueX {
   const result: MutableExntityValueX = [];
   let currentString = '';

   for (const item of value) {
      switch (item.type) {
         case CHARREF_PTOKEN:
            currentString += item.char;
            break;
         case TEXT_PTOKEN:
            currentString += strOrBlank(item.text);
            break;
         case PARAMETER_ENTITY_REFERENCE_PTOKEN:
            if (currentString !== '') {
               result.push(currentString);
               currentString = '';
            }
            result.push(new ParameterEntityReferenceXToken(item));
            break;
         case PARAMETER_ENTITY_START_PTOKEN:
         case PARAMETER_ENTITY_END_PTOKEN:
         default:
            // do nothing
            break;
      }
   }

   if (currentString !== '') {
      result.push(currentString);
   }

   return result;
}

export { ExntityValueX, makeEntityValueX };
