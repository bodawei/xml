/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

const XmlToken = require('./XmlToken.js');
const XmlErrorToken = require('./XmlErrorToken.js');
const XmlStringToken = require('./XmlStringToken.js');

const XMLDECL_NAME_TERMINATORS = [ '=', '?>' ];
const XMLDECL_VALUE_TERMINATORS = [ '?>' ];
const ATTRIBUTE_NAME_TERMINATORS = [ '=', '>', '/>' ];
const ATTRIBUTE_VALUE_TERMINATORS_LAX = [ '>', '/>' ];
const ATTRIBUTE_VALUE_TERMINATORS = [ '<', '>', '/>' ];

function makePair(nameToken, valueToken, quoteToken) {
   return {
      name: nameToken.text,
      value: valueToken ? valueToken.text : undefined,
      nameToken: nameToken,
      valueToken: valueToken,
      quoteType: quoteToken ? quoteToken.text : undefined
   };
}

class XmlTokenStream {

   constructor(cursor, options) {
      this._cursor = cursor;
      this._pendingTokens = [];
      this._elementNameStack = [];

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
         case XmlStringToken.MARKUP:
            const markupToken = this._cursor.getMarkup();

            switch (markupToken.text) {
               case '<':
                  this._getTag(true);
                  break;
               case '</':
                  this._getTag(false);
                  break;
               case '<?':
                  this._getProcessingInstruction();
                  break;
               case '<!--':
                  this._getComment();
                  break;
            }
            break;
         case XmlStringToken.SPACE:
            this._getS();
            break;
         case XmlStringToken.STRING:
            this._getContent();
            break;
      }

      return this._pendingTokens.shift();
   }

   _getS() {
      const space = this._cursor.getSpace();

      if (space.type !== XmlStringToken.SPACE) {
         throw new Error('Internal error');
      }

      const xtoken = new XmlToken(XmlToken.SPACE, space.text);
      xtoken.tokens = this._cursor.getRecentTokens();

      this._pendingTokens.push(xtoken);
   }

   /*
    *   [14] CharData ::= [^<&]* - ([^<&]* ']]>' [^<&]*)
    */
   _getContent() {
      const content = this._cursor.getToMarkup();

      if (content.type !== XmlStringToken.STRING || content.text === '') {
         throw new Error('Internal error');
      }

      const xtoken = new XmlToken(XmlToken.CHARDATA, content.text);
      xtoken.tokens = this._cursor.getRecentTokens();

      this._pendingTokens.push(xtoken);
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

         if (results.token && results.token.text[results.token.text.length - 1] === '-') {
            this._reportSyntaxError(XmlErrorToken.ERROR.COMMENT_ENDS_WITH_HYPHEN);
         }
      }

      const xtoken = new XmlToken(XmlToken.COMMENT, results.token ? results.token.text : undefined);
      xtoken.tokens = this._cursor.getRecentTokens();

      this._pendingTokens.push(xtoken);
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
         this._getXmlDecl(firstMarkup, target);
      } else {
         this._cursor.getSpace();   // optional space
         const results = this._cursor.getToTerminator([ '?>' ]);

         // If we found no ?> (thus, really, end of file) report an error.
         if (!results.terminator) {
            this._reportSyntaxError(XmlErrorToken.ERROR.PI_NO_TERMINATOR);
         } else {
            this._cursor.getMatch('?>');
         }

         const xtoken = new XmlToken(XmlToken.PI, target ? target.text : '');
         xtoken.content = results.token ? results.token.text : undefined;
         xtoken.tokens = this._cursor.getRecentTokens();

         this._pendingTokens.push(xtoken);
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
    * PARAMS This expects two string tokens '<?' and 'xml'
    * RETURN None.  however, this does add an XMLToken and possibly various
    *        syntax error tokens to the pending queue. The XMLToken is of type
    *        XmlToken.XMLDECL, with a params property, which is an array of
    *        objects corresponding to the "attributes" of the xml declaration
    *        in the order they were found, each object has a name and a value.
    */
   _getXmlDecl(start, target) {
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

      const xtoken = new XmlToken(XmlToken.XMLDECL, target.text);
      xtoken.params = params;
      xtoken.tokens = this._cursor.getRecentTokens();

      this._pendingTokens.push(xtoken);
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

         for (let index = 0; index < attributes.length; index++) {
            if (!attributes[index].nameToken.couldBeName) {
               this._reportSyntaxError(XmlErrorToken.ERROR.ATTRIBUTE_BAD_NAME,
                  'The attribute name does not match the syntax for names. Found: "' +
                     attributes[index].name + '".');
            }
         }
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
      const xtoken = new XmlToken(isStartOrEmpty ? startType : XmlToken.ELEMENT_END);
      xtoken.name = name ? name.text : '';
      xtoken.attributes = attributes;
      xtoken.tokens = this._cursor.getRecentTokens();

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
    * of this class is to try to cope reasonably with syntactically invalide
    * so processing can continue. There are some cases where parsing
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
    */
   _getAttributes(elementAttribute) {
      const attributes = [];
      let lastSpace = this._cursor.getSpace();
      let name = this._cursor.getWord(elementAttribute ? ATTRIBUTE_NAME_TERMINATORS : XMLDECL_NAME_TERMINATORS);

      while (name) {
         if (!lastSpace) {
            this._reportSyntaxError(XmlErrorToken.ERROR.NO_SPACE_BEFORE_ATTR);
         }

         this._cursor.getSpace();    // optional
         const equal = this._cursor.getMatch('=');     // =
         this._cursor.getSpace();    // optional
         const quote = this._cursor.peekChar(); // quote
         const gotQuote = quote && (quote.text === '"' || quote.text === '\'');
         let value;

         if (!equal) {
            this._reportSyntaxError(XmlErrorToken.ERROR.ATTRIBUTE_MISSING_EQUAL);
         }

         if (gotQuote) {
            const terminators = [ quote.text ];

            if (elementAttribute && !this._options['lax:allowOpenAngleBracketsInAttributeValues']) {
               terminators.push('<');
            }

            this._cursor.getChar();     // quote
            const result = this._cursor.getToTerminator(terminators);
            value = result.token;

            if (!result.terminator) {
               this._reportSyntaxError(XmlErrorToken.ERROR.ATTRIBUTE_MISSING_CLOSE_QUOTE);
            } else if (result.terminator === quote.text) {
               this._cursor.getChar();     // quote
            } else {
               this._reportSyntaxError(XmlErrorToken.ERROR.ATTRIBUTE_BAD_VALUE,
                  'An "<" was found in the value for attribute "' + name.text + '".');
               attributes.push(makePair(name, value, quote));
               break;   // Stop processing of attributes
            }
         } else if (!equal) {
            this._reportSyntaxError(XmlErrorToken.ERROR.ATTRIBUTE_MISSING_VALUE);
            attributes.push(makePair(name, undefined, undefined));

            name = this._cursor.getWord(elementAttribute ? ATTRIBUTE_NAME_TERMINATORS : XMLDECL_NAME_TERMINATORS);
            continue;   // without a quote, we assume there is no value and treat any following as a name
         } else {

            let terminators = elementAttribute ? ATTRIBUTE_VALUE_TERMINATORS : XMLDECL_VALUE_TERMINATORS;

            if (elementAttribute && this._options['lax:allowOpenAngleBracketsInAttributeValues']) {
               terminators = ATTRIBUTE_VALUE_TERMINATORS_LAX;
            }

            value = this._cursor.getWord(terminators);
            const terminator = this._cursor.peekChar();

            if (!value) {
               this._reportSyntaxError(XmlErrorToken.ERROR.ATTRIBUTE_MISSING_VALUE);
            } else {
               this._reportSyntaxError(XmlErrorToken.ERROR.ATTRIBUTE_MISSING_QUOTE);

               if (terminator && terminator.text === '<') {
                  this._reportSyntaxError(XmlErrorToken.ERROR.ATTRIBUTE_BAD_VALUE,
                     'An "<" was found in the value for attribute "' + name.text + '".');
                  attributes.push(makePair(name, value, undefined));
                  break;   // Stop processing of attributes
               }
            }
         }

         attributes.push(makePair(name, value, quote));

         lastSpace = this._cursor.getSpace();
         name = this._cursor.getWord(elementAttribute ? ATTRIBUTE_NAME_TERMINATORS : XMLDECL_NAME_TERMINATORS);
      }

      return attributes;
   }

   getNext() {
      if (this._pendingTokens.length > 0) {
         return this._pendingTokens.shift();
      }

      const token = this._nextToken();

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

}

module.exports = XmlTokenStream;
