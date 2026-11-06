/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { CHARREF_PTOKEN, PARAMETER_ENTITY_REFERENCE_PTOKEN, TEXT_PTOKEN } from 'pToken';
import { PARAMETER_ENTITY_START_PTOKEN, EntityValuePToken } from 'token';

import { ParameterEntityEndXToken } from '../marker/parameterEntityEndXToken';
import { ParameterEntityStartXToken } from '../marker/parameterEntityStartXToken';
import { TextXToken } from '../token/textXToken';
import { CharRefXToken } from '../token/charRefXToken';
import { ParameterEntityReferenceXToken } from '../token/parameterEntityReferenceXToken';

type MutableExntityValueX = Array<
   | TextXToken
   | CharRefXToken
   | ParameterEntityReferenceXToken
   | ParameterEntityStartXToken
   | ParameterEntityEndXToken
>;

type ExntityValueX = ReadonlyArray<
   | TextXToken
   | CharRefXToken
   | ParameterEntityReferenceXToken
   | ParameterEntityStartXToken
   | ParameterEntityEndXToken
>;

function makeEntityValueX(pToken: EntityValuePToken): ExntityValueX {
   const value: MutableExntityValueX = [];

   for (const item of pToken) {
      if (item.type === TEXT_PTOKEN) {
         value.push(new TextXToken(item));
      } else if (item.type === CHARREF_PTOKEN) {
         value.push(new CharRefXToken(item));
      } else if (item.type === PARAMETER_ENTITY_REFERENCE_PTOKEN) {
         value.push(new ParameterEntityReferenceXToken(item));
      } else if (item.type === PARAMETER_ENTITY_START_PTOKEN) {
         value.push(new ParameterEntityStartXToken(item));
      } else {
         value.push(new ParameterEntityEndXToken(item));
      }
   }

   return value;
}

function cloneEntityValueX(source: ExntityValueX | undefined): ExntityValueX {
   if (!source) {
      return [];
   }

   const newCopy: MutableExntityValueX = [];

   for (const item of source) {
      newCopy.push({ ...item });
   }

   return newCopy;
}

export { makeEntityValueX, ExntityValueX, cloneEntityValueX };
