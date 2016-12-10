/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

const Offset = require('../shared/Offset.js');
const StringBundle = require('../shared/StringBundle.js');
const TextChunk = require('../shared/TextChunk.js');
const XmlError = require('./XmlError.js');
const strings = require('../derive/XmlWarning.json');
const codes = require('../derive/XmlWarning-code.json');

const stringBundle = new StringBundle(strings);

/**********************************************************************\
 XmlWarning is used to report messages that are not fatal in nature.
\**********************************************************************/

class XmlWarning extends XmlError {

   /**********************************************************************\
    Construct a warning, and look up the message associated with the
    specified code.

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
   constructor(id, params, place, context) {
      super(id);

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

      if (context) {
         if (context instanceof TextChunk.PlainChunk) {
            context = [ context.startOffset ];
         }

         if (context instanceof Offset) {
            context = [ context ];
         }

         const newContext = [];
         for (let index = 0; index < context.length; index++) {
            newContext.push(context[index].clone());
         }
         context = newContext;
      }

      if (!codes[id]) {
         const message = 'The Error id "' + id + '" is not a legal id.';

         throw Error(id ? message : 'No error id passed to XmlWarning.');
      }

      this.code = codes[id];
      this.message = stringBundle.substitute(id, params);
      this.place = place ? place.clone() : undefined;
      this.context = context;
   }

}

XmlWarning.ID = {};

for (const key in strings.base) {
   XmlWarning.ID[key] = key;
}

XmlWarning.setPreferredLocale = function setPreferredLocale(localeName) {
   stringBundle.preferredLocale = localeName;
};

XmlWarning.addLocale = function addLocale(localeName, strings) {
   stringBundle.addLocale(localeName, strings);
};

XmlWarning.removeLocale = function removeLocale(localeName) {
   return stringBundle.removeLocale(localeName);
};

module.exports = XmlWarning;
