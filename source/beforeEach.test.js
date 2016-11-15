/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const SyntaxError = require('./error/SyntaxError.js');

const toBeSyntaxErrorMatcher = require('./beforeEach.js').toBeSyntaxError;

describe('toBeSyntaxError()', () => {

   describe('jasmine use', () => {

      it('reports pass when the error code is the expected error code', () => {
         expect(new SyntaxError(SyntaxError.ID.XMLDECL_NO_CLOSE))
            .toBeSyntaxError(SyntaxError.ID.XMLDECL_NO_CLOSE);
      });

      it('reports no pass when the error code is the expected error code', () => {
         expect(new SyntaxError(SyntaxError.ID.XMLDECL_NO_CLOSE))
            .not.toBeSyntaxError('BOGUS');
      });

   });

   describe('raw matcher', () => {
      const actualError = new SyntaxError(SyntaxError.ID.XMLDECL_NO_CLOSE);

      it('returns a compare function', () => {
         expect(typeof toBeSyntaxErrorMatcher().compare === 'function').toEqual(true);
      });

      it('returns a message indicating failure, on success, for the .not.toEqualProps() case', () => {
         expect(toBeSyntaxErrorMatcher().compare(actualError, 'XMLDECL_NO_CLOSE')).toEqual({
            pass: true,
            message: 'Expected syntax error code XMLDECL_NO_CLOSE not to match XMLDECL_NO_CLOSE.'
         });
      });

      it('returns a message indicating failure, on failure, for the .toEqualProps() case', () => {
         expect(toBeSyntaxErrorMatcher().compare(actualError, 'BAD_CODE')).toEqual({
            pass: false,
            message: 'Expected syntax error code XMLDECL_NO_CLOSE to match BAD_CODE.'
         });
      });

   });

});
