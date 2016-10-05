/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const XmlEntityManager = require('./XmlEntityManager.js');
const XmlStringCursor = require('./XmlStringCursor.js');
const XmlTokenStream = require('./XmlTokenStream.js');

function makeLaxStream(str) {
   return makeStream(str, new XmlEntityManager(), { lax: true });
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

function expectSyntaxError(input, code, message) {
   const strictS = makeStrictStream(input);
   const laxS = makeLaxStream(input);

   expect(() => {
      strictS.getNext();
   }).toThrowError(message);

   expect(laxS.getNext()).toBeSyntaxError(code);
}

module.exports = {
   expectSyntaxError,
   ignoreError,
   makeStrictStream,
   makeLaxStream
};
