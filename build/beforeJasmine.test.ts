/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import {toEqualProps } from './beforeJasmine';
import {toEqualShape } from './beforeJasmine';
import {toBeInstanceOf } from './beforeJasmine';

describe('toEqualProps()', () => {

   describe('jasmine use', () => {

      it('reports true when all the properties match', () => {
         expect({
            one: 1,
         }).toEqualProps({
            one: 1,
         });
      });

      it('reports true when the specified properties match', () => {
         expect({
            one: 1,
            two: 2,
         }).toEqualProps({
            one: 1,
         });
      });

      it('reports false when the specified properties do not match', () => {
         expect({
            one: 1,
            two: 2,
         }).not.toEqualProps({
            one: 2,
         });
      });

   });

   describe('raw matcher', () => {

      it('returns a compare function', () => {
         expect(typeof toEqualProps().compare === 'function').toEqual(true);
      });

      it('returns a message indicating failure, on success, for the .not.toEqualProps() case', () => {
         expect(toEqualProps({ equals: () => true }, () => true).compare({ a: 1 }, { a: 1 })).toEqual({
            pass: true,
            message: 'Expected {"a":1} not to match {"a":1}.',
         });
      });

      it('returns a message indicating failure, on failure, for the .toEqualProps() case', () => {
         expect(toEqualProps({ equals: () => false }, () => true).compare({ a: 2 }, { a: 1 })).toEqual({
            pass: false,
            message: 'Expected {"a":2} to match {"a":1}.',
         });
      });

   });

});

describe('toEqualShape()', () => {

   describe('toEqualShape().compare()', () => {

      it('returns a compare function', () => {
         expect(typeof toEqualShape().compare === 'function').toEqual(true);
      });

      it('returns a message indicating failure, on success (for not case)', () => {
         expect(toEqualShape().compare({ a: 1 }, { a: 1 })).toEqual({
            pass: true,
            message: 'Values did not mismatch (both were: {\n  "a": 1\n})\n',
         });
      });

      it('returns a message indicating mismatched properties', () => {
         expect(toEqualShape().compare({ a: 1 }, { a: 2 })).toEqual({
            pass: false,
            message: 'Property mismatches:\n\ta: 1  (Expected: 2)\n',
         });
      });

      it('returns a message indicating an extra actual property', () => {
         expect(toEqualShape().compare({ a: 1, b: undefined }, { a: 1 })).toEqual({
            pass: false,
            message: 'Extra properties in actual:\n\tb: undefined\n',
         });
      });

      it('returns a message indicating an extra expected property', () => {
         expect(toEqualShape().compare({ a: 1 }, { a: 1, b: 2 })).toEqual({
            pass: false,
            message: 'Property mismatches:\n\tb: undefined  (Expected: 2)\n',
         });
      });
   });

});

describe('toBeInstanceOf()', () => {

   function Test() {
   }

   function Test2() {
   }

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
            toBeInstanceOf({ equals: () => true }, () => true).compare(new Test(), 55);
         }).toThrowError('Must pass a function to the second argument of the .toBeInstanceOf() jasmine matcher.');
      });

      it('throws an error if not passed an object', () => {
         expect(() => {
            toBeInstanceOf({ equals: () => true }, () => true).compare(55, Test);
         }).toThrowError('Must pass an object to the first argument of the .toBeInstanceOf() jasmine matcher.');
      });

      it('throws an error if not passed undefined rather than an object', () => {
         expect(() => {
            toBeInstanceOf({ equals: () => true }, () => true).compare(undefined, Test);
         }).toThrowError('Must pass an object to the first argument of the .toBeInstanceOf() jasmine matcher.');
      });

      it('returns a message indicating failure, on success, for the .not.toBeInstanceOf() case', () => {
         expect(toBeInstanceOf({ equals: () => true }, () => true).compare(new Test(), Test)).toEqual({
            pass: true,
            message: 'Expected instance not to be an instance of Test.',
         });
      });

      it('returns a message indicating failure, on success, when passed a function', () => {
         expect(toBeInstanceOf({ equals: () => true }, () => true).compare(Test, Function)).toEqual({
            pass: true,
            message: 'Expected instance not to be an instance of Function.',
         });
      });

      it('returns a message indicating failure, on failure, for the .toBeInstanceOf() case', () => {
         expect(toBeInstanceOf({ equals: () => false }, () => true).compare(new Test(), Test2)).toEqual({
            pass: false,
            message: 'Expected instance to be an instance of Test2. Found Test',
         });
      });

   });

});
