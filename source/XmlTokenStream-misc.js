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

   /*
   parseProcessingInstruction(cursor, startChunk) {
      const results = {};

      results.postStartSpaceChunk = cursor.getSpace();
      results.targetChunk = cursor.getWord([ '?>' ]);

      if (results.targetChunk &&
         results.targetChunk.text.toLocaleLowerCase() === 'xml') {
         //this._getXmlDecl(start);
      } else {
         results.optSpaceChunk = cursor.getSpace();   // optional space
         results.instructionChunk = cursor.getToTerminator([ '?>' ]);
         results.closeChunk = cursor.getMatch('?>');
      }

      return results;
   }
   */

}

module.exports = XmlTokenStreamMisc;
