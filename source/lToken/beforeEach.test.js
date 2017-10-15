/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, Range } from '../basic';

import { toEqualLTokenText, toEqualLTokenTexts, toEqualLTokenRange } from './beforeEach.js';
import LToken from './LToken.js';

describe('lToken custom matchers', () => {

   describe('toEqualLTokenText()', () => {

      describe('jasmine use', () => {

         it('reports pass when the strings all match', () => {
            expect(new LToken('one', 'two')).toEqualLTokenText({ text: 'one', originalText: 'two'});
         });

         it('reports an exception if the lToken is undefined', () => {
            expect(() => {
               expect(undefined).not.toEqualLTokenText('foo');
            }).toThrowError('LToken with text "foo" is undefined, but should not be.');
         });

         it('reports no pass if the text value does not match', () => {
            expect(new LToken('one', 'one')).not.toEqualLTokenText('junk');
         });

         it('reports pass when text and original text are the same', () => {
            expect(new LToken('testValue', 'testValue')).toEqualLTokenText('testValue');
         });

      });

      describe('raw matcher', () => {

         it('returns a compare function', () => {
            expect(typeof toEqualLTokenText().compare === 'function').toEqual(true);
         });

         it('throws an exception if the lToken is undefined', () => {
            try {
               toEqualLTokenText().compare(undefined, 'foo');
            } catch (e) {
               expect(e.message).toEqual('LToken with text "foo" is undefined, but should not be.');
            }
         });

         it('returns a message indicating failure, when the values all match', () => {
            const result = toEqualLTokenText().compare(new LToken('testValue', 'original'),
                  { text: 'testValue', originalText: 'original'});

            expect(result).toEqual({
               pass: true,
               message: 'Expected text values in lToken not to match. ("testValue" and "original").\n',
            });
         });

         it('returns a message indicating failure, on success, when text value does not match', () => {
            const result = toEqualLTokenText().compare(new LToken('testValue', 'testValue'), 'bogusValue');

            expect(result).toEqual({
               pass: false,
               message: 'LToken text values do not match.\n\tActual:   testValue\n\tExpected: bogusValue\n',
            });
         });

         it('returns a message indicating failure, on success, when original text value does not match', () => {
            const result = toEqualLTokenText().compare(new LToken('testValue', 'original'), 'testValue');

            expect(result).toEqual({
               pass: false,
               message: 'LToken original text values do not match.\n\tActual:   original\n\tExpected: testValue\n',
            });
         });

      });

   });

   describe('toEqualLTokenTexts()', () => {

      describe('jasmine use', () => {

         it('reports pass when the lTokens all match', () => {
            expect([ new LToken('one', 'two'), new LToken('three', 'four') ])
               .toEqualLTokenTexts([ { text: 'one', originalText: 'two'}, { text: 'three', originalText: 'four'} ]);
         });

         it('reports an exception if the array is undefined', () => {
            expect(() => {
               expect(undefined).not.toEqualLTokenTexts([ 'foo' ]);
            }).toThrowError('Expected array of strings or text/original texts, but got undefined or a non-array.');
         });

         it('reports a pass if passed an array of arrays of lTokens', () => {
            expect([ [ new LToken('one', 'one') ] ]).toEqualLTokenTexts([ 'one' ]);
         });

         it('reports no pass if the text value does not match', () => {
            expect([ new LToken('one', 'one') ]).not.toEqualLTokenTexts([ 'junk' ]);
         });

         it('reports pass when text and original text are the same', () => {
            expect([ new LToken('testValue', 'testValue') ]).toEqualLTokenTexts([ 'testValue' ]);
         });

      });

      describe('raw matcher', () => {

         it('returns a compare function', () => {
            expect(typeof toEqualLTokenTexts().compare === 'function').toEqual(true);
         });

         it('throws an exception if the lToken is undefined', () => {
            try {
               toEqualLTokenTexts().compare(undefined, [ 'foo' ]);
            } catch (e) {
               expect(e.message).toEqual(
                  'Expected array of strings or text/original texts, but got undefined or a non-array.');
            }
         });

         it('returns a message indicating failure, when the array lengths do not match', () => {
            const result = toEqualLTokenTexts().compare([ new LToken('1', '2'), new LToken('3', '4') ],
                  [ { text: '1', originalText: '2'} ]);

            expect(result).toEqual({
               pass: false,
               message: 'Expected 1 lTokens, but got 2.\n\tExpected: "1"/"2"\n\tActual:   "1"/"2", "3"/"4"\n',
            });
         });

         it('returns a message indicating failure, when the values all match', () => {
            const result = toEqualLTokenTexts().compare([ new LToken('1', '2'), new LToken('3', '4') ],
                  [ { text: '1', originalText: '2'}, { text: '3', originalText: '4'} ]);

            expect(result).toEqual({
               pass: true,
               message: 'Expected one or more lToken texts to not match: "1"/"2", "3"/"4".',
            });
         });

         it('returns a message indicating failure, on success, when text value does not match', () => {
            const result = toEqualLTokenTexts().compare([ new LToken('1', '2'), new LToken('3', '5') ],
                  [ { text: '1', originalText: '2'}, { text: '9', originalText: '5'} ]);

            expect(result).toEqual({
               pass: false,
               message: 'The text of lToken 1 "3"/"5" did not match "9"/"5".',
            });
         });

         it('returns a message indicating failure, on success, when original text value does not match', () => {
            const result = toEqualLTokenTexts().compare([ new LToken('1', '2'), new LToken('3', '5') ],
                  [ { text: '1', originalText: '2'}, { text: '3', originalText: '0'} ]);

            expect(result).toEqual({
               pass: false,
               message: 'The text of lToken 1 "3"/"5" did not match "3"/"0".',
            });
         });

      });

   });

   describe('toEqualLTokenRange()', () => {
      let range;

      beforeEach(() => {
         range = new Range(new EntityLocation('s', 'p'), 0, 1, 2, 3, 4, 5);
      });

      describe('jasmine use', () => {

         it('reports pass when the range matches', () => {
            expect(new LToken('one', 'two', [ range ]))
               .toEqualLTokenRange(new Range(new EntityLocation('s', 'p'), 0, 1, 2, 3, 4, 5));
         });

         it('reports an exception if the lToken is undefined', () => {
            expect(() => {
               expect(undefined).not.toEqualLTokenRange(range);
            }).toThrowError('LToken is undefined, but should not be.');
         });

         it('reports no pass if the range does not match', () => {
            expect(new LToken('one', 'one', range)).not
               .toEqualLTokenText(new Range(new EntityLocation('s', 'p'), 3, 3, 3, 3, 3));
         });

      });

      describe('raw matcher', () => {

         it('returns a compare function', () => {
            expect(typeof toEqualLTokenRange().compare === 'function').toEqual(true);
         });

         it('throws an exception if the lToken is undefined', () => {
            try {
               toEqualLTokenRange().compare(undefined, range);
            } catch (e) {
               expect(e.message).toEqual('LToken is undefined, but should not be.');
            }
         });

         it('returns a message indicating failure, when the values all match', () => {
            const result = toEqualLTokenRange().compare(new LToken('testValue', 'original', range), range);

            expect(result).toEqual({
               pass: true,
               message: 'Expected range not to match. ' +
                  '("{"location":{"systemId":"s","publicId":"p"},"startIndex":0,"startRow":1,"startColumn":2,' +
                  '"endIndex":3,"endRow":4,"endColumn":5}").\n',
            });
         });

         it('returns a message indicating failure, on success, when range does not match', () => {
            const result = toEqualLTokenRange().compare(new LToken('testValue', 'testValue', range),
               new Range(new EntityLocation('s', 'p'), 0, 0, 0, 0, 0, 0));

            expect(result).toEqual({
               pass: false,
               message: 'LToken range does not match.\n\tActual:   {"location":{"systemId":"s","publicId":"p"},' +
                  '"startIndex":0,"startRow":1,"startColumn":2,"endIndex":3,"endRow":4,"endColumn":5}\n' +
                  '\tExpected: {"location":{"systemId":"s","publicId":"p"},"startIndex":0,"startRow":0,' +
                  '"startColumn":0,"endIndex":0,"endRow":0,"endColumn":0}\n',
            });
         });

      });

   });

});
