/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const XmlEntityManager = require('./XmlEntityManager.js');
const XmlStringCursor = require('./XmlStringCursor.js');

describe('XmlEntityManager', () => {

   const manager = new XmlEntityManager();

   describe('construction', () => {

      it('does not throw an exception', () => {
         expect(() => {
            new XmlEntityManager();
         }).not.toThrow();
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

      it('returns a cursor if it is called with a legitimate entity name', () => {
         expect(manager.getEntity('amp') instanceof XmlStringCursor).toBe(true);
      });

   });

   describe('addEntity', () => {

      it('throws an exception if called without a name', () => {
         expect(() => {
            manager.addEntity();
         }).toThrowError('Must call with the name of an entity.');
      });

      it('throws an exception if called without a value', () => {
         expect(() => {
            manager.addEntity('fish');
         }).toThrowError('Must call with data for an entity.');
      });

      it('returns a cursor if it is called with a legitimate entity name', () => {
         manager.addEntity('bar', 'baz');
         expect(manager.getEntity('bar').getToTerminator([ 'EOF' ]).chunk.text).toBe('baz');
      });

   });

   describe('default entities', () => {

      it('includes "lt"', () => {
         const ltCursor = manager.getEntity('lt');

         expect(ltCursor.getToTerminator([ 'gotoEOF' ]).chunk.text).toEqual('&60;');
      });

      it('includes "amp"', () => {
         const ampCursor = manager.getEntity('amp');

         expect(ampCursor.getToTerminator([ 'gotoEOF' ]).chunk.text).toEqual('&38;');
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
