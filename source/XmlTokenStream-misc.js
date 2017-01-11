/*Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

const XMLDECL_NAME_TERMINATORS = [ '=', '?>' ];
const XMLDECL_VALUE_TERMINATORS = [ '?>' ];

/**********************************************************************\
 XmlTokenStreamMisc provides a set of routines for parsing the "misc"
 production. Indirectly, this includes the XML and Text Declarations,
 since those look like processing instructions.

 SYNTAX
 [27]   	Misc	   ::=   	Comment | PI | S
\**********************************************************************/

class XmlTokenStreamMisc {

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
            attribute.quoteChunk = cursor.getChar();
            const chunkInfo = cursor.getToTerminator([ quote.text ]);

            if (chunkInfo.chunk) {
               attribute.valueChunk = chunkInfo.chunk;
            }

            attribute.postValueQuoteChunk = cursor.getMatch(quote.text);
            attribute.trailingSpaceChunk = cursor.getSpace();
         } else if (attribute.equalChunk) {
            attribute.valueChunk = cursor.getWord(XMLDECL_VALUE_TERMINATORS);
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

module.exports = XmlTokenStreamMisc;
