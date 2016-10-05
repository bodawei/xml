/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

const ATTR_TYPE_NAMES = [ 'CDATA', 'ID', 'IDREF', 'IDREFS', 'ENTITY', 'ENTITIES', 'NMTOKEN', 'NMTOKENS', 'NOTATION' ];

class XmlTokenStreamDtd {

   parseElement(cursor) {
      const results = {};

      results.elementName = cursor.getWord([ '>' ]);
      cursor.getSpace(); // no need to check this, as if no space, then no contentChunk
      const mixedStart = cursor.peekChar();

      if (!mixedStart || mixedStart.text !== '(') {
         results.contentChunk = cursor.getWord([ '>' ]);
      } else {
         cursor.getChar();
         const listInfo = this._getListItems(cursor, [ '>' ]);

         results.list = listInfo.list;
         results.listCloseChunk = listInfo.close;
         results.missingNames = listInfo.missingCount;
      }

      cursor.getSpace();
      results.closeChunk = cursor.getMatch('>');

      return results;
   }

   parseAttList(cursor) {
      const results = {
         attributes: []
      };
      let done = false;

      results.elementNameChunk = cursor.getWord([ '>' ]);

      while (!done) {
         const attr = {};

         cursor.getSpace();
         attr.name = cursor.getWord([ '>' ]);
         cursor.getSpace();
         attr.type = cursor.getWord([ '>', '(' ]);

         if (attr.type && attr.type.text.toLocaleUpperCase() === 'NOTATION') {
            attr.postNotationSpace = cursor.getSpace();
            attr.opening = cursor.peekChar();

            if (attr.opening && attr.opening.text === '(') {
               cursor.getChar();

               const listInfo = this._getListItems(cursor, [ '>' ]);

               attr.list = listInfo.list;
               attr.close = listInfo.close;
               attr.missingCount = listInfo.missingCount;
            }
         }

         attr.preDefaultSpace = cursor.getSpace();

         attr.default = cursor.getWord([ '>' ]);

         if (attr.name) {
            results.attributes.push(attr);
         } else {
            done = true;
         }
      }

      cursor.getSpace();
      results.closeChunk = cursor.getMatch('>');

      return results;
   }

   /**********************************************************************\
    _getListItems gets all the items from a list that is terminated
    by a ")", where individual items are terminated by "|"'s.

    If a "|" is missing, we assume that the list was ended prematurely.
    We could, theoretically, assume this just meant the "|" was omitted
    and keep reading items.  However, this runs the risk of consuming the
    whole file, in theory.  So, we err on a highly conservative position.

    If a name is omitted, we keep a count of the number of missing names
    (if, perchance, the whole file is nothing but |'s, then we will
    consume it all. seems unlikely in practice).

    PARAM
    terminators: An array of characters that could terminate the list
    beyond the ones we know.

    RETURN
    An object with these properties:
      list: An array of 0 or more WordChunks, each one representing a name
         found in the ist
      missingCount: The number of names missing from the list (e.g. empty
         space between "|"'s)
      close: The Chunk representing the closing ")" of the list, if found.
   \**********************************************************************/

   _getListItems(cursor, terminators) {
      const results = {
         list: [],
         missingCount: 0,
         close: undefined
      };
      const listTerminators = terminators.slice().concat([ ')', '|' ]);
      let done = false;

      while (!done) {
         let gotOr = false;
         cursor.getSpace();
         const aName = cursor.getWord(listTerminators);
         cursor.getSpace();
         const orChar = cursor.peekChar();

         if (orChar && orChar.text === '|') {
            cursor.getChar();
            gotOr = true;
         }

         cursor.getSpace();
         results.close = cursor.getMatch(')');

         if (aName) {
            results.list.push(aName);
         } else {
            results.missingCount++;
         }

         if (results.close || !gotOr) {
            done = true;
         }
      }

      return results;
   }

}

module.exports = XmlTokenStreamDtd;
