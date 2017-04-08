/* Copyright ® 2016-2017 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const Chunk = require('./shared/Chunk.js');
const EntityLocation = require('./shared/EntityLocation.js');
const XmlEntityManager = require('./XmlEntityManager.js');
const XmlStringCursor = require('./XmlStringCursor.js');
const tokens = require('./XmlToken.js');

const TEST_CHUNKS = [ new Chunk('from test') ];

function extractEntityText(manager, name) {
   return manager.getEntity(name).getToTerminator([ 'EOF' ]);
}

function extractParamEntityText(manager, name) {
   return manager.getParameterEntity(name).getToTerminator([ 'EOF' ]);
}

function makeToken(name, text, location, notationName) {
   return new tokens.EntityDeclaration(name, [ new tokens.Text(text, tokens.ATTR_NO_CHUNKS) ], location, notationName,
      TEST_CHUNKS);
}

function makePEToken(name, text, location, notationName) {
   return new tokens.PEntityDeclaration(name, [ new tokens.Text(text, tokens.ATTR_NO_CHUNKS) ], location, notationName,
      TEST_CHUNKS);
}

describe('XmlEntityManager', () => {

   let manager;

   beforeEach(() => {
      manager = new XmlEntityManager();
   });

   describe('construction', () => {

      it('does not throw an exception', () => {
         expect(() => {
            new XmlEntityManager();
         }).not.toThrow();
      });

   });

   describe('addEntity', () => {

      it('throws an exception if called without a token', () => {
         expect(() => {
            manager.addEntity();
         }).toThrowError('Must call with an entity declaration token.');
      });

      it('throws an exception if called with an invalid token type', () => {
         expect(() => {
            manager.addEntity(new tokens.ElementDeclaration('test', undefined, TEST_CHUNKS));
         }).toThrowError('Must call with an entity declaration token.');
      });

      it('returns a cursor if it is called with a legitimate entity name', () => {
         manager.addEntity(makeToken('bar', 'baz'));

         expect(extractEntityText(manager, 'bar').chunk.text).toBe('baz');
      });

      it('can add multiple internal entities, but only the first is returned', () => {
         manager.addEntity(makeToken('test', 'one'), XmlEntityManager.INTERNAL_SUBSET);
         manager.addEntity(makeToken('test', 'two'), XmlEntityManager.INTERNAL_SUBSET);

         expect(extractEntityText(manager, 'test').chunk.text).toBe('one');
      });

      it('can add multiple extneral entities, but only the first is returned', () => {
         manager.addEntity(makeToken('test', 'one'), XmlEntityManager.EXTERNAL_SUBSET);
         manager.addEntity(makeToken('test', 'two'),
            XmlEntityManager.EXTERNAL_SUBSET);

         expect(extractEntityText(manager, 'test').chunk.text).toBe('one');
      });

      it('can add internal and external entities, but only the first internal is returned', () => {
         manager.addEntity(makeToken('test', 'one'), XmlEntityManager.INTERNAL_SUBSET);
         manager.addEntity(makeToken('test', 'two'), XmlEntityManager.INTERNAL_SUBSET);
         manager.addEntity(makeToken('test', 'alpha'), XmlEntityManager.EXTERNAL_SUBSET);
         manager.addEntity(makeToken('test', 'beta'), XmlEntityManager.EXTERNAL_SUBSET);

         expect(extractEntityText(manager, 'test').chunk.text).toBe('one');
      });

      it('adds an external so it overrides the default', () => {
         manager.addEntity(makeToken('amp', 'one'), XmlEntityManager.EXTERNAL_SUBSET);

         expect(extractEntityText(manager, 'amp').chunk.text).toBe('one');
      });

      it('adds an internal so it overrides the default', () => {
         manager.addEntity(makeToken('amp', 'one'), XmlEntityManager.INTERNAL_SUBSET);

         expect(extractEntityText(manager, 'amp').chunk.text).toBe('one');
      });

      it('is unaffected by parameter entities', () => {
         manager.addParameterEntity(makePEToken('test', 'two'), XmlEntityManager.INTERNAL_SUBSET);
         manager.addEntity(makeToken('test', 'one'), XmlEntityManager.INTERNAL_SUBSET);

         expect(extractEntityText(manager, 'test').chunk.text).toBe('one');
      });

   });

   describe('addParameterEntity', () => {

      // whitebox.  Don't bother testing parameters, as code is the same with addEntity

      it('returns a cursor if it is called with a legitimate entity name', () => {
         manager.addParameterEntity(makePEToken('bar', 'baz'));

         expect(extractParamEntityText(manager, 'bar').chunk.text).toBe('baz');
      });

      it('can add multiple internal entities, but only the first is returned', () => {
         manager.addParameterEntity(makePEToken('test', 'one'), XmlEntityManager.INTERNAL_SUBSET);
         manager.addParameterEntity(makePEToken('test', 'two'), XmlEntityManager.INTERNAL_SUBSET);

         expect(extractParamEntityText(manager, 'test').chunk.text).toBe('one');
      });

      it('is unaffected by general entities', () => {
         manager.addEntity(makeToken('test', 'one'), XmlEntityManager.INTERNAL_SUBSET);
         manager.addParameterEntity(makePEToken('test', 'two'), XmlEntityManager.INTERNAL_SUBSET);

         expect(extractParamEntityText(manager, 'test').chunk.text).toBe('two');
      });

   });

   describe('getEntity', () => {

      it('throws an exception if called without a name', () => {
         expect(() => {
            manager.getEntity();
         }).toThrowError('Must call with the name of an entity.');
      });

      it('returns undefined when called with an entity name that does not exist', () => {
         expect(manager.getEntity('NoName')).toBeUndefined();
      });

      it('returns undefined if the requested entity has a notation name', () => {
         manager.addEntity(makeToken('test', 'two', undefined, 'notation'), XmlEntityManager.INTERNAL_SUBSET);

         expect(manager.getEntity('test')).toBeUndefined();
      });

      it('returns a cursor if it is called with a legitimate entity name', () => {
         expect(manager.getEntity('amp') instanceof XmlStringCursor).toBe(true);
      });

   });

   describe('getParameterEntity', () => {

      it('throws an exception if called without a name', () => {
         expect(() => {
            manager.getEntity();
         }).toThrowError('Must call with the name of an entity.');
      });

      it('returns undefined when called with an entity name that does not exist', () => {
         expect(manager.getParameterEntity('NoName')).toBeUndefined();
      });

      it('returns a cursor if it is called with a legitimate entity name', () => {
         manager.addParameterEntity(makeToken('test', 'two'), XmlEntityManager.INTERNAL_SUBSET);

         expect(manager.getParameterEntity('test') instanceof XmlStringCursor).toBe(true);
      });

   });

   describe('getEntityToken()', () => {

      it('throws an exception if called without a name', () => {
         expect(() => {
            manager.getEntityToken();
         }).toThrowError('Must call with the name of an entity.');
      });

      it('returns undefined when called with an entity name that does not exist', () => {
         expect(manager.getEntityToken('NoName')).toBeUndefined();
      });

      it('returns a the token', () => {
         const token = makeToken('test', 'two');
         manager.addEntity(token, XmlEntityManager.INTERNAL_SUBSET);

         expect(manager.getEntityToken('test')).toEqual(token);
      });

   });

   describe('addExternalSubsetEntity', () => {

      it('adds nothing if no parameter is passed', () => {
         manager.addExternalSubsetEntity();

         expect(manager.getExternalSubsetEntity()).toBeUndefined();
      });

      it('adds a token for the specified location', () => {
         manager.addExternalSubsetEntity(new EntityLocation('system', 'public'));

         expect(manager.getExternalSubsetEntity()._source).toEqual('');
      });

   });

   describe('getParameterEntityToken()', () => {

      it('throws an exception if called without a name', () => {
         expect(() => {
            manager.getParameterEntityToken();
         }).toThrowError('Must call with the name of an entity.');
      });

      it('returns undefined when called with an entity name that does not exist', () => {
         expect(manager.getParameterEntityToken('NoName')).toBeUndefined();
      });

      it('returns a cursor if it is called with a legitimate entity name', () => {
         const token = makePEToken('test', 'two');
         manager.addParameterEntity(token, XmlEntityManager.INTERNAL_SUBSET);

         expect(manager.getParameterEntityToken('test')).toBe(token);
      });

   });

   describe('isEntityUnparsed', () => {

      it('throws an exception if called without a name', () => {
         expect(() => {
            manager.isEntityUnparsed();
         }).toThrowError('Must call with the name of an entity.');
      });

      it('returns false when the entity is not unparsed', () => {
         expect(manager.isEntityUnparsed('amp')).toEqual(false);
      });

      it('returns false when the entity does not exist', () => {
         expect(manager.isEntityUnparsed('bogus')).toEqual(false);
      });

      it('returns true when the entity is unparsed', () => {
         manager.addEntity(makeToken('test', 'two', undefined, 'bogus'), XmlEntityManager.INTERNAL_SUBSET);

         expect(manager.isEntityUnparsed('test')).toBe(true);
      });

   });

   describe('isParameterEntityUnparsed', () => {

      it('throws an exception if called without a name', () => {
         expect(() => {
            manager.isParameterEntityUnparsed();
         }).toThrowError('Must call with the name of an entity.');
      });

      it('returns false when the entity is not unparsed', () => {
         manager.addParameterEntity(makePEToken('test', 'two'), XmlEntityManager.INTERNAL_SUBSET);

         expect(manager.isParameterEntityUnparsed('test')).toEqual(false);
      });

      it('returns false when the entity does not exist', () => {
         expect(manager.isParameterEntityUnparsed('bogus')).toEqual(false);
      });

      it('returns true when the entity is unparsed', () => {
         manager.addParameterEntity(makePEToken('test', 'two', undefined, 'bogus'), XmlEntityManager.INTERNAL_SUBSET);

         expect(manager.isParameterEntityUnparsed('test')).toBe(true);
      });

   });

   describe('default entities', () => {

      it('includes "lt"', () => {
         const ltCursor = manager.getEntity('lt');

         expect(ltCursor.getToTerminator([ 'gotoEOF' ]).chunk.text).toEqual('&#60;');
      });

      it('includes "amp"', () => {
         const ampCursor = manager.getEntity('amp');

         expect(ampCursor.getToTerminator([ 'gotoEOF' ]).chunk.text).toEqual('&#38;');
      });

      it('includes "gt"', () => {
         const gtCursor = manager.getEntity('gt');

         expect(gtCursor.getToTerminator([ 'gotoEOF' ]).chunk.text).toEqual('>');
      });

      it('includes "quot"', () => {
         const quotCursor = manager.getEntity('quot');

         expect(quotCursor.getToTerminator([ 'gotoEOF' ]).chunk.text).toEqual('"');
      });

      it('includes "apos"', () => {
         const aposCursor = manager.getEntity('apos');

         expect(aposCursor.getToTerminator([ 'gotoEOF' ]).chunk.text).toEqual('\'');
      });

   });

});
