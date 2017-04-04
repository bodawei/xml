/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

const iconvLite = require('iconv-lite');

const Offset = require('./shared/Offset.js');
const EntityMetaData = require('./shared/EntityMetaData.js');
const EntityLocation = require('./shared/EntityLocation.js');
const TextChunk = require('./shared/TextChunk.js');
const util = require('./shared/util.js');

const DECIMAL = 'DECIMAL';
const HEX = 'HEX';

const LINE_ENDING_REGEX10 = /(\r\n)|(\r)/g;
const LINE_ENDING_REGEX11 = /(\r[\u0085\n])|([\r\u0085\u2028])/g;

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

/**********************************************************************\
  An implementation of a cursor interface, where the source data for the
  cursor is a plain string.

  All getXxx() routines return either undefined or an XmlStringToken
  instance. An unknown return value means either that the specified item
  can not be retrieved, EOF or some other catastrophic read problem where
  reading can not procede.

  peekXxx() routines look ahead in the input stream by one character, but
  do not alter the position of the cursor.

  getToXxxx() routines return a descriptor including a possibly undefined
  token and additional meta data.
\**********************************************************************/

class XmlStringCursor {

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

   constructor(source, info, options) {
      if (typeof source !== 'string' && !(source instanceof String)) {
         throw new Error('Must pass a string to a StringCursor.');
      }

      if (!info || typeof info === 'string') {
         info = new EntityLocation(info);
      }

      if (info instanceof EntityLocation) {
         const temp = new EntityMetaData();
         temp.location = info;
         info = temp;
      }

      if (!(info instanceof EntityMetaData)) {
         throw new Error('Must pass an EntityMetaData, or something that can become one, into XmlStringCursor.');
      }

      this._source = source;
      this._offset = new Offset(0, 0, 0);
      this._chunks = [];
      this._entityMd = info;
      this._encoding = {
         specifiedEncoding: (options || {}).encoding,
         autodetectedEncoding: this._autodetectEncoding()
      };

      this._decodeSource();

      if (this.hasBOM) {
         this._offset.index ++;
         this._offset.column ++;
      }
   }

   get isUTF16() {
      switch (this._encoding.autodetectedEncoding) {
         case ENCODING.UTF16BE:
         case ENCODING.UTF16BE_BOM:
         case ENCODING.UTF16LE:
         case ENCODING.UTF16LE_BOM:
            return true;
         default:
            return false;
      }
   }

   get hasBOM() {
      switch (this._encoding.autodetectedEncoding) {
         case ENCODING.UTF8_BOM:
         case ENCODING.UTF16BE_BOM:
         case ENCODING.UTF16LE_BOM:
            return true;
         default:
            return false;
      }
   }

   get entityMd() {
      return this._entityMd;
   }

   set specifiedEncoding(value) {
      if (this._encoding.specifiedEncoding) {
         return;
      }

      this._encoding.specifiedEncoding = value;
      this._decodeSource(true);
   }

   /*
    * Decode the string either:
    *  - At startup time, in which case we use either the autodetection
    *    or the encoding option to decode, or
    *  - After reading the XML Declaration, we may have the specifiedEncoding
    *    set, which, if the encoding option was not set, will force us to
    *    reconsider re-encoding. Se the overall class comment for more general
    *    details.
    */
   _decodeSource(fromSetSpecifiedEncoding) {
      /*
       * Do not decode if no indication of any decoding that is needed
       *     (auto and specified are undefined)
       * or if the specified is forcing that there is no decoding to do,
       * or if autodetection said there was no encoding and nothing was specified
       */
      if ((!this._encoding.autodetectedEncoding && !this._encoding.specifiedEncoding) ||
         this._encoding.specifiedEncoding === ENCODING.UNENCODED ||
         (this._encoding.autodetectedEncoding === ENCODING.UNENCODED && !this._encoding.specifiedEncoding)) {
         return;
      }

      const encoding = this._encoding.specifiedEncoding || this._encoding.autodetectedEncoding;
      const targetEncoding = this._bestEncoding(encoding);

      // This can only happen when called from set specifiedEncoding
      // since currentEncoding will be undefined otherwise.
      if (targetEncoding === this._encoding.currentEncoding) {
         this._sourceBackup = undefined;
         return;
      }

      const canConvertToTarget = iconvLite.encodingExists(targetEncoding);

      if (canConvertToTarget) {
         iconvLite.skipDecodeWarning = true;
         const toConvert = this._sourceBackup || this._source;

         // Store the decoded string in case set specifiedEncoding comes in with a better value
         this._sourceBackup = fromSetSpecifiedEncoding ? undefined : this._source;
         this._source = iconvLite.decode(toConvert, targetEncoding, { stripBOM: false });

         // In the case we are re-encoding, try to adjust character offsets
         if (fromSetSpecifiedEncoding) {
            if (targetEncoding === ENCODING.UTF8 &&
               (this._encoding.currentEncoding === ENCODING.UTF16LE ||
                  this._encoding.currentEncoding === ENCODING.UTF16BE)) {
               this._offset.index = this._offset.index * 2;
            }
         }
         this._encoding.currentEncoding = targetEncoding;
      } else {
         throw new Error('Can not decode a string in ' + targetEncoding + ' encoding.');
      }
   }

   /*
    * Convert our internal identifiers to ones that iconv-lite likes.
    * It doesn't know about our BOM information.
    */
   _bestEncoding(encoding) {
      switch (encoding) {
         case ENCODING.UTF8:
         case ENCODING.UTF8_BOM:
            return ENCODING.UTF8;
         case ENCODING.UCS4BE:
         case ENCODING.UCS4BE_BOM:
            return ENCODING.UCS4BE;
         case ENCODING.UCS4LE:
         case ENCODING.UCS4LE_BOM:
            return ENCODING.UCS4LE;
         case ENCODING.UCS4UNUSUAL1:
         case ENCODING.UCS4UNUSUAL1_BOM:
            return ENCODING.UCS4UNUSUAL1;
         case ENCODING.UCS4UNUSUAL2:
         case ENCODING.UCS4UNUSUAL2_BOM:
            return ENCODING.UCS4UNUSUAL2;
         case ENCODING.UTF16BE:
         case ENCODING.UTF16BE_BOM:
            return ENCODING.UTF16BE;
         case ENCODING.UTF16LE:
         case ENCODING.UTF16LE_BOM:
            return ENCODING.UTF16LE;
      }

      return encoding;
   }

   /**********************************************************************\
    Returns the most likely type for the next token in the cursor. In some
    cases, the next token is ambiguous (e.g. is it a CHAR or a WORD or a
    STRING?). In those cases, this assumes STRING.

    RETURN
    One of the XmlStringToken constants: MARKUP, CLOSE, SPACE, or STRING.
   \**********************************************************************/

   peekType() {
      const nextChar = this._source[this._offset.index];

      if (!nextChar) {
         return;
      }

      if (nextChar === '<' || nextChar === '&' || nextChar === '%') {
         return TextChunk.TYPE.MARKUP;
      } else if (this._isSpace(this._source[this._offset.index])) {
         return TextChunk.TYPE.SPACE;
      } else if (nextChar === ']') {
         return TextChunk.TYPE.CLOSE;
      } else {
         return TextChunk.TYPE.STRING;
      }
   }

   /* ---------------------------------------------------------------------*\
    Returns the next character from the string, no matter what it is.
    RETURN
    The next character in the cursor as a CHAR token.
   \*----------------------------------------------------------------------*/

   peekChar() {
      let invalidChars;
      const startOffset = this._offset.clone();
      const endOffset = this._offset.clone();
      const is1dot1 = this._entityMd.isVersion1dot1;
      let nextChar = this._source[this._offset.index];

      if (!nextChar) {
         return;
      }

      endOffset.index ++;
      endOffset.column ++;

      // Deal with section 2.11 of the standard for end of line handling
      if (nextChar === '\n' || nextChar === '\r' ||
         (is1dot1 && (nextChar === '\u0085' || nextChar === '\u2028'))) {
         endOffset.line ++;
         endOffset.column = 0;
         const nextNextChar = this._source[this._offset.index + 1];

         if (nextChar === '\r' &&
            (nextNextChar === '\n' || (is1dot1 && nextNextChar === '\u0085'))) {
            endOffset.index ++;
         }

         nextChar = '\n';
      } else {
         const charKind = util.charKind(nextChar, this.entityMd);

         if (charKind === util.CHARKIND_INVALID) {
            invalidChars = [ 0 ];
         }
      }

      const chunk = new TextChunk.PlainChunk(nextChar, startOffset, endOffset, this._entityMd.location);
      chunk.invalidChars = invalidChars;

      return chunk;
   }

   /**********************************************************************\
    RETURN
    Returns the next S in the input.  That is, the next series of spaces,
    tabs, and newlines. As per the XML standard, any \r's or \r\n's are
    converted into single \n's. Note that the unmodified version of the
    string is included in the return chunk as a property named originalText.

        [3] S ::= (#x20 | #x9 | #xD | #xA)+
   \**********************************************************************/

   getSpace() {
      let fixString = false;
      const startOffset = this._offset.clone();
      const is1dot1 = this._entityMd.isVersion1dot1;
      let nextChar = this._source[this._offset.index];

      if (!nextChar || !this._isSpace(nextChar)) {
         return;
      }

      while (nextChar && this._isSpace(nextChar)) {
         if (nextChar === '\r') {
            const nextNextChar = this._source[this._offset.index + 1];

            nextChar = '\n';

            if (nextNextChar === '\n' || (is1dot1 && nextNextChar === '\u0085')) {
               this._offset.index ++;
            }
            this._offset.line ++;
            this._offset.column = 0;
            fixString = true;
         } else if (nextChar === '\n' || (is1dot1 && (nextChar === '\u0085' || nextChar === '\u2028'))) {
            this._offset.line ++;
            this._offset.column = 0;
            fixString = true;
         } else {
            this._offset.column ++;
         }

         this._offset.index ++;
         nextChar = this._source[this._offset.index];
      }

      const originalString = this._source.substring(startOffset.index, this._offset.index);
      let rawString = originalString;

      if (fixString) {
         // Address section 2.11 (Line Ending). \r\u0085. \r\n, \r, \u0085 and \u2028 all exposed as \n
         rawString = rawString.replace(is1dot1 ? LINE_ENDING_REGEX11 : LINE_ENDING_REGEX10, '\n');
      }

      return this._makeChunkWithSpace(rawString, originalString, startOffset);
   }

   /**********************************************************************\
     Returns the next delimited substring from the current position in
     the cursor. The substring is considered to be terminated by any
     Space (see getSpace()) or any of the strings in the terminators
     array.

     This returns a text chunk that has a couldBeName property. This will
     be set to true if the word adheres to the XML rules for names.

     PARAM
     terminators: an array of strings
     RETURN
     The next word in the cursor, or undefined if there is none.
   \**********************************************************************/

   getWord(terminators) {
      this._assertValuesHaveNoSpaces(terminators);

      const startOffset = this._offset.clone();

      this._findToTerminator(terminators, true);

      if (startOffset.index === this._offset.index) {
         return;
      }

      const rawString = this._source.substring(startOffset.index, this._offset.index);
      return this._makePlainChunk(rawString, startOffset);
   }

   /**********************************************************************\
     Returns the next delimited substring from the current position in
     the cursor. The substring is considered to be terminated by any
     Space (see getSpace()) or any of the strings in the terminators
     array.

     This returns a text chunk that has a couldBeName property. This will
     be set to true if the word adheres to the XML rules for names.

     PARAM
     terminators: an array of strings
     RETURN
     The next word in the cursor, or undefined if there is none.
   \**********************************************************************/

   getDigits() {
      const startOffset = this._offset.clone();
      let isDecimal = true;
      let type = this._nextCharDigitType();

      if (!type) {
         return;
      }

      do {
         isDecimal = isDecimal && (type === DECIMAL);
         this._offset.index ++;
         this._offset.column ++;
         type = this._nextCharDigitType();
      } while (type);

      const rawString = this._source.substring(startOffset.index, this._offset.index);
      return this._makeDigitChunk(rawString, isDecimal, startOffset);
   }

   /**********************************************************************\
     RETURN
     Returns the next character from the cursor.  Like peekChar(), this
     does not care what that character is. Thus, < and any S is returned
     as readily as any other character. Note, however, that this does
     do line-ending normalization automatically.
   \**********************************************************************/

   getChar() {
      const chunk = this.peekChar();

      if (!chunk) {
         return;
      }

      this._offset = chunk.endOffset.clone();
      this._chunks.push(chunk);

      return chunk;
   }

   /**********************************************************************\
    getClose() returns the close character from the input stream.

    RETURN
    A TextChunk chunk containing "]" or "]]>", or undefined if no close is
    at the current position
   \**********************************************************************/

   getClose() {
      const startOffset = this._offset.clone();
      const firstChar = this._source[this._offset.index];
      const secondChar = this._source[this._offset.index + 1];
      const thirdChar = this._source[this._offset.index + 2];

      if (!firstChar || firstChar !== ']') {
         return;
      }

      this._offset.index ++;
      this._offset.column ++;

      if (firstChar === ']' && secondChar === ']' && thirdChar === '>') {
         this._offset.index += 2;
         this._offset.column += 2;
      }

      const rawString = this._source.substring(startOffset.index, this._offset.index);
      return this._makePlainChunk(rawString, startOffset);
   }

   /**********************************************************************\
     RETURN
     A TextChunk token if the next characters in the cursor are the opening
     of some markup (<, <? <!, </,  <!-- or &) or undefined (if the current
     cursor position has no markup)
   \**********************************************************************/

   getMarkup() {
      const startOffset = this._offset.clone();
      const firstChar = this._source[this._offset.index];
      const secondChar = this._source[this._offset.index + 1];

      if (!firstChar || (firstChar !== '<' && firstChar !== '&')) {
         return;
      }

      this._offset.index ++;
      this._offset.column ++;

      if (firstChar === '<' && (secondChar === '?' || secondChar === '!' || secondChar === '/')) {
         this._offset.index ++;
         this._offset.column ++;

         if (secondChar === '!' &&
            this._source[this._offset.index] === '-' &&
            this._source[this._offset.index + 1] === '-') {
            this._offset.index += 2;
            this._offset.column += 2;
         }
      }

      const rawString = this._source.substring(startOffset.index, this._offset.index);
      return this._makePlainChunk(rawString, startOffset);
   }

   /**********************************************************************\
     PARAM
     toMatch: The string value to match at the current position in
     the cursor. This may not contain any whitespace.

     RETURN
     Gets a TextChunk that contains the exact string passed in as a
     parameter. In this process, the cursor is advanced past this value.
     If this value is not at the current cursor position, this returns
     undefined.
   \**********************************************************************/

   getMatch(toMatch) {
      if (!toMatch || toMatch === '') {
         throw new Error('Must pass a non-empty string to getMatch().');
      }
      this._assertValuesHaveNoSpaces([ toMatch ], 'Parameter to getMatch() may not contain any whitespace characters.');

      if (this._source.substr(this._offset.index, toMatch.length) !== toMatch) {
         return;
      }

      const startOffset = this._offset.clone();

      const rawString = this._source.substr(startOffset.index, toMatch.length);
      this._offset.index += rawString.length;
      this._offset.column += rawString.length;

      return this._makePlainChunk(rawString, startOffset);
   }

   /**********************************************************************\
     Returns all characters from the cursor up to the first of the strings
     specified in the input.

     For example, if this is passed [ '<', '&' ] and the cursor has
        "this is an example<name>&value;
     this will return the string "this is an example", with the terminator
     of '<'.

     Any \r's in the input will be converted (see the doc for getSpace()).
     Like that routine, this will return the unmodified original input
     string on the chunk in a property called originalText.

     PARAM
     An array of 1 or more strings that could terminate the string.

     RETURN
     An object with two properties. "chunk" includes all characters from
     the current position in the cursor up to, but not including, the
     first termination string found in the input. If the cursor is not at
     one of those terminators, this will be undefined. Similarly, if at
     EOF, this chunk will also be undefined. "terminator" is whiever
     terminator was found to terminate the input string. This will be
     undefined if at EOF.
   \**********************************************************************/

   getToTerminator(terminators) {
      if (!terminators || terminators.length === 0) {
         throw new Error('Must pass a non-empty array of terminators to getToTerminator().');
      }
      const startOffset = this._offset.clone();
      const terminator = this._findToTerminator(terminators, false);

      if (startOffset.index === this._offset.index) {
         return {
            chunk: undefined,
            terminator: terminator
         };
      }

      const originalString = this._source.substring(startOffset.index, this._offset.index);
      let rawString = originalString;
      const regex = this._entityMd.isVersion1dot1 ? LINE_ENDING_REGEX11 : LINE_ENDING_REGEX10;
      let ctr = 0;
      let lineCount = 0;
      let lengthToEnd = rawString.length;

      if (regex.exec(rawString)) {
         rawString = rawString.replace(regex, '\n');

         while (ctr !== -1) {
            ctr = rawString.indexOf('\n', ctr);
            if (ctr !== -1) {
               ctr++; // skip over the match
               lineCount++;
               lengthToEnd = rawString.length - ctr;
            }
         }
      }

      // change the offset based on line endings we found in the string
      if (lineCount > 0) {
         this._offset.line += lineCount;
         this._offset.column = lengthToEnd - 1; // length to index
      }

      return {
         chunk: this._makeChunkWithSpace(rawString, originalString, startOffset),
         terminator: terminator
      };
   }

   /**********************************************************************\
     unget() backs the cursor up past the specified chunk.  That chunk
     must have been the most recent chunk returned by this cursor, and
     it must be called before getRecentChunks() has been called.
     Note that if this cursor has returned A, B, C, you can call unget(C),
     unget(B), unget(A).

     Note: This could actually operate without the parameter. However,
     this signature makes it more explicit in the client code what is
     happening, and provides some error reporting in case the user is
     confused.

     PARAM
     chunk the most recent chunk returned
   \**********************************************************************/

   unget(chunk) {
      // validate that this is the most recent chunk returned
      if (this._chunks.length === 0 || this._chunks[this._chunks.length - 1] !== chunk) {
         throw new Error('Chunk passed to unget() is not the most recent chunk returned.');
      }

      this._chunks.length = this._chunks.length - 1;
      this._offset = chunk.startOffset.clone();
   }

   /**********************************************************************\
     RETURN
     All the chunks generated since the last time this routine was called.
   \**********************************************************************/

   getRecentChunks() {
      const temp = this._chunks;
      this._chunks = [];

      return temp;
   }

   /**********************************************************************\
     PARAM
     a single character string

     RETURN
     True if this character is one of the possible space characters in input.
   \**********************************************************************/

   _isSpace(aChar) {
      const base = aChar === ' ' || aChar === '\t' || aChar === '\n' || aChar === '\r';

      if (this._entityMd.isVersion1dot0) {
         return base;
      }

      return base || aChar === '\u0085' || aChar === '\u2028';
   }

   /**********************************************************************\
     Searches from the current point in the source string either to the
     first terminator in the terminators array, the first space, or
     the end of the input.

     PARAM
     terminators: An array of strings that could be considered terminators
     checkSpace: true if we should also check for whitespace as terminator

     RETURN
     The terminator found, or undefined.  This has the side effect of
     incrementing the offset in the string.
   \**********************************************************************/

   _findToTerminator(terminators, checkSpace) {
      this._assertValuesHaveNoSpaces(terminators);

      let maxLen = 0;

      for (let index = 0; index < terminators.length; index++) {
         const len = terminators[index].length;
         if (maxLen < len) {
            maxLen = len;
         }
      }

      let nextChar = this._source[this._offset.index];
      let terminator = this._atTerminator(terminators, maxLen, checkSpace);

      while (nextChar && !terminator) {
         this._offset.index ++;
         this._offset.column ++;

         nextChar = this._source[this._offset.index];
         terminator = this._atTerminator(terminators, maxLen, checkSpace);
      }

      return terminator;
   }

   /**********************************************************************\
     Identify whether we are at a terminator at the current position in
     the input.

     PARAM
     terminators: An array of strings that could be considered terminators
     maxLen: The length of the longest of the terminators
     checkSpace: true if we should also check for whitespace as terminator

     RETURN
     The terminating string, from the current position, or undefined
   \**********************************************************************/

   _atTerminator(terminators, maxLen, checkSpace) {
      if (checkSpace && this._isSpace(this._source[this._offset.index])) {
         return this._source[this._offset.index];
      }

      const nextSeg = this._source.substr(this._offset.index, maxLen);

      for (let index = 0; index < terminators.length; index++) {
         if (nextSeg.indexOf(terminators[index]) === 0) {
            return terminators[index];
         }
      }
   }

   /**********************************************************************\
     RETURN
     DECIMAL if the next character in the cursor is 0-9, HEX if it is
     A-Fa-f, and undefined otherwise.
   \**********************************************************************/

   _nextCharDigitType() {
      switch (this._source[this._offset.index]) {
         case '0':
         case '1':
         case '2':
         case '3':
         case '4':
         case '5':
         case '6':
         case '7':
         case '8':
         case '9':
            return DECIMAL;
         case 'A':
         case 'a':
         case 'B':
         case 'b':
         case 'C':
         case 'c':
         case 'D':
         case 'd':
         case 'E':
         case 'e':
         case 'F':
         case 'f':
            return HEX;
         default:
            return;
      }
   }

   /**********************************************************************\
     PARAM
     values: An array of values to examine
     message: An optional message to include in error message

     RETURN
     none

     THROWS
     Error if any terminators have space in them
   \**********************************************************************/

   _assertValuesHaveNoSpaces(values, message) {
      for (const index in values) {
         const value = values[index];

         for (let ctr = 0; ctr < value.length; ctr++) {
            if (this._isSpace(value[ctr])) {
               throw new Error(message || 'Terminators may not have any space characters (space, tab, newline, etc).');
            }
         }
      }
   }

   /**********************************************************************\
     PARAM
     values: An array of values to examine
     message: An optional message to include in error message

     RETURN
     none

     THROWS
     Error if any terminators have space in them
   \**********************************************************************/

   _autodetectEncoding() {
      const firstFour = this._source.substr(0, 4);

      switch (firstFour) {
         case '<?xm':
            return ENCODING.UNENCODED;
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

   /**********************************************************************\
     PARAM
     data for a chunk, the unmodified data, and the start offset.

     RETURN
     a with space chunk using the parameters and the current cursor offset.
     Note this also pushes the chunk into the set of recent chunks.
   \**********************************************************************/

   _makeChunkWithSpace(data, originalString, startOffset) {
      const chunk = new TextChunk.WithSpaceChunk(data, originalString, startOffset, this._offset.clone(),
         this._entityMd.location);
      this._chunks.push(chunk);
      return chunk;
   }

   /**********************************************************************\
     PARAM
     data for a chunk, and the start of the string's offset.

     RETURN
     a plain chunk using the parameters and the current cursor offset.
     Note this also pushes the chunk into the set of recent chunks.
   \**********************************************************************/

   _makePlainChunk(data, startOffset) {
      const chunk = new TextChunk.PlainChunk(data, startOffset, this._offset.clone(), this._entityMd.location);
      this._chunks.push(chunk);
      return chunk;
   }

   /**********************************************************************\
     PARAM
     data for a number chunk, whether it is decimal, and the start offset.

     RETURN
     a number chunk using the parameters and the current cursor offset.
     Note this also pushes the chunk into the set of recent chunks.
   \**********************************************************************/

   _makeDigitChunk(data, isDecimal, startOffset) {
      const chunk = new TextChunk.DigitChunk(data, isDecimal, startOffset, this._offset.clone(),
         this._entityMd.location);
      this._chunks.push(chunk);
      return chunk;
   }

}

module.exports = XmlStringCursor;
