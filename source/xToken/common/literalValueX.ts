/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import {
   CHARREF_PTOKEN,
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
   TEXT_PTOKEN,
} from 'pToken';
import {
   GENERAL_ENTITY_END_PTOKEN,
   PARAMETER_ENTITY_END_PTOKEN,
   PARAMETER_ENTITY_START_PTOKEN,
   LiteralValuePToken,
} from 'token';

import { GeneralEntityEndXToken } from '../marker/generalEntityEndXToken';
import { GeneralEntityStartXToken } from '../marker/generalEntityStartXToken';
import { ParameterEntityEndXToken } from '../marker/parameterEntityEndXToken';
import { ParameterEntityStartXToken } from '../marker/parameterEntityStartXToken';
import { TextXToken } from '../token/textXToken';
import { CharRefXToken } from '../token/charRefXToken';
import { ParameterEntityReferenceXToken } from '../token/parameterEntityReferenceXToken';
import { GeneralEntityReferenceXToken } from '../token/generalEntityReferenceXToken';

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

   for (const item of pToken) {
      if (item.type === TEXT_PTOKEN) {
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
      } else {
         value.push(new GeneralEntityStartXToken(item));
      }
   }

   return value;
}

function cloneLiteralValueX(source: LiteralValueX | undefined): LiteralValueX {
   if (!source) {
      return [];
   }

   const newCopy: LiteralValueX = [];

   for (const item of source) {
      newCopy.push({ ...item });
   }

   return newCopy;
}

export { makeLiteralValueX, LiteralValueX, cloneLiteralValueX };
