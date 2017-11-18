/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

/**********************************************************************\
 A SToken (Low-level token) represents a unit of text. The originalText
 property contains the text exactly as it came from the source,
 the text property contains the same after any newline normalization,
 and the range contains the one or more Ranges that define where this
 came from.

 It is quite possible, though not common, for a single SToken to have
 come from multiple entities. in that case, range will contain
 multiple Ranges, one for each piece of each entity.
\**********************************************************************/

class SToken {

   constructor(text, originalText, range) {
      this.text = text;
      this.originalText = originalText;
      this.range = Array.isArray(range) ? range : [ range ];
   }

}

export default SToken;
