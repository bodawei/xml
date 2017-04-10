
/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const EntityLocation = require('./shared/EntityLocation.js');
const EntityMetaData = require('./shared/EntityMetaData.js');
const ChunkSource = require('./ChunkSource.js');

describe('ChunkSource', () => {
   let defaultLoc;
   let entityMetaData1dot0;
   let entityMetaData1dot1;

   beforeEach(() => {
      defaultLoc = new EntityLocation();
      entityMetaData1dot0 = new EntityMetaData(EntityMetaData.TYPE.DOCUMENT, 1.0, 5, defaultLoc);
      entityMetaData1dot1 = new EntityMetaData(EntityMetaData.TYPE.DOCUMENT, 1.1, 2, defaultLoc);
   });

   describe('getDigits', () => {
      let pluckedSpy;
      let source;

      beforeEach(() => {
         pluckedSpy = jasmine.createSpy('pluckedSpy');
         source = new ChunkSource(entityMetaData1dot0);
      });

      describe('basic behavior', () => {

         it('calls back with a chunk with digits when digits are in the segment', () => {
            source.addSegment('012345', true);

            source.getDigits(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0].text).toEqual('012345');
         });

         it('calls back with a chunk with digits when hex digits are in the segment', () => {
            source.addSegment('abcdefABCDEF0123456789', true);

            source.getDigits(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0].text).toEqual('abcdefABCDEF0123456789');
         });

         it('calls back with undefined when no digits at the current offset in source', () => {
            source.addSegment('n012345abcdef', true);

            source.getDigits(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
         });

         it('throws an error if called without a function', () => {
            source.addSegment('012345', true);

            expect(() => {
               source.getDigits();
            }).toThrowError('Must pass a callback function of the form function(chunk|undefined):void to getDigits().');
         });

      });

      describe('segment spanning', () => {

         it('calls back with undefined when at the end of input', () => {
            source.addSegment('', true);

            source.getDigits(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
         });

         it('does not call back if digits go to end of source and nextsegment is not added', () => {
            source.addSegment('012345');

            source.getDigits(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(0);
         });

         it('does not call callback if no data is passed to source', () => {
            source.getDigits(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(0);
         });

         it('calls back with a chunk with digits when digits span segments', () => {
            source.addSegment('012345', false);
            source.addSegment('aef', false);
            source.addSegment('12', true);

            source.getDigits(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0].text).toEqual('012345aef12');
         });

         it('calls back with a chunk with digits when digits span segments and digits end before last segment', () => {
            source.addSegment('012345', false);
            source.addSegment('aef', false);
            source.addSegment('13last', false);

            source.getDigits(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0].text).toEqual('012345aef13');
         });

         it('calls back even when data added after call', () => {
            source.addSegment('012345', false);
            source.addSegment('aef', false);
            source.getDigits(pluckedSpy);
            expect(pluckedSpy.calls.count()).toEqual(0);

            source.addSegment('13last', false);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0].text).toEqual('012345aef13');
         });

         it('calls back with digits when called after a different operation (mid-segment)', () => {
            source.addSegment(' \t1234abFred', true);

            source.getSpace(pluckedSpy);
            source.getDigits(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(2);
            expect(pluckedSpy.calls.argsFor(1)[0].text).toEqual('1234abF');
         });

         it('leaves segment offset right for following operation', () => {
            source.addSegment('1234abF \t', true);

            source.getDigits(pluckedSpy);
            source.getSpace(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(2);
            expect(pluckedSpy.calls.argsFor(1)[0].text).toEqual(' \t');
         });

      });

      // test chunk offsets

   });

   describe('getSpace', () => {
      let pluckedSpy;
      let source;

      beforeEach(() => {
         pluckedSpy = jasmine.createSpy('pluckedSpy');
         source = new ChunkSource(entityMetaData1dot0);
      });

      describe('basic behavior', () => {

         it('calls back with a chunk with space when space at the current offset in the source', () => {
            source.addSegment('    hi', false);

            source.getSpace(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0].text).toEqual('    ');
         });

         it('calls back with undefined when no space at the current offset in source', () => {
            source.addSegment('n012345abcdef', true);

            source.getSpace(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
         });

         it('throws an error if called without a function', () => {
            source.addSegment('  ', true);

            expect(() => {
               source.getSpace();
            }).toThrowError('Must pass a callback function of the form function(chunk|undefined):void to getSpace().');
         });

      });

      describe('segment spanning', () => {

         it('does not call back if space goes to end of source and next segment is not added', () => {
            source.addSegment('  \n ');

            source.getSpace(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(0);
         });

         it('does not call callback if no data is passed to source', () => {
            source.getSpace(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(0);
         });

         it('calls back with a chunk with space when space spans segments', () => {
            source.addSegment('  ', false);
            source.addSegment('\t', false);
            source.addSegment(' ', true);

            source.getSpace(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0].text).toEqual('  \t ');
         });

         it('calls back with a chunk when space spans segments and space ends before last segment', () => {
            source.addSegment('  ', false);
            source.addSegment('\t', false);
            source.addSegment(' last', false);

            source.getSpace(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0].text).toEqual('  \t ');
         });

         it('calls back even when data added after call', () => {
            source.addSegment('  ', false);
            source.addSegment('\t', false);
            source.getSpace(pluckedSpy);
            expect(pluckedSpy.calls.count()).toEqual(0);

            source.addSegment(' last', false);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0].text).toEqual('  \t ');
         });

      });

      describe('space types', () => {

         it('calls back with a mixture of space and tabs', () => {
            source.addSegment(' \t \t hi', false);

            source.getSpace(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0].text).toEqual(' \t \t ');
         });

         it('recognizes tabs (\\t)', () => {
            source.addSegment(' \t hi', false);

            source.getSpace(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0].text).toEqual(' \t ');
         });

         it('recognizes newlines (\\n)', () => {
            source.addSegment(' \n hi', false);

            source.getSpace(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0].text).toEqual(' \n ');
         });

         it('recognizes carrige returns (\\r) and returns them as newlines', () => {
            source.addSegment(' \r hi', false);

            source.getSpace(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0].text).toEqual(' \n ');
         });

         it('recognizes carrige returns/new line combinations (\\r\\n) and returns them as newlines', () => {
            source.addSegment(' \r\n hi', false);

            source.getSpace(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0].text).toEqual(' \n ');
         });

         it('does not recognize next line (\\u0085) as space if version is 1.0', () => {
            source.addSegment(' \u0085 hi', false);

            source.getSpace(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0].text).toEqual(' ');
         });

         it('does not recognize line separator (\\u2028) as space if version is 1.0', () => {
            source.addSegment(' \u2028 hi', false);

            source.getSpace(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0].text).toEqual(' ');
         });

         it('recognizes next line (\\u0085) as space if version is 1.1 and returns as a new line', () => {
            source = new ChunkSource(entityMetaData1dot1);
            source.addSegment(' \u0085 hi', false);

            source.getSpace(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0].text).toEqual(' \n ');
         });

         it('recognizes carriage return and next line (\\r\\u0085) if version is 1.1 and returns as a new line', () => {
            source = new ChunkSource(entityMetaData1dot1);
            source.addSegment(' \r\u0085 hi', false);

            source.getSpace(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0].text).toEqual(' \n ');
         });

         it('recognizes line separator (\\u2028) as space  if version is 1.1 and returns a new line', () => {
            source = new ChunkSource(entityMetaData1dot1);
            source.addSegment(' \u2028 hi', false);

            source.getSpace(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0].text).toEqual(' \n ');
         });

         it('recognizes a combination of line breaks and transforms all to newline', () => {
            source = new ChunkSource(entityMetaData1dot1);
            source.addSegment(' \n\r\r\n \u2028\u0085\r\u0085hi', false);

            source.getSpace(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0].text).toEqual(' \n\n\n \n\n\n');
         });

      });

      // offsets
   });

   describe('getWord', () => {
      let pluckedSpy;
      let source;

      beforeEach(() => {
         pluckedSpy = jasmine.createSpy('pluckedSpy');
         source = new ChunkSource(entityMetaData1dot0);
      });

      describe('basic behavior', () => {

         it('calls back with a chunk with a word terminated by a space', () => {
            source.addSegment('word ', false);

            source.getWord([], pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0].text).toEqual('word');
         });

         it('calls back with undefined when no word at the current offset in source', () => {
            source.addSegment(' ', true);

            source.getWord([], pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
         });

         it('throws an error if called without a function', () => {
            source.addSegment('foo', true);

            expect(() => {
               source.getWord();
            }).toThrowError('Must pass a callback function of the form function(chunk|undefined):void to getWord().');
         });

      });

      describe('segment spanning', () => {

         it('does not recognize a word if the word reaches to end of segment and new segment not added', () => {
            source.addSegment('IAmAWord');

            source.getWord([], pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(0);
         });

         it('does not recognize a word if no segments added', () => {
            source.getWord([], pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(0);
         });

         it('recognizes now word when at eof', () => {
            source.addSegment('', true);
            source.getWord([], pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
         });

         it('recognizes a word when it spans segments', () => {
            source.addSegment('Wo', false);
            source.addSegment('rd', false);
            source.addSegment('99 ', false);

            source.getWord([], pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0].text).toEqual('Word99');
         });

         it('recognizes a word that ends at the end of the last segment', () => {
            source.addSegment('Wo', false);
            source.addSegment('rd', false);
            source.addSegment('98', true);

            source.getWord([], pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0].text).toEqual('Word98');
         });

         it('recognizes a word when it spans segments and the word ends before the last segment arrives', () => {
            source.addSegment('Wo', false);
            source.addSegment('rd', false);
            source.addSegment('100 ', false);

            source.getWord([], pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0].text).toEqual('Word100');
         });

         it('recognizes a word even when data added after the call', () => {
            source.addSegment('Wo', false);
            source.addSegment('r', false);
            source.getWord([], pluckedSpy);
            expect(pluckedSpy.calls.count()).toEqual(0);

            source.addSegment('d101 ', false);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0].text).toEqual('Word101');
         });

      });

      describe('terminator types', () => {

         it('calls back with a word terminated by a space', () => {
            source.addSegment('word1 ', false);

            source.getWord([], pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0].text).toEqual('word1');
         });

         it('calls back with a word terminated by a tab', () => {
            source.addSegment('word2\t', false);

            source.getWord([], pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0].text).toEqual('word2');
         });

         it('calls back with a word terminated by a newline', () => {
            source.addSegment('word3\n', false);

            source.getWord([], pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0].text).toEqual('word3');
         });

         it('calls back with a word terminated by a carriage return', () => {
            source.addSegment('word4\r', false);

            source.getWord([], pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0].text).toEqual('word4');
         });

         it('does not recognize a word terminated by a \\u0085 in 1.0', () => {
            source.addSegment('word5\u0085\r', false);

            source.getWord([], pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0].text).toEqual('word5\u0085');
         });

         it('does not recognize a word terminated by a \\u2028 in 1.0', () => {
            source.addSegment('word6\u2028\r', false);

            source.getWord([], pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0].text).toEqual('word6\u2028');
         });

         it('recognizes a word terminated by a \\u0085 in 1.1', () => {
            source = new ChunkSource(entityMetaData1dot1);
            source.addSegment('word7\u0085\r', false);

            source.getWord([], pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0].text).toEqual('word7');
         });

         it('recognizes a word terminated by a \\u2028 in 1.1', () => {
            source = new ChunkSource(entityMetaData1dot1);
            source.addSegment('word8\u2028\r', false);

            source.getWord([], pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0].text).toEqual('word8');
         });

         it('recognizes a word terminated by a custom terminator', () => {
            source.addSegment('word9\n', false);

            source.getWord([ 'o' ], pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0].text).toEqual('w');
         });

         it('recognizes a word terminated by a custom multi-character terminator', () => {
            source.addSegment('wordA\n', false);

            source.getWord([ 'rdA' ], pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0].text).toEqual('wo');
         });

         it('recognizes a word terminated by one of several custom terminators', () => {
            source.addSegment('wordA\n', false);

            source.getWord([ 'dA', 'A', 'rd' ], pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0].text).toEqual('wo');
         });

         it('recognizes a word not terminated by a false-postive terminator', () => {
            source.addSegment('wordC\n', false);

            // d will match, but then r will not
            source.getWord([ 'dr' ], pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0].text).toEqual('wordC');
         });

      });

      // offsets
   });

});
