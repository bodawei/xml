/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

class XmlTokenStreamDtd {

   parseElement(cursor) {
      const results = {};

      results.elementName = cursor.getWord([ '>' ]);
      cursor.getSpace(); // no need to check this, as if no space, then no contentChunk
      const mixedStart = cursor.peekChar();

      if (!mixedStart || mixedStart.text !== '(') {
         results.contentChunk = cursor.getWord([ '>' ]);
      } else {
         cursor.getChar();
         const listInfo = this._getListItems(cursor, [ '>' ]);

         results.list = listInfo.list;
         results.listCloseChunk = listInfo.close;
         results.missingNames = listInfo.missingCount;
         results.missingOrs = listInfo.missingOr;
      }

      cursor.getSpace();
      results.closeChunk = cursor.getMatch('>');

      return results;
   }

   /**********************************************************************\
    * [52] AttlistDecl    ::= '<!ATTLIST' S Name AttDef* S? '>'
    * [53] AttDef         ::= S Name S AttType S DefaultDecl
    * [54] AttType        ::= StringType | TokenizedType | EnumeratedType
    * [55] StringType     ::= 'CDATA'
    * [56] TokenizedType  ::= 'ID' | 'IDREF' | 'IDREFS' | 'ENTITY' |
    *                         'ENTITIES' | 'NMTOKEN' | 'NMTOKENS'
    * [57] EnumeratedType ::= NotationType | Enumeration
    * [58] NotationType   ::= 'NOTATION' S '(' S? Name
    *                         (S? '|' S? Name)* S? ')'
    * [59] Enumeration    ::= '(' S? Nmtoken (S? '|' S? Nmtoken)* S? ')'
    * [60] DefaultDecl    ::= '#REQUIRED' | '#IMPLIED' |
    *                         (('#FIXED' S)? AttValue)
   \**********************************************************************/
   parseAttList(cursor, options) {
      const results = {
         attributes: []
      };
      let done = false;

      results.elementNameChunk = cursor.getWord([ '>' ]);

      while (!done) {
         const attr = {};

         cursor.getSpace();
         attr.name = cursor.getWord([ '>' ]);
         cursor.getSpace();
         attr.type = cursor.getWord([ '>', '(', '#', '"', '\'' ]); // only?
         const postType = cursor.peekChar();

         if (attr.type && attr.type.text.toLocaleUpperCase() === 'NOTATION') {
            attr.postNotationSpace = cursor.getSpace();
            attr.opening = cursor.peekChar();

            if (attr.opening && attr.opening.text === '(') {
               cursor.getChar();

               const listInfo = this._getListItems(cursor, [ '>', '#', '"', '\'' ]);

               attr.list = listInfo.list;
               attr.close = listInfo.close;
               attr.missingCount = listInfo.missingCount;
               attr.missingOr = listInfo.missingOr;
            }
         } else if (!attr.type && postType && postType.text === '(') {
            cursor.getChar();

            const enumInfo = this._getListItems(cursor, [ '>', '#', '"', '\'' ]);
            attr.list = enumInfo.list;
            attr.close = enumInfo.close;
            attr.missingCount = enumInfo.missingCount;
            attr.missingOr = enumInfo.missingOr;

            attr.type = {
               text: 'ENUMERATION'
            };
         }

         attr.preDefaultSpace = cursor.getSpace();

         const nextChar = cursor.peekChar();
         let quotedResults;

         if (nextChar && nextChar.text === '#') {
            attr.default = cursor.getWord([ '>', '"', '\'' ]);

            if (attr.default.text.toLocaleUpperCase() === '#FIXED') {
               attr.postFixedSpace = cursor.getSpace();

               const quoteChunk = cursor.getChar(); // NEed to cope with non-quote
               quotedResults = this._getQuotedValue(cursor, quoteChunk, options);
            }
         } else if (nextChar && nextChar.text !== '>') {
            const quoteChunk = cursor.getChar(); // NEed to cope with non-quote
            quotedResults = this._getQuotedValue(cursor, quoteChunk, options);
         }

         if (quotedResults) {
            attr.value = quotedResults.value;
            attr.quote = quotedResults.quote;
            attr.aborted = quotedResults.abort;

            if (attr.aborted) {
               done = true;
            }
         }

         if (attr.name) {
            results.attributes.push(attr);
         } else {
            done = true;
         }
      }

      cursor.getSpace();
      results.closeChunk = cursor.getMatch('>');

      return results;
   }

   /**********************************************************************\
    _getListItems gets all the items from a list that is terminated
    by a ")", where individual items are terminated by "|"'s.

    If a "|" is missing, we keep a count of the number of missing "|"'s.

    If a name is omitted, we keep a count of the number of missing names
    (if, perchance, the whole file is nothing but |'s, then we will
    consume it all. seems unlikely in practice).

    PARAM
    terminators: An array of characters that could terminate the list
    beyond the ones we know.

    RETURN
    An object with these properties:
      list: An array of 0 or more WordChunks, each one representing a name
         found in the ist
      missingCount: The number of names missing from the list (e.g. empty
         space between "|"'s)
      close: The Chunk representing the closing ")" of the list, if found.
   \**********************************************************************/

   _getListItems(cursor, terminators) {
      const results = {
         list: [],
         missingCount: 0,
         missingOr: 0,
         close: undefined
      };
      const listTerminators = terminators.slice().concat([ ')', '|' ]);
      let done = false;

      while (!done) {
         cursor.getSpace();
         const aName = cursor.getWord(listTerminators);
         cursor.getSpace();
         const orChar = cursor.getMatch('|');
         cursor.getSpace();
         results.close = cursor.getMatch(')');
         const next = cursor.peekChar();

         const foundTerminator = terminators.indexOf(next.text) !== -1;

         if (aName) {
            results.list.push(aName);
         } else {
            results.missingCount++;
         }

         if (!results.close && !foundTerminator && !orChar) {
            results.missingOr++;
         }

         if (results.close || foundTerminator) {
            done = true;
         }
      }

      return results;
   }

   /**********************************************************************\
    _getQuotedValue consumes the next data from the cursor to extract
    a quoted value.  This is used for several diverse types of quoted
    values, so the options specify which variation should be handled.

    PARAMS
    quoteChunk is the TextChunk containing the quote that opened the value
    options is an Object containing these values:
      isElementAttribute: true if this is an element attribute's value
      isEntityValue: If true, expand parameter entity values
      nameChunk: If this is an element or xmldecl attribute value, this
                 the name of the attribute must be provided here.

    RETURN
    For attributes, this returns an object that contains the array of
    possibly zero XmlTokens found to make up the attribute value, and a
    flag named abort. If abort is true, it indicates that a "<" was found
    in the attribute value, and not only attribute value gathering should
    stop, but the whole start tag processing should stop.
    For entity values, this just returns the array of XMLTokens
   \**********************************************************************/
   _getQuotedValue(cursor, quoteChunk, options = {}) {
      const result = {
         value: [],
         abort: false,
         quote: undefined
      };
      let done = false;
      const terminators = [ quoteChunk.text ];

      if (!options['lax:allowOpenAngleBracketsInAttributeValues']) {
         terminators.push('<');
      }

      while (!done) {
         const chunkInfo = cursor.getToTerminator(terminators);

         if (chunkInfo.chunk) {
            result.value.push(chunkInfo.chunk);
         }

         done = true;

         switch (chunkInfo.terminator) {
            case quoteChunk.text:
               cursor.getChar(); // consume the quote
               result.quote = quoteChunk.text;
               break;
            case '<':
               result.abort = true;
               break;
            default: // no terminator
               break;
         }
      }

      return result;
   }

}

module.exports = XmlTokenStreamDtd;
