/* Copyright ® 2020-2021 by 柏大衛. All rights reserved. */

import { XmlVersion, XmlEdition } from 'basic';

const CONFORMANCE_VERSION = 'CONFORMANCE_VERSION';

/*
 * Records what version and edition of the XML specification this processor
 * is using to process the document. In many cases this reflects the version
 * specified in the document. However, it may be set by the user of the
 * processor to a different value than that of the document.
 */
class ConformanceVersion {
   readonly type: typeof CONFORMANCE_VERSION = CONFORMANCE_VERSION;

   readonly version: XmlVersion;

   readonly edition: XmlEdition;

   constructor(confVer?: ConformanceVersion);
   constructor(version?: XmlVersion, edition?: XmlEdition);
   constructor(verOrConfVer?: XmlVersion | ConformanceVersion, edition?: XmlEdition) {
      if (typeof verOrConfVer === 'number' || typeof verOrConfVer === 'undefined') {
         this.version = verOrConfVer || 1.0;
         this.edition = edition || (this.version === 1 ? 5 : 2);
      } else {
         this.version = verOrConfVer.version;
         this.edition = verOrConfVer.edition;
      }
   }
}

export { CONFORMANCE_VERSION, ConformanceVersion };
