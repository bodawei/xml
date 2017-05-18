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

      if (!subExtractor.process || !subExtractor.done || !subExtractor.getExtraction) {
         throw new Error('Must pass an object with process(), done() and getExtract() methods.');
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
      this._handleState();
   }

   done() {
      this._subExtractor.done();
      this._handleState();
   }

   _handleState() {
      if (this._subExtractor.state === Extractor.STATE.WORKING) {
         return;
      }

      this.state = this._subExtractor.state;
      this._segInfo.forEach((info) => { info.segment.index = 0; });
      this._text = this._subExtractor._text;
      this._normalizedText = this._subExtractor._normalizedText;

      if (this._segInfo[0]) {
         this._segInfo[0].segment.index = this._firstIndex;
      }
   }
}

module.exports = PeekExtractor;
