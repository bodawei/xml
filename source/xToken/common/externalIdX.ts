/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ExternalIdP, pTokenArrayToString } from 'pToken';

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

function cloneExternalIdX(source: ExternalIdX | undefined): ExternalIdX | undefined {
   if (!source) {
      return undefined;
   }

   return {
      ...source,
   };
}

export { ExternalIdX, cloneExternalIdX };
