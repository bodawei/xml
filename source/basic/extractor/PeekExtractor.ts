/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import Extractor from './Extractor';
import {PseudoSpace, Segment} from './Segment';

/**********************************************************************\
 A PeekExtractor "wraps" another extractor so it can do its work, but
 then "undoes" any segment consumption that that extractor did.

 Thus, this allows you to "peek" at the data that another extractor
 would extract, without committing to consuming that data.

 This does nothing to speed up a subsequent call to that extractor.
\**********************************************************************/

class PeekExtractor extends Extractor {
   private _subExtractor: Extractor;
   private _firstIndex: number;

   /* istanbul ignore next */ // Istanbul is confused by node transpilation
   constructor(version: number, processLineEndings: boolean, subExtractor: Extractor) {
      super(version, processLineEndings);

      if (!subExtractor.process || !subExtractor.finish) {
         throw new Error('Must pass an object with process() and finish() methods.');
      }

      this._subExtractor = subExtractor;
      this._firstIndex = -1;
   }

   process(segment: Segment | PseudoSpace) {
      this.segInfo.push(this.makeInfo(segment));

      if (this._firstIndex === -1) {
         this._firstIndex = segment.index;
      }

      this._subExtractor.process(segment);
      this.state = this._subExtractor.state;
   }

   finish() {
      const result = this._subExtractor.finish();
      this.state = this._subExtractor.state;

      for (let index = 0; index < this.segInfo.length; index++) {
         const info = this.segInfo[index];
         const subInfo = result.segments[index];

         info.chars = subInfo.chars;
         info.rows = subInfo.rows;
         info.columns = subInfo.columns;
         (info.segment as Segment).index = 0; // typeHack
      }

      if (this.segInfo[0]) {
         (this.segInfo[0].segment as Segment).index = this._firstIndex; // typeHack
      }

      result.segments = this.segInfo;
      return result;
   }

}

export default PeekExtractor;
