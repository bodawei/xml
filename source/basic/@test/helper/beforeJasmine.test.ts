/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { toBeInstanceOf } from './beforeJasmine';

describe('toBeInstanceOf()', () => {
   class Test {}

   class Test2 {}

   describe('jasmine use', () => {
      it('reports true when all the type matches', () => {
         expect(new Test()).toBeInstanceOf(Test);
      });

      it('reports false when the specified types do not match', () => {
         expect(new Test()).not.toBeInstanceOf(Test2);
      });
   });

   describe('raw matcher', () => {
      it('returns a compare function', () => {
         expect(typeof toBeInstanceOf().compare === 'function').toEqual(true);
      });

      it('throws an error if not passed a function', () => {
         expect(() => {
            toBeInstanceOf().compare(new Test(), 55);
         }).toThrowError(
            'Must pass a function to the second argument of the .toBeInstanceOf() jasmine matcher.',
         );
      });

      it('throws an error if not passed an object', () => {
         expect(() => {
            toBeInstanceOf().compare(55, Test);
         }).toThrowError(
            'Must pass an object to the first argument of the .toBeInstanceOf() jasmine matcher.',
         );
      });

      it('throws an error if not passed undefined rather than an object', () => {
         expect(() => {
            toBeInstanceOf().compare(undefined, Test);
         }).toThrowError(
            'Must pass an object to the first argument of the .toBeInstanceOf() jasmine matcher.',
         );
      });

      it('returns a message indicating failure, on success, for the .not.toBeInstanceOf() case', () => {
         expect(toBeInstanceOf().compare(new Test(), Test)).toEqual({
            pass: true,
            message: 'Expected instance not to be an instance of Test.',
         });
      });

      it('returns a message indicating failure, on success, when passed a function', () => {
         expect(toBeInstanceOf().compare(Test, Function)).toEqual({
            pass: true,
            message: 'Expected instance not to be an instance of Function.',
         });
      });

      it('returns a message indicating failure, on failure, for the .toBeInstanceOf() case', () => {
         expect(toBeInstanceOf().compare(new Test(), Test2)).toEqual({
            pass: false,
            message: 'Expected instance to be an instance of Test2. Found Test',
         });
      });
   });
});
