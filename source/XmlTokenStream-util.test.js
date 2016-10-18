/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const XmlEntityManager = require('./XmlEntityManager.js');
const XmlStringCursor = require('./XmlStringCursor.js');
const XmlTokenStream = require('./XmlTokenStream.js');

const ENTITY_TYPES = {
   DOCUMENT_ENTITY: 'DOCUMENT_ENTITY',
   EXTERNAL_ENTITY: 'EXTERNAL_ENTITY',
   EXTERNAL_SUBSET: 'EXTERNAL_SUBSET'
};

const ENTITY_TYPES_ARRAY = [
   ENTITY_TYPES.DOCUMENT_ENTITY,
   ENTITY_TYPES.EXTERNAL_ENTITY,
   ENTITY_TYPES.EXTERNAL_SUBSET
];

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
   expect(token.code).toEqual(errorCode);
}

function ignoreToken(stream, tokenType) {
   const token = stream.getNext();
   expect(token.type).toEqual(tokenType);
}

function expectSyntaxError(entityType, input, code, message, place, context) {
   if (ENTITY_TYPES_ARRAY.indexOf(entityType) === -1) {
      context = place;
      place = message;
      message = code;
      code = input;
      input = entityType;
      entityType = ENTITY_TYPES.DOCUMENT_ENTITY;
   }

   let strictS;
   let laxS;

   switch (entityType) {
      case ENTITY_TYPES.DOCUMENT_ENTITY:
         strictS = makeStrictStream(input);
         laxS = makeLaxStream(input);
         break;
      case ENTITY_TYPES.EXTERNAL_ENTITY:
         strictS = makeStrictExternalEntityStream(input);
         laxS = makeLaxExternalEntityStream(input);
         break;
      case ENTITY_TYPES.EXTERNAL_SUBSET:
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

function expectTokenType(stream, type) {
   const t = stream.getNext();
   expect(t.type).toEqual(type);
}

module.exports = {
   expectSyntaxError,
   expectExternalSubsetSyntaxError,
   expectTokenType,
   ignoreError,
   ignoreToken,
   makeStrictStream,
   makeLaxStream,
   makeLaxExternalSubsetStream,
   makeStrictExternalSubsetStream,
   makeLaxExternalEntityStream,
   makeStrictExternalEntityStream,
   ENTITY_TYPES
};
