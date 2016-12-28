/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const EntityLocation = require('../shared/EntityLocation.js');
const Offset = require('../shared/Offset.js');
const WellFormednessError = require('./WellFormednessError.js');
const TextChunk = require('../shared/TextChunk.js');

describe('WellFormednessError', () => {

   describe('class values', () => {

      it('populates the ID property', () => {
         expect(WellFormednessError.ID.ELEMENT_UNBALANCED).toEqual('ELEMENT_UNBALANCED');
      });

   });

   describe('construction', () => {

      it('throws no error when constructed', () => {
         expect(() => {
            new WellFormednessError(WellFormednessError.ID.ELEMENT_UNBALANCED);
         }).not.toThrow();
      });

      it('throws an error if the code is not a known one', () => {
         expect(() => {
            new WellFormednessError('BOGUS');
         }).toThrowError('The Error id "BOGUS" is not a legal id.');
      });

      it('throws an error if the code is unknown', () => {
         expect(() => {
            new WellFormednessError();
         }).toThrowError('No error id passed to WellFormednessError.');
      });

      it('sets the id', () => {
         expect(new WellFormednessError(WellFormednessError.ID.ELEMENT_UNBALANCED).id)
            .toEqual(WellFormednessError.ID.ELEMENT_UNBALANCED);
      });

      it('sets the code', () => {
         expect(new WellFormednessError(WellFormednessError.ID.ELEMENT_UNBALANCED).code)
            .toEqual(1501);
      });

      it('sets the message', () => {
         expect(new WellFormednessError(WellFormednessError.ID.ELEMENT_UNBALANCED).message)
            .toEqual('Expected end tag "{0}". Found "{1}".');
      });

      // This is mostly tested in stringbundle. just making sure basic case works
      it('fills in values in the message', () => {
         expect(new WellFormednessError(WellFormednessError.ID.ELEMENT_UNBALANCED, [ 'one', 'ONE' ]).message)
            .toEqual('Expected end tag "one". Found "ONE".');
      });

      it('sets the place', () => {
         expect(new WellFormednessError(WellFormednessError.ID.ELEMENT_UNBALANCED, [], new Offset(0, 1, 2)).place)
            .toEqual(new Offset(0, 1, 2));
      });

      it('sets the place even if a TextChunk is passed', () => {
         expect(new WellFormednessError(WellFormednessError.ID.ELEMENT_UNBALANCED, [],
            new TextChunk.PlainChunk('foo', new Offset(0, 1, 2), new Offset(0, 3, 4))).place)
            .toEqual(new Offset(0, 3, 4));
      });

      it('clones the place', () => {
         const place = new Offset(0, 1, 2);
         expect(new WellFormednessError(WellFormednessError.ID.ELEMENT_UNBALANCED, [], place).place)
            .not.toBe(place);
      });

      it('sets the place even when params omitted', () => {
         const place = new Offset(0, 1, 2);
         expect(new WellFormednessError(WellFormednessError.ID.ELEMENT_UNBALANCED, place).place)
            .not.toBe(place);
      });

      it('sets the context with a location', () => {
         const contextOffset = new Offset(0, 1, 2);
         expect(new WellFormednessError(WellFormednessError.ID.ELEMENT_UNBALANCED, [],
            new Offset(0, 1, 2), contextOffset,
            new EntityLocation('system', 'public')).context)
            .toEqual([ {
               offset: contextOffset,
               location: new EntityLocation('system', 'public')
            } ]);
      });

      it('wraps the context if just an Offset is passed', () => {
         const place = new Offset(0, 1, 2);
         expect(new WellFormednessError(WellFormednessError.ID.ELEMENT_UNBALANCED, [], place, place).context)
            .toEqual([ {
               offset: place,
               location: undefined
            } ]);
      });

      it('wraps the context if just an TextChunk is passed', () => {
         const place = new Offset(0, 1, 2);
         const textChunk = new TextChunk.PlainChunk('foo', place, new Offset(0, 3, 4));
         expect(new WellFormednessError(WellFormednessError.ID.ELEMENT_UNBALANCED, [], place, textChunk).context)
            .toEqual([ {
               offset: place,
               location: undefined
            } ]);
      });

      it('clones the context', () => {
         const place = new Offset(0, 1, 2);
         const context = [ place ];
         expect(new WellFormednessError(WellFormednessError.ID.ELEMENT_UNBALANCED, [], place, context).context[0])
            .not.toBe(place);
      });

      it('sets the context even when params omitted', () => {
         const place = new Offset(0, 1, 2);
         expect(new WellFormednessError(WellFormednessError.ID.ELEMENT_UNBALANCED, place, place).context)
            .toEqual([ {
               offset: place,
               location: undefined
            } ]);
      });
   });

   describe('addLocale', () => {

      it('adds a locale', () => {
         const locale = {};
         locale[WellFormednessError.ID.ELEMENT_UNBALANCED] = 'Erwarteter Endtag "{0}". Gefunden "{1}".';
         WellFormednessError.setPreferredLocale('de');
         WellFormednessError.addLocale('de', locale);

         expect(new WellFormednessError(WellFormednessError.ID.ELEMENT_UNBALANCED).message)
            .toEqual('Erwarteter Endtag "{0}". Gefunden "{1}".');
      });

   });

   describe('removeLocale()', () => {

      it('returns the remove locale', () => {
         const locale = {};
         locale[WellFormednessError.ID.ELEMENT_UNBALANCED] = 'Erwarteter Endtag "{0}". Gefunden "{1}".';
         WellFormednessError.setPreferredLocale('de');
         WellFormednessError.addLocale('de', locale);

         expect(WellFormednessError.removeLocale('de')).toEqual(locale);
      });

   });

});
