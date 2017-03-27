/*Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

const TextChunk = require('./shared/TextChunk.js');

const XMLDECL_NAME_TERMINATORS = [ '=', '?>' ];
const XMLDECL_VALUE_TERMINATORS = [ '?>' ];

const QUOTE_PIECE_TYPES = {
   CHAR_REF: 'CHAR_REF',
   GENERAL_REF: 'GENERAL_REF',
   PARAMETER_REF: 'PARAMETER_REF'
};

/**********************************************************************\
 XmlTokenStreamMisc provides a set of routines for parsing the "misc"
 production. Indirectly, this includes the XML and Text Declarations,
 since those look like processing instructions.

 SYNTAX
 [27]   	Misc	   ::=   	Comment | PI | S
\**********************************************************************/

class XmlTokenStreamMisc {

   /**********************************************************************\
    parseContent() extracts CharData from the input.  Note that this will
    extract a ]]> found in that content and return it in the array of
    chunks, if that is found. Technically illegal, but we need to provide
    enough information for a strict case

    PARAM
    cursor: The cursor to read from

    RETURN
      {
         chunks: An array of zero or more chunks
      }

    SYNTAX
    [14] CharData ::= [^<&]* - ([^<&]* ']]>' [^<&]*)
   \**********************************************************************/

   parseContent(cursor) {
      const results = [];
      let content;
      let keepGoing = true;

      do {
         content = cursor.getToTerminator([ '<', '&', ']]>' ]);

         if (content.chunk && content.chunk.text !== '') {
            results.push(content.chunk);
            keepGoing = false;
         }

         if (content.terminator === ']]>') {
            results.push(cursor.getMatch(']]>'));
         }

      } while (keepGoing && content.terminator && content.terminator !== '<');

      return {
         chunks: results
      };
   }

   /**********************************************************************\
    parseComment() does the parsing to extract a comment.

    PARAM
    cursor: The cursor to read from
    startChunk: The Chunk representing the <!--

    RETURN
      {
         startChunk: The opening <!-- of the comment
         commentChunk: The chunk containing the commment text.
            If no comment content (<!---->) this will be undefined.
         commentString: The string extracted from the commentChunk.
         closeChunk: The chunk for the closing -->, or undefined
            if not found
      }
    SYNTAX
    [15] Comment ::= '<!--' ((Char - '-') | ('-' (Char - '-')))* '-->'
   \**********************************************************************/

   parseComment(cursor, startChunk) {
      const results = {};
      const commentContent = cursor.getToTerminator([ '-->' ]);

      results.startChunk = startChunk;
      results.commentChunk = commentContent.chunk;
      results.commentString = results.commentChunk ?
         results.commentChunk.text : undefined;

      if (commentContent.terminator) {
         results.closeChunk = cursor.getMatch('-->');
      }

      return results;
   }

   /**********************************************************************\
    parseProcessingInstruction() does the parsing to extract either a
    processing instruction, or an XML Declaration, or a TextDeclaration.

    PARAM
    cursor: The cursor to read from
    startChunk: The Chunk representing the <!--

    RETURN
      {
         isXmlDecl: True if this looks like it is actually an XML/Text Decl
         openChunk: The opening <? of the comment
         postStartSpaceChunk: any space after the opening
         targetChunk: The chunk representing the target of the processing
            instruction.
         optSpaceChunk: Space after the target name
         instructionChunk: The content after the target
         closeChunk: The closing ?>, or undefined if not found
      }

    SYNTAX
    [16] PI       ::= '<?' PITarget (S (Char* - (Char* '?>' Char*)))? '?>'
    [17] PITarget ::= Name - (('X' | 'x') ('M' | 'm') ('L' | 'l'))
   \**********************************************************************/

   parseProcessingInstruction(cursor, startChunk) {
      const results = {};

      results.openChunk = startChunk;
      results.postStartSpaceChunk = cursor.getSpace();
      results.targetChunk = cursor.getWord([ '?>' ]);

      if (results.targetChunk &&
         results.targetChunk.text.toLocaleLowerCase() === 'xml') {
         results.isXmlDecl = true;
      } else {
         results.optSpaceChunk = cursor.getSpace();
         results.instructionChunk = cursor.getToTerminator([ '?>' ]).chunk;
         results.closeChunk = cursor.getMatch('?>');
      }

      return results;
   }

   /**********************************************************************\
    parseXmlDecl parses an XML Declaration which has the following format:

    RETURN
      {
         startChunk: The <? chunk
         postTargetSpace: The space after the 'xml'
         params: an params defined here
         closeChunk: The closing ?>, or undefined if not found
      }

    SYNTAX
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
   \**********************************************************************/
   parseXmlDecl(cursor, startChunk) {
      const results = {};

      results.startChunk = startChunk;
      results.postTargetSpace = cursor.getSpace();
      results.params = this._getParams(cursor);
      results.closeChunk = cursor.getMatch('?>');

      return results;
   }

   /**********************************************************************\
    parseBangItem

    RETURN
       {
         startChunk
       }
   \**********************************************************************/
   parseBangItem(cursor, startChunk) {
      const result = {
         startChunk: startChunk,
         postStartSpaceChunk: cursor.getSpace(),
         openBracket: cursor.getMatch('[')
      };

      if (result.openBracket) {
         return this._parseBracketItem(cursor, result);
      }

      result.declarationName = cursor.getWord([ '[', '>' ]); // could look for quotes, too
      result.postDeclarationNameSpace = cursor.getSpace();

      return result;
   }

   /**********************************************************************\
    parseBracketItem() extracts the start of a bracket item ( <![name[ )

    PARAM
    cursor: The cursor to read from
    startChunk: The Chunk representing the <!

    RETURN
      {
         startChunk: The start chunk. <!
         postStartSpaceChunk
         openBracket
         preTypeSpaceChunk: Space before the type
         typeChunk: The name
         typeString: The name or a blank
         postTypeSpaceChunk: Space after the name
         bracketTwoChunk: The second [
         contentChunk: In the case of a CDATA section, the contents
         closeChunk: The closing ]]>
      }

    SYNTAX
      [18] CDSect  ::=  CDStart CData CDEnd
      [19] CDStart ::=  '<![CDATA['
      [20] CData   ::=  (Char* - (Char* ']]>' Char*))
      [21] CDEnd   ::=  ']]>'
   \**********************************************************************/

   _parseBracketItem(cursor, results) {
      results.preTypeSpaceChunk = cursor.getSpace();
      results.typeChunk = cursor.getWord([ '[' ]);
      results.postTypeSpaceChunk = cursor.getSpace();
      results.bracketTwoChunk = cursor.getMatch('[');
      results.typeString = results.typeChunk ? results.typeChunk.text : '';

      const contents = cursor.getToTerminator([ ']]>' ]);

      results.contentChunk = contents.chunk;
      results.closeChunk = cursor.getMatch(']]>');

      return results;
   }

   /**********************************************************************\
    Parses whitespace

    RETURN
      {
         spaceChunk: The space
      }
   \**********************************************************************/
   parseSpace(cursor) {
      return {
         spaceChunk: cursor.getSpace()
      };
   }

   /**********************************************************************\
    parseReference

    RETURN
       Either a character reference or a general entity reference
   \**********************************************************************/
   parseReference(cursor, startChunk) {
      const spaceChunk = cursor.getSpace();
      const nextChunk = cursor.peekChar();

      if (nextChunk && nextChunk.text === '#') {
         return this.parseCharReference(cursor, startChunk, spaceChunk);
      } else {
         return this.parseEntityReference(cursor, startChunk, spaceChunk);
      }
   }

   /**********************************************************************\
    parseCharReference

    Note the & has already been read.  The # has been peeked

    RETURN
      {
         startChunk
         hashChunk
         postHashSpaceChunk
         hexMarkerChunk
         postHexSpaceChunk
         digitsChunk
         postDigitsSpaceChunk
         semicolonChunk
         character
      }
   \**********************************************************************/
   parseCharReference(cursor, startChunk, spaceChunk) {
      const result = {
         startChunk: startChunk,
         postStartSpaceChunk: spaceChunk
      };
      let isHex = false;

      result.hashChunk = cursor.getChar();
      result.postHashSpaceChunk = cursor.getSpace();
      const nextChar = cursor.peekChar();

      result.hexMarkerChunk = undefined;
      result.postHexSpaceChunk = undefined;
      if (nextChar && nextChar.text.toLocaleLowerCase() === 'x') {
         isHex = true;
         result.hexMarkerChunk = cursor.getChar();
         result.postHexSpaceChunk = cursor.getSpace();
      }

      result.digitsChunk = cursor.getDigits();
      result.postDigitsSpaceChunk = cursor.getSpace();
      result.semicolonChunk = cursor.getMatch(';');

      if (result.digitsChunk) {
         if (!result.digitsChunk.isDecimal) {
            isHex = true;
         }

         result.character = String.fromCharCode(parseInt(result.digitsChunk.text, isHex ? 16 : 10));
      }

      return result;
   }

   /**********************************************************************\
    parseEntityReference

    RETURN
      {
         startChunk
         nameChunk
         postNameSpaceChunk
         semicolonChunk
      }
   \**********************************************************************/
   parseEntityReference(cursor, startChunk, spaceChunk) {
      const result = {
         startChunk: startChunk,
         postStartSpaceChunk: spaceChunk
      };

      result.nameChunk = cursor.getWord([ ';' ]);
      result.postNameSpaceChunk = cursor.getSpace();
      result.semicolonChunk = cursor.getMatch(';');

      return result;
   }

   /**********************************************************************\
    parseQuotedValue

    RETURN
      {
         startQuoteChunk
         items
         stopQuoteChunk
      }
   \**********************************************************************/
   parseQuotedValue(cursor, options = {}) {
      const result = {
         startQuoteChunk: cursor.getChar(),
         items: [],
         stopQuoteChunk: undefined
      };
      const terminators = options.terminators ? options.terminators.slice(0) : [];
      let toPrepend;
      let block;

      terminators.push(result.startQuoteChunk.text);

      if (options.charRef || options.geRef) {
         terminators.push('&');
      }

      if (options.peRef) {
         terminators.push('%');
      }

      do {
         block = cursor.getToTerminator(terminators);

         if (block.chunk) {
            if (toPrepend) {
               block.chunk = this._combineChunks(toPrepend, block.chunk);
               toPrepend = undefined;
            }
            result.items.push(block.chunk);
         } else if (toPrepend) {
            result.items.push(toPrepend);
         }

         if (block.terminator === '&') {
            const ampersand = cursor.getChar();
            const spaceChunk = cursor.getSpace();
            const hashChunk = cursor.peekChar() || {};

            if (hashChunk.text === '#') {
               if (options.charRef) {
                  result.items.push({
                     type: QUOTE_PIECE_TYPES.CHAR_REF,
                     parsed: this.parseCharReference(cursor, ampersand, spaceChunk)
                  });
               } else {
                  toPrepend = ampersand;
               }
            } else if (options.geRef) {
               result.items.push({
                  type: QUOTE_PIECE_TYPES.GENERAL_REF,
                  parsed: this.parseEntityReference(cursor, ampersand, spaceChunk)
               });
            } else {
               toPrepend = this._combineChunks(ampersand, spaceChunk);
            }

            if (toPrepend) {
               const lastChunk = result.items.pop();
               toPrepend = this._combineChunks(lastChunk, toPrepend);
            }
         } else if (block.terminator === '%') {
            const percent = cursor.getChar();
            result.items.push({
               type: QUOTE_PIECE_TYPES.PARAMETER_REF,
               parsed: this.parseEntityReference(cursor, percent)
            });
         } else if (block.terminator === result.startQuoteChunk.text) {
            result.stopQuoteChunk = cursor.getChar();
            break;
         } else {
            // some terminator provided by the caller
            break;
         }
      } while (block.terminator);

      return result;
   }

   combineChunks(...args) {
      const chunks = [];
      for (let index = 0; index < args.length; index++) {
         if (args[index]) {
            chunks.push(args[index]);
         }
      }

      let accumulator = chunks[0];

      for (let index = 1; index < chunks.length; index++) {
         accumulator = this._combineChunks(accumulator, chunks[index]);
      }

      return accumulator;
   }

   _combineChunks(first, second) {
      if (!first) {
         return second;
      }
      if (!second) {
         return first;
      }

      if (first instanceof TextChunk.WithSpaceChunk) {
         if (second instanceof TextChunk.WithSpaceChunk) {
            first.originalText += second.originalText;
         } else {
            first.originalText += second.text;
         }
      } else if (second instanceof TextChunk.WithSpaceChunk) {
         second.text = first.text + second.text;
         second.originalText = first.text + second.originalText;
         second.startOffset = first.startOffset;
         return second;
      }

      first.text += second.text;
      first.endOffset = second.endOffset;
      return first;
   }

   /**********************************************************************\
    Parses the params of an XML or Text Declaration.
    Tolerates a missing = and value, or a missing value, or an unquoted
    value.

    RETURN
      [{
         nameChunk: The name of the attribute. Never undefined
         postNameSpaceChunk: Optional space after the name
         equalChunk: The chunk representing the = after the name
         postEqualSpaceChunk: Space after the =
         quoteChunk: The chunk for the quote after the equal
         valueChunk: Chunk of the value in the quotes. Note that this
            may be present if a quote is not present.
         trailingSpaceChunk: Any space after the closing quote or value
      }]
   \**********************************************************************/
   _getParams(cursor) {
      const attributes = [];
      let attribute;

      let name = cursor.getWord(XMLDECL_NAME_TERMINATORS);

      while (name) {
         attribute = {
            nameChunk: name,
            postNameSpaceChunk: cursor.getSpace(),
            equalChunk: cursor.getMatch('='),
            postEqualSpaceChunk: cursor.getSpace()
         };

         const quote = cursor.peekChar();
         const gotQuote = quote && (quote.text === '"' || quote.text === '\'');

         if (gotQuote) {
            attribute.val = this.parseQuotedValue(cursor, {
               terminators: [ '?>' ]
            });

            attribute.postValueQuoteChunk = attribute.val.startQuoteChunk;
            attribute.trailingSpaceChunk = cursor.getSpace();
         } else if (attribute.equalChunk) {
            attribute.val = {
               items: [ cursor.getWord(XMLDECL_VALUE_TERMINATORS) ]
            };
            attribute.trailingSpaceChunk = cursor.getSpace();
         } else {
            attribute.trailingSpaceChunk = attribute.postNameSpaceChunk;
            delete attribute.postNameSpaceChunk;
         }

         attributes.push(attribute);

         name = cursor.getWord(XMLDECL_NAME_TERMINATORS);
      }

      return attributes;
   }

}

XmlTokenStreamMisc.TYPE = QUOTE_PIECE_TYPES;

module.exports = XmlTokenStreamMisc;
