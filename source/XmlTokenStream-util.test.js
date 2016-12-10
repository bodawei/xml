/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const Offset = require('./shared/Offset.js');
const EntityMetaData = require('./shared/EntityMetaData.js');
const EntityLocation = require('./shared/EntityLocation.js');
const XmlEntityManager = require('./XmlEntityManager.js');
const XmlStringCursor = require('./XmlStringCursor.js');
const XmlTokenStream = require('./XmlTokenStream.js');

function makeStream(str, type, entityManager, options) {
   const entityMd = type ? new EntityMetaData(type, 1.0, 5, new EntityLocation()) : undefined;
   return new XmlTokenStream(new XmlStringCursor(str, entityMd), entityManager, options);
}

function makeLaxStream(str, options = {}) {
   options.lax = true;
   return makeStream(str, undefined, new XmlEntityManager(), options);
}

function makeStrictStream(str, options = {}) {
   return makeStream(str, undefined, new XmlEntityManager(), options);
}

function makeLaxExternalSubsetStream(str, options = {}) {
   options.lax = true;
   return makeStream(str, EntityMetaData.TYPE.EXTERNALSUBSET, new XmlEntityManager(), options);
}

function makeStrictExternalSubsetStream(str, options = {}) {
   return makeStream(str, EntityMetaData.TYPE.EXTERNALSUBSET, new XmlEntityManager(), options);
}

function makeLaxExternalEntityStream(str, options = {}) {
   options.lax = true;
   return makeStream(str, EntityMetaData.TYPE.EXTERNAL, new XmlEntityManager(), options);
}

function makeStrictExternalEntityStream(str, options = {}) {
   return makeStream(str, EntityMetaData.TYPE.EXTERNAL, new XmlEntityManager(), options);
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
   if (!EntityMetaData.TYPE[entityType]) {
      context = place;
      place = message;
      message = code;
      code = input;
      input = entityType;
      entityType = EntityMetaData.TYPE.DOCUMENT;
   }

   let strictS;
   let laxS;

   switch (entityType) {
      case EntityMetaData.TYPE.DOCUMENT:
         strictS = makeStrictStream(input);
         laxS = makeLaxStream(input);
         break;
      case EntityMetaData.TYPE.EXTERNAL:
         strictS = makeStrictExternalEntityStream(input);
         laxS = makeLaxExternalEntityStream(input);
         break;
      case EntityMetaData.TYPE.EXTERNALSUBSET:
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

function expectXmlWarning(entityType, input, code, message, place, context) {
   if (!EntityMetaData.TYPE[entityType]) {
      context = place;
      place = message;
      message = code;
      code = input;
      input = entityType;
      entityType = EntityMetaData.TYPE.DOCUMENT;
   }

   let strictS;
   let laxS;

   switch (entityType) {
      case EntityMetaData.TYPE.DOCUMENT:
         strictS = makeStrictStream(input);
         laxS = makeLaxStream(input);
         break;
      case EntityMetaData.TYPE.EXTERNAL:
         strictS = makeStrictExternalEntityStream(input);
         laxS = makeLaxExternalEntityStream(input);
         break;
      case EntityMetaData.TYPE.EXTERNALSUBSET:
         strictS = makeStrictExternalSubsetStream(input);
         laxS = makeLaxExternalSubsetStream(input);
         break;
   }

   expect(() => {
      strictS.getNext();
   }).toThrowError(message);

   const error = laxS.getNext();
//   expect(error.type).toBeSyntaxError(code);

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
      values[index].entityLocation = new EntityLocation();

      results.push(values[index]);
      offset += length;
   }

   return results;
}

module.exports = {
   expectSyntaxError,
   expectXmlWarning,
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
