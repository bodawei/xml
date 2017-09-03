/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

const Extractor = require('./Extractor.js');

/**********************************************************************\
 A MatchExtractor will look for the specified candidate string starting
 at the index in the first segment this is passed until either the
 candidate is found, or something is found that does not match the
 part of the candidate being examined at that time.

 Note: This is an optimistic extractor, which means that it gathers
 text and segments as long as it thinks it is potentially going to find
 the candidate text, only "unwinding" at the end if it does not find
 that.  Thus, if asked to find "supercalifragilistic" across [s][u][p]
 etc, it will add info's unti it finds a non-match, in which case it
 will clear those out.
\**********************************************************************/

class MatchExtractor extends Extractor {

   constructor(version, candidate) {
      super(version);

      if (typeof candidate !== 'string') {
         throw new Error('MatchExtractor expects a string as a parameter, but got ' + JSON.stringify(candidate));
      }

      this._candidate = candidate;
      this._candIndex = 0;
   }

   process(segment) {
      const info = this._makeInfo(segment);
      this._segInfo.push(info);

      const segmentRemainder = segment.text.length - segment.index;
      const candidateRemainder = this._candidate.length - this._candIndex;
      const lengthToCompare = Math.min(segmentRemainder, candidateRemainder);
      const segmentText = segment.text.substr(segment.index, lengthToCompare);
      const candText = this._candidate.substr(this._candIndex, lengthToCompare);

      if (segmentText !== candText) {
         this.state = Extractor.STATE.FAILURE;
      } else {
         this._processText(segmentText, info);

         this._candIndex += lengthToCompare;
         segment.index += lengthToCompare;

         if (this._candIndex >= this._candidate.length) {
            // Remove the segments that we are now certain we have consumed.
            this._segInfo.forEach((info) => {
               if (info.segment.atEnd()) {
                  info.segment = { range: info.segment.range };
               }
            });
            this.state = Extractor.STATE.SUCCESS;
         }
      }
   }

   finish() {
      switch (this.state) {
         case Extractor.STATE.WORKING:
         case Extractor.STATE.FAILURE:
            this.state = Extractor.STATE.FAILURE;
            this._text = [];
            this._normalizedText = [];
            this._segInfo.forEach((info) => {
               info.chars = 0;
               info.columns = 0;
               info.rows = 0;
            });
            return this._finish();
         case Extractor.STATE.SUCCESS:
            return this._finish();
      }
   }

}

module.exports = MatchExtractor;
