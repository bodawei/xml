/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const Chunk = require('./shared/Chunk.js');
const SyntaxError = require('./error/SyntaxError.js');
const tokens = require('./XmlToken.js');

const toBeSyntaxErrorMatcher = require('./beforeEach.js').toBeSyntaxError;
const toMatchClasses = require('./beforeEach.js').toMatchClasses;
const toEqualChunkText = require('./beforeEach.js').toEqualChunkText;

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

      it('returns a message indicating failure, when lengths do not match', () => {
         expect(toMatchClasses().compare([
            new tokens.CharRef('x', tokens.ENTITYVAL_NO_CHUNKS)
         ], [ tokens.ExternalSubsetStart, tokens.ExternalSubsetEnd ])).toEqual({
            pass: false,
            message: 'Expected 2 objects, but got 1.\n\tActual:   CharRef\n\tExpected: ExternalSubsetStart, ' +
               'ExternalSubsetEnd\n'
         });
      });

      it('returns a message indicating failure, on success, for the .not.toMatchClasses() case', () => {
         expect(toMatchClasses().compare([
            new tokens.CharRef('x', tokens.ENTITYVAL_NO_CHUNKS)
         ], [ tokens.CharRef ])).toEqual({
            pass: true,
            message: 'Expected one or more object types to not match: CharRef.'
         });
      });

      it('returns a message indicating failure, on failure, for the .toMatchClasses() case', () => {
         expect(toMatchClasses().compare([
            new tokens.CharRef('x', tokens.ENTITYVAL_NO_CHUNKS)
         ], [ tokens.ExternalSubsetStart ])).toEqual({
            pass: false,
            message: 'The type of object 0 (CharRef) did not match ExternalSubsetStart.'
         });
      });

   });
});


describe('toEqualChunkText()', () => {

   describe('jasmine use', () => {

      it('reports pass when the strings all match', () => {
         expect(new Chunk('one', 'two')).toEqualChunkText({ text: 'one', originalText: 'two'});
      });

      it('reports an exception if the chunk is undefined', () => {
         try {
            expect(undefined).not.toEqualChunkText('foo');
         } catch(e) {
         }
      });

      it('reports no pass if the text value does not match', () => {
         expect(new Chunk('one', 'one')).not.toEqualChunkText('junk');
      });

      it('reports pass when text and original text are the same', () => {
         expect(new Chunk('testValue', 'testValue')).toEqualChunkText('testValue');
      });

   });

   describe('raw matcher', () => {

      it('returns a compare function', () => {
         expect(typeof toEqualChunkText().compare === 'function').toEqual(true);
      });

      it('throws an exception if the chunk is undefined', () => {
         try {
            toEqualChunkText().compare(undefined, 'foo');
         } catch(e) {
            expect(e.message).toEqual('Chunk is undefined, but should not be.');
         }
      });

      it('returns a message indicating failure, when the values all match', () => {
         const result = toEqualChunkText().compare(new Chunk('testValue', 'original'),
               { text: 'testValue', originalText: 'original'});

         expect(result).toEqual({
            pass: true,
            message: 'Expected text values in chunk not to match. ("testValue" and "original").\n'
         });
      });

      it('returns a message indicating failure, on success, when text value does not match', () => {
         const result = toEqualChunkText().compare(new Chunk('testValue', 'testValue'), 'bogusValue');

         expect(result).toEqual({
            pass: false,
            message: 'Chunk text values do not match.\n\tActual:   testValue\n\tExpected: bogusValue\n'
         });
      });

      it('returns a message indicating failure, on success, when original text value does not match', () => {
         const result = toEqualChunkText().compare(new Chunk('testValue', 'original'), 'testValue');

         expect(result).toEqual({
            pass: false,
            message: 'Chunk original text values do not match.\n\tActual:   original\n\tExpected: testValue\n'
         });
      });

   });

});
