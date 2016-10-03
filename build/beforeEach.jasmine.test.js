/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const toEqualPropsMatcher = require('./beforeEach.jasmine.js').toEqualProps;

describe('toEqualProps()', () => {

   describe('jasmine use', () => {

      it('reports true when all the properties match', () => {
         expect({
            one: 1
         }).toEqualProps({
            one: 1
         });
      });

      it('reports true when the specified properties match', () => {
         expect({
            one: 1,
            two: 2
         }).toEqualProps({
            one: 1
         });
      });

      it('reports false when the specified properties do not match', () => {
         expect({
            one: 1,
            two: 2
         }).not.toEqualProps({
            one: 2
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
            message: 'Expected {"a":1} not to match {"a":1}.'
         });
      });

      it('returns a message indicating failure, on failure, for the .toEqualProps() case', () => {
         expect(toEqualPropsMatcher({ equals: () => false }, () => true).compare({ a: 2 }, { a: 1 })).toEqual({
            pass: false,
            message: 'Expected {"a":2} to match {"a":1}.'
         });
      });

   });

});
