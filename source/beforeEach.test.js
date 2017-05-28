/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const SyntaxError = require('./error/SyntaxError.js');
const tokens = require('./XmlToken.js');

const toBeSyntaxErrorMatcher = require('./beforeEach.js').toBeSyntaxError;
const toMatchClasses = require('./beforeEach.js').toMatchClasses;

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

describe('toMatchClasses()', () => {

   describe('jasmine use', () => {

      it('reports pass when the types all match', () => {
         expect([ new tokens.CharRef('x', tokens.ENTITYVAL_NO_CHUNKS) ])
            .toMatchClasses([ tokens.CharRef ]);
      });

      it('reports no pass when the the types do not match', () => {
         expect([ new tokens.ExternalSubsetStart() ])
            .not.toMatchClasses([ tokens.CharRef ]);
      });

      it('reports no pass when the the lengths do not match', () => {
         expect([
            new tokens.CharRef('x', tokens.ENTITYVAL_NO_CHUNKS),
            new tokens.CharRef('x', tokens.ENTITYVAL_NO_CHUNKS)
         ]).not.toMatchClasses([ tokens.CharRef ]);
      });

   });

   describe('raw matcher', () => {

      it('returns a compare function', () => {
         expect(typeof toMatchClasses().compare === 'function').toEqual(true);
      });

      // avoiding testing the actual class names, since on IE we can't get them nicely.
      it('returns a message indicating failure, when lengths do not match', () => {
         const result = toMatchClasses().compare([
            new tokens.CharRef('x', tokens.ENTITYVAL_NO_CHUNKS)
         ], [ tokens.ExternalSubsetStart, tokens.ExternalSubsetEnd ]);

         expect(result.pass).toEqual(false);
         expect(result.message.indexOf('Expected 2 objects, but got 1.\n\tActual')).toEqual(0);
      });

      it('returns a message indicating failure, on success, for the .not.toMatchClasses() case', () => {
         const result = toMatchClasses().compare([
            new tokens.CharRef('x', tokens.ENTITYVAL_NO_CHUNKS)
         ], [ tokens.CharRef ]);

         expect(result.pass).toEqual(true);
         expect(result.message.indexOf('Expected one or more object types to not match')).toEqual(0);
      });

      it('returns a message indicating failure, on failure, for the .toMatchClasses() case', () => {
         const result = toMatchClasses().compare([
            new tokens.CharRef('x', tokens.ENTITYVAL_NO_CHUNKS)
         ], [ tokens.ExternalSubsetStart ]);

         expect(result.pass).toEqual(false);
         expect(result.message.indexOf('The type of object 0')).toEqual(0);
      });

   });
});
