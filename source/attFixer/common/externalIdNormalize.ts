/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ExternalIdP, TextPToken } from 'pToken';
import { SToken, strOrBlank } from 'sToken';

const WHITESPACE_RUN = /[ \n]+/g;
const LEADING_SPACE = /^[ \n]+/;
const TRAILING_SPACE = /[ \n]+$/;

function externalIdNormalize(externalId: ExternalIdP): ExternalIdP {
   if (!externalId.public) {
      return externalId;
   }

   const publicValue = externalId.public.value;

   if (publicValue.length === 0) {
      return externalId;
   }

   // Intimate knowledge: We know the parser only generates a single
   // text PToken in the value.
   const textToken = publicValue[0] as TextPToken;
   const text = strOrBlank(textToken.text);

   // §4.2.2 Before a match is attempted, all strings of white space
   //    in the public identifier must be normalized to single space
   //    characters (#x20), and leading and trailing white space must
   //    be removed.
   //
   // Note: By the time we get here, any new lines will already have
   // been converted into '\n'

   const newText = text
      .replace(WHITESPACE_RUN, ' ')
      .replace(LEADING_SPACE, '')
      .replace(TRAILING_SPACE, '');

   if (text === newText) {
      return externalId;
   }

   return {
      ...externalId,
      public: {
         ...externalId.public,
         value: [
            {
               ...textToken,
               text: new SToken(newText, textToken.text.originalStr, textToken.text.ranges),
            },
         ],
      },
   };
}

export { externalIdNormalize };
