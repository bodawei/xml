/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ExternalIdP, pTokenArrayToString } from 'pToken';

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
         this.systemId = pTokenArrayToString(externalIdOrSystemId?.system?.value);
         this.publicId = pTokenArrayToString(externalIdOrSystemId?.public?.value) || undefined;
      }
   }
}

export { ExternalIdX };
