/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ExternalId, TEXT_PTOKEN, CHARREF_PTOKEN } from 'token';
import { LiteralValuePToken } from 'source/token/common/literal';

const EXTERNAL_ID_XTOKEN = 'EXTERNAL_ID_XTOKEN';

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
      }
   }

   return pieces.join('');
}

/*
 * Converts an ExternaId PToken into an XToken.  This is always
 * embedded in one of the relevant markup declaration tokens.
 */
class ExternalIdXToken {
   readonly type: typeof EXTERNAL_ID_XTOKEN = EXTERNAL_ID_XTOKEN;
   readonly systemId: string;
   readonly publicId?: string;

   constructor(externalId: ExternalId | undefined);
   constructor(systemId: string, publicId?: string);
   constructor(externalIdOrSystemId: ExternalId | string | undefined, publicId?: string) {
      if (typeof externalIdOrSystemId === 'string') {
         this.systemId = externalIdOrSystemId;
         this.publicId = publicId;
      } else {
         this.systemId = valueToString(externalIdOrSystemId?.system?.value);
         this.publicId = valueToString(externalIdOrSystemId?.public?.value) || undefined;
      }
   }
}

export { EXTERNAL_ID_XTOKEN, ExternalIdXToken };
