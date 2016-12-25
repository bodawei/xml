/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

const Offset = require('../shared/Offset.js');
const StringBundle = require('../shared/StringBundle.js');
const TextChunk = require('../shared/TextChunk.js');
const XmlError = require('./XmlError.js');
const strings = require('../derive/WellFormednessError.json');
const codes = require('../derive/WellFormednessError-code.json');

const stringBundle = new StringBundle(strings);

/**********************************************************************\
 WellFormednessError holds inforamtion about a syntax error
\**********************************************************************/

class WellFormednessError extends XmlError {

   /**********************************************************************\
    Construct a syntax error, and look up the message associated with
    the specified code.

    PARAM
    id: The error id
    params: Optional. An array of values that should be substituted into
       the message.
    place: An Offset or a TextChunk  (optional only for legacy purposes)
       Speifies where the error happened in the original text (before
       line ending handling etc).
       If an Offset is specified, it will be copied and used directly.
       If a TextChunk is specified, it's endOffset will be used. This
       is just a convenience for calling.
    contextOffset: an array of Offsets of a single TextChunk.
       Specifies the start of each hierarchical syntactic entity we are
       in the middle of parsing. So, if we are parsing &foo: and foo
       references &bar and &bar references <%badName>, the context
       will be the offset of the & of foo, the & at the offset of bar
       and the offset to the <. in that order. The last item in the
       context may or may not be the same as place.
       If a TextChunk is specified, its startOffset will be used. This
       is a shortcut for making a common calling case easier.
    entityLocation: The EntityLocation where this error occurred  Will
       be made part of the context.
   \**********************************************************************/
   constructor(id, params, place, contextOffset, entityLocation) {
      super(id);

      if (typeof params === 'object') {
         if (params instanceof Offset || params instanceof TextChunk.PlainChunk) {
            contextOffset = place;
            place = params;
            params = [];
         }
      }

      params = params || [];

      if (place instanceof TextChunk.PlainChunk) {
         place = place.endOffset;   // should be cloning
      }

      if (contextOffset) {
         if (contextOffset instanceof TextChunk.PlainChunk) {
            contextOffset = contextOffset.startOffset.clone();
         } else if (contextOffset instanceof Offset) {
            contextOffset = contextOffset.clone();
         }
      }

      if (!codes[id]) {
         const message = 'The Error id "' + id + '" is not a legal id.';

         throw Error(id ? message : 'No error id passed to WellFormednessError.');
      }

      this.code = codes[id];
      this.message = stringBundle.substitute(id, params);
      this.place = place ? place.clone() : undefined;
      this.context = [ {
         offset: contextOffset,
         location: entityLocation
      } ];
   }

}

WellFormednessError.ID = {};

for (const key in strings.base) {
   WellFormednessError.ID[key] = key;
}

WellFormednessError.setPreferredLocale = function setPreferredLocale(localeName) {
   stringBundle.preferredLocale = localeName;
};

WellFormednessError.addLocale = function addLocale(localeName, strings) {
   stringBundle.addLocale(localeName, strings);
};

WellFormednessError.removeLocale = function removeLocale(localeName) {
   return stringBundle.removeLocale(localeName);
};

module.exports = WellFormednessError;
