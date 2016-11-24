/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

const TextChunk = require('./TextChunk.js');
const Offset = require('./Offset.js');

const DECIMAL = 'DECIMAL';
const HEX = 'HEX';

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
    Constructs an instance with the specified source string.

    PARAM
    The string that this cursor should use.
    SourceLocation: The EntityLocation that corresponds to the string
   \**********************************************************************/

   constructor(source, sourceLocation) {
      if (typeof source !== 'string' && !(source instanceof String)) {
         throw new Error('Must pass a string to a StringCursor.');
      }

      this._source = source;
      this._offset = new Offset(0, 0, 0);
      this._chunks = [];
      this._sourceLoc = sourceLocation;
   }

   /**********************************************************************\
    setParseKind() sets the parseKind value for this cursor.

    PARAM
    A ParseKind object.
   \**********************************************************************/

   setParseKind(newKind) {
      this._parseKind = newKind;
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

      if (nextChar === '<' || nextChar === '&') {
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
      const startOffset = this._offset.clone();
      const endOffset = this._offset.clone();
      let nextChar = this._source[this._offset.index];

      if (!nextChar) {
         return;
      }

      endOffset.index ++;
      endOffset.column ++;

      if (nextChar === '\n' || nextChar === '\r') {
         endOffset.line ++;
         endOffset.column = 0;

         if (nextChar === '\r' && this._source[this._offset.index + 1] === '\n') {
            endOffset.index ++;
         }

         nextChar = '\n';
      }

      return new TextChunk.PlainChunk(nextChar, startOffset, endOffset, this._sourceLoc);
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
      let nextChar = this._source[this._offset.index];

      if (!nextChar || !this._isSpace(nextChar)) {
         return;
      }

      while (nextChar && this._isSpace(nextChar)) {
         if (nextChar === '\r') {
            nextChar = '\n';
            if (this._source[this._offset.index + 1] === '\n') {
               this._offset.index ++;
            }
            this._offset.line ++;
            this._offset.column = 0;
            fixString = true;
         } else if (nextChar === '\n') {
            this._offset.line ++;
            this._offset.column = 0;
         } else {
            this._offset.column ++;
         }

         this._offset.index ++;
         nextChar = this._source[this._offset.index];
      }

      const originalString = this._source.substring(startOffset.index, this._offset.index);
      let rawString = originalString;

      if (fixString) {
         rawString = rawString.replace('\r\n', '\n');
         rawString = rawString.replace('\r', '\n');
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
      const atTerminator = this._makeTerminatorCheckFunction(terminators, true);
      let nextChar = this._source[this._offset.index];

      if (!nextChar || atTerminator()) {
         return;
      }

      let couldBeName = this._isNameStartChar(nextChar);
      let couldBeNmToken = couldBeName || this._isNameChar(nextChar); // if it is a name, it is a nmtoken
      let index = this._offset.index + 1;

      while (nextChar && !atTerminator()) {
         const isNameChar = this._isNameChar(nextChar);
         couldBeName = couldBeName && isNameChar; // first time through is redundant
         couldBeNmToken = couldBeNmToken && isNameChar;
         this._offset.index ++;
         this._offset.column ++;

         nextChar = this._source[index];
         index++;
      }

      const rawString = this._source.substring(startOffset.index, index - 1);
      return this._makeWordChunk(rawString, couldBeName, couldBeNmToken, startOffset);
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
      this._assertValuesHaveNoSpaces(terminators);

      const atTerminator = this._makeTerminatorCheckFunction(terminators, false);
      const startOffset = this._offset.clone();
      let nextChar = this._source[this._offset.index];
      let terminator;

      terminator = atTerminator();
      if (!nextChar || terminator) {
         return {
            chunk: undefined,
            terminator: terminator
         };
      }

      let index = this._offset.index + 1;

      while (nextChar && !terminator) {
         this._offset.index ++;
         this._offset.column ++;

         nextChar = this._source[index];
         terminator = atTerminator();
         index++;
      }

      const originalString = this._source.substring(startOffset.index, this._offset.index);
      let rawString = originalString;

      if (rawString.indexOf('\r') !== -1) {
         rawString = rawString.replace('\r\n', '\n');
         rawString = rawString.replace('\r', '\n');
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
      return aChar === ' ' || aChar === '\t' || aChar === '\n' || aChar === '\r';
   }

   /**********************************************************************\
     PARAM
     terminators: An array of strings that could be considered terminators
     checkSpace: true if we should also check for whitespace as terminator

     RETURN
     A function that will return undefined if the cursor is not at one of
     the specified terminators, and otherwise return the terminator that
     the cursor is at.
     A function is returned so that a pre-calculation to make the check
     more efficient is done first.
   \**********************************************************************/

   _makeTerminatorCheckFunction(terminators, checkSpace) {
      let maxLen = 0;
      const self = this;

      for (let index = 0; index < terminators.length; index++) {
         const len = terminators[index].length;
         if (maxLen < len) {
            maxLen = len;
         }
      }

      return function atTerminator() {
         if (checkSpace && self._isSpace(self._source[self._offset.index])) {
            return self._source[self._offset.index];
         }

         const nextSeg = self._source.substr(self._offset.index, maxLen);

         for (let index = 0; index < terminators.length; index++) {
            if (nextSeg.indexOf(terminators[index]) === 0) {
               return terminators[index];
            }
         }
      };
   }

   /**********************************************************************\
     Utility routine. Identifies if a character is legal for starting a name.
       [5]  Name          ::= NameStartChar (NameChar)*
       [4]  NameStartChar ::= ":" | [A-Z] | "_" | [a-z] | [#xC0-#xD6] |
                              [#xD8-#xF6] | [#xF8-#x2FF] | [#x370-#x37D] |
                              [#x37F-#x1FFF] | [#x200C-#x200D] |
                              [#x2070-#x218F] | [#x2C00-#x2FEF] |
                              [#x3001-#xD7FF] | [#xF900-#xFDCF] |
                              [#xFDF0-#xFFFD] | [#x10000-#xEFFFF]
   \**********************************************************************/

   _isNameStartChar(char) {
      return (char >= 'A' && char <= 'Z') ||
         (char >= 'a' && char <= 'z') ||
         char === ':' ||
         char === '_' ||
         (char >= '\u00C0' && char <= '\u00D6') ||
         (char >= '\u00F8' && char <= '\u02FF') ||
         (char >= '\u0370' && char <= '\u037D') ||
         (char >= '\u037F' && char <= '\u1FFF') ||
         (char >= '\u200C' && char <= '\u200D') ||
         (char >= '\u2070' && char <= '\u218F') ||
         (char >= '\u2C00' && char <= '\u2FEF') ||
         (char >= '\u3001' && char <= '\uD7FF') ||
         (char >= '\uF900' && char <= '\uFDCF') ||
         (char >= '\uFDF0' && char <= '\uFFFD') ||
         (char.charCodeAt(0) >= 0xD800 && char.charCodeAt(0) <= 0xDFFF); // for chars in 0x010000 and 0x0EFFFF
   }

   /**********************************************************************\
     Utility routine. Helps to identify legal name characters in a word.
       [4a] NameChar ::= NameStartChar | "-" | "." | [0-9] | #xB7 |
                         [#x0300-#x036F] | [#x203F-#x2040]
   \**********************************************************************/

   _isNameChar(char) {
      return this._isNameStartChar(char) ||
         (char >= '0' && char <= '9') ||
         char === '-' ||
         char === '.' ||
         char === '\u00B7' ||
         (char >= '\u0300' && char <= '\u036F') ||
         (char >= '\u203F' && char <= '\u2040');
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
     data for a chunk, the unmodified data, and the start offset.

     RETURN
     a with space chunk using the parameters and the current cursor offset.
     Note this also pushes the chunk into the set of recent chunks.
   \**********************************************************************/

   _makeChunkWithSpace(data, originalString, startOffset) {
      const chunk = new TextChunk.WithSpaceChunk(data, originalString, startOffset, this._offset.clone(),
         this._sourceLoc);
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
      const chunk = new TextChunk.PlainChunk(data, startOffset, this._offset.clone(), this._sourceLoc);
      this._chunks.push(chunk);
      return chunk;
   }

   /**********************************************************************\
     PARAM
     data for a word chunk, whether it could be a name, and the start offset.
     couldBeName boolean flag could this be a name (production 5)
     couldBeNmToken boolean flag could this be a nmtoken (production 7)
     startOffset Offset data structure where this word started

     RETURN
     a word chunk using the parameters and the current cursor offset.
     Note this also pushes the chunk into the set of recent chunks.
   \**********************************************************************/

   _makeWordChunk(data, couldBeName, couldBeNmToken, startOffset) {
      const chunk = new TextChunk.WordChunk(data, couldBeName, couldBeNmToken, startOffset, this._offset.clone(),
         this._sourceLoc);
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
      const chunk = new TextChunk.DigitChunk(data, isDecimal, startOffset, this._offset.clone(), this._sourceLoc);
      this._chunks.push(chunk);
      return chunk;
   }

}

module.exports = XmlStringCursor;
