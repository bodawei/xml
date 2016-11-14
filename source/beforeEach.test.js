/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const SyntaxError = require('./error/SyntaxError.js');

const toBeSyntaxErrorMatcher = require('./beforeEach.js').toBeSyntaxError;

describe('toBeSyntaxError()', () => {

   describe('jasmine use', () => {

      it('reports pass when the error code is the expected error code', () => {
         expect(new SyntaxError('FISH')).toBeSyntaxError('FISH');
      });

      it('reports no pass when the error code is the expected error code', () => {
         expect(new SyntaxError('TEST')).not.toBeSyntaxError('BOGUS');
      });

   });

   describe('raw matcher', () => {
      const actualError = new SyntaxError('TEST_CODE', 'message');

      it('returns a compare function', () => {
         expect(typeof toBeSyntaxErrorMatcher().compare === 'function').toEqual(true);
      });

      it('returns a message indicating failure, on success, for the .not.toEqualProps() case', () => {
         expect(toBeSyntaxErrorMatcher().compare(actualError, 'TEST_CODE')).toEqual({
            pass: true,
            message: 'Expected syntax error code TEST_CODE not to match TEST_CODE.'
         });
      });

      it('returns a message indicating failure, on failure, for the .toEqualProps() case', () => {
         expect(toBeSyntaxErrorMatcher().compare(actualError, 'BAD_CODE')).toEqual({
            pass: false,
            message: 'Expected syntax error code TEST_CODE to match BAD_CODE.'
         });
      });

   });

});
