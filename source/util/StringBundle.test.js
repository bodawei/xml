/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const StringBundle = require('./StringBundle.js');

describe('StringBundle', () => {

   describe('construction', () => {

      it('can be constructed without error', () => {
         expect(() => {
            new StringBundle({ base: {} });
         }).not.toThrow();
      });

      it('throws an error if not passed an object', () => {
         expect(() => {
            new StringBundle(55);
         }).toThrowError('Must pass an object containing locales and messages.');
      });

      it('throws an error if passed object does not have a "base" key', () => {
         expect(() => {
            new StringBundle({ hi: 55 });
         }).toThrowError('Strings must at least have a locale called "base", with an object value.');
      });

      it('throws an error if passed object does not have an object value for the "base" key', () => {
         expect(() => {
            new StringBundle({ base: 44 });
         }).toThrowError('Strings must at least have a locale called "base", with an object value.');
      });

      it('has a preferredLocale property with the expected default', () => {
         expect(new StringBundle({ base: {} }).preferredLocale).toEqual('en-US');
      });

   });

   describe('lookup()', () => {
      let bundle;
      let strings;

      beforeEach(() => {
         strings = {
            base: {
               TEST: 'success',
               TEST3: 'base got it'
            },
            zh: {
               TEST2: 'zh got it'
            },
            ru: {
               TEST2: 'ru got it'
            },
            fr: {
               TEST4: 'fr got it'
            },
            'en-US': {
               TEST2: 'en-us got it'
            }
         };
         bundle = new StringBundle(strings);
      });

      it('throws an error if key is not a string', () => {
         expect(() => {
            bundle.lookup(44);
         }).toThrowError('Must pass a string key to look up.');
      });

      it('returns a undefined if no locale has the string', () => {
         expect(bundle.lookup('BOGUS')).toBeUndefined();
      });

      it('returns a message in the base locale if no other hase it', () => {
         expect(bundle.lookup('TEST')).toEqual('success');
      });

      it('returns a message from the preferredLocale if that is there', () => {
         expect(bundle.lookup('TEST2')).toEqual('en-us got it');
      });

      it('returns a message from base locale even though the preferred locale would have it', () => {
         expect(bundle.lookup('TEST3')).toEqual('base got it');
      });

      it('returns a message from the specified locale', () => {
         expect(bundle.lookup('TEST2', 'zh')).toEqual('zh got it');
      });

      it('returns a message from the start of the list of locales', () => {
         expect(bundle.lookup('TEST2', [ 'zh', 'ru' ])).toEqual('zh got it');
      });

      it('returns a message from the tail of the list of locales', () => {
         expect(bundle.lookup('TEST4', [ 'ru', 'fr' ])).toEqual('fr got it');
      });

      it('does not care if some locales do not exist', () => {
         expect(bundle.lookup('TEST4', [ 'kk', 'ok', 'ru', 'fr' ])).toEqual('fr got it');
      });

   });

   describe('substitute()', () => {
      let bundle;
      let strings;

      beforeEach(() => {
         strings = {
            base: {
               TEST3: 'base got it {0} {1}',
               TESTREVERSED: 'base got it backwards {1} {0}',
               TESTMISSING: 'base got it missing {0} {2}'
            },
            'en-US': {
               TEST2: 'en-us got it {0} {1}'
            }
         };
         bundle = new StringBundle(strings);
      });

      it('throws an error if key is not a string', () => {
         expect(() => {
            bundle.substitute(44);
         }).toThrowError('Must pass a string key to look up.');
      });

      it('returns a undefined if no locale has the string', () => {
         expect(bundle.substitute('BOGUS', [ 1 ])).toBeUndefined();
      });

      it('returns the raw message if no params are speciried', () => {
         expect(bundle.substitute('TEST3')).toEqual('base got it {0} {1}');
      });

      it('substitutes a single value if it is passed', () => {
         expect(bundle.substitute('TEST2', 'zero')).toEqual('en-us got it zero {1}');
      });

      it('substitutes a multiple values if passed', () => {
         expect(bundle.substitute('TEST2', [ 'zero', 'one' ])).toEqual('en-us got it zero one');
      });

      it('substitutes a multiple values in the order the string specifies', () => {
         expect(bundle.substitute('TESTREVERSED', [ 'zero', 'one' ])).toEqual('base got it backwards one zero');
      });

      it('does not care if one of the passed values does not exist in the string template', () => {
         expect(bundle.substitute('TESTMISSING', [ 'zero', 'one', 'two' ])).toEqual('base got it missing zero two');
      });

   });

});
