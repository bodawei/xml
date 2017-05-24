/* Copyright ® 2017 by David John Burrowes. All rights reserved. */

'use strict';

const Extractor = require('./Extractor.js');

/**********************************************************************\
 A PeekExtractor "wraps" another extractor so it can do its work, but
 then "undoes" any segment consumption that that extractor did.

 Thus, this allows you to "peek" at the data that another extractor
 would extract, without committing to consuming that data.

 This does nothing to speed up a subsequent call to that extractor.
\**********************************************************************/

class PeekExtractor extends Extractor {

   constructor(version, subExtractor) {
      super(version);

      if (!subExtractor.process || !subExtractor.finish) {
         throw new Error('Must pass an object with process() and finish() methods.');
      }

      this._subExtractor = subExtractor;
      this._firstIndex = -1;
   }

   process(segment) {
      this._segInfo.push(this._makeInfo(segment));

      if (this._firstIndex === -1) {
         this._firstIndex = segment.index;
      }

      this._subExtractor.process(segment);
      this.state = this._subExtractor.state;
   }

   finish() {
      const result = this._subExtractor.finish();
      this.state = this._subExtractor.state;
      this._segInfo.forEach((info) => { info.segment.index = 0; });

      if (this._segInfo[0]) {
         this._segInfo[0].segment.index = this._firstIndex;
      }

      result.segments = this._segInfo;
      return result;
   }

}

module.exports = PeekExtractor;
