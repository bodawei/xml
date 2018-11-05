/* Copyright ® 2016-2018 by David John Burrowes. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation } from '../../basic';
import { SToken, STokenSource } from '../../sToken';
import {
   entityDeclaration,
   text,
} from '../../token';
import { EntityDeclaration, ParameterEntityDeclaration } from '../../token/entityDeclaration';

import EntityManager from '../EntityManager.js';

describe('EntityManager (unit)', () => {
   let manager: EntityManager;

   beforeEach(() => {
      manager = new EntityManager();
   });

   function expectNameToLookupValue(name: string, expected: string | void, done: () => void) {
      const source = manager.getEntity(name);

      expectEntityToMatch(source, expected, done);
   }

   function expectParameterNameToLookupValue(name: string, expected: string | void, done: () => void) {
      const source = manager.getParameterEntity(name);

      expectEntityToMatch(source, expected, done);
   }

   function expectEntityToMatch(source: STokenSource | void, expected: any, done: () => void) {
      if (!source) {
         expect(undefined).toEqual(expected);
         done();
      } else {
         source.extract('all', [], (sToken) => {
            expect(sToken!.str).toEqual(expected);
            done();
         });
      }
   }

   function pTokenToXToken(name: string, str: string = '', location?: EntityLocation, notationName?: string): EntityDeclaration {
      return new entityDeclaration.XToken(name,
         [ new text.PToken({ text: SToken.fromString(str) }) ], location, notationName);
   }

   function makePEToken(name: string, str: string, location?: EntityLocation, notationName?: string): ParameterEntityDeclaration {
      return new entityDeclaration.ParamXToken(name,
         [ new text.PToken({ text: SToken.fromString(str) }) ], location, notationName);
   }

   describe('construction', () => {

      it('does not throw an exception', () => {
         expect(() => {
            new EntityManager();
         }).not.toThrow();
      });

   });

   describe('addEntityFromInternalSubset', () => {

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

      it('returns undefined when called with an entity name that does not exist', (done) => {
         expectParameterNameToLookupValue('noName', undefined, done);
      });

      it('returns a cursor if it is called with a legitimate entity name', (done) => {
         manager.addParameterEntityFromInternalSubset(pTokenToXToken('test', 'two'));

         expectParameterNameToLookupValue('test', 'two', done);
      });

   });

   describe('getEntityToken', () => {

      it('returns the token asked for', () => {
         const token = pTokenToXToken('test', 'two');
         manager.addEntityFromInternalSubset(token);

         expect(manager.getEntityToken('test')).toEqual(token);
      });

   });

   describe('getParameterEntityToken', () => {

      it('returns the token asked for', () => {
         const token = pTokenToXToken('test', 'two');
         manager.addParameterEntityFromInternalSubset(token);

         expect(manager.getParameterEntityToken('test')).toEqual(token);
      });

   });

   describe('getEntityInfo()', () => {

      it('returns nothing if the entity does not exist', () => {
         expect(manager.getEntityInfo('test')).toBeUndefined();
      });

      it('returns an object with a getStream() function', () => {
         const token = pTokenToXToken('test', 'two');
         manager.addEntityFromInternalSubset(token);

         expect(manager.getEntityInfo('test')!.getStream).not.toBeUndefined();
      });

      it('returned stream contains all the text', (done) => {
         const token = pTokenToXToken('test', 'two');
         manager.addEntityFromInternalSubset(token);

         expectEntityToMatch(manager.getEntityInfo('test')!.getStream(), 'two', done);
      });

      it('sets the isParameter flag to false', () => {
         const token = pTokenToXToken('test', 'two');
         manager.addEntityFromInternalSubset(token);

         expect(manager.getEntityInfo('test')!.isParameter).toBe(false);
      });

      it('sets the isInternal flag to false if it has an external location', () => {
         const token = pTokenToXToken('test', 'two', new EntityLocation());
         manager.addEntityFromInternalSubset(token);

         expect(manager.getEntityInfo('test')!.isInternal).toBe(false);
      });

      it('sets the isInternal flag to true if it does not have an external location', () => {
         const token = pTokenToXToken('test', 'two');
         manager.addEntityFromInternalSubset(token);

         expect(manager.getEntityInfo('test')!.isInternal).toBe(true);
      });

      it('sets the isParsable flag to false if it has a notation name', () => {
         const token = pTokenToXToken('test', 'two', new EntityLocation(), 'testNData');
         manager.addEntityFromInternalSubset(token);

         expect(manager.getEntityInfo('test')!.isParsable).toBe(false);
      });

      it('sets the isParsable flag to true if it does not have an ndata name', () => {
         const token = pTokenToXToken('test', 'two');
         manager.addEntityFromInternalSubset(token);

         expect(manager.getEntityInfo('test')!.isParsable).toBe(true);
      });

   });

   describe('getParameterEntityInfo', () => {

      it('returns an object with a getStream() function', () => {
         const token = makePEToken('test', 'two');
         manager.addParameterEntityFromInternalSubset(token);

         expect(manager.getParameterEntityInfo('test')!.getStream).not.toBeUndefined();
      });

      it('sets the isParameter flag to false', () => {
         const token = makePEToken('test', 'two');
         manager.addParameterEntityFromInternalSubset(token);

         expect(manager.getParameterEntityInfo('test')!.isParameter).toBe(true);
      });

   });

   describe('setExternalSubsetEntity()', () => {

      it('adds a token for the specified location', () => {
         manager.setExternalSubsetEntity(new EntityLocation('system', 'public'));

         const source = manager.getExternalSubsetEntity();

         expect(source).not.toBeUndefined();
      });

   });

   describe('getExternalSubsetEntity()', () => {

      it('is undefined if no external entity has been set yet', () => {
         const source = manager.getExternalSubsetEntity();

         expect(source).toBeUndefined();
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
