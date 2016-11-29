/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const EntityRetriever = require('./EntityRetriever.js');
const EntityLocation = require('./shared/EntityLocation.js');
const Promise = require('es6-promise');
const XmlStringCursor = require('./XmlStringCursor.js');

describe('EntityRetriever', () => {

   describe('construction', () => {

      it('does not throw an exception', () => {
         expect(() => {
            new EntityRetriever();
         }).not.toThrow();
      });

   });

   describe('getEntity()', () => {
      let er;

      beforeEach(() => {
         er = new EntityRetriever();
      });

      it('returns a Promise', () => {
         const loc = new EntityLocation('file:///nowhere.com');

         expect(er.getEntity(loc) instanceof Promise).toEqual(true);
      });

      it('resolves to a StringCursorcursor when successful', (done) => {
         const loc = new EntityLocation('file:///nowhere.com');
         const promise = er.getEntity(loc);

         promise.then((result) => {
            expect(result instanceof XmlStringCursor).toEqual(true);
            done();
         });
      });

   });

});
