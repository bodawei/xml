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
const DocTypeToken = XmlToken.DocTypeToken;
const NotationToken = XmlToken.NotationToken;
const EntityToken = XmlToken.EntityToken;
const ParameterEntityToken = XmlToken.ParameterEntityToken;
const ElementDeclarationToken = XmlToken.ElementDeclarationToken;

const ERRORS = XmlErrorToken.ERROR;

const XMLDECL_NAME_TERMINATORS = [ '=', '?>' ];
const XMLDECL_VALUE_TERMINATORS = [ '?>' ];
const ATTRIBUTE_NAME_TERMINATORS = [ '=', '>', '/>' ];
const ATTRIBUTE_VALUE_TERMINATORS_LAX = [ '>', '/>' ];
const ATTRIBUTE_VALUE_TERMINATORS = [ '<', '>', '/>' ];

const PUBID_CHARS = /^[- \n\'\(\)\+,\.\/:=\?;!\*#@$_%a-zA-Z0-9]*/;

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
            this._reportSyntaxError(ERRORS.CHARDATA_BAD_DATA);

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
         this._reportSyntaxError(ERRORS.REFERENCE_ILLEGAL_SPACE);
      }

      if (next.text === '#') {
         this._cursor.getChar();
         const character = this._getCharReference();

         if (inAttribute) {
            return [ new XmlToken(XmlToken.CHAR_REF, character) ];
         } else {
            this._pushToken(XmlToken.CHAR_REF, character);
         }
      } else {
         const name = this._cursor.getWord([ ';' ]);
         const entityName = name ? name.text : '';
         const afterSpace = this._cursor.getSpace();
         const closingSemicolon = this._cursor.getMatch(';');
         let entityCursor;

         if (!entityName) {
            this._reportSyntaxError(ERRORS.REFERENCE_NO_NAME);
         } else {
            entityCursor = this._entityManager.getEntity(entityName);
         }

         if (afterSpace) {
            this._reportSyntaxError(ERRORS.REFERENCE_ILLEGAL_TRAILING_SPACE,
               'A space was found after the entity name "' + name.text + '".');
         }

         if (!closingSemicolon) {
            this._reportSyntaxError(ERRORS.REFERENCE_NO_SEMICOLON);
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
         this._reportSyntaxError(ERRORS.CHAR_REFERENCE_ILLEGAL_SPACE);
      }

      if (nextChar.text.toLocaleLowerCase() === 'x') {
         if (nextChar.text !== 'x') {
            this._reportSyntaxError(ERRORS.CHAR_REFERENCE_HEX_CASE_WRONG);
         }

         isHex = true;
         this._cursor.getChar();
      }

      const afterSpace = this._cursor.getSpace();
      const digits = this._cursor.getDigits();
      const afterDigitsSpace = this._cursor.getSpace();
      const semicolon = this._cursor.getMatch(';');

      if (afterSpace) {
         this._reportSyntaxError(ERRORS.CHAR_REFERENCE_SPACE_BEFORE_DIGITS);
      }

      if (!digits) {
         this._reportSyntaxError(ERRORS.CHAR_REFERENCE_NO_DIGITS);
      } else {
         if (!isHex && !digits.isDecimal) {
            this._reportSyntaxError(ERRORS.CHAR_REFERENCE_HEX_DIGITS_DECIMAL_REF);
            isHex = true;
         }

         character = String.fromCharCode(parseInt(digits.text, isHex ? 16 : 10));
      }

      if (afterDigitsSpace) {
         this._reportSyntaxError(ERRORS.CHAR_REFERENCE_SPACE_AFTER_DIGITS);
      }

      if (!semicolon) {
         this._reportSyntaxError(ERRORS.CHAR_REFERENCE_MISSING_SEMICOLON);
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
         this._reportSyntaxError(ERRORS.COMMENT_NO_CLOSE);
      } else {
         this._cursor.getMatch('-->');

         if (results.chunk && results.chunk.text[results.chunk.text.length - 1] === '-') {
            this._reportSyntaxError(ERRORS.COMMENT_ENDS_WITH_HYPHEN);
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
            this._reportSyntaxError(ERRORS.SPACE_BEFORE_SQUARE_BRACKET);
         }

         this._getBracketItem();
         return;
      }

      const declarationName = this._cursor.getWord([ '[', '>' ]); // could look for quotes, too
      const postDeclarationSpace = this._cursor.getSpace();

      if (leadingSpace) {
         this._reportSyntaxError(ERRORS.BANGITEM_EXTRA_LEADING_SPACE);
      }

      if (!declarationName) {
         this._reportSyntaxError(ERRORS.BANGITEM_NO_TYPE);
      } else {
         const type = declarationName.text;
         const upperCaseType = type.toLocaleUpperCase();

         if (type !== upperCaseType) {
            this._reportSyntaxError(ERRORS.BANGITEM_WRONG_CASE,
               'Expected to find "' + upperCaseType + '" but found "' + type + '".');
         }

         if (!postDeclarationSpace) {
            this._reportSyntaxError(ERRORS.DECLARATION_MISSING_SPACE_AFTER_NAME,
               'No space found after the declaration name "' + type + '".');
         }

         switch (upperCaseType) {
            // [28] doctypedecl ::= '<!DOCTYPE' S Name (S ExternalID)? S? ('[' intSubset ']' S?)? '>'

            case 'DOCTYPE':
               const docTypeName = this._cursor.getWord([ '[', '>' ]); // could look for quotes, too
               this._cursor.getSpace();
               const externalId = this._retrieveExternalId([ '[', '>' ], {
                  requireSystemOnPublic: true
               });

               if (!docTypeName) {
                  this._reportSyntaxError(ERRORS.DOCTYPE_NO_NAME);
               }

               if (docTypeName && !docTypeName.couldBeName) {
                  this._reportSyntaxError(ERRORS.DOCTYPE_TYPE_NAME_INVALID,
                     'The name of the DOCTYPE does not match the syntax for names. Found: "' +
                        docTypeName.text + '".');
               }

               // lame DTD parsing
               this._cursor.getSpace();
               this._cursor.getMatch('[');
               this._cursor.getSpace();
               this._cursor.getMatch(']');

               this._cursor.getSpace();
               const doctypeClosing = this._cursor.getMatch('>');

               if (!doctypeClosing) {
                  this._reportSyntaxError(ERRORS.DOCTYPE_MISSING_CLOSE_BRACKET);
               }

               const docToken = new DocTypeToken(docTypeName ? docTypeName.text : '',
                  externalId ? externalId.systemLiteral : undefined,
                  externalId ? externalId.pubidLiteral : undefined, []);
               this._pendingTokens.push(docToken);
               return;
            // [82] NotationDecl ::= '<!NOTATION' S Name S (ExternalID | PublicID) S? '>'
            case 'NOTATION':
               let notionName = this._cursor.getWord([ '>' ]); // could look for quotes, too
               const postNotationNameSpace = this._cursor.getSpace();
               const externalOrPublicId = this._retrieveExternalId([ '>' ]);

               if (!notionName) {
                  notionName = { text: '' };
                  this._reportSyntaxError(ERRORS.NOTATION_MISSING_NAME);
               }

               if (!postNotationNameSpace) {
                  this._reportSyntaxError(ERRORS.NOTATION_MISSING_SPACE_AFTER_NAME,
                     'No space found after the notation name "' + notionName.text + '".');
               }

               if (!externalOrPublicId) {
                  this._reportSyntaxError(ERRORS.NOTATION_MISSING_EXTERNALID,
                     'The ExternalID or PublicId for the notation "' + notionName.text +
                        '" declaration is missing.');
               }

               this._cursor.getSpace();
               const closing = this._cursor.getMatch('>');

               if (notionName && notionName.text !== '' && !notionName.couldBeName) {
                  this._reportSyntaxError(ERRORS.NOTATION_NAME_NAME_INVALID,
                     'The name of the NOTATION does not match the syntax for names. Found: "' +
                        notionName.text + '".');
               }

               if (!closing) {
                  this._reportSyntaxError(ERRORS.NOTATION_MISSING_CLOSE_BRACKET,
                     'The closing ">" for the notation "' + notionName.text + '" could not be found.');
               }

               const notationToken = new NotationToken(notionName.text,
                  externalOrPublicId ? externalOrPublicId.systemLiteral : undefined,
                  externalOrPublicId ? externalOrPublicId.pubidLiteral : undefined);
               this._pendingTokens.push(notationToken);
               return;
            // Consume an entity declaration.  Note, that we are biased here if we
            // find something unexpected (e.g. stuff after NDATA, or no ExternalId or EntityValue)
            // to assume that the > is missing and report that, than to try to consume the whole
            // rest of the document as junk content.
            //
            // [70] EntityDecl  ::= GEDecl | PEDecl
            // [71] GEDecl      ::= '<!ENTITY' S Name S EntityDef S? '>'
            // [72] PEDecl      ::= '<!ENTITY' S '%' S Name S PEDef S? '>'
            // [73] EntityDef   ::= EntityValue | (ExternalID NDataDecl?)
            // [74] PEDef       ::= EntityValue | ExternalID
            // [76] NDataDecl   ::= S 'NDATA' S Name
            //  [9] EntityValue ::= '"' ([^%&"] | PEReference | Reference)* '"' |
            //                      "'" ([^%&'] | PEReference | Reference)* "'"
            case 'ENTITY':
               let isParameter = false;
               let notationDataName;
               let entityName = this._cursor.getWord([ '>' ]);

               if (!entityName) {
                  entityName = { text: '' };
                  this._reportSyntaxError(ERRORS.ENTITY_NO_NAME);
               } else if (entityName.text === '%') {
                  isParameter = true;
                  this._cursor.getSpace(); // either have space or >. no need to error if space not here
                  entityName = this._cursor.getWord([ '>' ]);
               }

               const postEntityNameSpace = this._cursor.getSpace();
               const valueQuote = this._cursor.peekChar();
               let entityExternalId;
               let value;

               this._assertSyntax(postEntityNameSpace, ERRORS.ENTITY_NAME_NO_TRAILING_SPACE, [ entityName.text ]);

               if (valueQuote && (valueQuote.text === '"' || valueQuote.text === '\'')) {
                  this._cursor.getChar();     // consume the quote
                  value = this._getQuotedValue(valueQuote, { isEntityValue: true });
               } else {
                  entityExternalId = this._retrieveExternalId([ '>' ], { isEntity: true });
               }

               if (entityExternalId) {
                  const preNDataSpace = this._cursor.getSpace();
                  const ndataMarker = this._cursor.getWord([ '>' ]);

                  if (ndataMarker) {
                     if (ndataMarker.text.toLocaleUpperCase() !== 'NDATA') {
                        this._cursor.unget(ndataMarker);
                     } else {
                        this._cursor.getSpace(); // no need to check. either have space or no word next
                        const ndataName = this._cursor.getWord([ '>' ]);

                        this._assertSyntax(preNDataSpace, ERRORS.ENTITY_NDATA_NO_SPACE_BEFORE, [ entityName.text ]);
                        this._assertSyntax(ndataMarker.text === 'NDATA',
                           ERRORS.ENTITY_NDATA_WRONG_CASE, [ entityName.text, ndataMarker.text ]);

                        if (ndataName) {
                           notationDataName = ndataName.text;
                        } else {
                           this._reportSyntaxError(ERRORS.ENTITY_NDATA_NO_NAME, [ entityName.text ]);
                        }
                     }
                  }
               }

               this._cursor.getSpace();
               const entityClosing = this._cursor.getMatch('>');

               this._assertSyntax(value || entityExternalId, ERRORS.ENTITY_NO_VALUE, [ entityName.text ]);
               this._assertSyntax(entityName && (entityName.text === '' || entityName.couldBeName),
                  ERRORS.ENTITY_NAME_NAME_INVALID, [ entityName.text ]);
               this._assertSyntax(entityClosing, ERRORS.ENTITY_NO_CLOSE, [ entityName.text ]);

               const entityToken = isParameter ?
                  new ParameterEntityToken(entityName.text,
                     value,
                     entityExternalId.systemLiteral,
                     entityExternalId.pubidLiteral,
                     notationDataName) :
                  new EntityToken(entityName.text,
                     value,
                     entityExternalId ? entityExternalId.systemLiteral : undefined,
                     entityExternalId ? entityExternalId.pubidLiteral : undefined,
                     notationDataName);
               this._pendingTokens.push(entityToken);
               return;
            // [45] elementdecl ::= '<!ELEMENT' S Name S contentspec S? '>'
            // [46] contentspec ::= 'EMPTY' | 'ANY' | Mixed | children
            // [51] Mixed       ::= '(' S? '#PCDATA' (S? '|' S? Name)* S? ')*' |
            //                      '(' S? '#PCDATA' S? ')'
            case 'ELEMENT':
               let nameText;
               let contentText;
               let contentToken;
               let contentList;
               let listClose = true;
               let missingNames = 0;

               const elementName = this._cursor.getWord([ '>' ]);
               this._cursor.getSpace(); // no need to check this, as if no space, then no contentToken
               const mixedStart = this._cursor.peekChar();

               if (!mixedStart || mixedStart.text !== '(') {
                  contentToken = this._cursor.getWord([ '>' ]);
               } else {
                  let done = false;
                  contentList = [];

                  this._cursor.getChar();

                  while (!done) {
                     let gotOr = false;
                     this._cursor.getSpace();
                     const elemName = this._cursor.getWord([ '>', ')', '|' ]);
                     this._cursor.getSpace();
                     const orChar = this._cursor.peekChar();
                     if (orChar && orChar.text === '|') {
                        this._cursor.getChar();
                        gotOr = true;
                     }
                     this._cursor.getSpace();
                     listClose = this._cursor.getMatch(')');

                     if (elemName) {
                        contentList.push(elemName);
                     } else {
                        missingNames++;
                     }

                     if (listClose || !gotOr) {
                        done = true;
                     }
                  }
               }

               this._cursor.getSpace();
               const elementClose = this._cursor.getMatch('>');

               if (!elementName) {
                  nameText = '';
                  this._reportSyntaxError(ERRORS.ELEMENTDECL_NO_NAME);
               } else {
                  nameText = elementName.text;
               }

               this._assertSyntax(nameText === '' || elementName.couldBeName,
                  ERRORS.ELEMENTDECL_NAME_NAME_INVALID, [ nameText ]);

               if (!contentToken && !contentList) {
                  this._reportSyntaxError(ERRORS.ELEMENTDECL_NO_CONTENT_SPEC, [ nameText ]);
               } else if (contentList) {
                  contentText = [];

                  this._assertSyntax(missingNames === 0 || contentList.length === 0,
                     ERRORS.ELEMENTDECL_CONTENT_SPEC_NO_NAMES, [ missingNames, nameText ]);
                  this._assertSyntax(contentList.length > 0, ERRORS.ELEMENTDECL_NO_CONTENT_SPEC_ITEMS, [ nameText ]);

                  for (let index = 0; index < contentList.length; index++) {
                     const item = contentList[index];

                     if (item.text.toLocaleUpperCase() === '#PCDATA') {
                        this._assertSyntax(item.text === '#PCDATA',
                           ERRORS.ELEMENTDECL_CONTENT_SPEC_WRONG_CASE, [ '#PCDATA', item.text ]);
                        this._assertSyntax(index === 0, ERRORS.ELEMENTDECL_PCDATA_NOT_FIRST, [ nameText ]);

                        contentText.push('#PCDATA');
                     } else {
                        this._assertSyntax(item.couldBeName, ERRORS.ELEMENTDECL_CONTENT_SPEC_NAME_BAD, [ item.text ]);
                        contentText.push(item.text);
                     }
                  }
                  this._assertSyntax(listClose, ERRORS.ELEMENTDECL_NO_SPEC_CLOSE, [ nameText ]);
               } else {
                  contentText = contentToken.text;
                  const upperText = contentToken.text.toLocaleUpperCase();

                  this._assertSyntax(upperText === 'ANY' || upperText === 'EMPTY',
                     ERRORS.ELEMENTDECL_CONTENT_SPEC_UNKNOWN, [ contentText ]);
                  this._assertSyntax(upperText === contentText,
                     ERRORS.ELEMENTDECL_CONTENT_SPEC_WRONG_CASE, [ upperText, contentText ]);
                  contentText = upperText;
               }

               this._assertSyntax(elementClose, ERRORS.ELEMENTDECL_NO_CLOSE, [ nameText ]);

               this._pendingTokens.push(new ElementDeclarationToken(nameText, contentText));
               return;
         }
      }

      this._reportSyntaxError(ERRORS.BANGITEM_UNSUPPORTED);
   }

   _getBracketItem() {
      const preSpace = this._cursor.getSpace();
      const bracketItemType = this._cursor.getWord([ '[' ]);
      const postSpace = this._cursor.getSpace();
      const secondBracket = this._cursor.getMatch('[');

      if (!bracketItemType) {
         this._reportSyntaxError(ERRORS.BANGITEM_NO_NAME);
      }

      if (!secondBracket) {
         this._reportSyntaxError(ERRORS.BANGITEM_MISSING_SECOND_SQUARE);
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
            this._reportSyntaxError(ERRORS.CDATA_SPACE_BEFORE_NAME);
         }
         if (bracketItemType.text !== 'CDATA') {
            this._reportSyntaxError(ERRORS.CDATA_NOT_CAPITALIZED,
               '"CDATA" must be all capital. found "' + bracketItemType.text + '".');
         }
         if (postSpace) {
            this._reportSyntaxError(ERRORS.CDATA_SPACE_AFTER_NAME);
         }

         const results = this._cursor.getToTerminator([ ']]>' ]);

         if (!results.terminator) {
            this._reportSyntaxError(ERRORS.CDATA_MISSING_CLOSE);
         } else {
            this._cursor.getMatch(']]>');
         }

         this._pushToken(XmlToken.CDATA, results.chunk ? results.chunk.text : undefined);
      } else if (bracketItemType) {
         this._reportSyntaxError(ERRORS.BANGITEM_UNKNOWN_BRACKET_NAME,
            'Unknown Bang-bracket item. Found "' + bracketItemType.text + '".');
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
    Either an object containing a "systemLiteral" or a "systemLiteral" and a
    "publidLiteral" property, or undefined if neither SYSTEM nor PUBLIC could
    be found.
    Note that the system and pubid properties may be undefined if they
    were not specified, or may be empty strings if they were specified with
    empty strings.
   \**********************************************************************/

   _retrieveExternalId(terminators, options = {}) {
      const xIdTerminators = terminators.slice().concat([ '"', '\'' ]);
      const xIdType = this._cursor.getWord(xIdTerminators);

      if (!xIdType) {
         return;
      }

      const upperCaseXIdType = xIdType.text.toLocaleUpperCase();
      let publicText;

      if (upperCaseXIdType !== 'SYSTEM' && upperCaseXIdType !== 'PUBLIC') {
         this._cursor.unget(xIdType);
         this._reportSyntaxError(ERRORS.EXTERNALID_UNKNOWN_ID,
            'The ExternalID on a DOCTYPE had an unknown source type ("' + xIdType.text + '").');
         return;
      }

      if (upperCaseXIdType !== xIdType.text) {
         this._reportSyntaxError(ERRORS.DOCTYPE_PARAM_BAD_CASE,
            'The ' + upperCaseXIdType + ' label on a DOCTYPE was not all upper case ("' + xIdType.text + '").');
      }

      if (upperCaseXIdType === 'PUBLIC') {
         publicText = this._getQuotedLiteral(true, false, terminators, ERRORS.PUBIDLITERAL_MISSING,
            ERRORS.PUBLIC_NO_LEADING_SPACE,
            ERRORS.PUBIDLITERAL_NOQUOTE);

         const match = PUBID_CHARS.exec(publicText);

         if (publicText && (!match || match[0] !== publicText)) {
            this._reportSyntaxError(ERRORS.PUBIDLITERAL_BAD_CHARS,
               'The public id had "' + publicText[match[0].length] + '" which is not a legal character.');
         }
      }

      // both SYSTEM and PUBLIC need to consume the systemLiteral unless requireSystemIdOnPublic is false
      const systemText = this._getQuotedLiteral(options.requireSystemOnPublic, options.isEntity, terminators,
         ERRORS.SYSTEMLITERAL_MISSING,
         upperCaseXIdType === 'SYSTEM' ? ERRORS.SYSTEM_NO_LEADING_SPACE : ERRORS.PUBLIC_NO_SPACE,
         ERRORS.SYSTEMLITERAL_NOQUOTE);

      return (publicText === undefined && systemText === undefined) ?
         undefined : {
            pubidLiteral: publicText,
            systemLiteral: systemText
         };
   }

   /**********************************************************************\
    _getQuotedLiteral generically extracts either a PublicID value or a
    SystemLiteral value from the cursor.

    PARAM
    literalRequired: True if this must find a value (will report an error
      if not found)
    isEntity: true if this is for an entity.
    terminators: An array of values that may terminate this logical section
    literalMissing: Error code to report if the value is missing
    noBetweenSpace: Error code if there was no leading space
    noQuoteError: Error quote if a quote was not found.

    RETURN
    undefined, if no such value, or the string between the quotes.
   \**********************************************************************/

   _getQuotedLiteral(literalRequired, isEntity, terminators, literalMissing, noBetweenSpace, noQuoteError) {
      const betweenSpace = this._cursor.getSpace();
      const quote = this._cursor.peekChar(); // quote
      const isQuote = quote && (quote.text === '"' || quote.text === '\'');

      if (!betweenSpace) {
         if (literalRequired) {
            this._reportSyntaxError(noBetweenSpace);
         }
      }

      if (isQuote) {
         this._cursor.getMatch(quote.text);
         const literal = this._cursor.getToTerminator([ quote.text ]);
         this._cursor.getMatch(quote.text);
         return literal.chunk ? literal.chunk.text : '';
      }

      if (isEntity) {
         const possibleNData = this._cursor.getWord(terminators);
         if (possibleNData && possibleNData.text.toLocaleUpperCase() === 'NDATA') {
            this._cursor.unget(possibleNData);
            if (betweenSpace) {
               this._cursor.unget(betweenSpace);
            }
            return;
         }
      }

      let quoteIsTerminator = false;
      for (let index = 0; quote && index < terminators.length; index++) {
         if (terminators[index] === quote.text) {
            quoteIsTerminator = true;
         }
      }

      if (quoteIsTerminator) {
         if (literalRequired) {
            this._reportSyntaxError(literalMissing);
         }
      } else if (quote) {
         this._reportSyntaxError(noQuoteError);
         const literal = this._cursor.getWord([]);
         return literal.text;
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
      this._cursor.getMarkup();
      const space = this._cursor.getSpace();
      const target = this._cursor.getWord([ '?>' ]);

      this._assertSyntax(!space, ERRORS.PI_SPACE_BEFORE_TARGET);

      if (!target) {
         this._reportSyntaxError(ERRORS.PI_NO_TARGET);
      } else if (!target.couldBeName) {
         this._reportSyntaxError(ERRORS.PI_TARGET_NAME_INVALID, [ target.text ]);
      }

      if (target && target.text.toLocaleLowerCase() === 'xml') {
         this._assertSyntax(target.text === 'xml', ERRORS.XMLDECL_TARGET_WRONG_CASE, [ target.text ]);
         this._getXmlDecl();
      } else {
         this._cursor.getSpace();   // optional space
         const results = this._cursor.getToTerminator([ '?>' ]);

         // If we found no ?> (thus, really, end of file) report an error.
         if (!results.terminator) {
            this._reportSyntaxError(ERRORS.PI_NO_CLOSE);
         } else {
            this._cursor.getMatch('?>');
         }

         const targetName = target ? target.text : '';
         const content = results.chunk ? results.chunk.text : undefined;
         this._pendingTokens.push(new ProcessingInstructionToken(targetName, content, this._cursor.getRecentChunks()));
      }
   }

   /**********************************************************************\
    _getXmlDecl parses an XML Declaration which has the following format:

      [23] XMLDecl      ::= '<?xml' VersionInfo EncodingDecl? SDDecl? S? '?>'
      [24] VersionInfo  ::= S 'version' Eq ("'" VersionNum "'" |
                            '"' VersionNum '"')
      [25] Eq           ::= S? '=' S?
      [26] VersionNum   ::= '1.1' | '1.0'
      [27] Misc         ::= Comment | PI | S
      [80] EncodingDecl ::= S 'encoding' Eq ('"' EncName '"' |
                            "'" EncName "'" )
      [32] SDDecl       ::= S 'standalone' Eq (("'" ('yes' | 'no') "'") |
                            ('"' ('yes' | 'no') '"'))
      [81] EncName      ::= [A-Za-z] ([A-Za-z0-9._] | '-')*

    RETURN
    None. Adds an XMLDECL token, and possibly errors, to the queue.
   \**********************************************************************/
   _getXmlDecl() {
      const params = this._getAttributes(false);
      const close = this._cursor.getMatch('?>');
      let seenVersion = false;
      let seenStandalone = false;

      this._assertSyntax(close, ERRORS.XMLDECL_NO_CLOSE);
      this._assertSyntax(params.length !== 0, ERRORS.XMLDECL_NO_ATTRIBUTES);

      // check that the parameters are in the right order and have the right values
      for (let index = 0; index < params.length; index++) {
         const param = params[index];
         const lcName = param.name.toLocaleLowerCase();

         switch (lcName) {
            case 'version':
               seenVersion = true;
               this._assertSyntax(index === 0, ERRORS.XMLDECL_VERSION_WRONG_ORDER, [ index ]);
               this._assertSyntax(param.name === lcName, ERRORS.XMLDECL_ATTR_WRONG_CASE, [ lcName, param.name ]);
               this._assertSyntax(param.value === '1.1' || param.value === '1.0',
                  ERRORS.XMLDECL_VERSION_INVALD, [ param.value ]);
               break;
            case 'encoding':
               this._assertSyntax(seenVersion && !seenStandalone, ERRORS.XMLDECL_ENCODING_WRONG_ORDER);
               this._assertSyntax(param.name === lcName, ERRORS.XMLDECL_ATTR_WRONG_CASE, [ lcName, param.name ]);
               this._assertSyntax(param.value.match(/^[A-Za-z][-A-Za-z0-9._]*$/),
                  ERRORS.XMLDECL_ENCODING_INVALID, [ param.value ]);
               break;
            case 'standalone':
               const lcValue = param.value.toLocaleLowerCase();

               seenStandalone = true;

               this._assertSyntax(seenVersion, ERRORS.XMLDECL_STANDALONE_WRONG_ORDER);
               this._assertSyntax(param.name === lcName, ERRORS.XMLDECL_ATTR_WRONG_CASE, [ lcName, param.name ]);
               this._assertSyntax(param.value === lcValue,
                  ERRORS.XMLDECL_STANDALONE_WRONG_CASE, [ lcValue, param.value ]);

               if (lcValue !== 'no' && lcValue !== 'yes') {
                  this._reportSyntaxError(ERRORS.XMLDECL_STANDALONE_INVALID, [ param.value ]);
               } else {
                  param.value = lcValue;
               }
               break;
            default:
               this._reportSyntaxError(ERRORS.XMLDECL_ATTR_UNKNOWN, [ param.name ]);
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
               this._reportSyntaxError(ERRORS.ELEMENT_END_BAD_CLOSE);
            }
         }
      }

      if (leadingSpace) {
         this._reportSyntaxError(ERRORS.ELEMENT_LEADING_SPACE);
      }

      if (!name) {
         this._reportSyntaxError(ERRORS.ELEMENT_MISSING_NAME);
      } else if (!name.couldBeName) {
         this._reportSyntaxError(ERRORS.ELEMENT_BAD_NAME,
            'The element name does not match the syntax for names. Found: "' +
            name.text + '".');
      }

      if (!close) {
         this._reportSyntaxError(ERRORS.ELEMENT_MISSING_CLOSE);
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
            this._reportSyntaxError(ERRORS.ELEMENT_UNBALANCED,
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
            this._reportSyntaxError(ERRORS.ATTRIBUTE_NO_SPACE_BEFORE_NAME);
         }

         if (!name.couldBeName && elementAttribute) {
            this._reportSyntaxError(ERRORS.ATTRIBUTE_BAD_NAME,
               'The attribute name does not match the syntax for names. Found: "' +
                  name.text + '".');
         }

         if (!equal) {
            this._reportSyntaxError(ERRORS.ATTRIBUTE_MISSING_EQUAL);
         }

         if (gotQuote) {
            this._cursor.getChar();     // consume the quote
            ({value, abort} = this._getQuotedValue(quote, {
               attributeName: name.text,
               isElementAttribute: elementAttribute
            }));
         } else if (!equal) {
            this._reportSyntaxError(ERRORS.ATTRIBUTE_MISSING_VALUE);
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
               this._reportSyntaxError(ERRORS.ATTRIBUTE_MISSING_VALUE);
            } else {
               this._reportSyntaxError(ERRORS.ATTRIBUTE_MISSING_QUOTE);

               if (terminator && terminator.text === '<') {
                  this._reportSyntaxError(ERRORS.ATTRIBUTE_BAD_VALUE,
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
   _getQuotedValue(quoteChunk, options) {
      const result = {
         value: [],
         abort: false
      };
      let done = false;
      const terminators = [ quoteChunk.text ];

      if (options.isElementAttribute) {
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
               this._reportSyntaxError(ERRORS.ATTRIBUTE_BAD_VALUE,
                  'An "<" was found in the value for attribute "' + options.attributeName + '".');
               result.abort = true;
               break;
            default: // no terminator
               this._reportSyntaxError(ERRORS.ATTRIBUTE_MISSING_CLOSE_QUOTE);
               break;
         }
      }

      return options.isEntityValue ? result.value : result;
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

   _assertSyntax(condition, code, message) {
      if (!condition) {
         this._reportSyntaxError(code, message);
      }
   }

   _reportSyntaxError(code, message) {
      if (typeof message !== 'string') {
         const params = message;
         message = XmlErrorToken.STRING[code];

         if (typeof params === 'object') {
            for (let index = 0; index < params.length; index++) {
               message = message.replace('{' + index + '}', params[index]);
            }
         }
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
