/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { XmlVersion, XmlRevision } from 'basic';

const CONFORMANCE_VERSION = 'CONFORMANCE_VERSION';

/*
 * Records what version and revision of the XML specification this processor
 * is using to process the document. In many cases this reflects the version
 * specified in the document. However, it may be set by the user of the
 * processor to a different value than that of the document.
 */
class ConformanceVersion {
   readonly type: typeof CONFORMANCE_VERSION = CONFORMANCE_VERSION;
   readonly version: XmlVersion;
   readonly revision: XmlRevision;

   constructor();
   constructor(confVer: ConformanceVersion);
   constructor(version: XmlVersion, revision?: XmlRevision);
   constructor(verOrConfVer?: XmlVersion | ConformanceVersion, revision?: XmlRevision) {
      if (typeof verOrConfVer === 'number' || typeof verOrConfVer === 'undefined') {
         this.version = verOrConfVer || 1.0;
         this.revision = revision || (this.version === 1  ? 5 : 2);
      } else {
         this.version = verOrConfVer.version;
         this.revision = verOrConfVer.revision;
      }
   }
}

export { CONFORMANCE_VERSION, ConformanceVersion };
