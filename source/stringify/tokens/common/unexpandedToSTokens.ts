/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { STokenArrayBuilder, SToken } from 'sToken';
import { PARAMETER_ENTITY_REFERENCE_PTOKEN, TEXT_PTOKEN } from 'token';

import { parameterEntityReferenceToSTokens } from '../parameterEntityReferenceToSTokens';

import { UnexpandedDetails } from 'source/pToken/types';

const DEFAULT: UnexpandedDetails = { propName: '', tokens: [] };

function unexpandedToSTokens(details: UnexpandedDetails = DEFAULT): Array<SToken> {
   const builder = new STokenArrayBuilder();
   const tokens = details.tokens;

   for (const token of tokens) {
      switch (token.type) {
         case PARAMETER_ENTITY_REFERENCE_PTOKEN:
            builder.add(...parameterEntityReferenceToSTokens(token));
            break;
         case TEXT_PTOKEN:
            builder.add(token.text);
            break;
      }
   }

   return builder.sTokenArray;
}

export { unexpandedToSTokens };
