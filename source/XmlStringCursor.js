/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

const XmlStringToken = require('./XmlStringToken.js');
const Offset = require('./Offset.js');

/*
 * An implementation of a cursor interface, where the source data for the
 * cursor is a plain string.
 */
class XmlStringCursor {

   /*
    * Constructs an instance with the specified source string.
    * PARAM
    * The string that this cursor should use.
    */
   constructor(source) {
      if (typeof source !== 'string' && !(source instanceof String)) {
         throw new Error('Must pass a string to a StringCursor.');
      }

      this._source = source;
      this._offset = new Offset(0, 0, 0);
      this._tokens = [];
   }

   /*
    * Returns the most likely type for the next token in the cursor. In some
    * cases, the next token is ambiguous (e.g. is it a CHAR or a WORD or a
    * STRING?). In those cases, this assumes STRING.
    *
    * RETURN
    * One of the XmlStringToken constants: MARKUP, SPACE, or STRING.
    */
   peekType() {
      const nextChar = this._source[this._offset.index];

      if (!nextChar) {
         return;
      }

      if (nextChar === '<') {
         return XmlStringToken.MARKUP;
      } else if (this._isSpace()) {
         return XmlStringToken.SPACE;
      } else {
         return XmlStringToken.STRING;
      }
   }

   /*
    * Returns the next character from the string, no matter what it is.
    * RETURN
    * The next character in the cursor as a CHAR token.
    */
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

      return new XmlStringToken(nextChar, XmlStringToken.CHAR, startOffset, endOffset);
   }

   /*
    * Returns the next S in the input.  That is, the next series of spaces,
    * tabs, and newlines. As per the standard, any \r's or \r\n's are
    * converted into single \n's.
    *
    *   [3] S ::= (#x20 | #x9 | #xD | #xA)+
    */
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

      let rawString = this._source.substring(startOffset.index, this._offset.index);

      if (fixString) {
         rawString = rawString.replace('\r\n', '\n');
         rawString = rawString.replace('\r', '\n');
      }

      return this._makeToken(rawString, XmlStringToken.SPACE, startOffset);
   }

   /*
    * Returns the next delimited substring from the current position in
    * the cursor. The definition of what terminates a word is not
    * necessarily a-priori logical. It is the maximal set of characters as
    * dictated by what is necessary to bound word-like things in XML.
    *
    * Note that the WORD token has an added property:
    *       couldBeName
    * It is set to true if the word adheres to the XML rules for names.
    *
    * RETURN
    * The next word in the cursor as a WORD token.
    */
   getWord() {
      const startOffset = this._offset.clone();
      let nextChar = this._source[this._offset.index];

      if (!nextChar || this._isWordTerminator(nextChar)) {
         return;
      }

      let couldBeName = this._isNameStartChar(nextChar);
      let index = this._offset.index + 1;

      while (nextChar && !this._isWordTerminator(nextChar)) {
         couldBeName = couldBeName && this._isNameChar(nextChar); // first time through is redundant
         this._offset.index ++;
         this._offset.column ++;

         nextChar = this._source[index];
         index++;
      }

      const token = this._makeToken(this._source.substring(startOffset.index, index - 1),
         XmlStringToken.WORD, startOffset);
      token.couldBeName = couldBeName;

      return token;
   }

   /*
    * Returns the next character from the input.  Like peekChar(), this
    * does not care what that character is. Thus, < and any S is returned
    * as readily as any other character. Note, however, that this does
    * do line-ending normalization automatically.
    *
    * RETURN
    * The next character in the cursor as a CHAR token.
    */
   getChar() {
      const token = this.peekChar();

      if (!token) {
         return;
      }

      this._offset = token.endOffset.clone();
      this._tokens.push(token);

      return token;
   }

   /*
    * Gets a MARKUP token.
    *
    * RETURN
    * A markup token (<, <? <! or </) from the current cursor position or
    * undefined (if the current cursor position has no markup token)
    */
   getMarkup() {
      const startOffset = this._offset.clone();
      const firstChar = this._source[this._offset.index];
      const secondChar = this._source[this._offset.index + 1];

      if (!firstChar || firstChar !== '<') {
         return;
      }

      this._offset.index ++;
      this._offset.column ++;

      if (secondChar === '?' || secondChar === '!' || secondChar === '/') {
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
      return this._makeToken(rawString, XmlStringToken.MARKUP, startOffset);
   }

   // This also needs to deal with line endings and pending tokens
   getMatch(toMatch) {
      if (!toMatch || toMatch === '') {
         throw new Error('Must pass a non-empty string to getMatch().');
      }

      if (this._source.substr(this._offset.index, toMatch.length) !== toMatch) {
         return;
      }

      const startOffset = this._offset.clone();

      const rawString = this._source.substr(startOffset.index, toMatch.length);
      this._offset.index += rawString.length;
      this._offset.column += rawString.length;

      return this._makeToken(rawString, XmlStringToken.STRING, startOffset);
   }

   // probably need to deal with line endings
   getToTerminator(terminator) {
      if (!terminator || terminator === '') {
         throw new Error('Must pass a non-empty string to getToTerminator().');
      }
      const location = this._source.indexOf(terminator, this._offset.index);

      const startOffset = this._offset.clone();

      if (location === -1) {
         return;
      }

      const rawString = this._source.substring(startOffset.index, location);
      this._offset.index += rawString.length;
      this._offset.column += rawString.length;

      return this._makeToken(rawString, XmlStringToken.STRING, startOffset);
   }

   // probably need to deal with line endings
   // also looks like should stop at ]]>
   getToMarkup() {
      const charData = this.getToTerminator('<');

      // no markup terminator. just read to the end
      if (charData) {
         return charData;
      } else {
         const startOffset = this._offset.clone();
         const rawString = this._source.substring(startOffset.index);
         this._offset.index += rawString.length;
         this._offset.column += rawString.length;

         return this._makeToken(rawString, XmlStringToken.STRING, startOffset);
      }

   }

   getRecentTokens() {
      const temp = this._tokens;
      this._tokens = [];

      return temp;
   }

   _isSpace() {
      const char = this._source[this._offset.index];
      return char === ' ' || char === '\t' || char === '\n' || char === '\r';
   }

   _isWordTerminator() {
      const char = this._source[this._offset.index];

      return this._isSpace(char) ||
         char === '>' ||
         char === '/' ||
         char === '=' ||
         char === '?';
   }

   /*
    * Utility routine. Identifies if a character is legal for starting a name.
    *   [5]  Name          ::= NameStartChar (NameChar)*
    *   [4]  NameStartChar ::= ":" | [A-Z] | "_" | [a-z] | [#xC0-#xD6] |
    *                          [#xD8-#xF6] | [#xF8-#x2FF] | [#x370-#x37D] |
    *                          [#x37F-#x1FFF] | [#x200C-#x200D] |
    *                          [#x2070-#x218F] | [#x2C00-#x2FEF] |
    *                          [#x3001-#xD7FF] | [#xF900-#xFDCF] |
    *                          [#xFDF0-#xFFFD] | [#x10000-#xEFFFF]
    */
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
         (char >= '\uFDF0' && char <= '\uFFFD');
   }

   /*
    * Utility routine. Helps to identify legal name characters in a word.
    *   [4a] NameChar ::= NameStartChar | "-" | "." | [0-9] | #xB7 |
    *                     [#x0300-#x036F] | [#x203F-#x2040]
    */
   _isNameChar(char) {
      return this._isNameStartChar(char) ||
         (char >= '0' && char <= '9') ||
         char === '-' ||
         char === '.' ||
         char === '\u00B7' ||
         (char >= '\u0300' && char <= '\u036F') ||
         (char >= '\u203F' && char <= '\u2040');
   }

   _makeToken(data, type, startOffset) {
      const token = new XmlStringToken(data, type, startOffset, this._offset.clone());
      this._tokens.push(token);
      return token;
   }

}

module.exports = XmlStringCursor;
