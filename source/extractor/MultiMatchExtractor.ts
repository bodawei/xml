/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import Extractor from './Extractor';
import MatchExtractor from './MatchExtractor';
import {DONE_SEGMENT, PSEUDO_SPACE, PseudoSpace, Segment} from './Segment';

type MatcherMap = {
   [candidate: string]: Extractor;
};

/**********************************************************************\
 A MultiMatchExtractor will look for the the best match among the
 provided candidates, and return it.

 Superficially, this is just like a "parallel" call to multiple
 MatchExtractors.  Indeed, this is how this is implemented.
 However, it is worth noting that it is possible to have candidates
 like "<" and "<!--", where both would successfully match. This
 chooses to match the longest possible match in this situation.
\**********************************************************************/

class MultiMatchExtractor extends Extractor {
   private _match: Extractor | void;
   private _matchLength: number;
   private _matchers: MatcherMap;
   private _firstSegment?: Segment | PseudoSpace;
   private _firstIndex = 0;
   private _lastSegment?: Segment | PseudoSpace;
   private _lastIndex = 0;

   /* istanbul ignore next */ // Istanbul is confused by node transpilation
   constructor(version: number, candidates: Array<string>) {
      super(version);

      this._matchers = candidates.reduce((matchers, candidate: string) => {
         if (matchers[candidate]) {
            throw new Error(`"${candidate}" was specified twice.`);
         }
         matchers[candidate] = new MatchExtractor(this.version, candidate);
         return matchers;
      }, {} as MatcherMap);
      this._match = undefined;
      this._matchLength = 0;
   }

   process(segment: Segment | PseudoSpace) {
      if (!this._firstSegment) {
         this._firstSegment = segment;
         this._firstIndex = segment.index;
      }
      const startIndex = segment.index;
      let workingCount = 0;
      this.segInfo.push(this.makeInfo(segment));

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
         if (segment.type !== PSEUDO_SPACE) {
            segment.index = segment.text.length;
         }
      } else {
         this.state = this._match ? Extractor.STATE.SUCCESS : Extractor.STATE.FAILURE;
      }
   }

   finish() {
      switch (this.state) {
         case Extractor.STATE.WORKING:
            // If we're being asked to finish, but are still working,
            // AND we have indeed found a match (even if there are still)
            // outstanding candidates) then consider it a successful match.
            if (this._match) {
               return this._finishWithSuccess();
            }

            return this._finishWithFailure();
         case Extractor.STATE.FAILURE:
            return this._finishWithFailure();
         case Extractor.STATE.SUCCESS:
            return this._finishWithSuccess();
      }
   }

   _finishWithFailure() {
      this.state = Extractor.STATE.FAILURE;
      this.segInfo.forEach((info) => { (info.segment as Segment).index = 0; }); // typeHack

      if (this._firstSegment) {
         this._firstSegment.index = this._firstIndex;
      }

      return {
         text: '',
         original: '',
         segments: this.segInfo,
      };
   }

   _finishWithSuccess() {
      this.state = Extractor.STATE.SUCCESS;
      const result = (this._match as Extractor).finish(); // typeHack
      const newInfo = [];

      for (let index = 0; index < this.segInfo.length; index++) {
         const usedInfo = result.segments[index];

         if (usedInfo) {
            newInfo.push(usedInfo);
         } else {
            const unused = this.segInfo[index];
            (unused.segment as Segment).index = 0; // typeHack
            newInfo.push(unused);
         }
      }
      (this._lastSegment as Segment).index = this._lastIndex; // typeHack
      result.segments = newInfo;

      return result;
   }

}

export default MultiMatchExtractor;
