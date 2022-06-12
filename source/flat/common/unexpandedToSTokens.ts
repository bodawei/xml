/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { SToken } from 'sToken';
import { PARAMETER_ENTITY_REFERENCE_PTOKEN, TEXT_PTOKEN, UnexpandedMarkupDetails } from 'pToken';
import { STokenArrayBuilder } from '../util/STokenArrayBuilder';

import { parameterEntityReferenceToSTokens } from '../token/parameterEntityReferenceToSTokens';
import { textToSTokens } from '../token/textToSTokens';

const DEFAULT: UnexpandedMarkupDetails = { propName: '', tokens: [] };

function unexpandedToSTokens(details: UnexpandedMarkupDetails = DEFAULT): Array<SToken> {
   const builder = new STokenArrayBuilder();
   const tokens = details.tokens;

   for (const token of tokens) {
      switch (token.type) {
         case PARAMETER_ENTITY_REFERENCE_PTOKEN:
            builder.add(parameterEntityReferenceToSTokens(token));
            break;
         case TEXT_PTOKEN:
            builder.add(textToSTokens(token));
            break;
      }
   }

   return builder.sTokenArray;
}

export { unexpandedToSTokens };
