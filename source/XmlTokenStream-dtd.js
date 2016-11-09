/*Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

const TextChunk = require('./TextChunk.js');
const XmlToken = require('./XmlToken.js');

class XmlTokenStreamDtd {

   /**********************************************************************\
    parseDocTypeStart extracts information about a DocType declaration.
    It may parse the whole declaration, or it may only parse up to the
    start of the internal subset

    This assumes that the "<!DOCTYPE S" has already been parsed.

    PARAM
    cursor: The cursor to read from

    RETURN
      {
         nameChunk: The name of the notation
         postNameSpaceChunk: The space after the name
         externalId: The structure returned by getExternalId
         postExternalIdChunk: As it says.
         hasInternalSubset: true if [ was found
         postInternalSubsetSpaceChunk: as the name says
         closeChunk: The chunk for the >.  Undefined if hasInternalSubset
      }
    SYNTAX
      [28] doctypedecl ::= '<!DOCTYPE' S
         Name (S ExternalID)? S? ('[' intSubset ']' S?)? '>'
   \**********************************************************************/
   parseDocTypeStart(cursor) {
      const results = {};

      results.nameChunk = cursor.getWord([ '[', '>' ]); // could look for quotes, too
      results.postNameSpaceChunk = cursor.getSpace();
      results.externalId = this._retrieveExternalId(cursor, [ '[', '>' ]);
      results.postExternalIdChunk = cursor.getSpace();

      return results;
   }

   /**********************************************************************\
    parseNotation extracts a notation declaration from the provided cursor
    and returns a data structure that describes what was extracted.

    This assumes that the "<!NOTATION S" has already been parsed.

    PARAM
    cursor: The cursor to read from

    RETURN
      {
         nameChunk: The name of the notation
         postNameSpaceChunk: The space after the name
         externalId: The structure returned by getExternalId
      }
    SYNTAX
      [82] NotationDecl ::=
         '<!NOTATION' S Name S (ExternalID | PublicID) S? '>'
   \**********************************************************************/
   parseNotation(cursor) {
      const results = {};

      results.nameChunk = cursor.getWord([ '>' ]);
      results.postNameSpaceChunk = cursor.getSpace();
      results.externalId = this._retrieveExternalId(cursor, [ '>' ]);
      cursor.getSpace();
      results.close = cursor.getMatch('>');

      return results;
   }

   /**********************************************************************\
    parseEntity extracts an entity declaration from the provided cursor
    and returns a data structure that describes what was extracted.

    This assumes that the "<!ENTITY S" has already been parsed.

    PARAM
    cursor: The cursor to read from

    RETURN
      {
         nameChunk: The chunk with the entity name
         isParameter: True if this is a parameter entry declaration
         postNameSpaceChunk: The space after the name, if any.
         valueQuoteChunk
         valueChunk
         externalId
      }
    SYNTAX
      // [70] EntityDecl  ::= GEDecl | PEDecl
      // [71] GEDecl      ::= '<!ENTITY' S Name S EntityDef S? '>'
      // [72] PEDecl      ::= '<!ENTITY' S '%' S Name S PEDef S? '>'
      // [73] EntityDef   ::= EntityValue | (ExternalID NDataDecl?)
      // [74] PEDef       ::= EntityValue | ExternalID
      // [76] NDataDecl   ::= S 'NDATA' S Name
      //  [9] EntityValue ::= '"' ([^%&"] | PEReference | Reference)* '"' |
      //                      "'" ([^%&'] | PEReference | Reference)* "'"
   \**********************************************************************/
   parseEntity(cursor) {
      const results = {};

      results.nameChunk = cursor.getWord([ '>' ]);

      if (results.nameChunk && results.nameChunk.text === '%') {
         results.isParameter = true;
         cursor.getSpace(); // either have space or >. no need to error if space not here
         results.nameChunk = cursor.getWord([ '>' ]);
      }

      results.postNameSpaceChunk = cursor.getSpace();

      // EntityDef or PEDef

      const valueQuote = cursor.peekChar();
      if (valueQuote && (valueQuote.text === '"' || valueQuote.text === '\'')) {
         results.valueQuoteChunk = cursor.getChar();     // consume the quote
         this._getQuotedValue(cursor, valueQuote, { isEntityValue: true }, results);
         results.valueChunk = [ ];
         if (results.value[0]) {
            results.valueChunk.push(new XmlToken(XmlToken.TEXT, results.value[0].text));
         }
      } else {
         results.externalId = this._retrieveExternalId(cursor, [ '>' ], { isEntity: true });
      }

      return results;
   }

   /**********************************************************************\
    parseElement extracts an element declaration from the provided cursor
    and returns a data structure that describes what was extracted

    This assumes that the "<!ELEMENT S" has already been parsed.

    PARAM
    cursor: The cursor to read from

    RETURN
    {
       elenentName  // Name of the elment
       contentChunk // Chunk containing the EMPTY or ANY text
       missingCount // The number of names missing if Mixed
       missingOr    // The number of "|"'s missing if Mixed
       close        // The close of the Mixed list
       list         // An array of Mixed names
       closeChunk   // Chunk that has the closing ">"
    }

    SYNTAX
      // [45] elementdecl ::= '<!ELEMENT' S Name S contentspec S? '>'
      // [46] contentspec ::= 'EMPTY' | 'ANY' | Mixed | children
      // [51] Mixed       ::= '(' S? '#PCDATA' (S? '|' S? Name)* S? ')*' |
      //                      '(' S? '#PCDATA' S? ')'
   \**********************************************************************/
   parseElement(cursor) {
      const results = {};

      results.elementName = cursor.getWord([ '>' ]);
      cursor.getSpace(); // no need to check this, as if no space, then no contentChunk
      const mixedStart = cursor.peekChar();

      if (!mixedStart || mixedStart.text !== '(') {
         results.contentChunk = cursor.getWord([ '>' ]);
      } else {
         cursor.getChar();
         this._getListItems(cursor, [ '>' ], results);
      }

      cursor.getSpace();
      results.closeChunk = cursor.getMatch('>');

      return results;
   }

   /**********************************************************************\
    parseAttList extracts an AttlistDecl from the input stream, and returns
    a data structure with all the pieces.

    This assumes that the "<!ATTLIST S" has already been parsed.

    PARAM
    cursor: The cursor to read from
    options: This makes use of the
         lax:allowOpenAngleBracketsInAttributeValues option.

    RETURN
      {
         elementNameChunk  // Name
         attributes: [ {
            name
            type
            preEnumSpaceChunk      // The space between Name and (enum)
            default
            value
            missingCount   // Number of missing names's (enum and notation)
            missingOr      // Number of missing |'s (enum and notation)
            close          // Closing ")" (enum and notation)
            quote          // Quote opening AttValue
            aborted        // true if < found in AttValue
         }],
         closeChunk        // the closing >
      }

    SYNTAX
    [52] AttlistDecl    ::= '<!ATTLIST' S Name AttDef S? '>'
    [53] AttDef         ::= S Name S AttType S DefaultDecl
    [54] AttType        ::= StringType | TokenizedType | EnumeratedType
    [55] StringType     ::= 'CDATA'
    [56] TokenizedType  ::= 'ID' | 'IDREF' | 'IDREFS' | 'ENTITY' |
                            'ENTITIES' | 'NMTOKEN' | 'NMTOKENS'
    [57] EnumeratedType ::= NotationType | Enumeration
    [58] NotationType   ::= 'NOTATION' S '(' S? Name (S? '|' S? Name)S? ')'
    [59] Enumeration    ::= '(' S? Nmtoken (S? '|' S? Nmtoken)S? ')'
    [60] DefaultDecl    ::= '#REQUIRED' | '#IMPLIED' |
                            (('#FIXED' S)? AttValue)
   \**********************************************************************/
   parseAttList(cursor, options) {
      const results = {
         attributes: []
      };
      let done = false;

      results.elementNameChunk = cursor.getWord([ '>' ]);

      // Consume each AttDef
      while (!done) {
         const attr = {};

         cursor.getSpace();
         attr.name = cursor.getWord([ '>', '(' ]);
         const postNameSpace = cursor.getSpace();
         const enumStart = cursor.peekChar();

         if (enumStart && enumStart.text === '(') {
            cursor.getChar();
            attr.preEnumSpaceChunk = postNameSpace;
            this._getListItems(cursor, [ '>', '#', '"', '\'' ], attr);

            attr.type = {
               text: 'ENUMERATION'
            };
         } else {
            attr.type = cursor.getWord([ '>', '(', '#', '"', '\'' ]); // only?

            if (attr.type && attr.type.text.toLocaleUpperCase() === 'NOTATION') {
               attr.postNotationSpace = cursor.getSpace();
               attr.opening = cursor.peekChar();

               if (attr.opening && attr.opening.text === '(') {
                  cursor.getChar();

                  this._getListItems(cursor, [ '>', '#', '"', '\'' ], attr);
               }
            }
         }

         attr.preDefaultSpace = cursor.getSpace();

         const nextChar = cursor.peekChar();

         if (nextChar && nextChar.text === '#') {
            attr.default = cursor.getWord([ '>', '"', '\'' ]);

            if (attr.default.text.toLocaleUpperCase() === '#FIXED') {
               attr.postFixedSpace = cursor.getSpace();

               const quoteChunk = cursor.peekChar();

               if (quoteChunk && (quoteChunk.text === '"' || quoteChunk.text === '\'')) {
                  cursor.getChar();
                  this._getQuotedValue(cursor, quoteChunk, options, attr);
               }
            }
         } else if (nextChar && nextChar.text !== '>') {
            const quoteChunk = cursor.getChar();
            this._getQuotedValue(cursor, quoteChunk, options, attr);
         }

         if (attr.aborted) {
            done = true;
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
      missingOr: The number of |'s missing from the list
      close: The Chunk representing the closing ")" of the list, if found.
   \**********************************************************************/

   _getListItems(cursor, terminators, results) {
      results.missingCount = 0;
      results.missingOr = 0;
      results.close = undefined;
      results.list = [];

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
   _getQuotedValue(cursor, quoteChunk, options = {}, result) {
      let done = false;
      const terminators = [ quoteChunk.text ];

      result.value = [];
      result.aborted = false;
      result.quote = undefined;

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
               result.aborted = true;
               break;
            default: // no terminator
               break;
         }
      }
   }

   /**********************************************************************\
    _retrieveExternalId tries to extract an ExternalID or a PublicID from
    the current position in the cursor. It assumes any leading space has
    already been consumed.

      [75] ExternalID    ::= 'SYSTEM' S SystemLiteral |
                             'PUBLIC' S PubidLiteral S SystemLiteral
      [83] PublicID      ::= 'PUBLIC' S PubidLiteral
      [11] SystemLiteral ::= ('"' [^"]* '"') | ("'" [^']* "'")
      [12] PubidLiteral  ::= '"' PubidChar* '"' |
                             "'" (PubidChar - "'")* "'"
      [13] PubidChar     ::= #x20 | #xD | #xA | [a-zA-Z0-9] |
                             [-'()+,./:=?;!*#@$_%]

    PARAM
    terminators: An array of characters this should terminate parsing of
      the id for
    options: Flags for special cases
      requireSystemOnPublic: true if the systemLiteral is required for
         a PUBLIC
      isEntity: true if this is for an entity (which means NDATA could
         be found instead of the system value on a PUBLIC)

    RETURN
    Either undefined, if no type could be found, or this structure. Note
    that if typeText is not a known value, then unknownType will be true
    and public and systemId's will be undefined
    {
      typeText: String of the type of data retrieved
      uppercaseTypeText: The capitalized version of the above
      unknownType: true if the type wasn't a recognized value
      spaceAfterTypeChunk: The space after the type
      publicId: The structure returned by getQuotedLiteral
      betweenSpaceChunk: Chunk between public and system values, if any
      systemId: The structure returned by getQuotedLiteral
    }
   \**********************************************************************/

   _retrieveExternalId(cursor, terminators) {
      const result = {
         unknownType: false
      };
      const xIdTerminators = terminators.slice().concat([ '"', '\'' ]);
      const xIdType = cursor.getWord(xIdTerminators);

      if (!xIdType) {
         return;
      }

      const upperCaseXIdType = xIdType.text.toLocaleUpperCase();
      result.typeText = xIdType.text;
      result.uppercaseTypeText = upperCaseXIdType;

      if (upperCaseXIdType !== 'SYSTEM' && upperCaseXIdType !== 'PUBLIC') {
         cursor.unget(xIdType);
         result.unknownType = true;
         return result;
      }

      result.spaceAfterTypeChunk = cursor.getSpace();
      if (upperCaseXIdType === 'PUBLIC') {
         result.publicId = this._getQuotedLiteral(cursor);
         if (!result.publicId) {
            result.publicId = this._getWordLiteral(cursor, terminators);
         }
      }

      // both SYSTEM and PUBLIC need to consume the systemLiteral
      result.betweenSpaceChunk = cursor.getSpace();

      // Entities may have an NDATA after the publicId, and no systemId
      const possibleNData = cursor.getWord(terminators);

      if (possibleNData && possibleNData.text.toLocaleUpperCase() === 'NDATA') {
         cursor.unget(possibleNData);
         if (result.betweenSpaceChunk) {
            cursor.unget(result.betweenSpaceChunk);
            delete result.betweenSpaceChunk;
         }
         return result;
      } else if (possibleNData) {
         cursor.unget(possibleNData);
      }

      result.systemId = this._getQuotedLiteral(cursor);
      if (!result.systemId) {
         result.systemId = this._getWordLiteral(cursor, terminators);
      }

      return result;
   }

   /**********************************************************************\
    _getQuotedLiteral generically extracts either a PublicID value or a
    SystemLiteral value from the cursor. This assumes any leading
    white space has been consumed

    PARAM
    cursor: The cursor to read from

    RETURN
    Either undefined, if no quote was found, or the following structure
    {
      quoteChunk: The opening quote chunk
      literalChunk: The chunk of text between quotes
      closeChunk: The closing quote chunk
    }
   \**********************************************************************/

   _getQuotedLiteral(cursor) {
      const result = {
         quote: cursor.peekChar()
      };
      const isQuote = result.quote && (result.quote.text === '"' || result.quote.text === '\'');

      if (isQuote) {
         cursor.getMatch(result.quote.text);
         const stringInfo = cursor.getToTerminator([ result.quote.text ]);
         result.literalChunk = stringInfo.chunk || new TextChunk.PlainChunk('', result.quote.endOffset,
            result.quote.endOffset, result.quote.entityLocation);
         result.closeChunk = cursor.getMatch(result.quote.text);

         return result;
      }
   }

   _getWordLiteral(cursor, terminators) {
      const word = cursor.getWord(terminators);
      if (word) {
         return {
            literalChunk: word
         };
      }
   }

}

module.exports = XmlTokenStreamDtd;
