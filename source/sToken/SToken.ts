/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { EntityId } from '../basic/token/entityId';
import { Range } from '../basic/klass/range';

function canFuseRanges(range1: Range, range2: Range): boolean {
   const locationsSame = range1.entityId === range2.entityId;
   const locationsEqual =
      range1.entityId.systemId === range2.entityId.systemId &&
      range1.entityId.publicId === range2.entityId.publicId;

   if (locationsSame || locationsEqual) {
      return range1.getEndOffset().equals(range2.getStartOffset());
   }

   return false;
}

/**********************************************************************\
 A SToken (String token) represents a unit of text. The originalText
 property contains the text exactly as it came from the source,
 the text property contains the same after any newline normalization,
 and the range contains the one or more Ranges that define where this
 came from.

 It is quite possible, though not common, for a single SToken to have
 come from multiple entities. For example, given this:
   --- ex.xml ---
   stuff
   --- doc.xml ---
   <!DOCTYPE ex [
      <!ENTITY another SYSTEM "ex.xml">
   ]>
   <ex>
   some&another;!
   </ex>
 The content there would be "\nsomestuff!\n", which came from three
 ranges in two entities. Given this, it is certainly possible to have
 an SToken composed from content from an arbitrary number of entities.

 A such, the range property in the SToken can have any number of
 Range instances in it.
\**********************************************************************/

class SToken {
   public str: string;

   public originalStr: string;

   public ranges: Array<Range>;

   static fromString(str: string): SToken {
      return new SToken(str, str, new Range(new EntityId()));
   }

   constructor(str: string, originalStr: string, range: Range | Array<Range>) {
      this.str = str;
      this.originalStr = originalStr;
      this.ranges = Array.isArray(range) ? range : [range];
   }

   clone(): SToken {
      const clonedRanges = [];
      for (let index = 0; index < this.ranges.length; index++) {
         clonedRanges.push(this.ranges[index].clone());
      }
      return new SToken(this.str, this.originalStr, clonedRanges);
   }

   get firstRange(): Range | undefined {
      return this.ranges.length > 0 ? this.ranges[0] : undefined;
   }

   get lastRange(): Range | undefined {
      const lastIndex = this.ranges.length - 1;
      return lastIndex >= 0 ? this.ranges[lastIndex] : undefined;
   }

   /*
    * This just mostly blindly combines the two STokens by
    * catenating their strings and ranges.  A copy of the
    * parameter's data is appended to this one.
    *
    * It is up to the caller to make sure this makes sense.
    *
    * This is "mostly" blind, in that if the two ranges
    * appear to touch (meaning, the last offset in the last
    * range in this and the first in the other are the same),
    * the two ranges will be combined.
    */
   merge(other: SToken): SToken {
      const otherRanges = other.ranges;

      this.str += other.str;
      this.originalStr += other.originalStr;

      if (this.lastRange && other.firstRange) {
         if (canFuseRanges(this.lastRange, other.firstRange)) {
            const lastRange = this.lastRange;
            const firstRange = other.firstRange;

            // Remove the last range of this and the first of the next
            this.ranges.pop();
            otherRanges.shift();

            // Create a new one which is the union of the two
            const newLastRange = new Range(
               lastRange.entityId,
               lastRange.startIndex,
               lastRange.startRow,
               lastRange.startColumn,
               firstRange.endIndex,
               firstRange.endRow,
               firstRange.endColumn,
            );

            // insert it in place of one of the originals.
            otherRanges.unshift(newLastRange);
         }
      }

      this.ranges = this.ranges.concat(otherRanges);

      return this;
   }
}

export default SToken;
