/*Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

const ATTRIBUTE_NAME_TERMINATORS = [ '=', '>', '/>' ];
const ATTRIBUTE_VALUE_TERMINATORS_LAX = [ '>', '/>' ];

const XmlTokenStreamMisc = require('./XmlTokenStream-misc.js');

/**********************************************************************\

\**********************************************************************/

const XmlTokenStreamElement = {

   /*
    * Parse the XML start or end tag, and queues the return token and/or any
    * errors found
    *  [40] STag ::= '<' Name (S Attribute)* S? '>'
    *  [42] ETag ::= '</' Name S? '>'
    *  [44] EmptyElemTag ::= '<' Name (S Attribute)* S? '/>'
    * PARAMS isStartOrEmpty: true if this is a start or empty tag, or false
    *        if an end tag
    * RETURN {
    *    ... stuff..
    * }
    */
   parseStartTag(cursor, start) {
      const results = {
         startChunk: start
      };

      results.preNameSpaceChunk = cursor.getSpace();
      results.nameChunk = cursor.getWord([ '>', '/>' ]);
      results.postNameSpaceChunk = cursor.getSpace();
      results.attributes = this._parseAttributes(cursor);
      results.closeChunk = cursor.getMatch('>');
      results.isEmpty = false;

      if (!results.closeChunk) {
         results.closeChunk = cursor.getMatch('/>');

         if (results.closeChunk) {
            results.isEmpty = true;
         }
      }

      return results;
   },

   parseEndTag(cursor, start) {
      const results = {
         startChunk: start
      };

      results.preNameSpaceChunk = cursor.getSpace();
      results.nameChunk = cursor.getWord([ '>', '/>' ]);
      results.postNameSpaceChunk = cursor.getSpace();
      results.closeChunk = cursor.getMatch('>');

      if (!results.closeChunk) {
         results.closeChunk = cursor.getMatch('/>');
      }

      return results;
   },

   /**********************************************************************\
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
   \**********************************************************************/
   _parseAttributes(cursor) {
      const attributes = [];
      let attribute = {
         name: cursor.getWord(ATTRIBUTE_NAME_TERMINATORS)
      };

      while (attribute.name) {
         attribute.preEqualSpace = cursor.getSpace();
         attribute.equal = cursor.getMatch('=');
         attribute.postEqualSpace = cursor.getSpace();
         const quote = cursor.peekChar();

         let parsedValue = { value: [] };
         const gotQuote = quote && (quote.text === '"' || quote.text === '\'');

         if (gotQuote) {
            parsedValue = XmlTokenStreamMisc.parseQuotedValue(cursor, {
               terminators: [ '>' ],
               charRef: true,
               geRef: true
            });
            attribute.value = parsedValue;
            attribute.closeQuote = parsedValue.stopQuoteChunk;
         } else if (attribute.equal) {
            attribute.value = this._getOneWordValue(cursor);
         } else {
            attribute.value = {
               items: []
            };
         }
         // without a quote, we assume there is no value and treat any following as a name

         attribute.trailingSpace = cursor.getSpace();

         this._doCDataNormalization(attribute.value.items);

         attributes.push(attribute);

         attribute = {
            name: cursor.getWord(ATTRIBUTE_NAME_TERMINATORS)
         };
      }

      return attributes;
   },

   // See §3.3.3 Attribute-Value Normalization
   _doCDataNormalization(valueArray) {
      for (let index = 0; index < valueArray.length; index++) {
         const item = valueArray[index];
         if (item.text) {
            item.text = item.text.replace(/[\n\r\t]/g, ' ');
         }
      }
   },

   _getOneWordValue(cursor) {
      const word = cursor.getWord(ATTRIBUTE_VALUE_TERMINATORS_LAX);

      return {
         items: word ? [ word ] : []
      };
   }

}

module.exports = XmlTokenStreamElement;
