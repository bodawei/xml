/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { Range } from '../basic/util/range';

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
   public readonly str: string;

   public originalStr: string;

   public ranges: Array<Range>;

   constructor(str: string, originalStr: string, range: Range | Array<Range>) {
      this.str = str;
      this.originalStr = originalStr;
      this.ranges = Array.isArray(range) ? range : [range];
   }
}

export default SToken;
