/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { EntityId } from '../basic/token/entityId';
import { Range } from '../basic/util/range';

const DONE_SEGMENT = 'DONE_SEGMENT';
const SEGMENT_TYPE = 'SEGMENT_TYPE';
const PSEUDO_SPACE = 'PSEUDO_SPACE';
const PSEUDO_SYSTEMID = 'https://xml-introduced-space/section-4.4.8';

class PseudoSpace {
   public type: typeof PSEUDO_SPACE;
   public index: 0;
   public range?: Range;

   constructor() {
      this.type = PSEUDO_SPACE;
      this.index = 0;
      this.range = new Range(new EntityId(PSEUDO_SYSTEMID), 0, 0, 0, 0, 0, 0);
   }
}

type DoneSegment = {
   type: typeof DONE_SEGMENT;
   range?: Range;
};


/**********************************************************************\
 Segment is a simple data structure that tracks information about a
 unit of text, including a current offset into that text, and an
 optional range tracking where that text came from in an overall
 entity.
\**********************************************************************/

class Segment {
   public type: typeof SEGMENT_TYPE;
   public text: string;
   public index: number;
   public range?: Range;

   constructor(text: string, range?: Range) {
      this.type = SEGMENT_TYPE;
      this.text = text;
      this.index = 0;
      this.range = range;
   }

   atEnd() {
      return this.index >= this.text.length;
   }
}

export { DoneSegment, PseudoSpace, DONE_SEGMENT, PSEUDO_SPACE, PSEUDO_SYSTEMID, SEGMENT_TYPE, Segment };
