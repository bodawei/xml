/* Copyright ® 2017 by David John Burrowes. All rights reserved. */

'use strict';

/**********************************************************************\
 Constructs an instance with the specified source string and entity
 info.  Note that the second parameter ultimately turns into an
 EntityMetaData instance, but various alternate parameters can be provided
 (this is so construction is as easy as possible for the caller).
 If the paramter is
    - an EntityMetaData, it is used directly (not cloned).
    - an EntityLocation, it is passed to an otherwise default-valued
      EntityMetaData instance.
    - a String, it is assumed to be the URL locating the entity this
      is processing, so is passed to an EntityLocation and then an
      EntityMetaData
    - the undefined value, it is assumed we should use the default
      location for the entity, and that is passed to an EntityLocation
      and then EntityMetaData.

 Encodings
 Handling the encoding of the XML data can get to be complex.
 Note: An unencoded string in JavaScript here is a string where and 'a'
 is represented as an 'a' (or \u0061). In contrast, in UTF-16 it would
 get to us as \u0000\u0061.  You can get this if you get a sequence of
 bytes and read each byte into one string character.

 Factors to consider:
   1. The XML entity itself may specify its own encoding in the
      XML Declaration or Text Declaration (<?xml encoding="UTF-8"?>
   2. The cursor will try to examine the first few bytes of the
      entity to see if it can recognize at least an approximation
      of the encoding.
   3. The cursor has an option (called encoding) which you can pass
      that will let you explicitly state the encoding of the data in
      the string.
   4. The XmlTokenStream has an option, ignoreDocumentEncoding, which
      will tell it to not inform the cursor of the encoding specified
      in the entity data.

 Here are the most likely use cases:
   A. You have a string which you have already decoded (e.g. you got
      it as a UTF-16 encoded string or buffer, and you converted it
      into a plain unencoded string).
         In this case, pass it to the cursor, do NOT set the encoding
         option on the cursor, and set ignoreDocumentEncoding option
         on the stream.
   B. You have a string which is encoded, you know the encoding, and
      the XML document doesn't carry the encoding name in it.
      (e.g. it is ISO-8859-2, whose lower 128 characters look like
      ASCII so by #2 the cursor will conclude it is unencoded).
         Pass the string and encoding option to the cursor
   C. You have a string which is encoded but looks like ASCII, and
      the encoding is also stated in the XML or Text Declaration.
         Pass the encoded string to the cursor. Do nothing else.
   D. You have an encoded string that is in UTF-16 (either LE or BE)
      that has a byte order marker on it
         If the encoding is not there, you can do either B or C
            (the cursor can identify UTF-16 automatically)
         Note that if there is an XML or Text Declaration that is
         different, then you should set the ignoreDocumentEncoding
         option.
   E. Same as D, but no byte order mark
         Strictly, this is an error, since all UTF-16 must have a
         byte order mark (4.3.3).  However, a lax XmlTokenStream will
         continue.
         If there is an XML or Text Declaration, the cursor can
         auto-detect the character set and convert (if these specify
         another encoding, you should set ignoreDocumentEncoding)
         If there is no XML or Text Declaration, you must specify
         and encoding option as in B.
Other notes:
   -  This uses iconv-lite to do the character decoding. This
      library is very forgiving of errors. So, if you have passed
      the wrong character set to convert, you will get gibberish
      and errors coming out of XmlTokenStream rather than errors
      at conversion time.
   -  The encoding option to the cursor (#3), if specified, takes
      precedence over the value specified in the document (#1).

 PARAM
 The string that this cursor should use.
 info: undefiend, a string (URL), EntityLocation, or an EntityMetaData
 options: An object with any one or more of the following
   encoding: The name of the encoding that the source string is in.
      Generally, you should be making sure that the string is already
      properly decoded to a normal JavaScript string. But if you have
      a string that actually contains encoded data, and you specify
      this encoding value with the name of that encoding, the cursor
      will try to decode the string before processing it.
\**********************************************************************/

const ENCODING = {
   UNENCODED: 'UNENCODED',
   UTF8: 'UTF-8',
   UTF8_BOM: 'UTF-8/BOM',
   UTF16BE: 'UTF-16BE',
   UTF16BE_BOM: 'UTF-16BE/BOM',
   UTF16LE: 'UTF-16LE',
   UTF16LE_BOM: 'UTF-16LE/BOM',
   UCS4BE: 'UCS-4BE',
   UCS4BE_BOM: 'UCS-4BE/BOM',
   UCS4LE: 'UCS-4LE',
   UCS4LE_BOM: 'UCS-4LE/BOM',
   UCS4UNUSUAL1: 'UCS-4UNUSUAL1',
   UCS4UNUSUAL1_BOM: 'UCS-4UNUSUAL1/BOM',
   UCS4UNUSUAL2: 'UCS-4UNUSUAL2',
   UCS4UNUSUAL2_BOM: 'UCS-4UNUSUAL2/BOM',
   EBCDIC: 'EBCDIC'
};

const ENCODING_REGEXP = /<\?xml.*encoding[ ]*=[ ]*(?:"(.*)"|'(.*)').*?>/i;

function identifyEncoding(segment, state) {
   segment.index = segment.text.length;

   state._findingEncoding = state._findingEncoding || '';

   if (typeof segment.text[0] === 'number') {
      const maxExtract = Math.min(segment.text.length, 100);
      for (let index = 0; index < maxExtract; index++) {
         state._findingEncoding += String.fromCharCode(segment.text[index]);
      }
   } else {
      state._findingEncoding += segment.text.substr(0, 100);
   }

   const totalLength = state._findingEncoding.length;

   // If we haven't already done so, try to identify the encoding based on the first four bytes/characters
   if (totalLength >= 4 && !state._examinedFirstFour) {
      const firstFourCharBytes = state._findingEncoding.substr(0, 4);
      const encoding = identifyEncodingFromFirstFourCharBytes(firstFourCharBytes);

      if (encoding) {
         return encoding;
      }

      // If we can't find an xml or text declaration start, we won't ever be able to say more
      if (/\<\?xm/i.exec(firstFourCharBytes) === null) {
         return ENCODING.UNENCODED;
      }

      state._examinedFirstFour = true;
   }

   // If we get this far see if we can find the end of the declaration and extract an encoding
   if (state._findingEncoding.indexOf('?>') >= 0) {
      const encoding = getEncodingFromDeclaration(state._findingEncoding);

      if (encoding) {
         return encoding;
      }
   }

   // If we've found nothing and we already have 100 charBytes or the segment is the end, then give up.
   if (totalLength >= 100 || segment.isLast) {
      return ENCODING.UNENCODED;
   }
}

function decodeSegment(segment, encoding) {
//      if (segment.text.length <= 0) {
//         return;
//      }

   //const isInt = (typeof segment.text[0] === 'number');
   const orig = segment.text;
   segment.text = [];

   switch (encoding) {
      case ENCODING.UTF8_BOM:
         for (let index = 0; index < orig.length; index++) {
            const nextCharByte = orig.charCodeAt(index);
            if (nextCharByte < 127) {
               segment.text.push(orig[index]);
            } else if ((nextCharByte & 0xE0) === 0xC0) { // Checking for 0b110x xxxx
               const upper = nextCharByte & 0x3F;
               index++; // should verify it is there
               const lower = orig.charCodeAt(index) & 0x7F; // should check is 0b10xx
               const final = (upper * 64) + lower;
               segment.text.push(String.fromCharCode(final));
            } else if ((nextCharByte & 0xF0) === 0xE0) { // Checking for 0b110x xxxx
               const upper = nextCharByte & 0x1F;
               index++; // should verify it is there
               const mid = orig.charCodeAt(index) & 0x7F; // should check is 0b10xx
               index++; // should verify it is there
               const lower = orig.charCodeAt(index) & 0x7F; // should check is 0b10xx
               const final = (upper * 4096) + (mid * 64) + lower;
               segment.text.push(String.fromCharCode(final));
//            } else if ((nextCharByte & 0xF8) === 0xF0) { // Checking for 0b110x xxxx
//               const upper = nextCharByte & 0x03;
//               index++; // should verify it is there
//               const upperMid = orig.charCodeAt(index) & 0x7F; // should check is 0b10xx
//               index++; // should verify it is there
//               const lowerMid = orig.charCodeAt(index) & 0x7F; // should check is 0b10xx
//               index++; // should verify it is there
//               const lower = orig.charCodeAt(index) & 0x7F; // should check is 0b10xx
//               const final = (upper << 18) + (upperMid * 4096) + (lowerMid * 64) + lower;
//               segment.text.push(String.fromCharCode(final));
            }
         }
         break;
      case ENCODING.UTF16BE:
      case ENCODING.UTF16BE_BOM:
      case ENCODING.UTF16LE:
      case ENCODING.UTF16LE_BOM:
         for (let index = 0; index < orig.length; index++) {
            let lower;
            let upper;
            if (encoding === ENCODING.UTF16BE || encoding === ENCODING.UTF16BE_BOM) {
               upper = orig[index];
               lower = orig[index + 1];
            } else {
               lower = orig[index];
               upper = orig[index + 1];
            }
            index++;
            const upperInt = upper.charCodeAt(0);
            const lowerInt = lower.charCodeAt(0);
            segment.text.push(String.fromCharCode((upperInt * 256) + lowerInt));
         }
         break;
      default:
         // error
         break;
   }
   segment.text = segment.text.join('');
}

function identifyEncodingFromFirstFourCharBytes(firstFour) {
   switch (firstFour) {
      case '\u004C\u006F\u00A7\u0094':
         return ENCODING.EBCDIC;
      case '\u0000\u003C\u0000\u003F':
         return ENCODING.UTF16BE;
      case '\u003C\u0000\u003F\u0000':
         return ENCODING.UTF16LE;
      case '\u0000\u0000\u0000\u003C':
         return ENCODING.UCS4BE;
      case '\u003C\u0000\u0000\u0000':
         return ENCODING.UCS4LE;
      case '\u0000\u0000\u003C\u0000':
         return ENCODING.UCS4UNUSUAL1;
      case '\u0000\u003C\u0000\u0000':
         return ENCODING.UCS4UNUSUAL2;
      case '\u0000\u0000\u00FE\u00FF':
         return ENCODING.UCS4BE_BOM;
      case '\u0000\u0000\u00FF\u00FE':
         return ENCODING.UCS4UNUSUAL1_BOM;
   }

   if (firstFour[0] === '\u00FE' && firstFour[1] === '\u00FF') {
      if (firstFour[2] !== '\u0000' || firstFour[3] !== '\u0000') {
         return ENCODING.UTF16BE_BOM;
      } else { // both second bytes are 0
         return ENCODING.UCS4UNUSUAL2_BOM;
      }
   }

   if (firstFour[0] === '\u00FF' && firstFour[1] === '\u00FE') {
      if (firstFour[2] !== '\u0000' || firstFour[3] !== '\u0000') {
         return ENCODING.UTF16LE_BOM;
      } else {
         return ENCODING.UCS4LE_BOM;
      }
   }

   if (firstFour[0] === '\u00EF' && firstFour[1] === '\u00BB' && firstFour[2] === '\u00BF') {
      return ENCODING.UTF8_BOM;
   }
}

function getEncodingFromDeclaration(data) {
   const result = ENCODING_REGEXP.exec(data) || [];

   return result[1] || result[2];
}

module.exports = {
   ENCODING,
   decodeSegment,
   identifyEncoding,
   identifyEncodingFromFirstFourCharBytes,
   getEncodingFromDeclaration
};
