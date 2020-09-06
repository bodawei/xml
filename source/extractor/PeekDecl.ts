/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { Extractor } from './Extractor';
import Segment from './Segment';

const HAS_START = /^\<\?/;
const HAS_DECL10 = /^\<\?[ \t\r\n]*[xXmMlL](.|[ \t\r\n])*\?\>/;
const HAS_DECL11 = /^\<\?[ \t\r\n\u0085\u2028]*[xXmMlL](.|[ \t\r\n\u0085\u2028])*\?\>/;

/**********************************************************************\
 A PeekDecl is used to locate an XML or Text Declaration at the start
 of an entity. If it isn't found within the first SEARCH_LIMIT
 characters, this considers that a failure.
 If it is found, this returns the processed string from <?xml ... ?>
\**********************************************************************/

class PeekDecl extends Extractor {
   private rawText: string = '';

   constructor(version: number) {
      super(version);
   }

   process(segment: Segment) {
      const info = this.makeInfo(segment);
      this.segInfo.push(info);

      this.rawText += segment.text;

      if (this.rawText.length < 5) {
         return;
      }

      if (!HAS_START.test(this.rawText)) {
         this.state = Extractor.STATE.FAILURE;
         return;
      }

      const regexp = this.version === 1.0 ? HAS_DECL10 : HAS_DECL11;
      const match = regexp.exec(this.rawText);
      if (match) {
         this.state = Extractor.STATE.SUCCESS;
         // Include a dummy segment info.
         this.processText(match[0], { chars: 0, rows: 0, columns: 0, segment: {} });
         return;
      }

      if(this.rawText.length > 1000) {
         this.state = Extractor.STATE.FAILURE;
      }
   }

   finish() {
      this.state = this.state === Extractor.STATE.WORKING ? Extractor.STATE.FAILURE : this.state;

      return this.innerFinish();
   }
   
}

export default PeekDecl;
