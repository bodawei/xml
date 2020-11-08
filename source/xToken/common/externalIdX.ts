/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ExternalIdP } from 'pToken';
// ick
import { TEXT_PTOKEN, CHARREF_PTOKEN } from 'token';
import { LiteralValuePToken } from '../../token/common/literal';

function valueToString(value: LiteralValuePToken = []): string {
   const pieces = [];

   for (const piece of value) {
      switch (piece.type) {
         case TEXT_PTOKEN:
            pieces.push(piece.text.str);
            break;
         case CHARREF_PTOKEN:
            pieces.push(piece.char);
            break;
         default:
         // do nothing
      }
   }

   return pieces.join('');
}

/*
 * Converts an ExternaId PToken into an XToken.  This is always
 * embedded in one of the relevant markup declaration tokens.
 */
class ExternalIdX {
   readonly systemId: string;

   readonly publicId?: string;

   constructor(externalId: ExternalIdP | undefined);
   constructor(systemId: string, publicId?: string);
   constructor(externalIdOrSystemId: ExternalIdP | string | undefined, publicId?: string) {
      if (typeof externalIdOrSystemId === 'string') {
         this.systemId = externalIdOrSystemId;
         this.publicId = publicId;
      } else {
         this.systemId = valueToString(externalIdOrSystemId?.system?.value);
         this.publicId = valueToString(externalIdOrSystemId?.public?.value) || undefined;
      }
   }
}

export { ExternalIdX };
