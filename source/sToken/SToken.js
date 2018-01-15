/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

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
   // public text: string;
   // public originalText: string;
   // public ranges: Array<Range>;

   constructor(str, originalStr, range) {
      this.str = str;
      this.originalStr = originalStr;
      if (range) {
         this.ranges = Array.isArray(range) ? range : [ range ];
      } else {
         this.ranges = [];
      }
   }

   clone() {
      const clonedRanges = [];
      for (let index = 0; index < this.ranges.length; index++) {
         clonedRanges.push(this.ranges[index].clone());
      }
      return new SToken(this.str, this.originalStr, clonedRanges);
   }

   get firstRange() {
      return this.ranges.length > 0 ? this.ranges[0] : undefined;
   }

   get lastRange() {
      const lastIndex = this.ranges.length - 1;
      return lastIndex >= 0 ? this.ranges[lastIndex] : undefined;
   }

   /*
    * This just mostly blindly combines the two STokens by
    * catenating their strings and ranges.
    *
    * It is up to the caller to make sure this makes sense.
    *
    * This is "mostly" blind, in that if the two ranges
    * appear to touch (meaning, the last offset in the last
    * range in this and the first in the other are the same),
    * the two ranges will be combined.
    */
   merge(other) {
      if (!(other instanceof SToken)) {
         throw new Error('Can only merge with another SToken.');
      }

      this.str += other.str;
      this.originalStr += other.originalStr;

      if (canFuseRanges(this.lastRange, other.firstRange)) {
         const lastRange = this.ranges.pop();

         other.firstRange.startIndex = lastRange.startIndex;
         other.firstRange.startRow = lastRange.startRow;
         other.firstRange.startColumn = lastRange.startColumn;
      }

      this.ranges = this.ranges.concat(other.ranges);

      return this;
   }
}

function canFuseRanges(range1, range2) {
   if (!range1 || !range2) {
      return false;
   }

   const locationsSame = range1.location === range2.location;
   const locationsEqual = range1.location.equals(range2.location);

   if (locationsSame || locationsEqual) {
      return range1.getEndOffset().equals(range2.getStartOffset());
   }

   return false;
}

SToken.fromString = function fromString(str) {
   return new SToken(str, str);
};

export default SToken;
