/* Copyright ® 2017 by David John Burrowes. All rights reserved. */

'use strict';

const Extractor = require('./Extractor.js');
const MatchExtractor = require('./MatchExtractor.js');

/**********************************************************************\
 A MultiExtractor will look for the specified candidate string starting
\**********************************************************************/

class MultiMatchExtractor extends Extractor {
   constructor(context, candidates) {
      super(context);

      this._matchers = candidates.reduce((matchers, candidate) => {
         if (matchers[candidate]) {
            throw new Error(`"${candidate}" was specified twice.`);
         }
         matchers[candidate] = new MatchExtractor(this.context, candidate);
         return matchers;
      }, {});
      this._match = undefined;
      this._matchLength = 0;
   }

   process(segment) {
      if (!this._firstSegment) {
         this._firstSegment = segment;
         this._firstIndex = segment.index;
      }
      const startIndex = segment.index;
      let workingCount = 0;
      this._segInfo.push(this._makeInfo(segment));

      for (const candidate in this._matchers) {
         // We already have a match longer than candidate.
         if (this._matchLength > candidate.length) {
            continue;
         }

         const matcher = this._matchers[candidate];
         matcher.process(segment);

         switch (matcher.state) {
            case Extractor.STATE.WORKING:
               workingCount++;
               break;
            case Extractor.STATE.SUCCESS:
               this._match = matcher;
               this._matchLength = candidate.length;
               this._lastSegment = segment;
               this._lastIndex = segment.index;
               delete this._matchers[candidate];
               break;
            case Extractor.STATE.FAILURE:
               delete this._matchers[candidate];
               break;
         }

         segment.index = startIndex;
      }

      if (workingCount !== 0) {
         segment.index = segment.text.length;
      } else {
         this.state = this._match ? Extractor.STATE.SUCCESS : Extractor.STATE.FAILURE;
      }
   }

   finish() {
      switch (this.state) {
         case Extractor.STATE.WORKING:
         case Extractor.STATE.FAILURE:
            this.state = Extractor.STATE.FAILURE;
            this._segInfo.forEach((info) => { info.segment.index = 0; });

            if (this._firstSegment) {
               this._firstSegment.index = this._firstIndex;
            }

            return {
               text: '',
               original: '',
               segments: this._segInfo
            };
         case Extractor.STATE.SUCCESS:
            const result = this._match.finish();
            const newInfo = [];

            for (let index = 0; index < this._segInfo.length; index++) {
               const usedInfo = result.segments[index];

               if (usedInfo) {
                  newInfo.push(usedInfo);
               } else {
                  const unused = this._segInfo[index];
                  unused.segment.index = 0;
                  newInfo.push(unused);
               }
            }
            this._lastSegment.index = this._lastIndex;
            result.segments = newInfo;

            return result;
      }
   }

}

module.exports = MultiMatchExtractor;
