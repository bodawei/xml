/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const Offset = require('../Offset.js');
const SyntaxError = require('./SyntaxError.js');
const TextChunk = require('../TextChunk.js');

describe('SyntaxError', () => {

   describe('class values', () => {

      it('populates the ID property', () => {
         expect(SyntaxError.ID.XMLDECL_NO_CLOSE).toEqual('XMLDECL_NO_CLOSE');
      });

   });

   describe('construction', () => {

      it('throws no error when constructed', () => {
         expect(() => {
            new SyntaxError(SyntaxError.ID.XMLDECL_NO_CLOSE);
         }).not.toThrow();
      });

      it('throws an error if the code is not a known one', () => {
         expect(() => {
            new SyntaxError('BOGUS');
         }).toThrowError('The Error id "BOGUS" is not a legal id.');
      });

      it('throws an error if the code is unknown', () => {
         expect(() => {
            new SyntaxError();
         }).toThrowError('No error id passed to SyntaxError.');
      });

      it('sets the id', () => {
         expect(new SyntaxError(SyntaxError.ID.XMLDECL_NO_CLOSE).id)
            .toEqual(SyntaxError.ID.XMLDECL_NO_CLOSE);
      });

      it('sets the code', () => {
         expect(new SyntaxError(SyntaxError.ID.XMLDECL_NO_CLOSE).code)
            .toEqual(1102);
      });

      it('sets the message', () => {
         expect(new SyntaxError(SyntaxError.ID.XMLDECL_NO_CLOSE).message)
            .toEqual('Missing closing "?>" in an XML or Text Declaration.');
      });

      // This is mostly tested in stringbundle. just making sure basic case works
      it('fills in values in the message', () => {
         expect(new SyntaxError(SyntaxError.ID.XMLDECL_ATTR_INVALID_CASE, [ 'one', 'ONE' ]).message)
            .toEqual('"one" must be lower case. Found "ONE".');
      });

      it('sets the place', () => {
         expect(new SyntaxError(SyntaxError.ID.XMLDECL_NO_CLOSE, [], new Offset(0, 1, 2)).place)
            .toEqual(new Offset(0, 1, 2));
      });

      it('sets the place even if a TextChunk is passed', () => {
         expect(new SyntaxError(SyntaxError.ID.XMLDECL_NO_CLOSE, [],
            new TextChunk.PlainChunk('foo', new Offset(0, 1, 2), new Offset(0, 3, 4))).place)
            .toEqual(new Offset(0, 3, 4));
      });

      it('clones the place', () => {
         const place = new Offset(0, 1, 2);
         expect(new SyntaxError(SyntaxError.ID.XMLDECL_NO_CLOSE, [], place).place)
            .not.toBe(place);
      });

      it('sets the place even when params omitted', () => {
         const place = new Offset(0, 1, 2);
         expect(new SyntaxError(SyntaxError.ID.XMLDECL_NO_CLOSE, place).place)
            .not.toBe(place);
      });

      it('sets the context', () => {
         const context = [ new Offset(0, 1, 2) ];
         expect(new SyntaxError(SyntaxError.ID.XMLDECL_NO_CLOSE, [], new Offset(0, 1, 2), context).context)
            .toEqual(context);
      });

      it('wraps the context if just an Offset is passed', () => {
         const place = new Offset(0, 1, 2);
         expect(new SyntaxError(SyntaxError.ID.XMLDECL_NO_CLOSE, [], place, place).context)
            .toEqual([ place ]);
      });

      it('wraps the context if just an TextChunk is passed', () => {
         const place = new Offset(0, 1, 2);
         const textChunk = new TextChunk.PlainChunk('foo', place, new Offset(0, 3, 4));
         expect(new SyntaxError(SyntaxError.ID.XMLDECL_NO_CLOSE, [], place, textChunk).context)
            .toEqual([ place ]);
      });

      it('clones the context', () => {
         const place = new Offset(0, 1, 2);
         const context = [ place ];
         expect(new SyntaxError(SyntaxError.ID.XMLDECL_NO_CLOSE, [], place, context).context[0])
            .not.toBe(place);
      });

      it('clones a multi-value context', () => {
         const place1 = new Offset(0, 1, 2);
         const place2 = new Offset(0, 4, 5);
         const context = [ place1, place2 ];
         expect(new SyntaxError(SyntaxError.ID.XMLDECL_NO_CLOSE, [], place1, context).context)
            .toEqual(context);
      });

      it('sets the context even when params omitted', () => {
         const place = new Offset(0, 1, 2);
         const context = [ place ];
         expect(new SyntaxError(SyntaxError.ID.XMLDECL_NO_CLOSE, place, context).context)
            .toEqual([ place ]);
      });
   });

   describe('addLocale', () => {

      it('adds a locale', () => {
         const locale = {};
         locale[SyntaxError.ID.XMLDECL_NO_CLOSE] = 'Fehlende Schließung "?>" In einer XML- oder Textdeklaration.';
         SyntaxError.setPreferredLocale('de');
         SyntaxError.addLocale('de', locale);

         expect(new SyntaxError(SyntaxError.ID.XMLDECL_NO_CLOSE).message)
            .toEqual('Fehlende Schließung "?>" In einer XML- oder Textdeklaration.');
      });

   });

   describe('removeLocale()', () => {

      it('returns the remove locale', () => {
         const locale = {};
         locale[SyntaxError.ID.XMLDECL_NO_CLOSE] = 'Fehlende Schließung "?>" In einer XML- oder Textdeklaration.';
         SyntaxError.setPreferredLocale('de');
         SyntaxError.addLocale('de', locale);

         expect(SyntaxError.removeLocale('de')).toEqual(locale);
      });

   });

});
