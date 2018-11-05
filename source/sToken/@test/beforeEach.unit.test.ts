/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, Range } from '../../basic';

import { toEqualSTokenText, toEqualSTokenTexts, toEqualSTokenRange } from './beforeEach.js';
import SToken from '../SToken';

describe('sToken beforeEach', () => {
   let range: Range;

   beforeEach(() => {
      range = new Range(undefined);
   });

   describe('toEqualSTokenText', () => {

      describe('jasmine use', () => {

         it('reports pass when the strings all match', () => {
            expect(new SToken('one', 'two', range)).toEqualSTokenText({ str: 'one', originalStr: 'two'});
         });

         it('reports an exception if the sToken is undefined', () => {
            expect(() => {
               expect(undefined).not.toEqualSTokenText('foo');
            }).toThrowError('SToken with text "foo" is undefined, but should not be.');
         });

         it('reports no pass if the text value does not match', () => {
            expect(new SToken('one', 'one', range)).not.toEqualSTokenText('junk');
         });

         it('reports pass when text and original text are the same', () => {
            expect(new SToken('testValue', 'testValue', range)).toEqualSTokenText('testValue');
         });

      });

      describe('raw matcher', () => {

         it('returns a compare function', () => {
            expect(typeof toEqualSTokenText().compare === 'function').toEqual(true);
         });

         it('throws an exception if the SToken is undefined', () => {
            try {
               toEqualSTokenText().compare(undefined, 'foo');
            } catch (e) {
               expect(e.message).toEqual('SToken with text "foo" is undefined, but should not be.');
            }
         });

         it('returns a message indicating failure, when the values all match', () => {
            const result = toEqualSTokenText().compare(new SToken('testValue', 'originalValue', range),
               new SToken('testValue', 'originalValue', range));

            expect(result).toEqual({
               pass: true,
               message: 'Expected text values in SToken not to match. ("testValue" and "originalValue").\n',
            });
         });

         it('returns a message indicating failure, on success, when text value does not match', () => {
            const result = toEqualSTokenText().compare(new SToken('testValue', 'testValue', range), 'bogusValue');

            expect(result).toEqual({
               pass: false,
               message: 'SToken text values do not match.\n\tActual:   testValue\n\tExpected: bogusValue\n',
            });
         });

         it('returns a message indicating failure, on success, when original text value does not match', () => {
            const result = toEqualSTokenText().compare(new SToken('testValue', 'original', range), 'testValue');

            expect(result).toEqual({
               pass: false,
               message: 'SToken original text values do not match.\n\tActual:   original\n\tExpected: testValue\n',
            });
         });

      });

   });

   describe('toEqualSTokenTexts()', () => {

      describe('jasmine use', () => {

         it('reports pass when the STokens all match', () => {
            expect([ new SToken('one', 'two', range), new SToken('three', 'four', range) ])
               .toEqualSTokenTexts([ { str: 'one', originalStr: 'two'}, { str: 'three', originalStr: 'four'} ]);
         });

         it('reports an exception if the array is undefined', () => {
            expect(() => {
               expect(undefined).not.toEqualSTokenTexts([ 'foo' ]);
            }).toThrowError('Expected array of strings or text/original texts, but got undefined or a non-array.');
         });

         it('reports a pass if passed an array of arrays of STokens', () => {
            expect([ [ new SToken('one', 'one', range) ] ]).toEqualSTokenTexts([ 'one' ]);
         });

         it('reports no pass if the text value does not match', () => {
            expect([ new SToken('one', 'one', range) ]).not.toEqualSTokenTexts([ 'junk' ]);
         });

         it('reports pass when text and original text are the same', () => {
            expect([ new SToken('testValue', 'testValue', range) ]).toEqualSTokenTexts([ 'testValue' ]);
         });

      });

      describe('raw matcher', () => {

         it('returns a compare function', () => {
            expect(typeof toEqualSTokenTexts().compare === 'function').toEqual(true);
         });

         it('throws an exception if the SToken is undefined', () => {
            try {
               toEqualSTokenTexts().compare(undefined, [ 'foo' ]);
            } catch (e) {
               expect(e.message).toEqual(
                  'Expected array of strings or text/original texts, but got undefined or a non-array.');
            }
         });

         it('returns a message indicating failure, when the array lengths do not match', () => {
            const result = toEqualSTokenTexts().compare([ new SToken('1', '2', range), new SToken('3', '4', range) ],
                  [ new SToken('1', '2', range) ]);

            expect(result).toEqual({
               pass: false,
               message: 'Expected 1 STokens, but got 2.\n\tExpected: "1"/"2"\n\tActual:   "1"/"2", "3"/"4"\n',
            });
         });

         it('returns a message indicating failure, when the values all match', () => {
            const result = toEqualSTokenTexts().compare([ new SToken('1', '2', range), new SToken('3', '4', range) ],
               [ new SToken('1', '2', range), new SToken('3', '4', range) ] );

            expect(result).toEqual({
               pass: true,
               message: 'Expected one or more SToken texts to not match: "1"/"2", "3"/"4".',
            });
         });

         it('returns a message indicating failure, on success, when text value does not match', () => {
            const result = toEqualSTokenTexts().compare([ new SToken('1', '2', range), new SToken('3', '5', range) ],
               [ new SToken('1', '2', range), new SToken('9', '5', range) ] );

            expect(result).toEqual({
               pass: false,
               message: 'The text of SToken 1 "3"/"5" did not match "9"/"5".',
            });
         });

         it('returns a message indicating failure, on success, when original text value does not match', () => {
            const result = toEqualSTokenTexts().compare([ new SToken('1', '2', range), new SToken('3', '5', range) ],
               [ new SToken('1', '2', range), new SToken('3', '0', range) ] );

            expect(result).toEqual({
               pass: false,
               message: 'The text of SToken 1 "3"/"5" did not match "3"/"0".',
            });
         });

      });

   });

   describe('toEqualSTokenRange()', () => {

      beforeEach(() => {
         range = new Range(new EntityLocation('s', 'p'), 0, 1, 2, 3, 4, 5);
      });

      describe('jasmine use', () => {

         // it('reports pass when the range matches', () => {
         //    expect(new SToken('one', 'two', [ range ]))
         //       .toEqualSTokenRange(new Range(new EntityLocation('s', 'p'), 0, 1, 2, 3, 4, 5));
         // });

         // it('reports an exception if the SToken is undefined', () => {
         //    expect(() => {
         //       expect(undefined).not.toEqualSTokenRange(range);
         //    }).toThrowError('SToken is undefined, but should not be.');
         // });

         // it('reports no pass if the range does not match', () => {
         //    expect(new SToken('one', 'one', range)).not
         //       .toEqualSTokenText(new Range(new EntityLocation('s', 'p'), 3, 3, 3, 3, 3));
         // });

      });

      describe('raw matcher', () => {

         it('returns a compare function', () => {
            expect(typeof toEqualSTokenRange().compare === 'function').toEqual(true);
         });

         it('throws an exception if the SToken is undefined', () => {
            try {
               toEqualSTokenRange().compare(undefined, range);
            } catch (e) {
               expect(e.message).toEqual('SToken is undefined, but should not be.');
            }
         });

         it('returns a message indicating failure, when the values all match', () => {
            const result = toEqualSTokenRange().compare(new SToken('testValue', 'original', range), range);

            expect(result).toEqual({
               pass: true,
               message: 'Expected range not to match. ' +
                  '("{"location":{"systemId":"s","publicId":"p"},"startIndex":0,"startRow":1,"startColumn":2,' +
                  '"endIndex":3,"endRow":4,"endColumn":5}").\n',
            });
         });

         it('returns a message indicating failure, on success, when range does not match', () => {
            const result = toEqualSTokenRange().compare(new SToken('testValue', 'testValue', range),
               new Range(new EntityLocation('s', 'p'), 0, 0, 0, 0, 0, 0));

            expect(result).toEqual({
               pass: false,
               message: 'SToken range does not match.\n\tActual:   {"location":{"systemId":"s","publicId":"p"},' +
                  '"startIndex":0,"startRow":1,"startColumn":2,"endIndex":3,"endRow":4,"endColumn":5}\n' +
                  '\tExpected: {"location":{"systemId":"s","publicId":"p"},"startIndex":0,"startRow":0,' +
                  '"startColumn":0,"endIndex":0,"endRow":0,"endColumn":0}\n',
            });
         });

      });

   });

});
