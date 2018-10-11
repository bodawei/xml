/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, Offset, Range, StringBundle } from '../../basic';
import { SToken } from '../../sToken';

import { BaseError, MessageCache } from '../BaseError';

describe('BaseError()', () => {
   let cache: MessageCache;
   /*
    * Because of the odd game we have to do to define BaseError,
    * we need to stick data onto the supertype for the tests to work.
    */
   beforeEach(() => {
      cache = {
         code: {
            TEST: 123,
         },
         message: new StringBundle({
            base: {
               TEST: 'Test message {0}.',
            },
         }),
      }
   });

   afterEach(() => {
   });

   describe('construction', () => {

      it('sets id', () => {
         expect(new BaseError(cache, 'TEST').id).toEqual('TEST');
      });

      it('throws no error when constructed', () => {
         expect(() => {
            new BaseError(cache, 'TEST');
         }).not.toThrow();
      });

      it('throws an error if the code is not a known one', () => {
         expect(() => {
            new BaseError(cache, 'BOGUS');
         }).toThrowError('The Error id "BOGUS" is not a legal id.');
      });

      it('sets the code', () => {
         expect(new BaseError(cache, 'TEST').code)
            .toEqual(123);
      });

      it('sets the message', () => {
         expect(new BaseError(cache, 'TEST').message)
            .toEqual('Test message {0}.');
      });

      // This is mostly tested in stringbundle. just making sure basic case works
      it('fills in values in the message', () => {
         expect(new BaseError(cache, 'TEST', [ 'one' ]).message)
            .toEqual('Test message one.');
      });

      it('provides an empty message in the case of not having a requested string', () => {
         cache = {
            code: {
               TEST: 123,
            },
            message: new StringBundle({
               base: {},
            }),
         }

         expect(new BaseError(cache, 'TEST', [ 'one' ]).message)
            .toEqual('');
      });

      it('sets the place', () => {
         expect(new BaseError(cache, 'TEST', [], new Offset(new EntityLocation(), 0, 1, 2)).place)
            .toEqual(new Offset(new EntityLocation(), 0, 1, 2));
      });

      it('sets the place even if a SToken is passed', () => {
         const error = new BaseError(cache, 'TEST', [],
            new SToken('foo', 'foo', new Range(new EntityLocation(), 0, 1, 2, 0, 3, 4)));
         expect(error.place).toEqual(new Offset(new EntityLocation(), 0, 3, 4));
      });

      it('clones the place', () => {
         const place = new Offset(new EntityLocation(), 0, 1, 2);

         expect(new BaseError(cache, 'TEST', [], place).place)
            .not.toBe(place);
      });

      it('sets the place even when params omitted', () => {
         const place = new Offset(new EntityLocation(), 0, 1, 2);

         expect(new BaseError(cache, 'TEST', [], place).place)
            .toEqual(place);
      });

      it('wraps the context if just an Offset is passed', () => {
         const place = new Offset(new EntityLocation(), 0, 1, 2);
         expect(new BaseError(cache, 'TEST', [], place, place).context)
            .toEqual([ place ]);
      });

      it('wraps the context if just an SToken is passed', () => {
         const place = new Offset(new EntityLocation(), 0, 1, 2);
         const sToken = new SToken('foo', 'foo', new Range(new EntityLocation(), 0, 1, 2, 0, 3, 4));

         expect(new BaseError(cache, 'TEST', [], place, sToken).context)
            .toEqual([ place ]);
      });

      it('clones the context', () => {
         const place = new Offset(new EntityLocation(), 0, 1, 2);
         const context = place;

         expect(new BaseError(cache, 'TEST', [], place, context).context[0])
            .not.toBe(place);
      });

      it('sets the context even when params omitted', () => {
         const place = new Offset(new EntityLocation(), 0, 1, 2);

         expect(new BaseError(cache, 'TEST', [], place, place).context)
            .toEqual([ place ]);
      });
   });

});
