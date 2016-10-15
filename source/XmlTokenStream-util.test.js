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

function makeStrictStream(str, options = {}) {
   return makeStream(str, new XmlEntityManager(), options);
}

function makeLaxExternalSubsetStream(str, options = {}) {
   options.lax = true;
   options.entityType = 'EXTERNAL_SUBSET';
   return makeStream(str, new XmlEntityManager(), options);
}

function makeStrictExternalSubsetStream(str, options = {}) {
   options.entityType = 'EXTERNAL_SUBSET';
   return makeStream(str, new XmlEntityManager(), options);
}

function makeStream(str, entityManager, options) {
   return new XmlTokenStream(new XmlStringCursor(str), entityManager, options);
}

function ignoreError(stream, errorCode) {
   const token = stream.getNext();
   expect(token.code).toEqual(errorCode);
}

function ignoreToken(stream, tokenType) {
   const token = stream.getNext();
   expect(token.type).toEqual(tokenType);
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

function expectExternalSubsetSyntaxError(input, code, message, place, context) {
   const strictS = makeStrictExternalSubsetStream(input);
   const laxS = makeLaxExternalSubsetStream(input);

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
   expectExternalSubsetSyntaxError,
   ignoreError,
   ignoreToken,
   makeStrictStream,
   makeLaxStream,
   makeLaxExternalSubsetStream,
   makeStrictExternalSubsetStream
};
