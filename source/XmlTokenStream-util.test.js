/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const Offset = require('./shared/Offset.js');
const EntityMetaData = require('./shared/EntityMetaData.js');
const EntityLocation = require('./shared/EntityLocation.js');
const SyntaxError = require('./error/SyntaxError.js');
const TextChunk = require('./shared/TextChunk.js');
const XmlEntityManager = require('./XmlEntityManager.js');
const XmlStringCursor = require('./XmlStringCursor.js');
const XmlTokenStream = require('./XmlTokenStream.js');
const XmlWarning = require('./error/XmlWarning.js');

function makeStream(str, type, entityManager, options) {
   if (typeof type === 'string') {
      type = new EntityMetaData(type, 1.0, 5, new EntityLocation());
   }

   return new XmlTokenStream(new XmlStringCursor(str, type), entityManager, options);
}

function makeLaxStream(str, type, options = {}) {
   if (!(type instanceof EntityMetaData)) {
      options = type || {};
      type = new EntityMetaData();
   }

   options.lax = true;
   return makeStream(str, type, new XmlEntityManager(), options);
}

function makeStrictStream(str, type, options = {}) {
   if (!(type instanceof EntityMetaData)) {
      options = type || {};
      type = new EntityMetaData();
   }

   return makeStream(str, type, new XmlEntityManager(), options);
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
   const token = stream.read();
   expect(token.id).toEqual(errorCode);
}

function ignoreToken(stream, tokenType) {
   const token = stream.read();

   if (typeof tokenType === 'string') {
      expect(token.type).toEqual(tokenType);
   } else {
      expect(token instanceof tokenType).toEqual(true);
   }
}

function expectProblem(entityType, input, id, message, place, context) {
   if (!EntityMetaData.TYPE[entityType] && !(entityType instanceof EntityMetaData)) {
      context = place;
      place = message;
      message = id;
      id = input;
      input = entityType;
      entityType = EntityMetaData.TYPE.DOCUMENT;
   }

   if (EntityMetaData.TYPE[entityType]) {
      entityType = new EntityMetaData(entityType);
   }

   const strictS = new XmlTokenStream(new XmlStringCursor(input, entityType), new XmlEntityManager(), {});
   const laxS = new XmlTokenStream(new XmlStringCursor(input, entityType), new XmlEntityManager(), { lax: true });
   let strictError;

   strictS.on('error', (err) => {
      if (!strictError) {
         strictError = err;
      }
   });

   strictS.read();
   expect(strictError.message).toEqual(message);

   const error = laxS.read();
   expect(error.id).toEqual(id);

   if (place) {
      expect(error.place).toEqual(place);
   }

   if (context) {
      expect(error.context).toEqual(context);
   }

   return error;
}

function expectSyntaxError(entityType, input, id, message, place, context) {
   const error = expectProblem(entityType, input, id, message, place, context);

   expect(error instanceof SyntaxError).toEqual(true);
}

function expectXmlWarning(entityType, input, id, message, place, context) {
   const error = expectProblem(entityType, input, id, message, place, context);

   expect(error instanceof XmlWarning).toEqual(true);
}

function expectExternalSubsetSyntaxError(input, code, message, place, context) {
   const strictS = makeStrictExternalSubsetStream(input);
   const laxS = makeLaxExternalSubsetStream(input);
   let strictError;

   strictS.on('error', (err) => {
      if (!strictError) {
         strictError = err;
      }
   });

   strictS.read();
   expect(strictError.message).toEqual(message);

   const error = laxS.read();
   expect(error).toBeSyntaxError(code);

   if (place) {
      expect(error.place).toEqual(place);
   }

   if (context) {
      expect(error.context).toEqual(context);
   }
}

function expectTokenType(stream, tokenType) {
   const t = stream.read();

   if (typeof tokenType === 'string') {
      expect(t.type).toEqual(tokenType);
   } else {
      const result = (t instanceof tokenType) ? tokenType.name : 'Unexpected Type in expectTokenType(). Found: ' + t;
      expect(result).toEqual(tokenType.name);
   }
}

function expectError(stream, id, message) {
   const t = stream.read();

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

function makePlainChunk(text, start, end) {
   end = end || start + text.length;
   return new TextChunk.PlainChunk(text,
      new Offset(0, start, start), new Offset(0, end, end), new EntityLocation(''));
}

function makeDigitsChunk(text, start, end, isDecimal) {
   end = end || start + text.length;
   return new TextChunk.DigitChunk(text, isDecimal,
      new Offset(0, start, start), new Offset(0, end, end), new EntityLocation(''));
}

function makeWithSpaceChunk(text, start, end, originalText) {
   end = end || start + text.length;
   return new TextChunk.WithSpaceChunk(text, originalText || text,
      new Offset(0, start, start), new Offset(0, end, end), new EntityLocation(''));
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
   makeStringTokenArray,
   makePlainChunk,
   makeWithSpaceChunk,
   makeDigitsChunk
};
