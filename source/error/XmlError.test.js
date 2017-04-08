/* Copyright ® 2016-2017 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const EntityLocation = require('../shared/EntityLocation.js');
const Offset = require('../shared/Offset.js');
const StringBundle = require('../shared/StringBundle.js');
const TextChunk = require('../shared/TextChunk.js');
const XmlError = require('./XmlError.js');

describe('XmlError()', () => {

   /*
    * Because of the odd game we have to do to define XmlError,
    * we need to stick data onto the supertype for the tests to work.
    */
   beforeEach(() => {
      Error.ID = {};
      Error.CODE = {};
      Error.ID.TEST = 'TEST';
      Error.CODE.TEST = 123;
      Error.STRING = new StringBundle({
         base: {
            TEST: 'Test message {0}.'
         }
      });
   });

   afterEach(() => {
      delete Error.ID;
      delete Error.CODE;
      delete Error.STRING;
   });

   describe('construction', () => {

      it('sets id', () => {
         expect(new XmlError('TEST').id).toEqual('TEST');
      });

      it('throws no error when constructed', () => {
         expect(() => {
            new XmlError(Error.ID.TEST);
         }).not.toThrow();
      });

      it('throws an error if the code is not a known one', () => {
         expect(() => {
            new XmlError('BOGUS');
         }).toThrowError('The Error id "BOGUS" is not a legal id.');
      });

      it('throws an error if the code is unknown', () => {
         expect(() => {
            new XmlError();
         }).toThrowError('No error id passed to Error.');
      });

      it('sets the code', () => {
         expect(new XmlError(Error.ID.TEST).code)
            .toEqual(123);
      });

      it('sets the message', () => {
         expect(new XmlError(Error.ID.TEST).message)
            .toEqual('Test message {0}.');
      });

      // This is mostly tested in stringbundle. just making sure basic case works
      it('fills in values in the message', () => {
         expect(new XmlError(Error.ID.TEST, [ 'one' ]).message)
            .toEqual('Test message one.');
      });

      it('sets the place', () => {
         expect(new XmlError(Error.ID.TEST, [], new Offset(0, 1, 2)).place)
            .toEqual(new Offset(0, 1, 2));
      });

      it('sets the place even if a TextChunk is passed', () => {
         expect(new XmlError(Error.ID.TEST, [],
            new TextChunk('foo', new Offset(0, 1, 2), new Offset(0, 3, 4))).place)
            .toEqual(new Offset(0, 3, 4));
      });

      it('clones the place', () => {
         const place = new Offset(0, 1, 2);
         expect(new XmlError(Error.ID.TEST, [], place).place)
            .not.toBe(place);
      });

      it('sets the place even when params omitted', () => {
         const place = new Offset(0, 1, 2);
         expect(new XmlError(Error.ID.TEST, place).place)
            .not.toBe(place);
      });

      it('sets the context with a location', () => {
         const contextOffset = new Offset(0, 1, 2);
         expect(new XmlError(Error.ID.TEST, [],
            new Offset(0, 1, 2), contextOffset,
            new EntityLocation('system', 'public')).context)
            .toEqual([ {
               offset: contextOffset,
               location: new EntityLocation('system', 'public')
            } ]);
      });

      it('wraps the context if just an Offset is passed', () => {
         const place = new Offset(0, 1, 2);
         expect(new XmlError(Error.ID.TEST, [], place, place).context)
            .toEqual([ {
               offset: place,
               location: undefined
            } ]);
      });

      it('wraps the context if just an TextChunk is passed', () => {
         const place = new Offset(0, 1, 2);
         const textChunk = new TextChunk('foo', place, new Offset(0, 3, 4));
         expect(new XmlError(Error.ID.TEST, [], place, textChunk).context)
            .toEqual([ {
               offset: place,
               location: undefined
            } ]);
      });

      it('clones the context', () => {
         const place = new Offset(0, 1, 2);
         const context = [ place ];
         expect(new XmlError(Error.ID.TEST, [], place, context).context[0])
            .not.toBe(place);
      });

      it('sets the context even when params omitted', () => {
         const place = new Offset(0, 1, 2);
         expect(new XmlError(Error.ID.TEST, place, place).context)
            .toEqual([ {
               offset: place,
               location: undefined
            } ]);
      });
   });

});
