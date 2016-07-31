/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

const XmlToken = require('./XmlToken.js');
const XmlErrorToken = require('./XmlErrorToken.js');
const TextChunk = require('./TextChunk.js');
const CommentToken = XmlToken.CommentToken;
const ProcessingInstructionToken = XmlToken.ProcessingInstructionToken;
const SpaceToken = XmlToken.SpaceToken;
const DeclarationToken = XmlToken.DeclarationToken;
const StartTagToken = XmlToken.StartTagToken;
const TagToken = XmlToken.TagToken;

const XMLDECL_NAME_TERMINATORS = [ '=', '?>' ];
const XMLDECL_VALUE_TERMINATORS = [ '?>' ];
const ATTRIBUTE_NAME_TERMINATORS = [ '=', '>', '/>' ];
const ATTRIBUTE_VALUE_TERMINATORS_LAX = [ '>', '/>' ];
const ATTRIBUTE_VALUE_TERMINATORS = [ '<', '>', '/>' ];

function makePair(nameChunk, valueChunk, quoteToken, elementAttribute) {
   let value = valueChunk;

   if (!elementAttribute) {
      value = valueChunk.length !== 0 ? valueChunk[0].data : undefined;
   }

   return {
      name: nameChunk.text,
      value: value,
      quoteType: quoteToken ? quoteToken.text : undefined
   };
}

class XmlTokenStream {

   constructor(cursor, entityManager, options) {
      if (!entityManager) {
         throw Error('Must provide an XmlEntityManager instance.');
      }

      this._cursor = cursor;
      this._pendingTokens = [];
      this._elementNameStack = [];
      this._entityManager = entityManager;
      this._cursorContexts = [];

      this._options = {
         lax: false,
         'lax:allowOpenAngleBracketsInAttributeValues': false
      };

      for (const name in options) {
         if (this._options[name] === undefined) {
            throw new Error('"' + name + '" is not a supported option name.');
         }
         this._options[name] = options[name];
      }
   }

   _nextToken() {
      const type = this._cursor.peekType();

      switch (type) {
         case TextChunk.TYPE.MARKUP:
            const markupToken = this._cursor.getMarkup();

            switch (markupToken.text) {
               case '&':
                  this._getReference();
                  break;
               case '<':
                  this._getTag(true);
                  break;
               case '</':
                  this._getTag(false);
                  break;
               case '<?':
                  this._getProcessingInstruction();
                  break;
               case '<!':
                  this._getBangItem();
                  break;
               case '<!--':
                  this._getComment();
                  break;
            }
            break;
         case TextChunk.TYPE.SPACE:
            // only recognize spaces when we aren't between tags
            if (this._elementNameStack.length === 0) {
               this._getS();
            } else {
               this._getContent();
            }
            break;
         case TextChunk.TYPE.STRING:
            this._getContent();
            break;
      }

      return this._pendingTokens.shift();
   }

   _getS() {
      const space = this._cursor.getSpace();

      this._pendingTokens.push(new SpaceToken(space.text, this._cursor.getRecentChunks()));
   }

   /*
    *   [14] CharData ::= [^<&]* - ([^<&]* ']]>' [^<&]*)
    */
   _getContent() {
      let content;

      do {
         content = this._cursor.getToTerminator([ '<', '&', ']]>' ]);

         if (content.terminator === ']]>') {
            this._reportSyntaxError(XmlErrorToken.ERROR.CHARDATA_BAD_DATA);

            this._pushToken(XmlToken.CHARDATA, content.chunk.text);

            content = {
               chunk: this._cursor.getMatch(']]>')
            };

         } else if (!content.chunk || content.chunk.text === '') {
            return;
         }

         this._pushToken(XmlToken.CHARDATA, content.chunk.text);
      } while (content.terminator !== '>');
   }

   _getReference(inAttribute) {
      const space = this._cursor.getSpace();
      const next = this._cursor.peekChar();

      if (space) {
         this._reportSyntaxError(XmlErrorToken.ERROR.REFERENCE_ILLEGAL_SPACE);
      }

      if (next.text === '#') {
         this._cursor.getChar();
         const character = this._getCharReference();

         if (inAttribute) {
            return [ new XmlToken(XmlToken.CHAR_ENTITY, character) ];
         } else {
            this._pushToken(XmlToken.CHAR_ENTITY, character);
         }
      } else {
         const name = this._cursor.getWord([ ';' ]);
         const entityName = name ? name.text : '';
         const afterSpace = this._cursor.getSpace();
         const closingSemicolon = this._cursor.getMatch(';');
         let entityCursor;

         if (!entityName) {
            this._reportSyntaxError(XmlErrorToken.ERROR.REFERENCE_NO_NAME);
         } else {
            entityCursor = this._entityManager.getEntity(entityName);
         }

         if (afterSpace) {
            this._reportSyntaxError(XmlErrorToken.ERROR.REFERENCE_ILLEGAL_TRAILING_SPACE,
               'A space was found after the entity name "' + name.text + '".');
         }

         if (!closingSemicolon) {
            this._reportSyntaxError(XmlErrorToken.ERROR.REFERENCE_NO_SEMICOLON);
         }

         const startToken = new XmlToken(XmlToken.ENTITY_START, entityName);
         startToken.haveEntityData = !!entityCursor;

         if (inAttribute) {
            const result = [ startToken ];

            if (entityCursor) {
               this._getAttributeReference(entityCursor, result);
            }

            result.push(new XmlToken(XmlToken.ENTITY_END, entityName));
            return result;
         } else {
            startToken.chunks = this._cursor.getRecentChunks();
            this._pendingTokens.push(startToken);

            if (entityCursor) {
               const endToken = new XmlToken(XmlToken.ENTITY_END, entityName);
               endToken.chunks = [];

               this._cursorContexts.push({
                  cursor: this._cursor,
                  token: endToken
               });

               this._cursor = entityCursor;
            } else {
               this._pushToken(XmlToken.ENTITY_END, entityName);
            }
         }
      }
   }

   _getAttributeReference(cursor, contents) {
      let result = cursor.getToTerminator([ '&' ]);

      if (result.chunk) {
         contents.push(new XmlToken(XmlToken.TEXT, result.chunk.text));
      }

      while (result.terminator) {
         cursor.getChar(); // swallow the &
         const tempCursor = this._cursor;
         this._cursor = cursor;
         const stuff = this._getReference(true);
         this._cursor = tempCursor;
         for (const index in stuff) {
            contents.push(stuff[index]);
         }

         result = cursor.getToTerminator([ '&' ]);

         if (result.chunk) {
            contents.push(new XmlToken(XmlToken.TEXT, result.chunk.text));
         }
      }
   }

   _getCharReference() {
      let isHex = false;
      let character;
      const space = this._cursor.getSpace();
      const nextChar = this._cursor.peekChar();

      if (space) {
         this._reportSyntaxError(XmlErrorToken.ERROR.CHAR_REFERENCE_ILLEGAL_SPACE);
      }

      if (nextChar.text.toLocaleLowerCase() === 'x') {
         if (nextChar.text !== 'x') {
            this._reportSyntaxError(XmlErrorToken.ERROR.CHAR_REFERENCE_HEX_CASE_WRONG);
         }

         isHex = true;
         this._cursor.getChar();
      }

      const afterSpace = this._cursor.getSpace();
      const digits = this._cursor.getDigits();
      const afterDigitsSpace = this._cursor.getSpace();
      const semicolon = this._cursor.getMatch(';');

      if (afterSpace) {
         this._reportSyntaxError(XmlErrorToken.ERROR.CHAR_REFERENCE_SPACE_BEFORE_DIGITS);
      }

      if (!digits) {
         this._reportSyntaxError(XmlErrorToken.ERROR.CHAR_REFERENCE_NO_DIGITS);
      } else {
         if (!isHex && !digits.isDecimal) {
            this._reportSyntaxError(XmlErrorToken.ERROR.CHAR_REFERENCE_HEX_DIGITS_DECIMAL_REF);
            isHex = true;
         }

         character = String.fromCharCode(parseInt(digits.text, isHex ? 16 : 10));
      }

      if (afterDigitsSpace) {
         this._reportSyntaxError(XmlErrorToken.ERROR.CHAR_REFERENCE_SPACE_AFTER_DIGITS);
      }

      if (!semicolon) {
         this._reportSyntaxError(XmlErrorToken.ERROR.CHAR_REFERENCE_MISSING_SEMICOLON);
      }

      return character;
   }

   /*
    * Parse any comment
    *   [15] Comment ::= '<!--' ((Char - '-') | ('-' (Char - '-')))* '-->'
    * PARAMS: The first token (currently not used)
    */
   _getComment() {
      this._cursor.getMarkup();
      const results = this._cursor.getToTerminator([ '-->' ]);

      if (!results.terminator) {
         this._reportSyntaxError(XmlErrorToken.ERROR.COMMENT_MISSING_END);
      } else {
         this._cursor.getMatch('-->');

         if (results.chunk && results.chunk.text[results.chunk.text.length - 1] === '-') {
            this._reportSyntaxError(XmlErrorToken.ERROR.COMMENT_ENDS_WITH_HYPHEN);
         }
      }

      const content = results.chunk ? results.chunk.text : undefined;
      this._pendingTokens.push(new CommentToken(content, this._cursor.getRecentChunks()));
   }

   _getBangItem() {
      this._cursor.getMarkup();
      const leadingSpace = this._cursor.getSpace();
      const bracket = this._cursor.getMatch('[');

      if (bracket) {
         if (leadingSpace) {
            this._reportSyntaxError(XmlErrorToken.ERROR.SPACE_BEFORE_SQUARE_BRACKET);
         }

         this._getBracketItem();
      } else {
         this._reportSyntaxError(XmlErrorToken.ERROR.BANGITEM_UNSUPPORTED);
      }
   }

   _getBracketItem() {
      const preSpace = this._cursor.getSpace();
      const bracketItemType = this._cursor.getWord([ '[' ]);
      const postSpace = this._cursor.getSpace();
      const secondBracket = this._cursor.getMatch('[');

      if (!bracketItemType) {
         this._reportSyntaxError(XmlErrorToken.ERROR.BANGITEM_NO_NAME);
      }

      if (!secondBracket) {
         this._reportSyntaxError(XmlErrorToken.ERROR.BANGITEM_MISSING_SECOND_SQUARE);
      }

      /*
       * Retrieve a CData section
       *   [18] CDSect  ::=  CDStart CData CDEnd
       *   [19] CDStart ::=  '<![CDATA['
       *   [20] CData   ::=  (Char* - (Char* ']]>' Char*))
       *   [21] CDEnd   ::=  ']]>'
       */
      if (bracketItemType && bracketItemType.text.toLocaleLowerCase() === 'cdata') {
         if (preSpace) {
            this._reportSyntaxError(XmlErrorToken.ERROR.CDATA_SPACE_BEFORE_NAME);
         }
         if (bracketItemType.text !== 'CDATA') {
            this._reportSyntaxError(XmlErrorToken.ERROR.CDATA_NOT_CAPITALIZED,
               '"CDATA" must be all capital. found "' + bracketItemType.text + '".');
         }
         if (postSpace) {
            this._reportSyntaxError(XmlErrorToken.ERROR.CDATA_SPACE_AFTER_NAME);
         }

         const results = this._cursor.getToTerminator([ ']]>' ]);

         if (!results.terminator) {
            this._reportSyntaxError(XmlErrorToken.ERROR.CDATA_MISSING_CLOSE);
         } else {
            this._cursor.getMatch(']]>');
         }

         this._pushToken(XmlToken.CDATA, results.chunk ? results.chunk.text : undefined);
      } else if (bracketItemType) {
         this._reportSyntaxError(XmlErrorToken.ERROR.BANGITEM_UNKNOWN_BRACKET_NAME,
            'Unknown Bang-bracket item. Found "' + bracketItemType.text + '".');
      }
   }

   /*
    * Parse Any processing instruction
    *   [16] PI       ::= '<?' PITarget (S (Char* - (Char* '?>' Char*)))? '?>'
    *   [17] PITarget ::= Name - (('X' | 'x') ('M' | 'm') ('L' | 'l'))
    * This assumes that something that calls this has already peeked and
    * noticed the <?.
    *
    * PARAMS None. however, this assumes that the first token has already
    *        been read
    * RETURN None.  Does queue an XMLToken of type XmlToken.XMLDECL or
    *        XmlToken.PI and possibly syntax error tokens.
    */
   _getProcessingInstruction() {
      const firstMarkup = this._cursor.getMarkup();
      const space = this._cursor.getSpace();
      const target = this._cursor.getWord([ '?>' ]);

      if (space) {
         this._reportSyntaxError(XmlErrorToken.ERROR.PI_SPACE_BEFORE_TARGET,
            'Space found before processing intruction target.');
      }

      if (!target) {
         this._reportSyntaxError(XmlErrorToken.ERROR.PI_NO_TARGET);
      }

      if (target && !target.couldBeName) {
         this._reportSyntaxError(XmlErrorToken.ERROR.PI_TARGET_NOT_NAME,
            'The target name does not match the syntax for names. Found: "' + target.text + '".');
      }

      if (target && target.text.toLocaleLowerCase() === 'xml') {
         if (target.text !== 'xml') {
            this._reportSyntaxError(XmlErrorToken.ERROR.XML_NOT_LOWERCASE,
               'The xml target name was not all lower case (' + target.text + ').');
         }
         this._getXmlDecl();
      } else {
         this._cursor.getSpace();   // optional space
         const results = this._cursor.getToTerminator([ '?>' ]);

         // If we found no ?> (thus, really, end of file) report an error.
         if (!results.terminator) {
            this._reportSyntaxError(XmlErrorToken.ERROR.PI_NO_TERMINATOR);
         } else {
            this._cursor.getMatch('?>');
         }

         const targetName = target ? target.text : '';
         const content = results.chunk ? results.chunk.text : undefined;
         this._pendingTokens.push(new ProcessingInstructionToken(targetName, content, this._cursor.getRecentChunks()));
      }
   }

   /*
    * Parse the XML Declaration which ha the following format:
    *   [23] XMLDecl	    ::= '<?xml' VersionInfo EncodingDecl? SDDecl? S? '?>'
    *   [24] VersionInfo ::= S 'version' Eq ("'" VersionNum "'" |
    *                        '"' VersionNum '"')
    *   [25] Eq	       ::= S? '=' S?
    *   [26] VersionNum  ::= '1.1' | '1.0'
    *   [27] Misc	       ::= Comment | PI | S
    *   [80] EncodingDecl::= S 'encoding' Eq ('"' EncName '"' |
    *                        "'" EncName "'" )
    *   [32] SDDecl	    ::= S 'standalone' Eq (("'" ('yes' | 'no') "'") |
    *                        ('"' ('yes' | 'no') '"'))
    *   [81] EncName	    ::= [A-Za-z] ([A-Za-z0-9._] | '-')*
    *
    * RETURN None.  however, this does add an XMLToken and possibly various
    *        syntax error tokens to the pending queue. The XMLToken is of type
    *        XmlToken.XMLDECL, with a params property, which is an array of
    *        objects corresponding to the "attributes" of the xml declaration
    *        in the order they were found, each object has a name and a value.
    */
   _getXmlDecl() {
      const params = this._getAttributes(false);

      const close = this._cursor.getMatch('?>');

      if (!close) {
         this._reportSyntaxError(XmlErrorToken.ERROR.MISSING_XMLDECL_CLOSE);
      }

      if (params.length === 0) {
         this._reportSyntaxError(XmlErrorToken.ERROR.NO_ATTRIBUTES);
      }

      // check that the parameters are in the right order and have the right values
      for (let index = 0; index < params.length; index++) {
         const param = params[index];
         const lcName = param.name.toLocaleLowerCase();

         switch (lcName) {
            case 'version':
               if (index !== 0) {
                  this._reportSyntaxError(XmlErrorToken.ERROR.ATTR_WRONG_ORDER,
                     '"version" attribute should be at position #0 but was at #' + index + '.');
               }
               if (param.name !== lcName) {
                  this._reportSyntaxError(XmlErrorToken.ERROR.XMLDECL_ATTR_WRONG_CASE,
                        '"' + lcName + '" must be lower case, but found "' + param.name + '".');
               }
               if (param.value !== '1.1' && param.value !== '1.0') {
                  this._reportSyntaxError(XmlErrorToken.ERROR.BAD_VERSION,
                     '"version" must be "1.0" or "1.1" but found "' + param.value + '".');
               }
               break;
            case 'encoding':
               if (index !== 1) {
                  this._reportSyntaxError(XmlErrorToken.ATTR_WRONG_ORDER,
                     'encoding attribute in the wrong position. Should be after version, but was #' +
                     index + '.');
               }
               if (param.name !== lcName) {
                  this._reportSyntaxError(XmlErrorToken.ERROR.XMLDECL_ATTR_WRONG_CASE,
                        '"' + lcName + '" must be lower case, but found "' + param.name + '".');
               }
               if (!param.value.match(/^[A-Za-z][-A-Za-z0-9._]*$/)) {
                  this._reportSyntaxError(XmlErrorToken.ERROR.BAD_ENCODING,
                     '"encoding" must be alphanumerics, but found "' + param.value + '".');
               }
               break;
            case 'standalone':
               const lcValue = param.value.toLocaleLowerCase();

               if (index !== 1 && index !== 2) {
                  this._reportSyntaxError(XmlErrorToken.ERROR.ATTR_WRONG_ORDER,
                     'standalone attribute in the wrong position. Should be #1 or #2, but was #' +
                     index + '.');
               }
               if (param.name !== lcName) {
                  this._reportSyntaxError(XmlErrorToken.ERROR.XMLDECL_ATTR_WRONG_CASE,
                     '"' + lcName + '" must be lower case, but found "' + param.name + '".');
               }
               if (param.value !== lcValue) {
                  this._reportSyntaxError(XmlErrorToken.ERROR.XMLDECL_STANDALONE_WRONG_CASE,
                     '"' + lcValue + '" must be lower case, but found "' + param.value + '".');
               }
               if (param.value !== 'no' && param.value !== 'yes') {
                  this._reportSyntaxError(XmlErrorToken.ERROR.BAD_STANDALONE,
                        '"standalone" must be "yes" or "no" but found "' + param.value + '".');
               }
               break;
            default:
               this._reportSyntaxError(XmlErrorToken.ERROR.UNKNOWN_ATTR,
                  'Unknown XML Declaration parameter "' + param.name + '".');
         }
      }

      this._pendingTokens.push(new DeclarationToken(params, this._cursor.getRecentChunks()));
   }

   /*
    * Parse the XML start or end tag, and queues the return token and/or any
    * errors found
    *  [40] STag ::= '<' Name (S Attribute)* S? '>'
    *  [42] ETag ::= '</' Name S? '>'
    *  [44] EmptyElemTag ::= '<' Name (S Attribute)* S? '/>'
    * PARAMS isStartOrEmpty: true if this is a start or empty tag, or false
    *        if an end tag
    * RETURN none
    */
   _getTag(isStartOrEmpty) {
      let attributes = [];

      const leadingSpace = this._cursor.getSpace();
      const name = this._cursor.getWord([ '>', '/>' ]);

      if (isStartOrEmpty) {
         attributes = this._getAttributes(true);
      } else {
         this._cursor.getSpace();
      }

      let close = this._cursor.getMatch('>');
      let isEmpty = false;

      if (!close) {
         close = this._cursor.getMatch('/>');

         if (close) {
            if (isStartOrEmpty) {
               isEmpty = true;
            } else {
               this._reportSyntaxError(XmlErrorToken.ERROR.ELEMENT_END_BAD_CLOSE);
            }
         }
      }

      if (leadingSpace) {
         this._reportSyntaxError(XmlErrorToken.ERROR.ELEMENT_LEADING_SPACE);
      }

      if (!name) {
         this._reportSyntaxError(XmlErrorToken.ERROR.ELEMENT_MISSING_NAME);
      } else if (!name.couldBeName) {
         this._reportSyntaxError(XmlErrorToken.ERROR.ELEMENT_BAD_NAME,
            'The element name does not match the syntax for names. Found: "' +
            name.text + '".');
      }

      if (!close) {
         this._reportSyntaxError(XmlErrorToken.ERROR.ELEMENT_MISSING_CLOSE);
      }

      const startType = isEmpty ? XmlToken.ELEMENT_EMPTY : XmlToken.ELEMENT_START;
      let xtoken;

      if (isStartOrEmpty) {
         xtoken = new StartTagToken(startType, name ? name.text : '', attributes, this._cursor.getRecentChunks());
      } else {
         xtoken = new TagToken(XmlToken.ELEMENT_END, name ? name.text : '', this._cursor.getRecentChunks());
      }

      if (isStartOrEmpty) {
         if (!isEmpty) {
            this._elementNameStack.push(xtoken.name);
         }
      } else {
         const lastElement = this._elementNameStack[this._elementNameStack.length - 1];

         if (lastElement === xtoken.name) {
            this._elementNameStack.pop();
         } else {
            this._reportSyntaxError(XmlErrorToken.ERROR.ELEMENT_UNBALANCED,
               'Element end tag does not match. Expected "' + lastElement + '" but found "' + xtoken.name + '".');

         }
      }
      this._pendingTokens.push(xtoken);
   }

   /*
    * Retrieve attributes either for a start/empty tag or for an XML
    * Declaration.
    * For an element start or empty tag:
    *   [41] Attribute ::= Name Eq AttValue
    *   [10] AttValue ::= '"' ([^<&"] | Reference)* '"' |
    *                     "'" ([^<&'] | Reference)* "'"
    *
    * While syntactically valid attributes are easy to parse, part of the goal
    * of this class is to try to cope reasonably with syntactically invalid
    * files so processing can continue. There are some cases where parsing
    * attributes that this gets ugly, and there are some cases where the
    * decision of what to do with the case is not "obvious".  These are the
    * general rules used:
    *    1) If a value's quote is missing, read the next space-terminated
    *       token (within the tag) as the value
    *            name=value
    *    2) If an equal is missing, if the following string starts with a
    *       quote, just read that as a value. Otherwise, consider this as
    *       a valueless attribute.
    *            name "value"
    *            name name
    *    3) If a quote is found within an attribute name, consider it part
    *       of a name that doesn't match the syntax for xml names.
    *            name"name"
    * In truly degenerate cases, of course, this will produce a messy set of
    * attributes. And it is still possible to have a mis-balanced quote on
    * an attribute and so consider a substantial chunk of the remainder of the
    * document part of the attribute. Ignoring that case, though, the damage
    * here should be confined cleanly to the set of attributes, with just
    * a variety of presumably invalid-name attributes.
    *
    * Put another way, when parsing attributes in lax mode, a name is any
    * sequence of characters terminated by space or equal, the equal may or
    * may not exist. If an attribute value doesn't start with a quote, then
    * the value is anything that is terminated by <, space, or the tag close,
    * otherwise the value terminates by <, the close quote, or tag close.
    *
    * Two final notes: We could legitimately consider the case of a missing
    * equal and quote  (the second case of 2, above) to produce a name and
    * value, rather than two names. This seemed an arbitrary decision, and
    * since HTML allows valueless attributes, that seemed a fine way to go.
    * We could also consider finding a quote within a name as the start of
    * the name's value. The main argument against this is just that a single
    * quote within a name would tend to risk reading in past the end of the
    * tag as part of the attribute. In terms of recovery from errors, it
    * seemed safer to be biased towards the case that would consume less
    * (all of these, after all, are syntax errors to start with).
    *
    * PARAM
    * elementAttribute: true if these are attributes for an element, and
    * false if for an XMLDecl.
    * RETURN
    * An array of attributes. Each element has a name (string), a value
    * (array of XMLTokens) and a quoteType, which is either " or ' The
    * latter is only useful for reproducing the original quote type.
    */
   _getAttributes(elementAttribute) {
      const attributes = [];
      let abort = false;
      let lastSpace = this._cursor.getSpace();
      let name = this._cursor.getWord(elementAttribute ? ATTRIBUTE_NAME_TERMINATORS : XMLDECL_NAME_TERMINATORS);

      while (name && !abort) {
         this._cursor.getSpace();    // optional
         const equal = this._cursor.getMatch('=');
         this._cursor.getSpace();    // optional
         const quote = this._cursor.peekChar();
         const gotQuote = quote && (quote.text === '"' || quote.text === '\'');
         let value = [];

         if (!lastSpace) {
            this._reportSyntaxError(XmlErrorToken.ERROR.NO_SPACE_BEFORE_ATTR);
         }

         if (!name.couldBeName && elementAttribute) {
            this._reportSyntaxError(XmlErrorToken.ERROR.ATTRIBUTE_BAD_NAME,
               'The attribute name does not match the syntax for names. Found: "' +
                  name.text + '".');
         }

         if (!equal) {
            this._reportSyntaxError(XmlErrorToken.ERROR.ATTRIBUTE_MISSING_EQUAL);
         }

         if (gotQuote) {
            this._cursor.getChar();     // consume the quote
            ({value, abort} = this._getQuotedAttributeValue(name, quote, elementAttribute));
         } else if (!equal) {
            this._reportSyntaxError(XmlErrorToken.ERROR.ATTRIBUTE_MISSING_VALUE);
            attributes.push(makePair(name, value, undefined, elementAttribute));

            name = this._cursor.getWord(elementAttribute ? ATTRIBUTE_NAME_TERMINATORS : XMLDECL_NAME_TERMINATORS);
            continue;   // without a quote, we assume there is no value and treat any following as a name
         } else {
            let terminators = elementAttribute ? ATTRIBUTE_VALUE_TERMINATORS : XMLDECL_VALUE_TERMINATORS;

            if (elementAttribute && this._options['lax:allowOpenAngleBracketsInAttributeValues']) {
               terminators = ATTRIBUTE_VALUE_TERMINATORS_LAX;
            }

            const word = this._cursor.getWord(terminators);
            if (word) {
               value.push(new XmlToken(XmlToken.TEXT, word.text));
            }
            const terminator = this._cursor.peekChar();

            if (value.length === 0) {
               this._reportSyntaxError(XmlErrorToken.ERROR.ATTRIBUTE_MISSING_VALUE);
            } else {
               this._reportSyntaxError(XmlErrorToken.ERROR.ATTRIBUTE_MISSING_QUOTE);

               if (terminator && terminator.text === '<') {
                  this._reportSyntaxError(XmlErrorToken.ERROR.ATTRIBUTE_BAD_VALUE,
                     'An "<" was found in the value for attribute "' + name.text + '".');
                  attributes.push(makePair(name, value, undefined, elementAttribute));
                  break;   // Stop processing of attributes
               }
            }
         }

         attributes.push(makePair(name, value, quote, elementAttribute));

         if (!abort) {
            lastSpace = this._cursor.getSpace();
            name = this._cursor.getWord(elementAttribute ? ATTRIBUTE_NAME_TERMINATORS : XMLDECL_NAME_TERMINATORS);
         }
      }

      return attributes;
   }

   /*
    * _getQuotedAttributeValue consumes the next data from the cursor
    * to extract the quoted value for an attribute.
    *
    * This assumes that the opening quote has already been consumed.
    *
    * PARAMS
    * nameChunk is the TextChunk containing the name of the attribute
    * quoteChunk is the TextChunk containing the quote that opened the value
    * elementAttribute is a boolean indicating whether this is an attribute
    *    for an element (true) or an XML Declaration (false).
    * RETURN
    * An object that contains the array of possibly zero XmlTokens found
    * to make up the attribute value, and a flag named abort. If abort is
    * true, it indicates that a "<" was found in the attribute value, and
    * not only attribute value gathering should stop, but the whole start
    * tag processing should stop.
    */
   _getQuotedAttributeValue(nameChunk, quoteChunk, elementAttribute) {
      const result = {
         value: [],
         abort: false
      };
      let done = false;
      const terminators = [ quoteChunk.text ];

      if (elementAttribute) {
         terminators.push('&');

         if (!this._options['lax:allowOpenAngleBracketsInAttributeValues']) {
            terminators.push('<');
         }
      }

      while (!done) {
         const chunkInfo = this._cursor.getToTerminator(terminators);
         if (chunkInfo.chunk) {
            result.value.push(new XmlToken(XmlToken.TEXT, chunkInfo.chunk.text));
         }
         done = true;

         switch (chunkInfo.terminator) {
            case quoteChunk.text:
               this._cursor.getChar(); // consume the quote
               break;
            case '&':
               done = false;
               this._cursor.getChar(); // consume the &
               const tokens = this._getReference(true);
               for (const index in tokens) {
                  result.value.push(tokens[index]);
               }
               break;
            case '<':
               this._reportSyntaxError(XmlErrorToken.ERROR.ATTRIBUTE_BAD_VALUE,
                  'An "<" was found in the value for attribute "' + nameChunk.text + '".');
               result.abort = true;
               break;
            default: // no terminator
               this._reportSyntaxError(XmlErrorToken.ERROR.ATTRIBUTE_MISSING_CLOSE_QUOTE);
               break;
         }
      }

      return result;
   }

   getNext() {
      if (this._pendingTokens.length > 0) {
         return this._pendingTokens.shift();
      }

      let token = this._nextToken();

      if (!token && this._cursorContexts.length > 0) {
         const context = this._cursorContexts.pop();
         this._cursor = context.cursor;
         token = context.token;
      }

      return token;
   }

   hasNext() {
      if (this._pendingTokens.length > 0) {
         return true;
      }

      const token = this._nextToken();

      if (token) {
         this._pendingTokens.push(token);
      }

      return this._pendingTokens.length > 0;
   }

   _reportSyntaxError(code, message) {
      if (typeof message !== 'string') {
         message = XmlErrorToken.STRING[code];
      }
      const error = new XmlErrorToken(XmlToken.SYNTAX_ERROR, code, message);
      if (this._options.lax) {
         this._pendingTokens.push(error);
         return;
      }

      const e = new Error(message);
      e.details = error;

      throw e;
   }

   _pushToken(type, data) {
      const xtoken = new XmlToken(type, data);
      xtoken.chunks = this._cursor.getRecentChunks();

      this._pendingTokens.push(xtoken);

      return xtoken;
   }

}

module.exports = XmlTokenStream;
