/* Copyright ® 2016-2017 by David John Burrowes. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation } from '../basic';
import { SToken } from '../sToken';
import {
   entityDeclaration,
   text,
} from '../token';

import EntityManager from './EntityManager.js';

describe('EntityManager (unit)', () => {
   let manager;

   beforeEach(() => {
      manager = new EntityManager();
   });

   function expectNameToLookupValue(name, expected, done) {
      const source = manager.getEntity(name);

      expectEntityToMatch(source, expected, done);
   }

   function expectParameterNameToLookupValue(name, expected, done) {
      const source = manager.getParameterEntity(name);

      expectEntityToMatch(source, expected, done);
   }

   function expectEntityToMatch(source, expected, done) {
      if (!source) {
         expect(undefined).toEqual(expected);
         done();
      } else {
         source.extract('all', [], (sToken) => {
            expect(sToken.str).toEqual(expected);
            done();
         });
      }
   }

   function pTokenToXToken(name, str, location, notationName) {
      return new entityDeclaration.XToken(name,
         [ new text.PToken({ text: new SToken(str) }) ], location, notationName, []);
   }

   function makePEToken(name, str, location, notationName) {
      return new entityDeclaration.ParamXToken(name,
         [ new text.PToken({ text: new SToken(str) }) ], location, notationName, []);
   }

   describe('construction', () => {

      it('does not throw an exception', () => {
         expect(() => {
            new EntityManager();
         }).not.toThrow();
      });

   });

   describe('addEntityFromInternalSubset', () => {

      it('throws an exception if called without a token', () => {
         expect(() => {
            manager.addEntityFromInternalSubset();
         }).toThrowError('Must call with an entity declaration token.');
      });

      it('returns a cursor if it is called with a legitimate entity name', (done) => {
         manager.addEntityFromInternalSubset(pTokenToXToken('testName', 'testValue'));

         expectNameToLookupValue('testName', 'testValue', done);
      });

      it('can add multiple name-named entities, but only the first is returned', (done) => {
         manager.addEntityFromInternalSubset(pTokenToXToken('name', 'one'));
         manager.addEntityFromInternalSubset(pTokenToXToken('name', 'two'));

         expectNameToLookupValue('name', 'one', done);
      });

   });

   describe('addEntityFromExternalSubset', () => {

      it('throws an exception if called without a token', () => {
         expect(() => {
            manager.addEntityFromExternalSubset();
         }).toThrowError('Must call with an entity declaration token.');
      });

      it('returns a cursor if it is called with a legitimate entity name', (done) => {
         manager.addEntityFromExternalSubset(pTokenToXToken('testName', 'testValue'));

         expectNameToLookupValue('testName', 'testValue', done);
      });

      it('can add multiple name-named entities, but only the first is returned', (done) => {
         manager.addEntityFromExternalSubset(pTokenToXToken('name', 'one'));
         manager.addEntityFromExternalSubset(pTokenToXToken('name', 'two'));

         expectNameToLookupValue('name', 'one', done);
      });

   });

   describe('add*Entity interaction', () => {

      it('can add internal and external entities, but only the first internal is returned', (done) => {
         manager.addEntityFromInternalSubset(pTokenToXToken('testName', 'one'));
         manager.addEntityFromInternalSubset(pTokenToXToken('testName', 'two'));
         manager.addEntityFromExternalSubset(pTokenToXToken('testName', 'alpha'));
         manager.addEntityFromExternalSubset(pTokenToXToken('testName', 'beta'));

         expectNameToLookupValue('testName', 'one', done);
      });

      it('is unaffected by parameter entities', (done) => {
         manager.addParameterEntityFromInternalSubset(makePEToken('test', 'two'));
         manager.addEntityFromInternalSubset(pTokenToXToken('test', 'one'));

         expectNameToLookupValue('test', 'one', done);
      });

      it('parameter entities unaffected by general entities', (done) => {
         manager.addEntityFromInternalSubset(pTokenToXToken('test', 'foo'));
         manager.addParameterEntityFromInternalSubset(makePEToken('test', 'one'));

         expectParameterNameToLookupValue('test', 'one', done);
      });

   });

   describe('addParameterEntityFromInternalSubset()', () => {

      it('returns a cursor if it is called with a legitimate entity name', (done) => {
         manager.addParameterEntityFromInternalSubset(makePEToken('bar', 'baz'));

         expectParameterNameToLookupValue('bar', 'baz', done);
      });

      it('can add multiple internal entities, but only the first is returned', (done) => {
         manager.addParameterEntityFromInternalSubset(makePEToken('test', 'one'));
         manager.addParameterEntityFromInternalSubset(makePEToken('test', 'two'));

         expectParameterNameToLookupValue('test', 'one', done);
      });

   });

   describe('addEntityFromExternalSubset()', () => {

      it('returns a cursor if it is called with a legitimate entity name', (done) => {
         manager.addParameterEntityFromExternalSubset(makePEToken('bar', 'baz'));

         expectParameterNameToLookupValue('bar', 'baz', done);
      });

      it('can add multiple internal entities, but only the first is returned', (done) => {
         manager.addParameterEntityFromExternalSubset(makePEToken('test', 'one'));
         manager.addParameterEntityFromExternalSubset(makePEToken('test', 'two'));

         expectParameterNameToLookupValue('test', 'one', done);
      });

   });

   describe('getEntity', () => {

      it('throws an exception if called without a name', () => {
         expect(() => {
            manager.getEntity();
         }).toThrowError('Must call with the name of an entity.');
      });

      it('returns undefined when called with an entity name that does not exist', (done) => {
         expectNameToLookupValue('test', undefined, done);
      });

      it('returns undefined if the requested entity has a notation name', (done) => {
         manager.addEntityFromInternalSubset(pTokenToXToken('test', undefined, undefined, 'fred'));

         expectNameToLookupValue('test', undefined, done);
      });

      it('returns a cursor if it is called with a legitimate entity name', (done) => {
         manager.addEntityFromInternalSubset(pTokenToXToken('test', 'two'));

         expectNameToLookupValue('test', 'two', done);
      });

      it('returns undefined when asked for a general when only parameter by that name', (done) => {
         manager.addParameterEntityFromExternalSubset(makePEToken('test', 'baz'));

         expectNameToLookupValue('test', undefined, done);
      });

   });

   describe('getParameterEntity', () => {

      it('throws an exception if called without a name', () => {
         expect(() => {
            manager.getParameterEntity();
         }).toThrowError('Must call with the name of an entity.');
      });

      it('returns undefined when called with an entity name that does not exist', (done) => {
         expectParameterNameToLookupValue('noName', undefined, done);
      });

      it('returns a cursor if it is called with a legitimate entity name', (done) => {
         manager.addParameterEntityFromInternalSubset(pTokenToXToken('test', 'two'));

         expectParameterNameToLookupValue('test', 'two', done);
      });

   });

   describe('getEntityToken', () => {

      it('throws an exception if called without a name', () => {
         expect(() => {
            manager.getEntityToken();
         }).toThrowError('Must call with the name of an entity.');
      });

      it('returns the token asked for', () => {
         const token = pTokenToXToken('test', 'two');
         manager.addEntityFromInternalSubset(token);

         expect(manager.getEntityToken('test')).toEqual(token);
      });

   });

   describe('getParameterEntityToken', () => {

      it('throws an exception if called without a name', () => {
         expect(() => {
            manager.getParameterEntityToken();
         }).toThrowError('Must call with the name of an entity.');
      });

      it('returns the token asked for', () => {
         const token = pTokenToXToken('test', 'two');
         manager.addParameterEntityFromInternalSubset(token);

         expect(manager.getParameterEntityToken('test')).toEqual(token);
      });

   });

   describe('setExternalSubsetEntity()', () => {

      it('adds nothing if no parameter is passed', () => {
         manager.setExternalSubsetEntity();

         expect(manager.getExternalSubsetEntity()).toBeUndefined();
      });

      it('adds a token for the specified location', () => {
         manager.setExternalSubsetEntity(new EntityLocation('system', 'public'));

         const source = manager.getExternalSubsetEntity();

         expect(source).not.toBeUndefined();
      });

   });

   describe('default entities', () => {

      it('includes "lt"', (done) => {
         expectNameToLookupValue('lt', '&#60;', done);
      });

      it('includes "amp"', (done) => {
         expectNameToLookupValue('amp', '&#38;', done);
      });

      it('includes "gt"', (done) => {
         expectNameToLookupValue('gt', '>', done);
      });

      it('includes "quot"', (done) => {
         expectNameToLookupValue('quot', '"', done);
      });

      it('includes "apos"', (done) => {
         expectNameToLookupValue('apos', '\'', done);
      });

      it('adds an external so it overrides the default', (done) => {
         manager.addEntityFromExternalSubset(pTokenToXToken('amp', 'one'));

         expectNameToLookupValue('amp', 'one', done);
      });

      it('adds an internal so it overrides the default', (done) => {
         manager.addEntityFromInternalSubset(pTokenToXToken('amp', 'one'));

         expectNameToLookupValue('amp', 'one', done);
      });
   });

});
