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
    place: An Offset or a TextChunk  (optional only for legacy purposes)
       Speifies where the error happened in the original text (before
       line ending handling etc).
       If an Offset is specified, it will be copied and used directly.
       If a TextChunk is specified, it's endOffset will be used. This
       is just a convenience for calling.
    context: an array of Offsets of a single TextChunk.
       Specifies the start of each hierarchical syntactic entity we are
       in the middle of parsing. So, if we are parsing &foo: and foo
       references &bar and &bar references <%badName>, the context
       will be the offset of the & of foo, the & at the offset of bar
       and the offset to the <. in that order. The last item in the
       context may or may not be the same as place.
       If a TextChunk is specified, its startOffset will be used. This
       is a shortcut for making a common calling case easier.
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
         place = place.endOffset;   // should be cloning
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
