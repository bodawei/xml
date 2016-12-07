/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

const EntityLocation = require('./shared/EntityLocation.js');
const EntityMetaData = require('./shared/EntityMetaData.js');
const SyntaxError = require('./error/SyntaxError.js');
const TextChunk = require('./shared/TextChunk.js');
const XmlStream = require('./XmlStream.js');
const tokens = require('./XmlToken.js');
const XmlTokenStreamDtd = require('./XmltokenStream-dtd.js');
const XmlTokenStreamMisc = require('./XmltokenStream-misc.js');

const SEID = SyntaxError.ID;

const XMLDECL_NAME_TERMINATORS = [ '=', '?>' ];
const XMLDECL_VALUE_TERMINATORS = [ '?>' ];
const ATTRIBUTE_NAME_TERMINATORS = [ '=', '>', '/>' ];
const ATTRIBUTE_VALUE_TERMINATORS_LAX = [ '>', '/>' ];
const ATTRIBUTE_VALUE_TERMINATORS = [ '<', '>', '/>' ];

const PUBID_CHARS = /^[- \n\'\(\)\+,\.\/:=\?;!\*#@$_%a-zA-Z0-9]*/;

const ATTR_TYPE_NAMES = [ 'CDATA', 'ID', 'IDREF', 'IDREFS', 'ENTITY', 'ENTITIES', 'NMTOKEN', 'NMTOKENS', 'NOTATION',
   'ENUMERATION' ];
const ATTR_DEFAULT_NAMES = [ '#REQUIRED', '#IMPLIED', '#FIXED' ];

const STATE = {
   START: 'START',
   PROLOG_PREDOCTYPE: 'PROLOG_PREDOCTYPE',
   PROLOG: 'PROLOG',
   IN_CONTENT: 'IN_CONTENT',
   IN_DTD: 'IN_DTD',
   AFTER_CONTENT: 'AFTER_CONTENT'
};

const XML_DECL_PARAMS = {
   version: 'version',
   encoding: 'encoding',
   standalone: 'standalone'
};

function makePair(nameChunk, valueChunk, quoteToken, elementAttribute) {
   let value = valueChunk;

   if (!elementAttribute) {
      value = valueChunk.length !== 0 ? valueChunk[0].text : undefined;
   }

   return {
      name: nameChunk.text,
      value: value,
      quoteType: quoteToken ? quoteToken.text : undefined
   };
}

// See §3.3.3 Attribute-Value Normalization
function doCDataNormalization(valueArray) {
   for (let index = 0; index < valueArray.length; index++) {
      const item = valueArray[index];
      if (item instanceof tokens.Text) {
         item.text = item.text.replace(/[\n\r\t]/g, ' ');
      }
   }
}

function locFromExternalId(externalId) {
   if (!externalId) {
      return;
   }

   const systemId = externalId.systemId ? externalId.systemId.literalChunk.text : undefined;
   const publicId = externalId.publicId ? externalId.publicId.literalChunk.text : undefined;
   return new EntityLocation(systemId, publicId);
}

function textOrBlank(chunk) {
   return chunk ? chunk.text : '';
}

function textOrUndef(chunk) {
   return chunk ? chunk.text : undefined;
}

/**********************************************************************\
 A note about document versions.
 An XML entity defaults to version 1.0 unless a version is explicitly
 stated in the XML Declaration or the Text Declaration (1.1 line
 endings are not allowed within those, even in a 1.1 entity. Basically,
 the declarations are always 1.0 format). Ordinarily, this will use
 that version to parse the entity.

 Relatedly, this stream relies on the EntityMetaData found in the
 cursor to determine what version (and revision) and type of entity
 this is parsing. This will modify that info only based on the version
 found in the Declaration.

 OPTIONS
 ignoreDocumentVersion: In the exceedingly rare case that you want to
 override the version in the document, specify the version you want to
 use when creating the cursor that will be passed to this, and make
 sure to set this flag. In that case, the version specified in the
 cursor will be used in preferene to what is in the document.

 ignoreDocumentEncoding: In the case that you do not want to let the
 encoding specified in the document text (in the XML or Text
 Declaration) influence the cursor's handling of that data, set this
 flag to true.  Note that if you pass an encoding option to a cursor,
 that is at cursor creation time specify the encoding of the data,
 that will take precedence over what this stream tells the cursor.
\**********************************************************************/
class XmlTokenStream extends XmlStream {

   constructor(cursor, entityManager, options) {
      super();
      if (!entityManager) {
         throw Error('Must provide an XmlEntityManager instance.');
      }

      this._cursor = cursor;
      this._pendingTokens = [];
      this._elementNameStack = [];
      this._entityManager = entityManager;
      this._envelopers = [];
      this._dtdParser = new XmlTokenStreamDtd();
      this._miscParser = new XmlTokenStreamMisc();
      this._state = STATE.START;

      this._options = {
         lax: false,
         'lax:allowOpenAngleBracketsInAttributeValues': false,
         ignoreDocumentVersion: false,
         ignoreDocumentEncoding: false
      };

      for (const name in options) {
         if (this._options[name] === undefined) {
            throw new Error('"' + name + '" is not a supported option name.');
         }
         this._options[name] = options[name];
      }

      this._entityMd = this._cursor.entityMd;
   }

   _innerGetNext() {
      let token;

      if (this._pendingTokens.length > 0) {
         token = this._pendingTokens.shift();

         return token;
      }

      this._nextToken();

      token = this._pendingTokens.shift();

      if (!token) {
         this._setEnded();
      }

      return token;
   }

   _pushToken(token) {
      this._pendingTokens.push(token);
      this._getting = false;
      this._tokenLoop();
   }

   _noEnvelopers() {
      return this._envelopers.length === 0;
   }

   _pushEnveloper(close, token) {
      this._envelopers.push({
         close: close,
         token: token
      });
   }

   _peekEnveloper() {
      return this._envelopers[this._envelopers.length - 1];
   }

   _popEnveloper() {
      return this._envelopers.pop();
   }

   _nextToken() {
      if (this._getting) {
         return;
      }
      this._getting = true;

      this._innerNext();
   }

   // This is separate from _nextToken to support a pseudo-async test case until we get full async capabilities in
   _innerNext() {
      let type;
      let finished = false;

      while (!finished) {
         type = this._cursor.peekType();

         switch (type) {
            case TextChunk.TYPE.MARKUP:
               const markupToken = this._cursor.getMarkup();

               switch (markupToken.text) {
                  case '&':
                     this._getReference(markupToken);
                     break;
                  case '<':
                     this._getTag(markupToken, true);
                     break;
                  case '</':
                     this._getTag(markupToken, false);
                     break;
                  case '<?':
                     this._getProcessingInstruction(markupToken);
                     break;
                  case '<!':
                     this._getBangItem(markupToken);
                     break;
                  case '<!--':
                     this._getComment(markupToken);
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
            case TextChunk.TYPE.CLOSE:
               const pendingClose = this._peekEnveloper();
               let close;

               if (pendingClose) {
                  close = this._cursor.getClose();

                  if (close.text !== pendingClose.close) {
                     this._cursor.unget(close);
                     close = undefined;
                  } else {
                     this._closeDocType();
                     this._popEnveloper();
                  }
               }

               if (!close) {
                  this._getContent();
               }
               break;
            case TextChunk.TYPE.STRING:
               this._getContent();
               break;
         }

         finished = this._noEnvelopers();
      }
   }

   _getS() {
      const space = this._cursor.getSpace();

      if (this._entityMd.isTypeDocument) {
         this._assert(this._state !== STATE.START, SEID.SPACE_INVALID_CONTEXT, space.startOffset, space);
      }

      this._pushToken(new tokens.Space(space.text, this._cursor.getRecentChunks()));
   }

   /*
    *   [14] CharData ::= [^<&]* - ([^<&]* ']]>' [^<&]*)
    */
   _getContent() {
      let content;

      do {
         content = this._cursor.getToTerminator([ '<', '&', ']]>' ]);

         if (content.terminator === ']]>') {
            this._report(SEID.CHARDATA_INVALID_TEXT);

            if (content.chunk) {
               this._checkContentState(content.chunk,
                  SEID.CHARDATA_INVALID_DOC_CONTEXT, SEID.CHARDATA_INVALID_SUBSET_CONTEXT);
               this._pushToken(new tokens.CharData(content.chunk.text, this._cursor.getRecentChunks()));
            }

            content = {
               chunk: this._cursor.getMatch(']]>')
            };

         } else if (!content.chunk || content.chunk.text === '') {
            return;
         }

         this._checkContentState(content.chunk,
            SEID.CHARDATA_INVALID_DOC_CONTEXT, SEID.CHARDATA_INVALID_SUBSET_CONTEXT);
         this._pushToken(new tokens.CharData(content.chunk.text, this._cursor.getRecentChunks()));
      } while (content.terminator && content.terminator !== '<');
   }

   _getReference(start, inAttribute) {
      const space = this._cursor.getSpace();
      const next = this._cursor.peekChar();

      this._assert(!space, SEID.REFERENCE_XTRA_SPACE);

      if (next.text === '#') {
         this._cursor.getChar();
         const character = this._getCharReference();

         if (inAttribute) {
            return [ new tokens.CharRef(character, tokens.ATTR_NO_CHUNKS) ];
         } else {
            this._checkContentState(start, SEID.CHARREF_INVALID_DOC_CONTEXT, SEID.CHARREF_INVALID_SUBSET_CONTEXT);
            this._pushToken(new tokens.CharRef(character, this._cursor.getRecentChunks()));
         }
      } else {
         const name = this._cursor.getWord([ ';' ]);
         const entityName = name ? name.text : '';
         const afterSpace = this._cursor.getSpace();
         const closingSemicolon = this._cursor.getMatch(';');

         if (!entityName) {
            this._report(SEID.REFERENCE_NO_NAME);
         }

         this._assert(!afterSpace, SEID.REFERENCE_XTRA_TRAILING_SPACE, [ entityName ]);
         this._assert(closingSemicolon, SEID.REFERENCE_NO_SEMICOLON, [ entityName ]);

         if (inAttribute) {
            return [ new tokens.EntityStart(entityName, false, tokens.ATTR_NO_CHUNKS),
               new tokens.EntityEnd(entityName, tokens.ATTR_NO_CHUNKS) ];
         } else {
            const startToken = new tokens.EntityStart(entityName, false, this._cursor.getRecentChunks());

            this._checkContentState(start,
               SEID.REFERENCE_INVALID_DOC_CONTEXT, SEID.REFERENCE_INVALID_SUBSET_CONTEXT);

            this._pushToken(startToken);
            this._pushToken(new tokens.EntityEnd(entityName, this._cursor.getRecentChunks()));
         }
      }
   }

   _getCharReference() {
      let isHex = false;
      let character;
      const space = this._cursor.getSpace();
      const nextChar = this._cursor.peekChar();

      this._assert(!space, SEID.CHARREF_XTRA_SPACE);

      if (nextChar.text.toLocaleLowerCase() === 'x') {
         this._assert(nextChar.text === 'x', SEID.CHARREF_INVALID_HEX_CASE);

         isHex = true;
         this._cursor.getChar();
      }

      const afterSpace = this._cursor.getSpace();
      const digits = this._cursor.getDigits();
      const afterDigitsSpace = this._cursor.getSpace();
      const semicolon = this._cursor.getMatch(';');

      this._assert(!afterSpace, SEID.CHARREF_XTRA_SPACE_BEFORE_DIGITS);

      if (!digits) {
         this._report(SEID.CHARREF_NO_DIGITS);
      } else {
         if (!isHex && !digits.isDecimal) {
            this._report(SEID.CHARREF_INVALID_BASE, [ digits.text ]);
            isHex = true;
         }

         character = String.fromCharCode(parseInt(digits.text, isHex ? 16 : 10));
      }

      this._assert(!afterDigitsSpace, SEID.CHARREF_XTRA_SPACE_AFTER_DIGITS);
      this._assert(semicolon, SEID.CHARREF_NO_SEMICOLON);

      return character;
   }

   /*
    * Parse any comment
    *   [15] Comment ::= '<!--' ((Char - '-') | ('-' (Char - '-')))* '-->'
    * PARAMS: The first token (currently not used)
    */
   _getComment(start) {
      const parsedComment = this._miscParser.parseComment(this._cursor, start);

      if (!parsedComment.closeChunk) {
         this._report(SEID.COMMENT_NO_CLOSE, parsedComment.commentChunk || start, start);
      } else if (parsedComment.commentString &&
         parsedComment.commentString[parsedComment.commentString.length - 1] === '-') {
         const place = parsedComment.commentChunk.endOffset.clone();
         place.index --;
         place.column --;
         this._report(SEID.COMMENT_ENDS_WITH_HYPHEN, place, start);
      }

      this._checkPiAndCommentState(start, SEID.COMMENT_INVALID_CONTEXT);
      this._pushToken(new tokens.Comment(parsedComment.commentString || '',
         this._cursor.getRecentChunks()));
   }

   _getBangItem(start) {
      this._cursor.getMarkup();
      const leadingSpace = this._cursor.getSpace();
      const bracket = this._cursor.getMatch('[');

      if (bracket) {
         this._assert(!leadingSpace, SEID.BRACKETITEM_XTRA_SPACE_BEFORE);

         this._getBracketItem(start);
         return;
      }

      const declarationName = this._cursor.getWord([ '[', '>' ]); // could look for quotes, too
      const postDeclarationSpace = this._cursor.getSpace();

      this._assert(!leadingSpace, SEID.BANGITEM_NAME_XTRA_SPACE_BEFORE);

      if (!declarationName) {
         this._report(SEID.BANGITEM_NO_NAME);
      } else {
         const type = declarationName.text;
         const upperCaseType = type.toLocaleUpperCase();

         this._assert(type === upperCaseType, SEID.BANGITEM_NAME_INVALID_CASE, [ upperCaseType, type ]);
         this._assert(postDeclarationSpace, SEID.BANGITEM_NAME_XTRA_SPACE_AFTER, [ type ]);

         switch (upperCaseType) {
            case 'DOCTYPE':
               const parsedDocType = this._dtdParser.parseDocTypeStart(this._cursor, start, declarationName);

               this._validateStartDocType(parsedDocType);

               const docToken = new tokens.DocTypeStart(textOrBlank(parsedDocType.nameChunk),
                  locFromExternalId(parsedDocType.externalId), this._cursor.getRecentChunks());
               this._pushToken(docToken);

               if (parsedDocType.startInternalSubsetChunk) {
                  this._pushEnveloper(']', docToken);
                  this._state = STATE.IN_DTD;
               } else {
                  this._closeDocType();
               }
               return;
            case 'NOTATION':
               const parsedNotation = this._dtdParser.parseNotation(this._cursor, start, declarationName);

               this._validateNotation(parsedNotation);

               this._pushToken(new tokens.NotationDeclaration(textOrBlank(parsedNotation.nameChunk),
                  locFromExternalId(parsedNotation.externalId), this._cursor.getRecentChunks()));
               return;
            case 'ENTITY':
               const parsedEntity = this._dtdParser.parseEntity(this._cursor, start, declarationName);

               this._validateEntity(parsedEntity);

               const entityClass = parsedEntity.isParameter ? tokens.PEntityDeclaration : tokens.EntityDeclaration;

               this._pushToken(new entityClass(textOrBlank(parsedEntity.nameChunk),
                  parsedEntity.valueChunk,
                  locFromExternalId(parsedEntity.externalId),
                  textOrUndef(parsedEntity.nDataName), this._cursor.getRecentChunks()));
               return;
            case 'ELEMENT':

               const parsedEl = this._dtdParser.parseElement(this._cursor);

               const contentText = this._validateElementDeclaration(parsedEl, start);

               this._pushToken(new tokens.ElementDeclaration(textOrBlank(parsedEl.elementName), contentText,
                  this._cursor.getRecentChunks()));
               return;
            case 'ATTLIST':
               const parseResults = this._dtdParser.parseAttList(this._cursor, this._options);

               const attributes = this._validatAttList(parseResults, start);

               this._pushToken(new tokens.AttrListDeclaration(textOrBlank(parseResults.elementNameChunk), attributes,
                  this._cursor.getRecentChunks()));
               return;
         }
      }

      this._report(SEID.BANGITEM_UNKNOWN);
   }

   _closeDocType() {
      const parseResults = this._dtdParser.parseDocTypeClose(this._cursor);

      this._validateCloseDocType(parseResults);

      if (this._state === STATE.PROLOG_PREDOCTYPE || this._state === STATE.IN_DTD) {
         this._state = STATE.PROLOG;
      }
      this._pushToken(new tokens.DocTypeEnd(this._cursor.getRecentChunks()));
   }

   _getBracketItem(start) {
      const preSpace = this._cursor.getSpace();
      const bracketItemType = this._cursor.getWord([ '[' ]);
      const postSpace = this._cursor.getSpace();
      const secondBracket = this._cursor.getMatch('[');

      this._assert(bracketItemType, SEID.BRACKETITEM_NO_NAME);
      this._assert(secondBracket, SEID.BRACKETITEM_NO_SECOND_BRACKET);

      /*
       * Retrieve a CData section
       *   [18] CDSect  ::=  CDStart CData CDEnd
       *   [19] CDStart ::=  '<![CDATA['
       *   [20] CData   ::=  (Char* - (Char* ']]>' Char*))
       *   [21] CDEnd   ::=  ']]>'
       */
      if (bracketItemType && bracketItemType.text.toLocaleLowerCase() === 'cdata') {
         this._assert(!preSpace, SEID.CDATA_XTRA_SPACE_BEFORE);
         this._assert(bracketItemType.text === 'CDATA', SEID.CDATA_INVALID_CASE, [ bracketItemType.text ]);
         this._assert(!postSpace, SEID.CDATA_XTRA_SPACE_AFTER);

         const results = this._cursor.getToTerminator([ ']]>' ]);

         if (!results.terminator) {
            this._report(SEID.CDATA_NO_CLOSE);
         } else {
            this._cursor.getMatch(']]>');
         }

         this._checkContentState(start, SEID.CDATA_INVALID_DOC_CONTEXT, SEID.CDATA_INVALID_SUBSET_CONTEXT);

         this._pushToken(new tokens.CData(results.chunk ? results.chunk.text : undefined,
            this._cursor.getRecentChunks()));
      } else if (bracketItemType) {
         this._report(SEID.BRACKETITEM_UNKNOWN, [ bracketItemType.text ]);
      }
   }

   _getProcessingInstruction(start) {
      const parsedPI = this._miscParser.parseProcessingInstruction(this._cursor, start);

      this._validateProcessingInstruction(parsedPI, start);

      if (parsedPI.isXmlDecl) {
         this._getXmlDecl(start);
      } else {
         this._pushToken(new tokens.ProcessingInstruction(textOrBlank(parsedPI.targetChunk),
            textOrBlank(parsedPI.instructionChunk), this._cursor.getRecentChunks()));
      }
   }

   _checkPiAndCommentState(start, error) {
      if (this._state === STATE.START) {
         switch (this._entityMd.type) {
            case EntityMetaData.TYPE.DOCUMENT:
               this._report(error, start.startOffset, start);
               break;
            case EntityMetaData.TYPE.EXTERNAL:
               this._state = STATE.IN_CONTENT;
               break;
            case EntityMetaData.TYPE.EXTERNALSUBSET:
               this._state = STATE.IN_DTD;
               break;
         }
      }
   }

   _checkDeclarationState(start, error) {
      if (this._entityMd.isTypeExternalSubset && this._state === STATE.START) {
         this._state = STATE.IN_DTD;
      }
      this._assert(this._state === STATE.IN_DTD, error, start.startOffset, start);
   }

   _checkContentState(chunk, docError, subsetError) {
      switch (this._entityMd.type) {
         case EntityMetaData.TYPE.DOCUMENT:
            this._assert(this._state === STATE.IN_CONTENT, docError,
               [ chunk.text ], chunk.startOffset, chunk);
            break;
         case EntityMetaData.TYPE.EXTERNAL:
            if (this._state === STATE.START) {
               this._state = STATE.IN_CONTENT;
            }
            break;
         case EntityMetaData.TYPE.EXTERNALSUBSET:
            this._report(subsetError, [ chunk.text ], chunk.startOffset, chunk);
            break;
      }
   }

   /**********************************************************************\
    _getXmlDecl parses an XML Declaration which has the following format:

      [23] XMLDecl      ::= '<?xml' VersionInfo EncodingDecl? SDDecl? S? '?>'
      [77] TextDecl     ::= '<?xml' VersionInfo? EncodingDecl S? '?>'
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
   _getXmlDecl(start) {
      const params = this._getAttributes(false);
      const close = this._cursor.getMatch('?>');
      const isXmlDecl = this._entityMd.isTypeDocument;
      let foundVersion;
      let foundEncoding;
      let seenStandalone = false;

      this._assert(close, SEID.XMLDECL_NO_CLOSE);
      this._assert(params.length !== 0, SEID.XMLDECL_NO_ATTRIBUTES,
         [ isXmlDecl ? SEID.NOUN_XMLDECL : SEID.NOUN_TEXTDECL ]);

      // check that the parameters are in the right order and have the right values
      for (let index = 0; index < params.length; index++) {
         const param = params[index];
         const lcName = param.name.toLocaleLowerCase();

         if (XML_DECL_PARAMS[lcName]) {
            this._assert(param.name === lcName, SEID.XMLDECL_ATTR_INVALID_CASE, [ lcName, param.name ]);
         }

         switch (lcName) {
            case 'version':
               this._assert(index === 0, SEID.XMLDECL_VERSION_INVALID_ORDER, [ index ]);
               this._assert(param.value === '1.1' || param.value === '1.0',
                  SEID.XMLDECL_VERSION_INVALD, [ param.value ]);
               foundVersion = param.value;
               break;
            case 'encoding':
               foundEncoding = param.value;
               if (isXmlDecl) {
                  this._assert(foundVersion && !seenStandalone, SEID.XMLDECL_ENCODING_INVALID_ORDER);
               }
               this._assert(param.value.match(/^[A-Za-z][-A-Za-z0-9._]*$/),
                  SEID.XMLDECL_ENCODING_INVALID, [ param.value ]);
               break;
            case 'standalone':
               if (!isXmlDecl) {
                  this._report(SEID.TEXTDECL_XTRA_STANDALONE);
               }

               const lcValue = param.value.toLocaleLowerCase();

               seenStandalone = true;

               this._assert(foundVersion, SEID.XMLDECL_STANDALONE_INVALID_ORDER);
               this._assert(param.value === lcValue,
                  SEID.XMLDECL_STANDALONE_INVALID_CASE, [ lcValue, param.value ]);

               if (lcValue !== 'no' && lcValue !== 'yes') {
                  this._report(SEID.XMLDECL_STANDALONE_INVALID, [ param.value ]);
               } else {
                  param.value = lcValue;
               }
               break;
            default:
               this._report(SEID.XMLDECL_ATTR_UNKNOWN, [ param.name ]);
         }
      }

      if (!isXmlDecl) {
         this._assert(foundEncoding, SEID.TEXTDECL_NO_ENCODING, start.startOffset, start);
      }

      if (this._state === STATE.START) {
         switch (this._entityMd.type) {
            case EntityMetaData.TYPE.DOCUMENT:
               this._state = STATE.PROLOG_PREDOCTYPE;
               break;
            case EntityMetaData.TYPE.EXTERNAL:
               this._state = STATE.IN_CONTENT;
               break;
            case EntityMetaData.TYPE.EXTERNALSUBSET:
               this._state = STATE.IN_DTD;
               break;
         }
      } else {
         this._report(SEID.XMLDECL_INVALID_CONTEXT);
      }

      if (!this._options.ignoreDocumentVersion) {
         if (foundVersion === '1.0') {
            this._entityMd.version = 1.0;
         } else if (foundVersion === '1.1') {
            this._entityMd.version = 1.1;
         }
      }

      if (!this._options.ignoreDocumentEncoding) {
         this._cursor.specifiedEncoding = foundEncoding;
      }

      this._pushToken(isXmlDecl ?
         new tokens.XmlDeclaration(params, this._cursor.getRecentChunks()) :
         new tokens.TextDeclaration(params, this._cursor.getRecentChunks()));
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
   _getTag(start, isStartOrEmpty) {
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
               this._report(SEID.ELEMENT_END_INVALID_CLOSE);
            }
         }
      }

      this._assert(!leadingSpace, SEID.ELEMENT_XTRA_LEADING_SPACE);

      if (!name) {
         this._report(SEID.ELEMENT_NO_NAME);
      } else if (!name.couldBeName) {
         this._report(SEID.ELEMENT_NAME_INVALID, [ name.text ]);
      }

      if (!close) {
         this._report(SEID.ELEMENT_NO_CLOSE);
      }

      let xtoken;

      if (isStartOrEmpty) {
         if (isEmpty) {
            xtoken = new tokens.EmptyElement(name ? name.text : '', attributes, this._cursor.getRecentChunks());
         } else {
            xtoken = new tokens.ElementStart(name ? name.text : '', attributes, this._cursor.getRecentChunks());
         }
      } else {
         xtoken = new tokens.ElementEnd(name ? name.text : '', this._cursor.getRecentChunks());
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
            this._report(SEID.ELEMENT_UNBALANCED, [ lastElement, xtoken.name ]);
         }
      }

      const nameText = name ? name.text : '';
      switch (this._entityMd.type) {
         case EntityMetaData.TYPE.DOCUMENT:
            if (this._state === STATE.PROLOG_PREDOCTYPE || this._state === STATE.PROLOG) {
               this._state = STATE.IN_CONTENT;
            } else if (this._state === STATE.IN_DTD) {
               this._report(SEID.ELEMENT_INVALID_DTD_CONTEXT, [ nameText ], start.startOffset, start);
            } else if (this._state !== STATE.IN_CONTENT) {
               this._report(SEID.ELEMENT_INVALID_DOC_CONTEXT, [ nameText ], start.startOffset, start);
            }
            break;
         case EntityMetaData.TYPE.EXTERNAL:
            if (this._state === STATE.START) {
               this._state = STATE.IN_CONTENT;
            }
            this._assert(this._state === STATE.IN_CONTENT,
               SEID.ELEMENT_INVALID_CONTEXT, [ nameText ], start.startOffset, start);
            break;
         case EntityMetaData.TYPE.EXTERNALSUBSET:
            this._report(SEID.ELEMENT_INVALID_DTD_CONTEXT, [ nameText ], start.startOffset, start);
            break;
      }

      this._pushToken(xtoken);
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

         this._assert(lastSpace, SEID.ATTRIBUTE_NO_SPACE_BEFORE_NAME, [ name.text ], name.startOffset);
         this._assert(name.couldBeName || !elementAttribute, SEID.ATTRIBUTE_INVALID_NAME, [ name.text ]);
         this._assert(equal, SEID.ATTRIBUTE_NO_EQUAL, [ name.text ]);

         if (gotQuote) {
            this._cursor.getChar();     // consume the quote
            ({value, abort} = this._getQuotedValue(quote, {
               attributeName: name.text,
               isElementAttribute: elementAttribute
            }));
         } else if (!equal) {
            this._report(SEID.ATTRIBUTE_NO_VALUE, [ name.text ]);
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
               value.push(new tokens.Text(word.text, tokens.ATTR_NO_CHUNKS));
            }
            const terminator = this._cursor.peekChar();

            if (value.length === 0) {
               this._report(SEID.ATTRIBUTE_NO_VALUE, [ name.text ]);
            } else {
               this._report(SEID.ATTRIBUTE_NO_QUOTE, [ name.text ]);

               if (terminator && terminator.text === '<') {
                  this._report(SEID.ATTRIBUTE_INVALID_VALUE, [ name.text ]);
                  attributes.push(makePair(name, value, undefined, elementAttribute));
                  break;   // Stop processing of attributes
               }
            }
         }

         if (elementAttribute) {
            doCDataNormalization(value);
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
            result.value.push(new tokens.Text(chunkInfo.chunk.text, tokens.ATTR_NO_CHUNKS));
         }
         done = true;

         switch (chunkInfo.terminator) {
            case quoteChunk.text:
               this._cursor.getChar(); // consume the quote
               break;
            case '&':
               done = false;
               const start = this._cursor.getChar(); // consume the &
               const tokens = this._getReference(start, true);
               for (const index in tokens) {
                  result.value.push(tokens[index]);
               }
               break;
            case '<':
               this._report(SEID.ATTRIBUTE_INVALID_VALUE, [ options.attributeName ]);
               result.abort = true;
               break;
            default: // no terminator
               this._report(SEID.ATTRIBUTE_NO_CLOSE_QUOTE, [ options.attributeName ]);
               break;
         }
      }

      return result;
   }

   _assert(condition, code, params, place, context) {
      if (!condition) {
         this._report(code, params, place, context);
      }
   }

   _report(code, params, place, context) {
      this._pushToken(new SyntaxError(code, params, place, context));
   }

   _validateStartDocType(parsedDocType) {
      const start = parsedDocType.startChunk;

      this._assert(parsedDocType.nameChunk, SEID.DOCTYPE_NO_NAME);

      if (parsedDocType.nameChunk && !parsedDocType.nameChunk.couldBeName) {
         this._report(SEID.DOCTYPE_NAME_INVALID, [ parsedDocType.nameChunk.text ]);
      }

      if (parsedDocType.externalId) {
         this._validateExternalId(parsedDocType.externalId, true);
      }

      if (this._entityMd.isTypeDocument) {
         if (this._state !== STATE.PROLOG_PREDOCTYPE) {
            this._report(SEID.DOCTYPE_INVALID_DOC_CONTEXT, start.startOffset, start);
         }
      } else {
         this._report(SEID.DOCTYPE_INVALID_EXTERNAL_CONTEXT, start.startOffset, start);
      }
   }

   _validateCloseDocType(parsedClose) {
      this._assert(parsedClose.closeChunk, SEID.DOCTYPE_NO_CLOSE);
   }

   _validateNotation(parsedNotation) {
      const notNameText = textOrBlank(parsedNotation.nameChunk);
      const couldBeName = notNameText === '' ||
         (parsedNotation.nameChunk && parsedNotation.nameChunk.couldBeName);

      this._assert(parsedNotation.nameChunk, SEID.NOTATIONDECL_NO_NAME);
      this._assert(couldBeName, SEID.NOTATIONDECL_NAME_INVALID, [ notNameText ]);
      this._assert(parsedNotation.postNameSpaceChunk,
         SEID.NOTATIONDECL_NO_SPACE_AFTER_NAME, [ notNameText ]);
      if (!parsedNotation.externalId || parsedNotation.externalId.unknownType) {
         this._report(SEID.NOTATIONDECL_NO_EXTERNALID, [ notNameText ]);
      } else {
         this._validateExternalId(parsedNotation.externalId, false);
      }
      this._assert(parsedNotation.close, SEID.NOTATIONDECL_NO_CLOSE, [ notNameText ]);
      this._checkDeclarationState(parsedNotation.startChunk, SEID.NOTATIONDECL_INVALID_CONTEXT);
   }

   _validateEntity(parsedEntity) {
      const enNameText = textOrBlank(parsedEntity.nameChunk);

      this._assert(parsedEntity.nameChunk, SEID.ENTITYDECL_NO_NAME);
      this._assert((parsedEntity.nameChunk && parsedEntity.nameChunk.couldBeName) || enNameText === '',
         SEID.ENTITYDECL_NAME_INVALID, [ enNameText ]);
      this._assert(parsedEntity.postNameSpaceChunk, SEID.ENTITYDECL_NAME_NO_TRAILING_SPACE, [ enNameText ]);

      if (parsedEntity.nDataMarker) {
         this._assert(parsedEntity.preNDataSpace, SEID.ENTITYDECL_NDATA_NO_SPACE_BEFORE, [ enNameText ]);
         this._assert(parsedEntity.nDataMarker.text === 'NDATA',
            SEID.ENTITYDECL_NDATA_INVALID_CASE, [ enNameText, parsedEntity.nDataMarker.text ]);
         this._assert(parsedEntity.nDataName, SEID.ENTITYDECL_NDATA_NO_NAME, [ enNameText ]);
      }

      this._assert(parsedEntity.valueChunk || parsedEntity.externalId,
         SEID.ENTITYDECL_NO_VALUE, [ enNameText ]);
      this._assert(parsedEntity.closeChunk, SEID.ENTITYDECL_NO_CLOSE, [ enNameText ]);

      this._checkDeclarationState(parsedEntity.start, SEID.ENTITYDECL_INVALID_CONTEXT);
   }

   _validateElementDeclaration(parsedEl, start) {
      const nameText = parsedEl.elementName ? parsedEl.elementName.text : '';
      let contentText;

      if (nameText === '') {
         this._report(SEID.ELEMENTDECL_NO_NAME);
      }

      this._assert(nameText === '' || parsedEl.elementName.couldBeName,
         SEID.ELEMENTDECL_NAME_INVALID, [ nameText ]);

      if (!parsedEl.contentChunk && !parsedEl.list) {
         this._report(SEID.ELEMENTDECL_NO_SPEC, [ nameText ]);
      } else if (parsedEl.list) {
         contentText = [];

         this._assert(parsedEl.missingCount === 0 || parsedEl.list.length === 0,
            SEID.ELEMENTDECL_SPEC_NO_NAMES, [ parsedEl.missingCount, nameText ]);
         this._assert(parsedEl.missingOr === 0 || parsedEl.list.length <= 1,
            SEID.ELEMENTDECL_SPEC_NO_ORS, [ parsedEl.missingOr, nameText ]);
         this._assert(parsedEl.list.length > 0, SEID.ELEMENTDECL_SPEC_ITEMS_MISSING, [ nameText ]);

         for (let index = 0; index < parsedEl.list.length; index++) {
            const item = parsedEl.list[index];

            if (item.text.toLocaleUpperCase() === '#PCDATA') {
               this._assert(item.text === '#PCDATA',
                  SEID.ELEMENTDECL_SPEC_INVALID_CASE, [ '#PCDATA', item.text ]);
               this._assert(index === 0, SEID.ELEMENTDECL_PCDATA_NOT_FIRST, [ nameText ]);

               contentText.push('#PCDATA');
            } else {
               this._assert(item.couldBeName, SEID.ELEMENTDECL_SPEC_NAME_INVALID, [ item.text ]);
               contentText.push(item.text);
            }
         }
         this._assert(parsedEl.close, SEID.ELEMENTDECL_NO_SPEC_CLOSE, [ nameText ]);
      } else {
         contentText = parsedEl.contentChunk.text;
         const upperText = parsedEl.contentChunk.text.toLocaleUpperCase();

         this._assert(upperText === 'ANY' || upperText === 'EMPTY',
            SEID.ELEMENTDECL_SPEC_UNKNOWN, [ contentText ]);
         this._assert(upperText === contentText,
            SEID.ELEMENTDECL_SPEC_INVALID_CASE, [ upperText, contentText ]);
         contentText = upperText;
      }

      this._assert(parsedEl.closeChunk, SEID.ELEMENTDECL_NO_CLOSE, [ nameText ]);

      this._checkDeclarationState(start, SEID.ELEMENTDECL_INVALID_CONTEXT);

      return contentText;
   }

   _validatAttList(parseResults, start) {
      const elNameChunk = parseResults.elementNameChunk;
      const rawAttrs = parseResults.attributes;
      const attListClose = parseResults.closeChunk;

      const attributes = [];
      const elName = elNameChunk ? elNameChunk.text : '';
      const nameValid = elName === '' || (elNameChunk && elNameChunk.couldBeName);

      this._assert(elName !== '', SEID.ATTLISTDECL_NO_NAME);
      this._assert(nameValid, SEID.ATTLISTDECL_NAME_INVALID, [ elName ]);
      this._assert(rawAttrs.length > 0, SEID.ATTLISTDECL_NO_ATTRIBUTES, [ elName ]);

      for (let index = 0; index < rawAttrs.length; index++) {
         const attr = rawAttrs[index];
         const attrName = attr.name.text;
         let list;
         let attrType = '';
         let attrDefault;

         this._assert(attr.name.couldBeName, SEID.ATTLISTDECL_ATTR_NAME_INVALID, [ attrName ]);

         if (!attr.type) {
            this._report(SEID.ATTLISTDECL_ATTR_NO_TYPE, [ attrName, elName ]);
         } else {
            attrType = attr.type.text;

            const upper = attrType.toLocaleUpperCase();
            const known = ATTR_TYPE_NAMES.indexOf(upper) !== -1;

            this._assert(known, SEID.ATTLISTDECL_ATTR_TYPE_UNKNOWN, [ elName, attrType ]);

            if (known && attrType !== upper) {
               this._report(SEID.ATTLISTDECL_ATTR_TYPE_INVALID, [ upper, elName, attrType ]);
               attrType = upper;
            }

            if (attrType === 'NOTATION' || attrType === 'ENUMERATION') {
               const attrList = attr.list || [];
               list = [];

               if (attrType === 'NOTATION') {
                  this._assert(attr.postNotationSpace, SEID.ATTLISTDECL_ATTR_NOTA_NO_SPACE, [ elName ]);
               }

               if (attrType === 'ENUMERATION') {
                  this._assert(attr.preEnumSpaceChunk, SEID.ATTLISTDECL_ATTR_ENUM_NO_PRESPACE,
                     [ elName ], attr.name, start);
               }
               this._assert(attrList.length > 0, SEID.ATTLISTDECL_ATTR_NOTA_EMPTY, [ elName ]);

               for (let listIndex = 0; listIndex < attrList.length; listIndex++) {
                  if (attrType === 'NOTATION') {
                     this._assert(attrList[listIndex].couldBeName,
                        SEID.ATTLISTDECL_ATTR_NOTA_NAME_INVALID, [ elName, attrList[listIndex].text ]);
                  } else {
                     this._assert(attrList[listIndex].couldBeNmToken,
                        SEID.ATTLISTDECL_ATTR_ENUM_NMTOKEN_INVALID, [ elName, attrList[listIndex].text ]);
                  }

                  list.push(attrList[listIndex].text);
               }

               this._assert(attr.missingOr === 0,
                  SEID.ATTLISTDECL_ATTR_LIST_NO_ORS, [ attr.missingOr, elName ]);
               this._assert(attr.missingCount === 0,
                  SEID.ATTLISTDECL_ATTR_LIST_NO_NAMES, [ attr.missingCount, elName ]);

               if (!attr.close) {
                  this._report(attrType === 'NOTATION' ? SEID.ATTLISTDECL_ATTR_NOTA_NO_CLOSE :
                     SEID.ATTLISTDECL_ATTR_ENUM_NO_CLOSE, [ attrName, elName ]);
               }
            }
         }

         if (!attr.default && !attr.value) {
            this._assert(attr.default, SEID.ATTLISTDECL_ATTR_NO_DEFAULT, [ attrName, elName ]);
         }

         if (attr.default) {
            attrDefault = attr.default.text;

            const upper = attrDefault.toLocaleUpperCase();
            const known = ATTR_DEFAULT_NAMES.indexOf(upper) !== -1;

            if (!known) {
               this._assert(known, SEID.ATTLISTDECL_ATTR_DEFAULT_UNKNOWN, [ attrDefault, elName ]);
            } else {
               this._assert(upper === attrDefault,
                  SEID.ATTLISTDECL_ATTR_DEFAULT_INVALID, [ upper, elName, attrDefault ]);
               attrDefault = upper;

               if (attrDefault === '#FIXED') {
                  if (attr.value) {
                     this._assert(attr.postFixedSpace, SEID.ATTLISTDECL_FIXED_NO_SPACE, [ elName ]);
                  }
                  this._assert(attr.value, SEID.ATTLISTDECL_ATTR_FIXED_NO_VALUE, [ elName ],
                     attr.default, start);
               }
            }
         }

         if (attr.value || attr.default) {
            this._assert(attr.preDefaultSpace,
               SEID.ATTLISTDECL_ATTR_DEFAULT_NO_SPACE, [ attrName, elName ]);

            if (attr.value) {
               this._assert(!attr.aborted, SEID.ATTLISTDECL_ATTR_INVALID, [ elName ]);
               if (!attr.aborted) {
                  this._assert(attr.quote, SEID.ATTLISTDECL_ATTR_NO_CLOSE_QUOTE, [ elName ]);
               }
            }
         }

         if (attr.value) {
            for (let index = 0; index < attr.value.length; index++) {
               attr.value[index] = attr.value[index].text;
            }
         }

         attributes.push({
            name: attrName,
            type: attrType,
            list: list,
            flag: attrDefault,
            value: attr.value
         });
      }

      this._assert(attListClose, SEID.ATTLISTDECL_NO_CLOSE, [ elName ]);

      this._checkDeclarationState(start, SEID.ATTLISTDECL_INVALID_CONTEXT);

      return attributes;
   }

   _validateExternalId(externalId, systemRequired) {
      if (externalId.unknownType) {
         this._report(SEID.EXTERNALID_UNKNOWN, [ externalId.typeText ]);
         return;
      }

      this._assert(externalId.uppercaseTypeText === externalId.typeText,
         SEID.EXTERNALID_INVALID_CASE, [ externalId.uppercaseTypeText, externalId.typeText ]);

      if (externalId.uppercaseTypeText === 'PUBLIC') {
         this._assert(externalId.publicId, SEID.EXTERNALID_NO_PUBLIC);
      }

      if (externalId.publicId) {
         if (!externalId.publicId.quote) {
            this._report(SEID.EXTERNALID_PUBLIC_NO_QUOTE);
         }
         this._assert(externalId.spaceAfterTypeChunk, SEID.EXTERNALID_PUBLIC_NO_LEADING_SPACE);
         const match = PUBID_CHARS.exec(externalId.publicId.literalChunk.text);

         if (externalId.publicId.literalChunk.text && (!match || match[0] !== externalId.publicId.literalChunk.text)) {
            this._report(SEID.EXTERNALID_PUBLIC_INVALID_CHARS,
                [ externalId.publicId.literalChunk.text[match[0].length] ]);
         }
      }

      if (systemRequired) {
         this._assert(externalId.systemId, SEID.EXTERNALID_NO_SYSTEM);
      }

      if (externalId.systemId) {
         if (!externalId.systemId.quote) {
            this._report(SEID.EXTERNALID_SYSTEM_NO_QUOTE);
         }

         if (externalId.publicId) {
            this._assert(externalId.betweenSpaceChunk, SEID.EXTERNALID_PUBLIC_NO_SPACE);
         } else {
            this._assert(externalId.spaceAfterTypeChunk, SEID.EXTERNALID_SYSTEM_NO_LEADING_SPACE);
         }
      }
   }

   _validateProcessingInstruction(parsedPI, start) {
      this._assert(!parsedPI.postStartSpaceChunk, SEID.PI_SPACE_BEFORE_TARGET, start.endOffset);

      if (parsedPI.isXmlDecl) {
         this._assert(parsedPI.targetChunk.text === 'xml', SEID.XMLDECL_TARGET_INVALID_CASE,
            [ parsedPI.targetChunk.text ], parsedPI.postStartSpaceChunk || start, start);
      } else {
         if (!parsedPI.targetChunk) {
            this._report(SEID.PI_NO_TARGET, parsedPI.postStartSpaceChunk || start, start);
         } else if (!parsedPI.targetChunk.couldBeName) {
            this._report(SEID.PI_TARGET_NAME_INVALID, [ parsedPI.targetChunk.text ],
               parsedPI.postStartSpaceChunk || start, start);
         }

         this._assert(parsedPI.closeChunk, SEID.PI_NO_CLOSE, parsedPI.instructionChunk || parsedPI.optSpaceChunk ||
            parsedPI.targetChunk || parsedPI.optSpaceChunk || start, start);
         this._checkPiAndCommentState(start, SEID.PI_INVALID_CONTEXT);
      }
   }
}

module.exports = XmlTokenStream;
