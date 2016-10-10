/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const XmlEntityManager = require('./XmlEntityManager.js');
const XmlStringCursor = require('./XmlStringCursor.js');
const XmlTokenStream = require('./XmlTokenStream.js');

function makeLaxStream(str, options = {}) {
   options.lax = true;
   return makeStream(str, new XmlEntityManager(), options);
}

function makeStrictStream(str) {
   return makeStream(str, new XmlEntityManager(), {});
}

function makeStream(str, entityManager, options) {
   return new XmlTokenStream(new XmlStringCursor(str), entityManager, options);
}

function ignoreError(stream, errorCode) {
   const token = stream.getNext();
   expect(token.code).toEqual(errorCode);
}

function expectSyntaxError(input, code, message, place, context) {
   const strictS = makeStrictStream(input);
   const laxS = makeLaxStream(input);

   expect(() => {
      strictS.getNext();
   }).toThrowError(message);

   const error = laxS.getNext();
   expect(error).toBeSyntaxError(code);

   if (place) {
      expect(error.place).toEqual(place);
   }

   if (context) {
      expect(error.context).toEqual(context);
   }
}

module.exports = {
   expectSyntaxError,
   ignoreError,
   makeStrictStream,
   makeLaxStream
};
