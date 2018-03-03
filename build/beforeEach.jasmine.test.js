/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

const toEqualPropsMatcher = require('./beforeEach.jasmine.js').toEqualProps;
const toBeInstanceOfMatcher = require('./beforeEach.jasmine.js').toBeInstanceOf;

describe('console.json()', () => {

   beforeEach(() => {
      spyOn(console, 'debug');
   });

   it('calls console.debug() for one argument', () => {
      const expected = '{\n    "a": 1\n}';

      console.json({ a: 1 });

      expect(console.debug).toHaveBeenCalledWith(expected);
   });
   
   it('calls console.debug() repeatedly for multiple argument', () => {
      const expected = '{\n    "a": 1\n}';

      console.json({ a: 1 }, true, 3);

      expect(console.debug).toHaveBeenCalledWith(`ARG 0: ${expected}`);
      expect(console.debug).toHaveBeenCalledWith('ARG 1: true');
      expect(console.debug).toHaveBeenCalledWith('ARG 2: 3');
   });
   
});

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
         expect(typeof toEqualPropsMatcher().compare === 'function').toEqual(true);
      });

      it('returns a message indicating failure, on success, for the .not.toEqualProps() case', () => {
         expect(toEqualPropsMatcher({ equals: () => true }, () => true).compare({ a: 1 }, { a: 1 })).toEqual({
            pass: true,
            message: 'Expected {"a":1} not to match {"a":1}.',
         });
      });

      it('returns a message indicating failure, on failure, for the .toEqualProps() case', () => {
         expect(toEqualPropsMatcher({ equals: () => false }, () => true).compare({ a: 2 }, { a: 1 })).toEqual({
            pass: false,
            message: 'Expected {"a":2} to match {"a":1}.',
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
         expect(typeof toBeInstanceOfMatcher().compare === 'function').toEqual(true);
      });

      it('throws an error if not passed a function', () => {
         expect(() => {
            toBeInstanceOfMatcher({ equals: () => true }, () => true).compare(new Test(), 55);
         }).toThrowError('Must pass a function to the second argument of the .toBeInstanceOf() jasmine matcher.');
      });

      it('throws an error if not passed an object', () => {
         expect(() => {
            toBeInstanceOfMatcher({ equals: () => true }, () => true).compare(55, Test);
         }).toThrowError('Must pass an object to the first argument of the .toBeInstanceOf() jasmine matcher.');
      });

      it('throws an error if not passed undefined rather than an object', () => {
         expect(() => {
            toBeInstanceOfMatcher({ equals: () => true }, () => true).compare(undefined, Test);
         }).toThrowError('Must pass an object to the first argument of the .toBeInstanceOf() jasmine matcher.');
      });

      it('returns a message indicating failure, on success, for the .not.toBeInstanceOf() case', () => {
         expect(toBeInstanceOfMatcher({ equals: () => true }, () => true).compare(new Test(), Test)).toEqual({
            pass: true,
            message: 'Expected instance not to be an instance of Test.',
         });
      });

      it('returns a message indicating failure, on success, when passed a function', () => {
         expect(toBeInstanceOfMatcher({ equals: () => true }, () => true).compare(Test, Function)).toEqual({
            pass: true,
            message: 'Expected instance not to be an instance of Function.',
         });
      });

      it('returns a message indicating failure, on failure, for the .toBeInstanceOf() case', () => {
         expect(toBeInstanceOfMatcher({ equals: () => false }, () => true).compare(new Test(), Test2)).toEqual({
            pass: false,
            message: 'Expected instance to be an instance of Test2.',
         });
      });

   });

});
