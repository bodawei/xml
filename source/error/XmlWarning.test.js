/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const Offset = require('../shared/Offset.js');
const XmlWarning = require('./XmlWarning.js');
const TextChunk = require('../shared/TextChunk.js');

describe('XmlWarning', () => {

   describe('class values', () => {

      it('populates the ID property', () => {
         expect(XmlWarning.ID.ELEMENT_NAME_XML_RESERVED).toEqual('ELEMENT_NAME_XML_RESERVED');
      });

   });

   describe('construction', () => {

      it('throws no error when constructed', () => {
         expect(() => {
            new XmlWarning(XmlWarning.ID.ELEMENT_NAME_XML_RESERVED);
         }).not.toThrow();
      });

      it('throws an error if the code is not a known one', () => {
         expect(() => {
            new XmlWarning('BOGUS');
         }).toThrowError('The Error id "BOGUS" is not a legal id.');
      });

      it('throws an error if the code is unknown', () => {
         expect(() => {
            new XmlWarning();
         }).toThrowError('No error id passed to XmlWarning.');
      });

      it('sets the id', () => {
         expect(new XmlWarning(XmlWarning.ID.ELEMENT_NAME_XML_RESERVED).id)
            .toEqual(XmlWarning.ID.ELEMENT_NAME_XML_RESERVED);
      });

      it('sets the code', () => {
         expect(new XmlWarning(XmlWarning.ID.ELEMENT_NAME_XML_RESERVED).code)
            .toEqual(3001);
      });

      it('sets the message', () => {
         expect(new XmlWarning(XmlWarning.ID.ELEMENT_NAME_XML_RESERVED).message)
            .toEqual('Element names should not start with [Xx][Mm][Ll]. Found "{0}".');
      });

      // This is mostly tested in stringbundle. just making sure basic case works
      it('fills in values in the message', () => {
         expect(new XmlWarning(XmlWarning.ID.ELEMENT_NAME_XML_RESERVED, [ 'one' ]).message)
            .toEqual('Element names should not start with [Xx][Mm][Ll]. Found "one".');
      });

      it('sets the place', () => {
         expect(new XmlWarning(XmlWarning.ID.ELEMENT_NAME_XML_RESERVED, [], new Offset(0, 1, 2)).place)
            .toEqual(new Offset(0, 1, 2));
      });

      it('sets the place even if a TextChunk is passed', () => {
         expect(new XmlWarning(XmlWarning.ID.ELEMENT_NAME_XML_RESERVED, [],
            new TextChunk.PlainChunk('foo', new Offset(0, 1, 2), new Offset(0, 3, 4))).place)
            .toEqual(new Offset(0, 3, 4));
      });

      it('clones the place', () => {
         const place = new Offset(0, 1, 2);
         expect(new XmlWarning(XmlWarning.ID.ELEMENT_NAME_XML_RESERVED, [], place).place)
            .not.toBe(place);
      });

      it('sets the place even when params omitted', () => {
         const place = new Offset(0, 1, 2);
         expect(new XmlWarning(XmlWarning.ID.ELEMENT_NAME_XML_RESERVED, place).place)
            .not.toBe(place);
      });

      it('sets the context', () => {
         const context = [ new Offset(0, 1, 2) ];
         expect(new XmlWarning(XmlWarning.ID.ELEMENT_NAME_XML_RESERVED, [], new Offset(0, 1, 2), context).context)
            .toEqual(context);
      });

      it('wraps the context if just an Offset is passed', () => {
         const place = new Offset(0, 1, 2);
         expect(new XmlWarning(XmlWarning.ID.ELEMENT_NAME_XML_RESERVED, [], place, place).context)
            .toEqual([ place ]);
      });

      it('wraps the context if just an TextChunk is passed', () => {
         const place = new Offset(0, 1, 2);
         const textChunk = new TextChunk.PlainChunk('foo', place, new Offset(0, 3, 4));
         expect(new XmlWarning(XmlWarning.ID.ELEMENT_NAME_XML_RESERVED, [], place, textChunk).context)
            .toEqual([ place ]);
      });

      it('clones the context', () => {
         const place = new Offset(0, 1, 2);
         const context = [ place ];
         expect(new XmlWarning(XmlWarning.ID.ELEMENT_NAME_XML_RESERVED, [], place, context).context[0])
            .not.toBe(place);
      });

      it('clones a multi-value context', () => {
         const place1 = new Offset(0, 1, 2);
         const place2 = new Offset(0, 4, 5);
         const context = [ place1, place2 ];
         expect(new XmlWarning(XmlWarning.ID.ELEMENT_NAME_XML_RESERVED, [], place1, context).context)
            .toEqual(context);
      });

      it('sets the context even when params omitted', () => {
         const place = new Offset(0, 1, 2);
         const context = [ place ];
         expect(new XmlWarning(XmlWarning.ID.ELEMENT_NAME_XML_RESERVED, place, context).context)
            .toEqual([ place ]);
      });
   });

   describe('addLocale', () => {

      it('adds a locale', () => {
         const locale = {};
         locale[XmlWarning.ID.ELEMENT_NAME_XML_RESERVED] = 'Fehlende Schließung "?>" In einer XML- oder Textdeklaration.';
         XmlWarning.setPreferredLocale('de');
         XmlWarning.addLocale('de', locale);

         expect(new XmlWarning(XmlWarning.ID.ELEMENT_NAME_XML_RESERVED).message)
            .toEqual('Fehlende Schließung "?>" In einer XML- oder Textdeklaration.');
      });

   });

   describe('removeLocale()', () => {

      it('returns the remove locale', () => {
         const locale = {};
         locale[XmlWarning.ID.ELEMENT_NAME_XML_RESERVED] = 'Fehlende Schließung "?>" In einer XML- oder Textdeklaration.';
         XmlWarning.setPreferredLocale('de');
         XmlWarning.addLocale('de', locale);

         expect(XmlWarning.removeLocale('de')).toEqual(locale);
      });

   });

});
