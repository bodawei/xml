/* Copyright ® 2016-2017 by David John Burrowes. All rights reserved. */

'use strict';

const Offset = require('../shared/Offset.js');
const Chunk = require('../shared/Chunk.js');

/**********************************************************************\
 XmlError is a base type for all error objects.  It is a subtype of
 Error.

 This provides a bunch of common logic for setting up properties for
 all errors, but this relies on several properties defined on the
 relevant subclass constructors.

 PARAM
 id: The error id
 params: Optional. An array of values that should be substituted into
    the message.
 place: An Offset or a Chunk  (optional only for legacy purposes)
    Speifies where the error happened in the original text (before
    line ending handling etc).
    If an Offset is specified, it will be copied and used directly.
    If a Chunk is specified, it's endOffset will be used. This
    is just a convenience for calling.
 contextOffset: an array of Offsets of a single Chunk.
    Specifies the start of each hierarchical syntactic entity we are
    in the middle of parsing. So, if we are parsing &foo: and foo
    references &bar and &bar references <%badName>, the context
    will be the offset of the & of foo, the & at the offset of bar
    and the offset to the <. in that order. The last item in the
    context may or may not be the same as place.
    If a Chunk is specified, its startOffset will be used. This
    is a shortcut for making a common calling case easier.
 entityLocation: The EntityLocation where this error occurred  Will
    be made part of the context.
\**********************************************************************/

function XmlError(id, params, place, contextOffset, entityLocation) {
   this.id = id;

   if (typeof params === 'object') {
      if (params instanceof Offset || params instanceof Chunk) {
         contextOffset = place;
         place = params;
         params = [];
      }
   }

   params = params || [];

   if (place instanceof Chunk) {
      place = place.endOffset;   // should be cloning
      entityLocation = entityLocation || place.entityLocation;
   }

   if (contextOffset) {
      if (contextOffset instanceof Chunk) {
         contextOffset = contextOffset.startOffset.clone();
      } else if (contextOffset instanceof Offset) {
         contextOffset = contextOffset.clone();
      }
   }

   // Get the actual constructor object used so we can get at CODE and STRING
   const constructor = this.constructor;

   if (!constructor.CODE[id]) {
      const message = 'The Error id "' + id + '" is not a legal id.';

      throw Error(id ? message : 'No error id passed.');
   }

   this.code = constructor.CODE[id];
   this.message = constructor.STRING.substitute(id, params);
   this.place = place ? place.clone() : undefined;
   this.context = [ {
      offset: contextOffset,
      location: entityLocation
   } ];

}

XmlError.prototype = new Error();

module.exports = XmlError;
