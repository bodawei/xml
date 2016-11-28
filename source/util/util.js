/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

const CHARKIND_INVALID = 'CHARKIND_INVALID';
const CHARKIND_VALID = 'CHARKIND_VALID';

/**********************************************************************\
 charKind() identifies that kind of character it is passed. Characters
 have several kinds:

   CHARKIND_INVALID: defined by [2] and [2a], any character not in
      these productions
   CHARKIND_VALID: Any character defined in those productions

 SYNTAX
   1.0
    [2]  Char           ::= #x9 | #xA | #xD | [#x20-#xD7FF] |
                            [#xE000-#xFFFD] | [#x10000-#x10FFFF]
   1.1
    [2]  Char           ::= [#x1-#xD7FF] | [#xE000-#xFFFD] |
                            [#x10000-#x10FFFF]
    [2a] RestrictedChar ::= [#x1-#x8] | [#xB-#xC] | [#xE-#x1F] |
                            [#x7F-#x84] | [#x86-#x9F]
\**********************************************************************/

function charKind(char, entityInfo) {
   const charCode = char.charCodeAt(0);

   if (entityInfo.versionIs1dot0) {
      if (charCode > 0x1f && charCode < 0xd800) {
         return CHARKIND_VALID;
      }

      if (charCode < 0x09 || charCode === 0x0b || charCode === 0x0c || (charCode > 0x0D && charCode < 0x20) ||
         charCode === 0xFFFE || charCode === 0xFFFF || (charCode > 0xD800 && charCode < 0xE000)) {
         return CHARKIND_INVALID;
      }
   } else {
      if ((charCode > 0x1f && charCode < 0x7f) || (charCode > 0x9f && charCode < 0xd800)) {
         return CHARKIND_VALID;
      }

      if (charCode < 0x09 || charCode === 0x0b || charCode === 0x0c || (charCode > 0x0D && charCode < 0x20) ||
         (charCode >= 0x7f && charCode <= 0x9f && charCode !== 0x85) || charCode === 0xFFFE || charCode === 0xFFFF ||
         (charCode > 0xD800 && charCode < 0xE000)) {
         return CHARKIND_INVALID;
      }
   }

   return CHARKIND_VALID;
}

module.exports = {
   CHARKIND_VALID,
   CHARKIND_INVALID,
   charKind
};
