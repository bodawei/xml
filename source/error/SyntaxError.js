/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

const Offset = require('../Offset.js');
const StringBundle = require('../util/StringBundle.js');
const TextChunk = require('../TextChunk.js');
const XmlError = require('./XmlError.js');
const strings = require('../derive/base.json');

const stringBuffer = new StringBundle(strings);

/**********************************************************************\
 SyntaxError holds inforamtion about a syntax error
\**********************************************************************/

class SyntaxError extends XmlError {

   /**********************************************************************\
    Construct a syntax error, and look up the message associated with
    the specified code.

    PARAM
    code: The error code
    params: Optional. An array of values that should be substituted into
      the message.
    place: an Offset describing where the error happened when parsingm or
      a TextChunk, in which case the endOffset will be used
    context: an array of Offsets ir a sungke TextChunk.  If it is an array
      then each describing where the start of a syntactic element was when
      the error happened.  For example, if parsing encountered
         <blah error>
      the first Offset would be the location of the <.  If this was in the
      body of an entity being processed, the next Offset would be the start
      of that entity reference, and if that, in turn, was in another, the
      next Offset would be the start of that reference, and so on.
      If itis a TextChunk, then its startOffset will be used.
   \**********************************************************************/
   constructor(code, params, place, context) {
      super();

      if (typeof params === 'object') {
         if (params instanceof Offset || params instanceof TextChunk.PlainChunk) {
            context = place;
            place = params;
            params = [];
         }
      }

      params = params || [];

      if (place instanceof TextChunk.PlainChunk) {
         place = place.endOffset;
      }

      if (context && context instanceof TextChunk.PlainChunk) {
         context = [ context.startOffset ];
      }

      this.code = code;
      this.message = stringBuffer.substitute(code, params);
      this.place = place;
      this.context = context;
   }

}

SyntaxError.ERROR = {};

for (const key in strings.base) {
   SyntaxError.ERROR[key] = key;
}

module.exports = SyntaxError;
