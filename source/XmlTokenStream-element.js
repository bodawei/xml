/*Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

//const ATTRIBUTE_NAME_TERMINATORS = [ '=', '>', '/>' ];
//const ATTRIBUTE_VALUE_TERMINATORS_LAX = [ '>', '/>' ];
//const ATTRIBUTE_VALUE_TERMINATORS = [ '<', '>', '/>' ];
//
//const tokens = require('./XmlToken.js');

/**********************************************************************\

\**********************************************************************/

class XmlTokenStreamElement {

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
    * RETURN
    * An array of attributes. Each element has a name (string), a value
    * (array of XMLTokens) and a quoteType, which is either " or ' The
    * latter is only useful for reproducing the original quote type.
    */
   //_getAttributes(cursor, options) {
   //   const attributes = [];
   //   let abort = false;
   //   let attribute = {
   //      name: cursor.getWord(ATTRIBUTE_NAME_TERMINATORS)
   //   };
   //
   //   while (attribute.name && !abort) {
   //      attribute.preEqualSpace = cursor.getSpace();
   //      attribute.equal = cursor.getMatch('=');
   //      attribute.postEqualSpace = cursor.getSpace();
   //      attribute.quote = cursor.peekChar();
   //
   //      let parsedValue = { value: [] };
   //      const gotQuote = attribute.quote && (attribute.quote.text === '"' || attribute.quote.text === '\'');
   //
   //      if (gotQuote) {
   //         parsedValue = this._getQuotedValue(cursor, options);
   //      } else if (attribute.equal) {
   //         parsedValue = this._getOneWordValue(cursor, options);
   //      }
   //      // without a quote, we assume there is no value and treat any following as a name
   //
   //      abort = parsedValue.abort;
   //      attribute.value = parsedValue.value;
   //      attribute.trailingSpace = cursor.getSpace();
   //
   //      this._doCDataNormalization(attribute.value);
   //
   //      attributes.push(attribute);
   //
   //      if (abort) {
   //         attribute = {
   //            name: cursor.getWord(ATTRIBUTE_NAME_TERMINATORS)
   //         };
   //      }
   //   }
   //
   //   return attributes;
   //}
   //
   //// See §3.3.3 Attribute-Value Normalization
   //_doCDataNormalization(valueArray) {
   //   for (let index = 0; index < valueArray.length; index++) {
   //      const item = valueArray[index];
   //      if (item instanceof tokens.Text) {
   //         item.text = item.text.replace(/[\n\r\t]/g, ' ');
   //      }
   //   }
   //}
   //
   // @ @@@@ why don't we abort when we find any unexpected terminator?
   //_getOneWordValue(cursor, options) {
   //   const allowAngleBracket = options['lax:allowOpenAngleBracketsInAttributeValues'];
   //   const terminators = allowAngleBracket ? ATTRIBUTE_VALUE_TERMINATORS_LAX : ATTRIBUTE_VALUE_TERMINATORS;
   //
   //   const word = cursor.getWord(terminators);
   //   const terminator = this._cursor.peekChar();
   //
   //   return {
   //      value: word ? [ new tokens.Text(word.text, tokens.ATTR_NO_CHUNKS) ] : [],
   //      abort: (terminator && terminator.text === '<')
   //   };
   //}
   //
   ///**********************************************************************\
   // _getQuotedValue consumes the next data from the cursor to extract
   // the quoted value for an attribute.
   //
   // PARAMS
   // cursor: The cursor to read from
   // quoteChunk is the TextChunk containing the quote that opened the value
   // options @@@@@@@@@
   //
   // RETURN
   // {
   //   value: Array<XmlToken> Text, CharRef, Start/EndEntity tokens
   //   abort: true if this encountered a < in the attribute value, and
   //      options doesn't override that.
   // }
   //\**********************************************************************/
   //_getQuotedValue(cursor, options) {
   //   let parseMore = true;
   //   const result = {
   //      value: [],
   //      abort: false
   //   };
   //
   //   const terminators = [ quoteChunk.text, '&' ];
   //   if (options['lax:allowOpenAngleBracketsInAttributeValues']) {
   //      terminators.push('<');
   //   }
   //
   //   const quoteChunk = cursor.getChar();     // consume the quote that got us here DOC THIS
   //   while (parseMore) {
   //      const chunkInfo = cursor.getToTerminator(terminators);
   //      parseMore = false;
   //
   //      if (chunkInfo.chunk) {
   //         result.value.push(new tokens.Text(chunkInfo.chunk.text, tokens.ATTR_NO_CHUNKS));
   //      }
   //
   //      switch (chunkInfo.terminator) {
   //         case quoteChunk.text:
   //            cursor.getChar();
   //            break;
   //         case '&':
   //            //const start = cursor.getChar(); // consume the &
   //            //const tokens = this._getReference(start, true);
   //            //for (const index in tokens) {
   //            //   result.value.push(tokens[index]);
   //            //}
   //            parseMore = true;
   //            break;
   //         case '<':
   //            result.abort = true;
   //            break;
   //         default: // no terminator
   //            break;
   //      }
   //   }
   //
   //   return result;
   //}

}

module.exports = XmlTokenStreamElement;
