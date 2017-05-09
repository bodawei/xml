/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const Chunk = require('./chunk/Chunk.js');
const SyntaxError = require('./error/SyntaxError.js');
const tokens = require('./XmlToken.js');
const Range = require('./chunk/Range.js');

const toBeSyntaxErrorMatcher = require('./beforeEach.js').toBeSyntaxError;
const toMatchClasses = require('./beforeEach.js').toMatchClasses;
const toEqualChunkText = require('./beforeEach.js').toEqualChunkText;
const toEqualChunkTexts = require('./beforeEach.js').toEqualChunkTexts;
const toEqualChunkRange = require('./beforeEach.js').toEqualChunkRange;

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
         expect(() => {
            expect(undefined).not.toEqualChunkText('foo');
         }).toThrowError('Chunk with text "foo" is undefined, but should not be.');
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
         } catch (e) {
            expect(e.message).toEqual('Chunk with text "foo" is undefined, but should not be.');
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

describe('toEqualChunkTexts()', () => {

   describe('jasmine use', () => {

      it('reports pass when the chunks all match', () => {
         expect([ new Chunk('one', 'two'), new Chunk('three', 'four') ])
            .toEqualChunkTexts([ { text: 'one', originalText: 'two'}, { text: 'three', originalText: 'four'} ]);
      });

      it('reports an exception if the array is undefined', () => {
         expect(() => {
            expect(undefined).not.toEqualChunkTexts([ 'foo' ]);
         }).toThrowError('Expected array of strings or text/original texts, but got undefined or a non-array.');
      });

      it('reports a pass if passed an array of arrays of chunks', () => {
         expect([ [ new Chunk('one', 'one') ] ]).toEqualChunkTexts([ 'one' ]);
      });

      it('reports no pass if the text value does not match', () => {
         expect([ new Chunk('one', 'one') ]).not.toEqualChunkTexts([ 'junk' ]);
      });

      it('reports pass when text and original text are the same', () => {
         expect([ new Chunk('testValue', 'testValue') ]).toEqualChunkTexts([ 'testValue' ]);
      });

   });

   describe('raw matcher', () => {

      it('returns a compare function', () => {
         expect(typeof toEqualChunkTexts().compare === 'function').toEqual(true);
      });

      it('throws an exception if the chunk is undefined', () => {
         try {
            toEqualChunkTexts().compare(undefined, [ 'foo' ]);
         } catch (e) {
            expect(e.message).toEqual(
               'Expected array of strings or text/original texts, but got undefined or a non-array.');
         }
      });

      it('returns a message indicating failure, when the array lengths do not match', () => {
         const result = toEqualChunkTexts().compare([ new Chunk('1', '2'), new Chunk('3', '4') ],
               [ { text: '1', originalText: '2'} ]);

         expect(result).toEqual({
            pass: false,
            message: 'Expected 1 chunks, but got 2.\n\tExpected: "1"/"2"\n\tActual:   "1"/"2", "3"/"4"\n'
         });
      });

      it('returns a message indicating failure, when the values all match', () => {
         const result = toEqualChunkTexts().compare([ new Chunk('1', '2'), new Chunk('3', '4') ],
               [ { text: '1', originalText: '2'}, { text: '3', originalText: '4'} ]);

         expect(result).toEqual({
            pass: true,
            message: 'Expected one or more chunk texts to not match: "1"/"2", "3"/"4".'
         });
      });

      it('returns a message indicating failure, on success, when text value does not match', () => {
         const result = toEqualChunkTexts().compare([ new Chunk('1', '2'), new Chunk('3', '5') ],
               [ { text: '1', originalText: '2'}, { text: '9', originalText: '5'} ]);

         expect(result).toEqual({
            pass: false,
            message: 'The text of chunk 1 "3"/"5" did not match "9"/"5".'
         });
      });

      it('returns a message indicating failure, on success, when original text value does not match', () => {
         const result = toEqualChunkTexts().compare([ new Chunk('1', '2'), new Chunk('3', '5') ],
               [ { text: '1', originalText: '2'}, { text: '3', originalText: '0'} ]);

         expect(result).toEqual({
            pass: false,
            message: 'The text of chunk 1 "3"/"5" did not match "3"/"0".'
         });
      });

   });

});

describe('toEqualChunkRange()', () => {
   let range;

   beforeEach(() => {
      range = new Range({ systemId: 's', publicId: 'p' }, 0, 1, 2, 3, 4, 5);
   });

   describe('jasmine use', () => {

      it('reports pass when the range matches', () => {
         expect(new Chunk('one', 'two', [ range ]))
            .toEqualChunkRange(new Range({ systemId: 's', publicId: 'p' }, 0, 1, 2, 3, 4, 5));
      });

      it('reports an exception if the chunk is undefined', () => {
         expect(() => {
            expect(undefined).not.toEqualChunkRange(range);
         }).toThrowError('Chunk is undefined, but should not be.');
      });

      it('reports no pass if the range does not match', () => {
         expect(new Chunk('one', 'one', range)).not
            .toEqualChunkText(new Range({ systemId: 's', publicId: 'p' }, 3, 3, 3, 3, 3));
      });

   });

   describe('raw matcher', () => {

      it('returns a compare function', () => {
         expect(typeof toEqualChunkRange().compare === 'function').toEqual(true);
      });

      it('throws an exception if the chunk is undefined', () => {
         try {
            toEqualChunkRange().compare(undefined, range);
         } catch (e) {
            expect(e.message).toEqual('Chunk is undefined, but should not be.');
         }
      });

      it('returns a message indicating failure, when the values all match', () => {
         const result = toEqualChunkRange().compare(new Chunk('testValue', 'original', range), range);

         expect(result).toEqual({
            pass: true,
            message: 'Expected range not to match. ' +
               '("{"location":{"systemId":"s","publicId":"p"},"startIndex":0,"startRow":1,"startColumn":2,' +
               '"endIndex":3,"endRow":4,"endColumn":5}").\n'
         });
      });

      it('returns a message indicating failure, on success, when range does not match', () => {
         const result = toEqualChunkRange().compare(new Chunk('testValue', 'testValue', range),
            new Range({ systemId: 's', publicId: 'p' }, 0, 0, 0, 0, 0, 0));

         expect(result).toEqual({
            pass: false,
            message: 'Chunk range does not match.\n\tActual:   {"location":{"systemId":"s","publicId":"p"},' +
               '"startIndex":0,"startRow":1,"startColumn":2,"endIndex":3,"endRow":4,"endColumn":5}\n' +
               '\tExpected: {"location":{"systemId":"s","publicId":"p"},"startIndex":0,"startRow":0,"startColumn":0,' +
               '"endIndex":0,"endRow":0,"endColumn":0}\n'
         });
      });

   });

});
