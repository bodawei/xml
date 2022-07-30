/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { ExtractorNew, Counters } from './ExtractorNew';
import { PseudoSpace, DONE_SEGMENT, PSEUDO_SPACE, Segment } from './Segment';

const SPACE_10_REGEX = /[ \t\n\r]+/g;
const SPACE_11_REGEX = /[ \t\n\r\u0085\u2028]+/g;

function makeSegmentCounter(): Counters {
   return {
      chars: 0,
      rows: 0,
      columns: 0,
   };
}

// BIG QUESTIONS
// Can we kill pseudoSpace
// Can we remove Range from segment?  And what makes us think a sement will ever have only one range?  (to be sure, we can't handle it if there are... but... can we actually do that?)
// nope. a segment can have any number of ranges.

/**********************************************************************\
 A SpaceExtractor extracts an SToken made up of a series of whitespace
 characters.  This is sensitifce to the differences between 1.0 and 1.1
 of the XML standard.

 Note that while the XML standard defines whitespace as:
  [3] S ::= (#x20 | #x9 | #xD | #xA)+
 that syntax is posed line endint normalization
\**********************************************************************/

class SpaceExtractor extends ExtractorNew {
   private foundSpace = false;

   process(segment: Segment | PseudoSpace, startIndex: number) {
      const spaceRegexp = this.version === 1.0 ? SPACE_10_REGEX : SPACE_11_REGEX;
      let counter = makeSegmentCounter();

      if (segment.type === PSEUDO_SPACE) {
         this.foundSpace = true;
         this.processPseudoText();
         this.counters.push(counter);
         this.processedSegments.push(segment);

         return;
      }

      /*
       * Check if the next char is a space before doing the full-on search
       * for spaces. If we don't do this, the full-on check could scan
       * megabytes of text before finding a space, so we would then both
       * pay for the full scan, and need to check whether the match started
       * at the current index, anyway.
       */
      spaceRegexp.lastIndex = 0;
      const foundSpace = spaceRegexp.test(segment.text[segment.index]);

      if (!foundSpace) {
         this.untouchedSegments.push(segment);
         return this.foundSpace ? ExtractorNew.STATE.SUCCESS : ExtractorNew.STATE.FAILURE;
      }

      this.foundSpace = foundSpace;
      spaceRegexp.lastIndex = startIndex;
      const allSpace = spaceRegexp.exec(segment.text)![0]; // typeHack Because above check garantues this is not null.
      const spaceLength = allSpace.length;

      counter = this.processText(allSpace, counter);
      this.counters.push(counter);

      if (!segment.atEnd()) {
         this.partialSegment = segment;
         this.partialIndex = startIndex + spaceLength;
         this.state = ExtractorNew.STATE.SUCCESS;
      } else {
         this.processedSegments.push(segment);
      }
   }

   finish() {
      this.state = this.foundSpace ? ExtractorNew.STATE.SUCCESS : ExtractorNew.STATE.FAILURE;

      return {
         status: this.state,
         ...this.innerFinish(),
         counters: this.counters,
         consumedSegments: this.processedSegments,
         partialSegment: this.partialSegment,
         untouchedSegments: this.untouchedSegments,
         partialIndex: this.partialIndex,
      };
   }
}

export { SpaceExtractor };
