/*Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

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

//   parseXmlDecl(cursor, startChunk) {
//      const results = {};
//
//      results.startChunk = startChunk;
//      results.params = this._getAttributes(cursor, false);
//      results.closeChunk = cursor.getMatch('?>');
//
//      return results;
//   }
//
//   _getAttributes(cursor, elementAttribute, options) {
//      const nameTerminators = elementAttribute ? ATTRIBUTE_NAME_TERMINATORS : XMLDECL_NAME_TERMINATORS;
//      let valueTerminators = elementAttribute ? ATTRIBUTE_VALUE_TERMINATORS : XMLDECL_VALUE_TERMINATORS;
//      const attributes = [];
//      let attribute;
//
//      if (elementAttribute && options['lax:allowOpenAngleBracketsInAttributeValues']) {
//         valueTerminators = ATTRIBUTE_VALUE_TERMINATORS_LAX;
//      }
//
//
//      let lastSpace = cursor.getSpace();
//      let name = this._cursor.getWord(nameTerminators);
//
//      while (name) {
//         attribute = {
//            preNameSpaceChunk: lastSpace,
//            nameChunk: name,
//            postNameSpaceChunk: cursor.getSpace(),    // optional
//            equalChunk: cursor.getMatch('='),
//            postEqualSpaceChunk: cursor.getSpace()    // optional
//         };
//
//         const quote = cursor.peekChar();
//         const gotQuote = quote && (quote.text === '"' || quote.text === '\'');
//         let value = [];
//
//         if (gotQuote) {
//            attribute.quoteChunk = cursor.getChar();     // consume the quote
//            const chunkInfo = cursor.getToTerminator([ quote.text ]);
//
//            if (chunkInfo.chunk) {
//               value.push(new tokens.Text(chunkInfo.chunk.text, tokens.ATTR_NO_CHUNKS));
//            }
//
//            const nextChar = cursor.peekChar();
//            if (nextChar && nextChar.text === quote.text) {
//               attribute.postValueQuoteChunk = cursor.getChar();
//            }
//         } else if (!attribute.equalChunk) {
//            attribute.extracted = makePair(name, value, undefined, elementAttribute);
//            name = cursor.getWord(nameTerminators);
//            continue;   // without a quote, we assume there is no value and treat any following as a name
//         } else {
//            attribute.valueChunk = cursor.getWord(valueTerminators);
//            if (attribute.valueChunk) {
//               value.push(new tokens.Text(attribute.valueChunk.text, tokens.ATTR_NO_CHUNKS));
//            }
//            const terminator = cursor.peekChar();
//
//            if (value.length !== 0) {
//               if (terminator && terminator.text === '<') {
//                  attribute.extracted = makePair(name, value, undefined, elementAttribute);
//                  break;   // Stop processing of attributes
//               }
//            }
//         }
//
//         if (elementAttribute) {
//            doCDataNormalization(value);
//         }
//         attribute.extracted = makePair(name, value, quote, elementAttribute);
//
//         if (!abort) {
//            lastSpace = cursor.getSpace();
//            name = cursor.getWord(nameTerminators);
//         }
//      }
//
//      return attributes;
//   }

}

//function makePair(nameChunk, valueChunk, quoteToken, elementAttribute) {
//   let value = valueChunk;
//
//   if (!elementAttribute) {
//      value = valueChunk.length !== 0 ? valueChunk[0].text : undefined;
//   }
//
//   return {
//      name: nameChunk.text,
//      value: value,
//      quoteType: quoteToken ? quoteToken.text : undefined
//   };
//}
//
//// See §3.3.3 Attribute-Value Normalization
//function doCDataNormalization(valueArray) {
//   for (let index = 0; index < valueArray.length; index++) {
//      const item = valueArray[index];
//      if (item instanceof tokens.Text) {
//         item.text = item.text.replace(/[\n\r\t]/g, ' ');
//      }
//   }
//}

module.exports = XmlTokenStreamMisc;
