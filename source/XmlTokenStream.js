/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

const EntityLocation = require('./EntityLocation.js');
const Offset = require('./Offset.js');
const TextChunk = require('./TextChunk.js');
const XmlErrorToken = require('./XmlErrorToken.js');
const XmlStream = require('./XmlStream.js');
const XmlToken = require('./XmlToken.js');
const XmlTokenStreamDtd = require('./XmltokenStream-dtd.js');

const CommentToken = XmlToken.CommentToken;
const ProcessingInstructionToken = XmlToken.ProcessingInstructionToken;
const SpaceToken = XmlToken.SpaceToken;
const DeclarationToken = XmlToken.DeclarationToken;
const TextDeclarationToken = XmlToken.TextDeclarationToken;
const StartTagToken = XmlToken.StartTagToken;
const StartEntityToken = XmlToken.StartEntityToken;
const TagToken = XmlToken.TagToken;
const DocTypeStartToken = XmlToken.DocTypeStartToken;
const DocTypeEndToken = XmlToken.DocTypeEndToken;
const NotationToken = XmlToken.NotationToken;
const EntityToken = XmlToken.EntityToken;
const ParameterEntityToken = XmlToken.ParameterEntityToken;
const ElementDeclarationToken = XmlToken.ElementDeclarationToken;
const AttributeListDeclarationToken = XmlToken.AttributeListDeclarationToken;

const ERRORS = XmlErrorToken.ERROR;

const XMLDECL_NAME_TERMINATORS = [ '=', '?>' ];
const XMLDECL_VALUE_TERMINATORS = [ '?>' ];
const ATTRIBUTE_NAME_TERMINATORS = [ '=', '>', '/>' ];
const ATTRIBUTE_VALUE_TERMINATORS_LAX = [ '>', '/>' ];
const ATTRIBUTE_VALUE_TERMINATORS = [ '<', '>', '/>' ];

const PUBID_CHARS = /^[- \n\'\(\)\+,\.\/:=\?;!\*#@$_%a-zA-Z0-9]*/;
const ATTR_TYPE_NAMES = [ 'CDATA', 'ID', 'IDREF', 'IDREFS', 'ENTITY', 'ENTITIES', 'NMTOKEN', 'NMTOKENS', 'NOTATION',
   'ENUMERATION' ];
const ATTR_DEFAULT_NAMES = [ '#REQUIRED', '#IMPLIED', '#FIXED' ];

const ENTITY_TYPE = {
   DOCUMENT_ENTITY: 'DOCUMENT_ENTITY',
   EXTERNAL_ENTITY: 'EXTERNAL_ENTITY',
   EXTERNAL_SUBSET: 'EXTERNAL_SUBSET'
};

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
      value = valueChunk.length !== 0 ? valueChunk[0].data : undefined;
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
      if (item.type === XmlToken.TEXT) {
         item.data = item.data.replace(/[\n\r\t]/g, ' ');
      }
   }
}

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
      this._state = STATE.START;

      this._options = {
         lax: false,
         'lax:allowOpenAngleBracketsInAttributeValues': false,
         entityType: ENTITY_TYPE.DOCUMENT_ENTITY
      };

      for (const name in options) {
         if (this._options[name] === undefined) {
            throw new Error('"' + name + '" is not a supported option name.');
         }
         this._options[name] = options[name];
      }

      this._entityType = this._options.entityType;
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

      if (this._entityType === ENTITY_TYPE.DOCUMENT_ENTITY) {
         this._assertSyntax(this._state !== STATE.START, ERRORS.SPACE_INVALID_CONTEXT, space.startOffset, space);
      }

      this._pushToken(new SpaceToken(space.text, this._cursor.getRecentChunks()));
   }

   /*
    *   [14] CharData ::= [^<&]* - ([^<&]* ']]>' [^<&]*)
    */
   _getContent() {
      let content;

      do {
         content = this._cursor.getToTerminator([ '<', '&', ']]>' ]);

         if (content.terminator === ']]>') {
            this._reportSyntaxError(ERRORS.CHARDATA_INVALID_TEXT);

            if (content.chunk) {
               this._checkContentState(content.chunk,
                  ERRORS.CHARDATA_INVALID_DOC_CONTEXT, ERRORS.CHARDATA_INVALID_SUBSET_CONTEXT);
               this._pushTokenWrapper(XmlToken.CHARDATA, content.chunk.text);
            }

            content = {
               chunk: this._cursor.getMatch(']]>')
            };

         } else if (!content.chunk || content.chunk.text === '') {
            return;
         }

         this._checkContentState(content.chunk,
            ERRORS.CHARDATA_INVALID_DOC_CONTEXT, ERRORS.CHARDATA_INVALID_SUBSET_CONTEXT);
         this._pushTokenWrapper(XmlToken.CHARDATA, content.chunk.text);
      } while (content.terminator && content.terminator !== '<');
   }

   _checkContentState(chunk, docError, subsetError) {
      switch (this._entityType) {
         case ENTITY_TYPE.DOCUMENT_ENTITY:
            this._assertSyntax(this._state === STATE.IN_CONTENT, docError,
               [ chunk.text ], chunk.startOffset, chunk);
            break;
         case ENTITY_TYPE.EXTERNAL_ENTITY:
            if (this._state === STATE.START) {
               this._state = STATE.IN_CONTENT;
            }
            break;
         case ENTITY_TYPE.EXTERNAL_SUBSET:
            this._reportSyntaxError(subsetError, [ chunk.text ], chunk.startOffset, chunk);
            break;
      }
   }

   _getReference(start, inAttribute) {
      const space = this._cursor.getSpace();
      const next = this._cursor.peekChar();

      this._assertSyntax(!space, ERRORS.REFERENCE_XTRA_SPACE);

      if (next.text === '#') {
         this._cursor.getChar();
         const character = this._getCharReference();

         if (inAttribute) {
            return [ new XmlToken(XmlToken.CHAR_REF, character) ];
         } else {
            this._checkContentState(start, ERRORS.CHARREF_INVALID_DOC_CONTEXT, ERRORS.CHARREF_INVALID_SUBSET_CONTEXT);
            this._pushTokenWrapper(XmlToken.CHAR_REF, character);
         }
      } else {
         const name = this._cursor.getWord([ ';' ]);
         const entityName = name ? name.text : '';
         const afterSpace = this._cursor.getSpace();
         const closingSemicolon = this._cursor.getMatch(';');

         if (!entityName) {
            this._reportSyntaxError(ERRORS.REFERENCE_NO_NAME);
         }

         this._assertSyntax(!afterSpace, ERRORS.REFERENCE_XTRA_TRAILING_SPACE, [ entityName ]);
         this._assertSyntax(closingSemicolon, ERRORS.REFERENCE_NO_SEMICOLON, [ entityName ]);

         const startToken = new StartEntityToken(entityName);

         if (inAttribute) {
            return [ startToken, new XmlToken(XmlToken.ENTITY_END, entityName) ];
         } else {
            startToken.chunks = this._cursor.getRecentChunks();

            this._checkContentState(start,
               ERRORS.REFERENCE_INVALID_DOC_CONTEXT, ERRORS.REFERENCE_INVALID_SUBSET_CONTEXT);

            this._pushToken(startToken);
            this._pushTokenWrapper(XmlToken.ENTITY_END, entityName);
         }
      }
   }

   _getCharReference() {
      let isHex = false;
      let character;
      const space = this._cursor.getSpace();
      const nextChar = this._cursor.peekChar();

      this._assertSyntax(!space, ERRORS.CHARREF_XTRA_SPACE);

      if (nextChar.text.toLocaleLowerCase() === 'x') {
         this._assertSyntax(nextChar.text === 'x', ERRORS.CHARREF_INVALID_HEX_CASE);

         isHex = true;
         this._cursor.getChar();
      }

      const afterSpace = this._cursor.getSpace();
      const digits = this._cursor.getDigits();
      const afterDigitsSpace = this._cursor.getSpace();
      const semicolon = this._cursor.getMatch(';');

      this._assertSyntax(!afterSpace, ERRORS.CHARREF_XTRA_SPACE_BEFORE_DIGITS);

      if (!digits) {
         this._reportSyntaxError(ERRORS.CHARREF_NO_DIGITS);
      } else {
         if (!isHex && !digits.isDecimal) {
            this._reportSyntaxError(ERRORS.CHARREF_INVALID_BASE, [ digits.text ]);
            isHex = true;
         }

         character = String.fromCharCode(parseInt(digits.text, isHex ? 16 : 10));
      }

      this._assertSyntax(!afterDigitsSpace, ERRORS.CHARREF_XTRA_SPACE_AFTER_DIGITS);
      this._assertSyntax(semicolon, ERRORS.CHARREF_NO_SEMICOLON);

      return character;
   }

   /*
    * Parse any comment
    *   [15] Comment ::= '<!--' ((Char - '-') | ('-' (Char - '-')))* '-->'
    * PARAMS: The first token (currently not used)
    */
   _getComment(start) {
      const results = this._cursor.getToTerminator([ '-->' ]);

      if (!results.terminator) {
         this._reportSyntaxError(ERRORS.COMMENT_NO_CLOSE, results.chunk || start, start);
      } else {
         this._cursor.getMatch('-->');

         if (results.chunk && results.chunk.text[results.chunk.text.length - 1] === '-') {
            const place = results.chunk.endOffset.clone();
            place.index --;
            place.column --;
            this._reportSyntaxError(ERRORS.COMMENT_ENDS_WITH_HYPHEN, place, start);
         }
      }

      const content = results.chunk ? results.chunk.text : undefined;
      this._checkPiAndCommentState(start, ERRORS.COMMENT_INVALID_CONTEXT);
      this._pushToken(new CommentToken(content, this._cursor.getRecentChunks()));
   }

   _getBangItem(start) {
      this._cursor.getMarkup();
      const leadingSpace = this._cursor.getSpace();
      const bracket = this._cursor.getMatch('[');

      if (bracket) {
         this._assertSyntax(!leadingSpace, ERRORS.BRACKETITEM_XTRA_SPACE_BEFORE);

         this._getBracketItem(start);
         return;
      }

      const declarationName = this._cursor.getWord([ '[', '>' ]); // could look for quotes, too
      const postDeclarationSpace = this._cursor.getSpace();

      this._assertSyntax(!leadingSpace, ERRORS.BANGITEM_NAME_XTRA_SPACE_BEFORE);

      if (!declarationName) {
         this._reportSyntaxError(ERRORS.BANGITEM_NO_NAME);
      } else {
         const type = declarationName.text;
         const upperCaseType = type.toLocaleUpperCase();

         this._assertSyntax(type === upperCaseType, ERRORS.BANGITEM_NAME_INVALID_CASE, [ upperCaseType, type ]);
         this._assertSyntax(postDeclarationSpace, ERRORS.BANGITEM_NAME_XTRA_SPACE_AFTER, [ type ]);

         switch (upperCaseType) {
            case 'DOCTYPE':
               const parsedDocType = this._dtdParser.parseDocTypeStart(this._cursor);
               const externalId = parsedDocType.externalId;
               let externalLoc;

               this._assertSyntax(parsedDocType.nameChunk, ERRORS.DOCTYPE_NO_NAME);

               if (parsedDocType.nameChunk && !parsedDocType.nameChunk.couldBeName) {
                  this._reportSyntaxError(ERRORS.DOCTYPE_NAME_INVALID, [ parsedDocType.nameChunk.text ]);
               }

               if (externalId) {
                  this._validateExternalId(externalId, true);
                  // EntityLocation could take the raw object and handle. note these still aren't quite right
                  const systemId = externalId.systemId ? externalId.systemId.literalChunk.text : undefined;
                  const publicId = externalId.publicId ? externalId.publicId.literalChunk.text : undefined;
                  externalLoc = new EntityLocation(systemId, publicId);
               }
               const openDtd = this._cursor.getMatch('[');
               const docToken = new DocTypeStartToken(parsedDocType.nameChunk ? parsedDocType.nameChunk.text : '',
                  externalLoc);

               if (this._entityType === ENTITY_TYPE.DOCUMENT_ENTITY) {
                  if (this._state !== STATE.PROLOG_PREDOCTYPE) {
                     this._reportSyntaxError(ERRORS.DOCTYPE_INVALID_DOC_CONTEXT, start.startOffset, start);
                  }
               } else {
                  this._reportSyntaxError(ERRORS.DOCTYPE_INVALID_EXTERNAL_CONTEXT, start.startOffset, start);
               }

               this._pushToken(docToken);

               if (openDtd) {
                  this._pushEnveloper(']', docToken);
                  this._state = STATE.IN_DTD;
               } else {
                  this._closeDocType();
               }
               return;
            // [82] NotationDecl ::= '<!NOTATION' S Name S (ExternalID | PublicID) S? '>'
            case 'NOTATION':
               const parsedNotation = this._dtdParser.parseNotation(this._cursor);
               const notNameText = parsedNotation.nameChunk ? parsedNotation.nameChunk.text : '';
               const couldBeName = notNameText === '' ||
                  (parsedNotation.nameChunk && parsedNotation.nameChunk.couldBeName);

               this._assertSyntax(parsedNotation.nameChunk, ERRORS.NOTATIONDECL_NO_NAME);
               this._assertSyntax(couldBeName, ERRORS.NOTATIONDECL_NAME_INVALID, [ notNameText ]);
               this._assertSyntax(parsedNotation.postNameSpaceChunk,
                  ERRORS.NOTATIONDECL_NO_SPACE_AFTER_NAME, [ notNameText ]);
               if (!parsedNotation.externalId || parsedNotation.externalId.unknownType) {
                  this._reportSyntaxError(ERRORS.NOTATIONDECL_NO_EXTERNALID, [ notNameText ]);
               } else {
                  this._validateExternalId(parsedNotation.externalId, false);
               }
               this._assertSyntax(parsedNotation.close, ERRORS.NOTATIONDECL_NO_CLOSE, [ notNameText ]);

               let notationToken;
               if (parsedNotation.externalId) {
                  const externalId = parsedNotation.externalId;
                  /* eslint-disable no-console */
                  const publicId = externalId.publicId ? externalId.publicId.text : undefined;
                  const systemId = externalId.systemId ? externalId.systemId.text : undefined;
                  notationToken = new NotationToken(notNameText, systemId, publicId);
               } else {
                  notationToken = new NotationToken(notNameText);
               }

               this._checkDeclarationState(start, ERRORS.NOTATIONDECL_INVALID_CONTEXT);

               this._pushToken(notationToken);
               return;
            // Consume an entity declaration.  Note, that we are biased here if we
            // find something unexpected (e.g. stuff after NDATA, or no ExternalId or EntityValue)
            // to assume that the > is missing and report that, than to try to consume the whole
            // rest of the document as junk content.
            //
            case 'ENTITY':
               const parsedEntity = this._dtdParser.parseEntity(this._cursor);
               const enNameText = parsedEntity.nameChunk ? parsedEntity.nameChunk.text : '';
               let notationDataName;

               this._assertSyntax(parsedEntity.nameChunk, ERRORS.ENTITYDECL_NO_NAME);
               this._assertSyntax((parsedEntity.nameChunk && parsedEntity.nameChunk.couldBeName) || enNameText === '',
                  ERRORS.ENTITYDECL_NAME_INVALID, [ enNameText ]);
               this._assertSyntax(parsedEntity.postNameSpaceChunk,
                  ERRORS.ENTITYDECL_NAME_NO_TRAILING_SPACE, [ enNameText ]);

               if (parsedEntity.externalId) {
                  const preNDataSpace = this._cursor.getSpace();
                  const ndataMarker = this._cursor.getWord([ '>' ]);

                  if (ndataMarker) {
                     if (ndataMarker.text.toLocaleUpperCase() !== 'NDATA') {
                        this._cursor.unget(ndataMarker);
                     } else {
                        this._cursor.getSpace(); // no need to check. either have space or no word next
                        const ndataName = this._cursor.getWord([ '>' ]);

                        this._assertSyntax(preNDataSpace, ERRORS.ENTITYDECL_NDATA_NO_SPACE_BEFORE, [ enNameText ]);
                        this._assertSyntax(ndataMarker.text === 'NDATA',
                           ERRORS.ENTITYDECL_NDATA_INVALID_CASE, [ enNameText, ndataMarker.text ]);

                        if (ndataName) {
                           notationDataName = ndataName.text;
                        } else {
                           this._reportSyntaxError(ERRORS.ENTITYDECL_NDATA_NO_NAME, [ enNameText ]);
                        }
                     }
                  }
               }

               this._cursor.getSpace();
               const entityClosing = this._cursor.getMatch('>');

               this._assertSyntax(parsedEntity.valueChunk || parsedEntity.externalId,
                  ERRORS.ENTITYDECL_NO_VALUE, [ enNameText ]);
               this._assertSyntax(entityClosing, ERRORS.ENTITYDECL_NO_CLOSE, [ enNameText ]);

               const entityToken = parsedEntity.isParameter ?
                  new ParameterEntityToken(enNameText,
                     parsedEntity.valueChunk,
                     parsedEntity.externalId.systemLiteral,
                     parsedEntity.externalId.pubidLiteral,
                     notationDataName) :
                  new EntityToken(enNameText,
                     parsedEntity.valueChunk,
                     parsedEntity.externalId ? parsedEntity.externalId.systemLiteral : undefined,
                     parsedEntity.externalId ? parsedEntity.externalId.pubidLiteral : undefined,
                     notationDataName);

               this._checkDeclarationState(start, ERRORS.ENTITYDECL_INVALID_CONTEXT);

               this._pushToken(entityToken);
               return;
            case 'ELEMENT':
               let contentText;

               const parsedEl = this._dtdParser.parseElement(this._cursor);
               const nameText = parsedEl.elementName ? parsedEl.elementName.text : '';

               if (nameText === '') {
                  this._reportSyntaxError(ERRORS.ELEMENTDECL_NO_NAME);
               }

               this._assertSyntax(nameText === '' || parsedEl.elementName.couldBeName,
                  ERRORS.ELEMENTDECL_NAME_INVALID, [ nameText ]);

               if (!parsedEl.contentChunk && !parsedEl.list) {
                  this._reportSyntaxError(ERRORS.ELEMENTDECL_NO_SPEC, [ nameText ]);
               } else if (parsedEl.list) {
                  contentText = [];

                  this._assertSyntax(parsedEl.missingCount === 0 || parsedEl.list.length === 0,
                     ERRORS.ELEMENTDECL_SPEC_NO_NAMES, [ parsedEl.missingCount, nameText ]);
                  this._assertSyntax(parsedEl.missingOr === 0 || parsedEl.list.length <= 1,
                     ERRORS.ELEMENTDECL_SPEC_NO_ORS, [ parsedEl.missingOr, nameText ]);
                  this._assertSyntax(parsedEl.list.length > 0, ERRORS.ELEMENTDECL_SPEC_ITEMS_MISSING, [ nameText ]);

                  for (let index = 0; index < parsedEl.list.length; index++) {
                     const item = parsedEl.list[index];

                     if (item.text.toLocaleUpperCase() === '#PCDATA') {
                        this._assertSyntax(item.text === '#PCDATA',
                           ERRORS.ELEMENTDECL_SPEC_INVALID_CASE, [ '#PCDATA', item.text ]);
                        this._assertSyntax(index === 0, ERRORS.ELEMENTDECL_PCDATA_NOT_FIRST, [ nameText ]);

                        contentText.push('#PCDATA');
                     } else {
                        this._assertSyntax(item.couldBeName, ERRORS.ELEMENTDECL_SPEC_NAME_INVALID, [ item.text ]);
                        contentText.push(item.text);
                     }
                  }
                  this._assertSyntax(parsedEl.close, ERRORS.ELEMENTDECL_NO_SPEC_CLOSE, [ nameText ]);
               } else {
                  contentText = parsedEl.contentChunk.text;
                  const upperText = parsedEl.contentChunk.text.toLocaleUpperCase();

                  this._assertSyntax(upperText === 'ANY' || upperText === 'EMPTY',
                     ERRORS.ELEMENTDECL_SPEC_UNKNOWN, [ contentText ]);
                  this._assertSyntax(upperText === contentText,
                     ERRORS.ELEMENTDECL_SPEC_INVALID_CASE, [ upperText, contentText ]);
                  contentText = upperText;
               }

               this._assertSyntax(parsedEl.closeChunk, ERRORS.ELEMENTDECL_NO_CLOSE, [ nameText ]);

               this._checkDeclarationState(start, ERRORS.ELEMENTDECL_INVALID_CONTEXT);

               this._pushToken(new ElementDeclarationToken(nameText, contentText));
               return;
            case 'ATTLIST':
               const parseResults = this._dtdParser.parseAttList(this._cursor, this._options);

               const elNameChunk = parseResults.elementNameChunk;
               const rawAttrs = parseResults.attributes;
               const attListClose = parseResults.closeChunk;

               const attributes = [];
               const elName = elNameChunk ? elNameChunk.text : '';
               const nameValid = elName === '' || (elNameChunk && elNameChunk.couldBeName);

               this._assertSyntax(elName !== '', ERRORS.ATTLISTDECL_NO_NAME);
               this._assertSyntax(nameValid, ERRORS.ATTLISTDECL_NAME_INVALID, [ elName ]);
               this._assertSyntax(rawAttrs.length > 0, ERRORS.ATTLISTDECL_NO_ATTRIBUTES, [ elName ]);

               for (let index = 0; index < rawAttrs.length; index++) {
                  const attr = rawAttrs[index];
                  const attrName = attr.name.text;
                  let list;
                  let attrType = '';
                  let attrDefault;

                  this._assertSyntax(attr.name.couldBeName, ERRORS.ATTLISTDECL_ATTR_NAME_INVALID, [ attrName ]);

                  if (!attr.type) {
                     this._reportSyntaxError(ERRORS.ATTLISTDECL_ATTR_NO_TYPE, [ attrName, elName ]);
                  } else {
                     attrType = attr.type.text;

                     const upper = attrType.toLocaleUpperCase();
                     const known = ATTR_TYPE_NAMES.indexOf(upper) !== -1;

                     this._assertSyntax(known, ERRORS.ATTLISTDECL_ATTR_TYPE_UNKNOWN, [ elName, attrType ]);

                     if (known && attrType !== upper) {
                        this._reportSyntaxError(ERRORS.ATTLISTDECL_ATTR_TYPE_INVALID, [ upper, elName, attrType ]);
                        attrType = upper;
                     }

                     if (attrType === 'NOTATION' || attrType === 'ENUMERATION') {
                        const attrList = attr.list || [];
                        list = [];

                        if (attrType === 'NOTATION') {
                           this._assertSyntax(attr.postNotationSpace, ERRORS.ATTLISTDECL_ATTR_NOTA_NO_SPACE,
                              [ elName ]);
                        }

                        if (attrType === 'ENUMERATION') {
                           this._assertSyntax(attr.preEnumSpaceChunk, ERRORS.ATTLISTDECL_ATTR_ENUM_NO_PRESPACE,
                              [ elName ], attr.name, start);
                        }
                        this._assertSyntax(attrList.length > 0, ERRORS.ATTLISTDECL_ATTR_NOTA_EMPTY, [ elName ]);

                        for (let listIndex = 0; listIndex < attrList.length; listIndex++) {
                           if (attrType === 'NOTATION') {
                              this._assertSyntax(attrList[listIndex].couldBeName,
                                 ERRORS.ATTLISTDECL_ATTR_NOTA_NAME_INVALID, [ elName, attrList[listIndex].text ]);
                           } else {
                              this._assertSyntax(attrList[listIndex].couldBeNmToken,
                                 ERRORS.ATTLISTDECL_ATTR_ENUM_NMTOKEN_INVALID, [ elName, attrList[listIndex].text ]);
                           }

                           list.push(attrList[listIndex].text);
                        }

                        this._assertSyntax(attr.missingOr === 0,
                           ERRORS.ATTLISTDECL_ATTR_LIST_NO_ORS, [ attr.missingOr, elName ]);
                        this._assertSyntax(attr.missingCount === 0,
                           ERRORS.ATTLISTDECL_ATTR_LIST_NO_NAMES, [ attr.missingCount, elName ]);

                        if (!attr.close) {
                           this._reportSyntaxError(attrType === 'NOTATION' ? ERRORS.ATTLISTDECL_ATTR_NOTA_NO_CLOSE :
                              ERRORS.ATTLISTDECL_ATTR_ENUM_NO_CLOSE, [ attrName, elName ]);
                        }
                     }
                  }

                  if (!attr.default && !attr.value) {
                     this._assertSyntax(attr.default, ERRORS.ATTLISTDECL_ATTR_NO_DEFAULT, [ attrName, elName ]);
                  }

                  if (attr.default) {
                     attrDefault = attr.default.text;

                     const upper = attrDefault.toLocaleUpperCase();
                     const known = ATTR_DEFAULT_NAMES.indexOf(upper) !== -1;

                     if (!known) {
                        this._assertSyntax(known, ERRORS.ATTLISTDECL_ATTR_DEFAULT_UNKNOWN, [ attrDefault, elName ]);
                     } else {
                        this._assertSyntax(upper === attrDefault,
                           ERRORS.ATTLISTDECL_ATTR_DEFAULT_INVALID, [ upper, elName, attrDefault ]);
                        attrDefault = upper;

                        if (attrDefault === '#FIXED') {
                           if (attr.value) {
                              this._assertSyntax(attr.postFixedSpace, ERRORS.ATTLISTDECL_FIXED_NO_SPACE, [ elName ]);
                           }
                           this._assertSyntax(attr.value, ERRORS.ATTLISTDECL_ATTR_FIXED_NO_VALUE, [ elName ],
                              attr.default, start);
                        }
                     }
                  }

                  if (attr.value || attr.default) {
                     this._assertSyntax(attr.preDefaultSpace,
                        ERRORS.ATTLISTDECL_ATTR_DEFAULT_NO_SPACE, [ attrName, elName ]);

                     if (attr.value) {
                        this._assertSyntax(!attr.aborted, ERRORS.ATTLISTDECL_ATTR_INVALID, [ elName ]);
                        if (!attr.aborted) {
                           this._assertSyntax(attr.quote, ERRORS.ATTLISTDECL_ATTR_NO_CLOSE_QUOTE, [ elName ]);
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

               this._assertSyntax(attListClose, ERRORS.ATTLISTDECL_NO_CLOSE, [ elName ]);

               this._checkDeclarationState(start, ERRORS.ATTLISTDECL_INVALID_CONTEXT);

               this._pushToken(new AttributeListDeclarationToken(elName, attributes));
               return;
         }
      }

      this._reportSyntaxError(ERRORS.BANGITEM_UNKNOWN);
   }

   _validateExternalId(externalId, systemRequired) {
      if (externalId.unknownType) {
         this._reportSyntaxError(ERRORS.EXTERNALID_UNKNOWN, [ externalId.typeText ]);
         return;
      }

      this._assertSyntax(externalId.uppercaseTypeText === externalId.typeText,
         ERRORS.EXTERNALID_INVALID_CASE, [ externalId.uppercaseTypeText, externalId.typeText ]);

      if (externalId.uppercaseTypeText === 'PUBLIC') {
         this._assertSyntax(externalId.publicId, ERRORS.EXTERNALID_NO_PUBLIC);
      }

      if (externalId.publicId) {
         if (!externalId.publicId.quote) {
            this._reportSyntaxError(ERRORS.EXTERNALID_PUBLIC_NO_QUOTE);
         }
         this._assertSyntax(externalId.spaceAfterTypeChunk, ERRORS.EXTERNALID_PUBLIC_NO_LEADING_SPACE);
         const match = PUBID_CHARS.exec(externalId.publicId.literalChunk.text);

         if (externalId.publicId.literalChunk.text && (!match || match[0] !== externalId.publicId.literalChunk.text)) {
            this._reportSyntaxError(ERRORS.EXTERNALID_PUBLIC_INVALID_CHARS,
                [ externalId.publicId.literalChunk.text[match[0].length] ]);
         }
      }

      if (systemRequired) {
         this._assertSyntax(externalId.systemId, ERRORS.EXTERNALID_NO_SYSTEM);
      }

      if (externalId.systemId) {
         if (!externalId.systemId.quote) {
            this._reportSyntaxError(ERRORS.EXTERNALID_SYSTEM_NO_QUOTE);
         }

         if (externalId.publicId) {
            this._assertSyntax(externalId.betweenSpaceChunk, ERRORS.EXTERNALID_PUBLIC_NO_SPACE);
         } else {
            this._assertSyntax(externalId.spaceAfterTypeChunk, ERRORS.EXTERNALID_SYSTEM_NO_LEADING_SPACE);
         }
      }
   }

   _closeDocType() {
      this._cursor.getSpace();
      const doctypeClosing = this._cursor.getMatch('>');
      this._assertSyntax(doctypeClosing, ERRORS.DOCTYPE_NO_CLOSE);

      if (this._state === STATE.PROLOG_PREDOCTYPE || this._state === STATE.IN_DTD) {
         this._state = STATE.PROLOG;
      }
      this._pushToken(new DocTypeEndToken());
   }

   _checkDeclarationState(start, error) {
      if (this._entityType === ENTITY_TYPE.EXTERNAL_SUBSET && this._state === STATE.START) {
         this._state = STATE.IN_DTD;
      }
      this._assertSyntax(this._state === STATE.IN_DTD, error, start.startOffset, start);
   }

   _getBracketItem(start) {
      const preSpace = this._cursor.getSpace();
      const bracketItemType = this._cursor.getWord([ '[' ]);
      const postSpace = this._cursor.getSpace();
      const secondBracket = this._cursor.getMatch('[');

      this._assertSyntax(bracketItemType, ERRORS.BRACKETITEM_NO_NAME);
      this._assertSyntax(secondBracket, ERRORS.BRACKETITEM_NO_SECOND_BRACKET);

      /*
       * Retrieve a CData section
       *   [18] CDSect  ::=  CDStart CData CDEnd
       *   [19] CDStart ::=  '<![CDATA['
       *   [20] CData   ::=  (Char* - (Char* ']]>' Char*))
       *   [21] CDEnd   ::=  ']]>'
       */
      if (bracketItemType && bracketItemType.text.toLocaleLowerCase() === 'cdata') {
         this._assertSyntax(!preSpace, ERRORS.CDATA_XTRA_SPACE_BEFORE);
         this._assertSyntax(bracketItemType.text === 'CDATA', ERRORS.CDATA_INVALID_CASE, [ bracketItemType.text ]);
         this._assertSyntax(!postSpace, ERRORS.CDATA_XTRA_SPACE_AFTER);

         const results = this._cursor.getToTerminator([ ']]>' ]);

         if (!results.terminator) {
            this._reportSyntaxError(ERRORS.CDATA_NO_CLOSE);
         } else {
            this._cursor.getMatch(']]>');
         }

         this._checkContentState(start, ERRORS.CDATA_INVALID_DOC_CONTEXT, ERRORS.CDATA_INVALID_SUBSET_CONTEXT);

         this._pushTokenWrapper(XmlToken.CDATA, results.chunk ? results.chunk.text : undefined);
      } else if (bracketItemType) {
         this._reportSyntaxError(ERRORS.BRACKETITEM_UNKNOWN, [ bracketItemType.text ]);
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
   _getProcessingInstruction(start) {
      const space = this._cursor.getSpace();
      const target = this._cursor.getWord([ '?>' ]);

      this._assertSyntax(!space, ERRORS.PI_SPACE_BEFORE_TARGET, start.endOffset);

      if (!target) {
         this._reportSyntaxError(ERRORS.PI_NO_TARGET, space || start, start);
      } else if (!target.couldBeName) {
         this._reportSyntaxError(ERRORS.PI_TARGET_NAME_INVALID, [ target.text ], space || start, start);
      }

      if (target && target.text.toLocaleLowerCase() === 'xml') {
         this._assertSyntax(target.text === 'xml', ERRORS.XMLDECL_TARGET_INVALID_CASE, [ target.text ],
            space || start, start);
         this._getXmlDecl(start);
      } else {
         const optSpace = this._cursor.getSpace();   // optional space
         const results = this._cursor.getToTerminator([ '?>' ]);

         // If we found no ?> (thus, really, end of file) report an error.
         if (!results.terminator) {
            this._reportSyntaxError(ERRORS.PI_NO_CLOSE, results.chunk || optSpace || target || space || start, start);
         } else {
            this._cursor.getMatch('?>');
         }

         const targetName = target ? target.text : '';
         const content = results.chunk ? results.chunk.text : undefined;

         this._checkPiAndCommentState(start, ERRORS.PI_INVALID_CONTEXT);

         this._pushToken(new ProcessingInstructionToken(targetName, content, this._cursor.getRecentChunks()));
      }
   }

   _checkPiAndCommentState(start, error) {
      if (this._state === STATE.START) {
         switch (this._entityType) {
            case ENTITY_TYPE.DOCUMENT_ENTITY:
               this._reportSyntaxError(error, start.startOffset, start);
               break;
            case ENTITY_TYPE.EXTERNAL_ENTITY:
               this._state = STATE.IN_CONTENT;
               break;
            case ENTITY_TYPE.EXTERNAL_SUBSET:
               this._state = STATE.IN_DTD;
               break;
         }
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
      const isXmlDecl = this._entityType === ENTITY_TYPE.DOCUMENT_ENTITY;
      let seenVersion = false;
      let seenEncoding = false;
      let seenStandalone = false;

      this._assertSyntax(close, ERRORS.XMLDECL_NO_CLOSE);
      this._assertSyntax(params.length !== 0, ERRORS.XMLDECL_NO_ATTRIBUTES);

      // check that the parameters are in the right order and have the right values
      for (let index = 0; index < params.length; index++) {
         const param = params[index];
         const lcName = param.name.toLocaleLowerCase();

         if (XML_DECL_PARAMS[lcName]) {
            this._assertSyntax(param.name === lcName, ERRORS.XMLDECL_ATTR_INVALID_CASE, [ lcName, param.name ]);
         }

         switch (lcName) {
            case 'version':
               seenVersion = true;
               this._assertSyntax(index === 0, ERRORS.XMLDECL_VERSION_INVALID_ORDER, [ index ]);
               this._assertSyntax(param.value === '1.1' || param.value === '1.0',
                  ERRORS.XMLDECL_VERSION_INVALD, [ param.value ]);
               break;
            case 'encoding':
               seenEncoding = true;
               if (isXmlDecl) {
                  this._assertSyntax(seenVersion && !seenStandalone, ERRORS.XMLDECL_ENCODING_INVALID_ORDER);
               }
               this._assertSyntax(param.value.match(/^[A-Za-z][-A-Za-z0-9._]*$/),
                  ERRORS.XMLDECL_ENCODING_INVALID, [ param.value ]);
               break;
            case 'standalone':
               if (!isXmlDecl) {
                  this._reportSyntaxError(ERRORS.TEXTDECL_XTRA_STANDALONE);
               }

               const lcValue = param.value.toLocaleLowerCase();

               seenStandalone = true;

               this._assertSyntax(seenVersion, ERRORS.XMLDECL_STANDALONE_INVALID_ORDER);
               this._assertSyntax(param.value === lcValue,
                  ERRORS.XMLDECL_STANDALONE_INVALID_CASE, [ lcValue, param.value ]);

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

      if (!isXmlDecl) {
         this._assertSyntax(seenEncoding, ERRORS.TEXTDECL_NO_ENCODING, start.startOffset, start);
      }

      if (this._state === STATE.START) {
         switch (this._entityType) {
            case ENTITY_TYPE.DOCUMENT_ENTITY:
               this._state = STATE.PROLOG_PREDOCTYPE;
               break;
            case ENTITY_TYPE.EXTERNAL_ENTITY:
               this._state = STATE.IN_CONTENT;
               break;
            case ENTITY_TYPE.EXTERNAL_SUBSET:
               this._state = STATE.IN_DTD;
               break;
         }
      } else {
         this._reportSyntaxError(ERRORS.XMLDECL_INVALID_CONTEXT);
      }

      this._pushToken(isXmlDecl ?
         new DeclarationToken(params, this._cursor.getRecentChunks()) :
         new TextDeclarationToken(params, this._cursor.getRecentChunks()));
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
               this._reportSyntaxError(ERRORS.ELEMENT_END_INVALID_CLOSE);
            }
         }
      }

      this._assertSyntax(!leadingSpace, ERRORS.ELEMENT_XTRA_LEADING_SPACE);

      if (!name) {
         this._reportSyntaxError(ERRORS.ELEMENT_NO_NAME);
      } else if (!name.couldBeName) {
         this._reportSyntaxError(ERRORS.ELEMENT_NAME_INVALID, [ name.text ]);
      }

      if (!close) {
         this._reportSyntaxError(ERRORS.ELEMENT_NO_CLOSE);
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
            this._reportSyntaxError(ERRORS.ELEMENT_UNBALANCED, [ lastElement, xtoken.name ]);
         }
      }

      const nameText = name ? name.text : '';
      switch (this._entityType) {
         case ENTITY_TYPE.DOCUMENT_ENTITY:
            if (this._state === STATE.PROLOG_PREDOCTYPE || this._state === STATE.PROLOG) {
               this._state = STATE.IN_CONTENT;
            } else if (this._state === STATE.IN_DTD) {
               this._reportSyntaxError(ERRORS.ELEMENT_INVALID_DTD_CONTEXT, [ nameText ], start.startOffset, start);
            } else if (this._state !== STATE.IN_CONTENT) {
               this._reportSyntaxError(ERRORS.ELEMENT_INVALID_DOC_CONTEXT, [ nameText ], start.startOffset, start);
            }
            break;
         case ENTITY_TYPE.EXTERNAL_ENTITY:
            if (this._state === STATE.START) {
               this._state = STATE.IN_CONTENT;
            }
            this._assertSyntax(this._state === STATE.IN_CONTENT,
               ERRORS.ELEMENT_INVALID_CONTEXT, [ nameText ], start.startOffset, start);
            break;
         case ENTITY_TYPE.EXTERNAL_SUBSET:
            this._reportSyntaxError(ERRORS.ELEMENT_INVALID_DTD_CONTEXT, [ nameText ], start.startOffset, start);
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

         this._assertSyntax(lastSpace, ERRORS.ATTRIBUTE_NO_SPACE_BEFORE_NAME, [ name.text ], name.startOffset);
         this._assertSyntax(name.couldBeName || !elementAttribute, ERRORS.ATTRIBUTE_INVALID_NAME, [ name.text ]);
         this._assertSyntax(equal, ERRORS.ATTRIBUTE_NO_EQUAL, [ name.text ]);

         if (gotQuote) {
            this._cursor.getChar();     // consume the quote
            ({value, abort} = this._getQuotedValue(quote, {
               attributeName: name.text,
               isElementAttribute: elementAttribute
            }));
         } else if (!equal) {
            this._reportSyntaxError(ERRORS.ATTRIBUTE_NO_VALUE, [ name.text ]);
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
               this._reportSyntaxError(ERRORS.ATTRIBUTE_NO_VALUE, [ name.text ]);
            } else {
               this._reportSyntaxError(ERRORS.ATTRIBUTE_NO_QUOTE, [ name.text ]);

               if (terminator && terminator.text === '<') {
                  this._reportSyntaxError(ERRORS.ATTRIBUTE_INVALID_VALUE, [ name.text ]);
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
            result.value.push(new XmlToken(XmlToken.TEXT, chunkInfo.chunk.text));
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
               this._reportSyntaxError(ERRORS.ATTRIBUTE_INVALID_VALUE, [ options.attributeName ]);
               result.abort = true;
               break;
            default: // no terminator
               this._reportSyntaxError(ERRORS.ATTRIBUTE_NO_CLOSE_QUOTE, [ options.attributeName ]);
               break;
         }
      }

      return result;
   }

   _assertSyntax(condition, code, params, place, context) {
      if (!condition) {
         this._reportSyntaxError(code, params, place, context);
      }
   }

   _reportSyntaxError(code, params, place, context) {
      let message = XmlErrorToken.STRING[code];

      if (typeof params === 'object') {
         if (params instanceof Offset || params instanceof TextChunk.PlainChunk) {
            context = place;
            place = params;
            params = undefined;
         } else {
            for (let index = 0; index < params.length; index++) {
               message = message.replace('{' + index + '}', params[index]);
            }
         }
      }

      if (place instanceof TextChunk.PlainChunk) {
         place = place.endOffset;
      }

      const contextArray = context ? [ context.startOffset ] : undefined;
      this._pushToken(new XmlErrorToken(XmlToken.SYNTAX_ERROR, code, message, place, contextArray));
   }

   _pushTokenWrapper(type, data) {
      const xtoken = new XmlToken(type, data);
      xtoken.chunks = this._cursor.getRecentChunks();

      this._pushToken(xtoken);
   }

}

module.exports = XmlTokenStream;
