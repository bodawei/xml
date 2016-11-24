/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const Offset = require('./Offset.js');
const ParseKind = require('./util/ParseKind.js');
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

function makeLaxExternalEntityStream(str, options = {}) {
   options.lax = true;
   options.entityType = 'EXTERNAL_ENTITY';
   return makeStream(str, new XmlEntityManager(), options);
}

function makeStrictExternalEntityStream(str, options = {}) {
   options.entityType = 'EXTERNAL_ENTITY';
   return makeStream(str, new XmlEntityManager(), options);
}

function makeStream(str, entityManager, options) {
   return new XmlTokenStream(new XmlStringCursor(str), entityManager, options);
}

function ignoreError(stream, errorCode) {
   const token = stream.getNext();
   expect(token.id).toEqual(errorCode);
}

function ignoreToken(stream, tokenType) {
   const token = stream.getNext();

   if (typeof tokenType === 'string') {
      expect(token.type).toEqual(tokenType);
   } else {
      expect(token instanceof tokenType).toEqual(true);
   }
}

function expectSyntaxError(entityType, input, code, message, place, context) {
   if (!ParseKind.ENTITY_TYPE[entityType]) {
      context = place;
      place = message;
      message = code;
      code = input;
      input = entityType;
      entityType = ParseKind.ENTITY_TYPE.DOCUMENT_ENTITY;
   }

   let strictS;
   let laxS;

   switch (entityType) {
      case ParseKind.ENTITY_TYPE.DOCUMENT_ENTITY:
         strictS = makeStrictStream(input);
         laxS = makeLaxStream(input);
         break;
      case ParseKind.ENTITY_TYPE.EXTERNAL_ENTITY:
         strictS = makeStrictExternalEntityStream(input);
         laxS = makeLaxExternalEntityStream(input);
         break;
      case ParseKind.ENTITY_TYPE.EXTERNAL_SUBSET:
         strictS = makeStrictExternalSubsetStream(input);
         laxS = makeLaxExternalSubsetStream(input);
         break;
   }

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

function expectTokenType(stream, tokenType) {
   const t = stream.getNext();

   if (typeof tokenType === 'string') {
      expect(t.type).toEqual(tokenType);
   } else {
      expect(t instanceof tokenType).toEqual(true);
   }
}

function expectError(stream, id, message) {
   const t = stream.getNext();

   expect(t).toEqualProps({
      id: id,
      message: message
   });
}

function makeStringTokenArray(values, offset = 0) {
   const results = [];

   for (let index = 0; index < values.length; index++) {
      const length = values[index].text.length;
      values[index].startOffset = new Offset(0, offset, offset);
      values[index].endOffset = new Offset(0, offset + length, offset + length);

      results.push(values[index]);
      offset += length;
   }

   return results;
}

module.exports = {
   expectSyntaxError,
   expectExternalSubsetSyntaxError,
   expectTokenType,
   expectError,
   ignoreError,
   ignoreToken,
   makeStrictStream,
   makeLaxStream,
   makeLaxExternalSubsetStream,
   makeStrictExternalSubsetStream,
   makeLaxExternalEntityStream,
   makeStrictExternalEntityStream,
   makeStringTokenArray
};
