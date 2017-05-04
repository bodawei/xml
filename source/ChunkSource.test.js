
/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const Buffer = require('buffer').Buffer;
const Chunk = require('./shared/Chunk.js');
const ChunkSource = require('./ChunkSource.js');
const EntityLocation = require('./shared/EntityLocation.js');
const EntityMetaData = require('./shared/EntityMetaData.js');

describe('ChunkSource', () => {
   let pluckedSpy;
   let source;
   let defaultLoc;
   let entityMetaData1dot0;
   let entityMetaData1dot1;

   beforeEach(() => {
      defaultLoc = new EntityLocation();
      entityMetaData1dot0 = new EntityMetaData(EntityMetaData.TYPE.DOCUMENT, 1.0, 5, defaultLoc);
      entityMetaData1dot1 = new EntityMetaData(EntityMetaData.TYPE.DOCUMENT, 1.1, 2, defaultLoc);

      pluckedSpy = jasmine.createSpy('pluckedSpy');
      source = new ChunkSource(entityMetaData1dot0);
   });

   describe('multiple calls', () => {

      it('made before any segments added', () => {
         source.getSpace(pluckedSpy);
         source.getDigits(pluckedSpy);
         source.getWord([], pluckedSpy);

         source.addSegment(' 123Test', true);

         expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ ' ', '123', 'Test' ]);
      });

      it('made after segments added', () => {
         source.addSegment(' 123Test', true);

         source.getSpace(pluckedSpy);
         source.getDigits(pluckedSpy);
         source.getWord([], pluckedSpy);

         expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ ' ', '123', 'Test' ]);
      });

      it('made across segment addition', () => {
         source.addSegment(' ', false);

         source.getSpace(pluckedSpy);
         source.addSegment('\t123', false);
         source.getDigits(pluckedSpy);
         source.addSegment('456TestV', false);
         source.getWord([], pluckedSpy);
         source.addSegment('alue ', true);

         expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ ' \t', '123456', 'TestValue' ]);
      });

   });

   describe('peekIsSpace', () => {

      describe('basic behavior', () => {

         it('calls back with true if there is a space as the next character', () => {
            source.addSegment(' foo', false);

            source.peekIsSpace(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toEqual(true);
         });

         it('calls back with false if there is no space as the next character', () => {
            source.addSegment('foo', true);

            source.peekIsSpace(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toEqual(false);
         });

         it('calls back with false when nothing in the source', () => {
            source.addSegment('', true);

            source.peekIsSpace(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toEqual(false);
         });

         it('throws an error if called without a function', () => {
            source.addSegment('foo', true);

            expect(() => {
               source.peekIsSpace();
            }).toThrowError(
               'Must pass a callback function of the form function(boolean):void to peekIsSpace().');
         });

      });

      describe('segment spanning', () => {

         it('calls back with false if at the end of all segments', () => {
            source.addSegment('', true);

            source.peekIsSpace(pluckedSpy);

            expect(pluckedSpy.calls.argsFor(0)[0]).toEqual(false);
         });

         it('does not call back when no seguments have been added', () => {
            source.peekIsSpace(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(0);
         });

         it('returns true if the character in the next segment is a space', () => {
            source.addSegment('', false);
            source.addSegment(' x', true);

            source.peekIsSpace(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toEqual(true);
         });

         it('returns true if the next character is a carriage return', () => {
            source.addSegment('\r', false);
            source.addSegment('x', true);

            source.peekIsSpace(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toEqual(true);
         });

         it('returns true if the next character is a carriage return/newline', () => {
            source.addSegment('\r', false);
            source.addSegment('\nx', true);

            source.peekIsSpace(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toEqual(true);
         });

      });

      describe('terminators', () => {

         it('returns true if a space is the next character', () => {
            source.addSegment(' a', true);

            source.peekIsSpace(pluckedSpy);
            source.getChar(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(2);
            expect(pluckedSpy.calls.argsFor(0)[0]).toEqual(true);
            expect(pluckedSpy.calls.argsFor(1)[0]).toEqualChunkText(' ');
         });

         it('returns true if a tab is the next character', () => {
            source.addSegment('\ta', true);

            source.peekIsSpace(pluckedSpy);
            source.getChar(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(2);
            expect(pluckedSpy.calls.argsFor(0)[0]).toEqual(true);
            expect(pluckedSpy.calls.argsFor(1)[0]).toEqualChunkText('\t');
         });

         it('returns true if a carriage return is the next character', () => {
            source.addSegment('\ra', true);

            source.peekIsSpace(pluckedSpy);
            source.getChar(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(2);
            expect(pluckedSpy.calls.argsFor(0)[0]).toEqual(true);
            expect(pluckedSpy.calls.argsFor(1)[0]).toEqualChunkText('\n');
         });

         it('returns true if a newline is the next character', () => {
            source.addSegment('\na', true);

            source.peekIsSpace(pluckedSpy);
            source.getChar(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(2);
            expect(pluckedSpy.calls.argsFor(0)[0]).toEqual(true);
            expect(pluckedSpy.calls.argsFor(1)[0]).toEqualChunkText('\n');
         });

         it('returns false if a \\u2028 is the next character in v. 1.0', () => {
            source.addSegment('\na', true);

            source.peekIsSpace(pluckedSpy);
            source.getChar(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(2);
            expect(pluckedSpy.calls.argsFor(0)[0]).toEqual(true);
            expect(pluckedSpy.calls.argsFor(1)[0]).toEqualChunkText('\n');
         });

         it('returns true if a \\u2028 is the next character in v. 1.1', () => {
            source = new ChunkSource(entityMetaData1dot1);
            source.addSegment('\u2028', true);

            source.peekIsSpace(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toEqual(true);
         });

      });

   });

   // Whitebox note: Code is the same for peekChar and getChar except for index handling. Just test the latter here
   describe('peekChar', () => {

      describe('basic behavior', () => {

         it('calls back with the char', () => {
            source.addSegment(' foo', false);

            source.peekChar(pluckedSpy);
            source.getChar(pluckedSpy);

            const chunks = pluckedSpy.calls.allArgs().map((arg) => arg[0]);
            expect(chunks).toEqualChunkTexts([ ' ', ' ' ]);
         });

         it('calls back with undefined when nothing in the source', () => {
            source.addSegment('', true);

            source.peekChar(pluckedSpy);
            source.getChar(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(2);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
            expect(pluckedSpy.calls.argsFor(1)[0]).toBeUndefined();
         });

         it('throws an error if called without a function', () => {
            source.addSegment('foo', true);

            expect(() => {
               source.peekChar();
            }).toThrowError(
               'Must pass a callback function of the form function(chunk|undefined):void to peekChar().');
         });

      });

      describe('segment spanning', () => {

         it('calls back with undefined if at the end of all segments', () => {
            source.addSegment('', true);

            source.peekChar(pluckedSpy);
            source.getChar(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(2);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
            expect(pluckedSpy.calls.argsFor(1)[0]).toBeUndefined();
         });

         it('does not call back when no seguments have been added', () => {
            source.peekChar(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(0);
         });

         it('returns the character from the next segment if this one is empty', () => {
            source.addSegment('', false);
            source.addSegment('x', true);

            source.peekChar(pluckedSpy);
            source.getChar(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'x', 'x' ]);
         });

         it('returns a newline if a carriage return is next', () => {
            source.addSegment('\r', false);
            source.addSegment('x', true);

            source.peekChar(pluckedSpy);
            source.getChar(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '\n', '\n' ]);
         });

         it('returns a newline if the next is a carriage return/newline', () => {
            source.addSegment('\r', false);
            source.addSegment('\nx', true);

            source.peekChar(pluckedSpy);
            source.getChar(pluckedSpy);
            source.getChar(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '\n', '\n', 'x' ]);
         });

      });

   });

   describe('getChar', () => {

      describe('basic behavior', () => {

         it('calls back with a chunk with the next character', () => {
            source.addSegment('x', true);

            source.getChar(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'x' ]);
         });

         it('calls back with undefined when no character at the offset', () => {
            source.addSegment('', true);

            source.getChar(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
         });

         it('throws an error if called without a function', () => {
            source.addSegment('012345', true);

            expect(() => {
               source.getChar();
            }).toThrowError('Must pass a callback function of the form function(chunk|undefined):void to getChar().');
         });

      });

      describe('segment spanning', () => {

         it('does not call callback if no data is passed to source', () => {
            source.getChar(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(0);
         });

         it('calls back with undefined when at the end of input', () => {
            source.addSegment('', true);

            source.getChar(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
         });

         it('calls back with a char when segment added later', () => {
            source.getChar(pluckedSpy);

            source.addSegment('abc', true);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'a' ]);
         });

         it('calls back with a char when in middle of segment', () => {
            source.addSegment('123mom', true);
            source.getDigits(pluckedSpy);

            source.getChar(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '123', 'm' ]);
         });

         it('calls back with a char at middle of segment', () => {
            source.addSegment('123nun', true);
            source.getDigits(pluckedSpy);

            source.getChar(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '123', 'n' ]);
         });

         it('calls back with a char at end of segment', () => {
            source.addSegment('123p', true);
            source.getDigits(pluckedSpy);

            source.getChar(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(2);
            expect(pluckedSpy.calls.argsFor(1)[0]).toEqualChunkText('p');
         });

         it('calls back with a char at start of subsequent segment', () => {
            source.addSegment('123', true);
            source.addSegment('great', true);
            source.getDigits(pluckedSpy);

            source.getChar(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '123', 'g' ]);
         });

         it('does not call back if there is just a carriage return at the end of a non-terminal segment', () => {
            source.addSegment('\r');

            source.getChar(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(0);
         });

         it('calls back with a newline when a carriage return is found at the end of the terminal segment', () => {
            source.addSegment('\r', true);

            source.getChar(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '\n' ]);
         });

         it('calls back with a single newline after finding a carriage return and newline across segments', () => {
            source.addSegment('\r');
            source.addSegment('\n');
            source.addSegment('x', true);

            source.getChar(pluckedSpy);
            source.getChar(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '\n', 'x' ]);
         });

         it('calls back with a single newline after finding a carriage return and \\u0085 across segments', () => {
            source = new ChunkSource(entityMetaData1dot1);
            source.addSegment('\r');
            source.addSegment('\u0085');
            source.addSegment('x', true);

            source.getChar(pluckedSpy);
            source.getChar(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '\n', 'x' ]);
         });

         it('calls back with a newline after finding a CR at end of one segment and other char at next start', () => {
            source.addSegment('\r');
            source.addSegment('x', true);

            source.getChar(pluckedSpy);
            source.getChar(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '\n', 'x' ]);
         });

      });

      describe('whitespace handling', () => {

         it('calls back with a tab', () => {
            source.addSegment('\t', true);

            source.getChar(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '\t' ]);
         });

         it('calls back with a space', () => {
            source.addSegment(' ', true);

            source.getChar(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ ' ' ]);
         });

         it('calls back with a newline', () => {
            source.addSegment('\n', true);

            source.getChar(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '\n' ]);
         });

         it('calls back with a \\u0085 in 1.0', () => {
            source.addSegment('\u0085', true);

            source.getChar(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '\u0085' ]);
         });

         it('calls back with a \\u0085 as a newline in 1.1', () => {
            source = new ChunkSource(entityMetaData1dot1);
            source.addSegment('\u0085', true);

            source.getChar(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '\n' ]);
         });

         it('calls back with a \\u2028 in 1.0', () => {
            source.addSegment('\u2028', true);

            source.getChar(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '\u2028' ]);
         });

         it('calls back with a \\u2028 as a newlinein 1.1', () => {
            source = new ChunkSource(entityMetaData1dot1);
            source.addSegment('\u2028', true);

            source.getChar(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '\n' ]);
         });

         it('calls back with a carriage return as a newline', () => {
            source.addSegment('\rx', true);

            source.getChar(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '\n' ]);
         });

         it('calls back with a carriage return/newline as a newline', () => {
            source.addSegment('\r\n', true);

            source.getChar(pluckedSpy);

            expect(pluckedSpy.calls.argsFor(0)[0]).toEqualChunkText('\n');
         });

         it('calls back with a carriage return/\\u0085 as a newline and ignores the latter in 1.0', () => {
            source.addSegment('\r\u0085', true);

            source.getChar(pluckedSpy);
            source.getChar(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '\n', '\u0085' ]);
         });

         it('calls back with a carriage return/\\u0085 as a newline in 1.1', () => {
            source = new ChunkSource(entityMetaData1dot1);
            source.addSegment('\r\u0085x', true);

            source.getChar(pluckedSpy);
            source.getChar(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '\n', 'x' ]);
         });

         // more about line endings in the segment section, above

      });

   });

   describe('getDigits', () => {

      describe('basic behavior', () => {

         it('calls back with a chunk with digits when digits are in the segment', () => {
            source.addSegment('012345', true);

            source.getDigits(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '012345' ]);
         });

         it('calls back with a chunk with digits when hex digits are in the segment', () => {
            source.addSegment('abcdefABCDEF0123456789', true);

            source.getDigits(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'abcdefABCDEF0123456789' ]);
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

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '012345aef12' ]);
         });

         it('calls back with a chunk with digits when digits span segments and digits end before last segment', () => {
            source.addSegment('012345', false);
            source.addSegment('aef', false);
            source.addSegment('13last', false);

            source.getDigits(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '012345aef13' ]);
         });

         it('calls back even when data added after call', () => {
            source.addSegment('012345', false);
            source.addSegment('aef', false);
            source.getDigits(pluckedSpy);
            expect(pluckedSpy.calls.count()).toEqual(0);

            source.addSegment('13last', false);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '012345aef13' ]);
         });

         it('calls back with digits when called after a different operation (mid-segment)', () => {
            source.addSegment(' \t1234abFred', true);

            source.getSpace(pluckedSpy);
            source.getDigits(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ ' \t', '1234abF' ]);
         });

         it('leaves segment offset right for following operation', () => {
            source.addSegment('1234abF \t', true);

            source.getDigits(pluckedSpy);
            source.getSpace(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '1234abF', ' \t' ]);
         });

      });

   });

   describe('getSpace', () => {

      describe('basic behavior', () => {

         it('calls back with a chunk with space when space at the current offset in the source', () => {
            source.addSegment('    hi', false);

            source.getSpace(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '    ' ]);
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

         it('calls back with undefined when at the end of the input', () => {
            source.addSegment('', true);

            source.getSpace(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
         });

         it('calls back with a chunk with space when space spans segments', () => {
            source.addSegment('  ', false);
            source.addSegment('\t', false);
            source.addSegment(' ', true);

            source.getSpace(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '  \t ' ]);
         });

         it('calls back with a chunk when space spans segments and space ends before last segment', () => {
            source.addSegment('  ', false);
            source.addSegment('\t', false);
            source.addSegment(' last', false);

            source.getSpace(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '  \t ' ]);
         });

         it('calls back even when data added after call', () => {
            source.addSegment('  ', false);
            source.addSegment('\t', false);
            source.getSpace(pluckedSpy);
            expect(pluckedSpy.calls.count()).toEqual(0);

            source.addSegment(' last', false);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '  \t ' ]);
         });

      });

      describe('space types', () => {

         it('calls back with a mixture of space and tabs', () => {
            source.addSegment(' \t \t hi', false);

            source.getSpace(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ ' \t \t ' ]);
         });

         it('recognizes tabs (\\t)', () => {
            source.addSegment(' \t hi', false);

            source.getSpace(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ ' \t ' ]);
         });

         it('recognizes newlines (\\n)', () => {
            source.addSegment(' \n hi', false);

            source.getSpace(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ ' \n ' ]);
         });

         it('recognizes carrige returns (\\r) and returns them as newlines', () => {
            source.addSegment(' \r hi', false);

            source.getSpace(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ ' \n ' ]);
         });

         it('recognizes carrige returns/new line combinations (\\r\\n) and returns them as newlines', () => {
            source.addSegment(' \r\n hi', false);

            source.getSpace(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ ' \n ' ]);
         });

         it('does not recognize next line (\\u0085) as space if version is 1.0', () => {
            source.addSegment(' \u0085 hi', false);

            source.getSpace(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ ' ' ]);
         });

         it('does not recognize line separator (\\u2028) as space if version is 1.0', () => {
            source.addSegment(' \u2028 hi', false);

            source.getSpace(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ ' ' ]);
         });

         it('recognizes next line (\\u0085) as space if version is 1.1 and returns as a new line', () => {
            source = new ChunkSource(entityMetaData1dot1);
            source.addSegment(' \u0085 hi', false);

            source.getSpace(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ ' \n ' ]);
         });

         it('recognizes carriage return and next line (\\r\\u0085) if version is 1.1 and returns as a new line', () => {
            source = new ChunkSource(entityMetaData1dot1);
            source.addSegment(' \r\u0085 hi', false);

            source.getSpace(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ ' \n ' ]);
         });

         it('recognizes line separator (\\u2028) as space  if version is 1.1 and returns a new line', () => {
            source = new ChunkSource(entityMetaData1dot1);
            source.addSegment(' \u2028 hi', false);

            source.getSpace(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ ' \n ' ]);
         });

         it('recognizes a combination of line breaks and transforms all to newline', () => {
            source = new ChunkSource(entityMetaData1dot1);
            source.addSegment(' \n\r\r\n \u2028\u0085\r\u0085hi', false);

            source.getSpace(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ ' \n\n\n \n\n\n' ]);
         });

      });

   });

   describe('getWord', () => {

      describe('basic behavior', () => {

         it('calls back with a chunk with a word terminated by a space', () => {
            source.addSegment('word x', false);

            source.getWord([], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'word' ]);
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

         it('recognizes no word when at eof', () => {
            source.addSegment('', true);
            source.getWord([], pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
         });

         it('recognizes a word when it spans segments', () => {
            source.addSegment('Wo', false);
            source.addSegment('rd', false);
            source.addSegment('99 ', true);

            source.getWord([], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'Word99' ]);
         });

         it('recognizes a word that ends at the end of the last segment', () => {
            source.addSegment('Wo', false);
            source.addSegment('rd', false);
            source.addSegment('98', true);

            source.getWord([], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'Word98' ]);
         });

         it('recognizes a word when it spans segments and the word ends before the last segment arrives', () => {
            source.addSegment('Wo', false);
            source.addSegment('rd', false);
            source.addSegment('100 x', false);

            source.getWord([], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'Word100' ]);
         });

         it('recognizes a word even when data added after the call', () => {
            source.addSegment('Wo', false);
            source.addSegment('r', false);
            source.getWord([], pluckedSpy);
            expect(pluckedSpy.calls.count()).toEqual(0);

            source.addSegment('d101 ', true);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'Word101' ]);
         });

      });

      describe('terminator types', () => {

         it('calls back with a word terminated by a space', () => {
            source.addSegment('word1 ', true);

            source.getWord([], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'word1' ]);
         });

         it('calls back with a word terminated by a tab', () => {
            source.addSegment('word2\t', true);

            source.getWord([], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'word2' ]);
         });

         it('calls back with a word terminated by a newline', () => {
            source.addSegment('word3\n', true);

            source.getWord([], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'word3' ]);
         });

         it('calls back with a word terminated by a carriage return', () => {
            source.addSegment('word4\r', true);

            source.getWord([], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'word4' ]);
         });

         it('does not recognize a word terminated by a \\u0085 in 1.0', () => {
            source.addSegment('word5\u0085\r', true);

            source.getWord([], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'word5\u0085' ]);
         });

         it('does not recognize a word terminated by a \\u2028 in 1.0', () => {
            source.addSegment('word6\u2028\r', true);

            source.getWord([], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'word6\u2028' ]);
         });

         it('recognizes a word terminated by a \\u0085 in 1.1', () => {
            source = new ChunkSource(entityMetaData1dot1);
            source.addSegment('word7\u0085\r', false);

            source.getWord([], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'word7' ]);
         });

         it('recognizes a word terminated by a \\u2028 in 1.1', () => {
            source = new ChunkSource(entityMetaData1dot1);
            source.addSegment('word8\u2028\r', false);

            source.getWord([], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'word8' ]);
         });

         it('recognizes a word terminated by a custom terminator', () => {
            source.addSegment('word9\n', false);

            source.getWord([ 'o' ], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'w' ]);
         });

         it('recognizes a word terminated by a custom multi-character terminator', () => {
            source.addSegment('wordA\n', false);

            source.getWord([ 'rdA' ], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'wo' ]);
         });

         it('recognizes a word terminated by one of several custom terminators', () => {
            source.addSegment('wordA\n', false);

            source.getWord([ 'dA', 'A', 'rd' ], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'wo' ]);
         });

         it('recognizes a word not terminated by a false-postive terminator', () => {
            source.addSegment('wordC\n', true);

            // d will match, but then r will not
            source.getWord([ 'dr' ], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'wordC' ]);
         });

         it('recognizes a word terminated by terminator that spans chunks', () => {
            source.addSegment('wor', false);
            source.addSegment('dC', true);

            source.getWord([ 'rd' ], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'wo' ]);
         });

      });

   });

   describe('getMatch', () => {

      describe('basic behavior', () => {

         it('calls back with a chunk that matches the requested match', () => {
            source.addSegment('some stuff', false);

            source.getMatch('som', pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'som' ]);
         });

         it('calls back with undefined when no match at the current offset in source', () => {
            source.addSegment('test', true);

            source.getMatch('xx', pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
         });

         it('throws an error if called without a match value', () => {
            source.addSegment('foo', true);

            expect(() => {
               source.getMatch();
            }).toThrowError('Must pass a string to match to getMatch().');
         });

         it('throws an error if called without a function', () => {
            source.addSegment('foo', true);

            expect(() => {
               source.getMatch('xxx');
            }).toThrowError('Must pass a callback function of the form function(chunk|undefined):void to getMatch().');
         });

      });

      describe('segment spanning', () => {

         it('does recognize a match if the match reaches to end of segment and new segment not added', () => {
            source.addSegment('match', false);

            source.getMatch('match', pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'match' ]);
         });

         it('does not recognize a match if no segments added', () => {
            source.getMatch('match', pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(0);
         });

         it('recognizes no match when at eof', () => {
            source.addSegment('', true);

            source.getMatch('match', pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
         });

         it('recognizes a match when it spans segments', () => {
            source.addSegment('Ma', false);
            source.addSegment('tc', false);
            source.addSegment('hABxxx', true);

            source.getMatch('Mat', pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'Mat' ]);
         });

         it('recognizes a match that ends at the end of the last segment', () => {
            source.addSegment('Ma', false);
            source.addSegment('tc', false);
            source.addSegment('hAB ', true);

            source.getMatch('MatchAB', pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'MatchAB' ]);
         });

         it('recognizes a match when it spans segments and the match ends before the last segment arrives', () => {
            source.addSegment('Ma', false);
            source.addSegment('tc', false);
            source.addSegment('hAAxx', false);

            source.getMatch('MatchAA', pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'MatchAA' ]);
         });

         it('recognizes a match even when data added after the call', () => {
            source.addSegment('Ma', false);
            source.addSegment('t', false);
            source.getMatch('Matc', pluckedSpy);
            expect(pluckedSpy.calls.count()).toEqual(0);

            source.addSegment('ch101 ', false);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'Matc' ]);
         });

      });

      describe('interacting calls', () => {

         it('calls back with value after a getWord() call', () => {
            source.addSegment('georgeMichael', false);

            source.getWord([ 'M' ], pluckedSpy);
            source.getMatch('Micha', pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'george', 'Micha' ]);
         });

         it('calls back with value after a getMatch() call', () => {
            source.addSegment('testOne', false);

            source.getMatch('test', pluckedSpy);
            source.getMatch('One', pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'test', 'One' ]);
         });

         it('calls back with value after a getMatch() call across segment boundaries', () => {
            source.addSegment('test', false);
            source.addSegment('Two', false);

            source.getMatch('test', pluckedSpy);
            source.getMatch('Two', pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'test', 'Two' ]);
         });

      });

   });

   describe('getToTerminator', () => {

      describe('basic behavior', () => {

         it('calls back with a chunk with a word terminated by a space', () => {
            source.addSegment('fox and friends', false);

            source.getToTerminator([ 'x' ], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'fo' ]);
         });

         it('calls back with undefined when nothing in the source', () => {
            source.addSegment('', true);

            source.getToTerminator([ 'x' ], pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
         });

         it('throws an error if called without a function', () => {
            source.addSegment('foo', true);

            expect(() => {
               source.getToTerminator([]);
            }).toThrowError(
               'Must pass a callback function of the form function(chunk|undefined):void to getToTerminator().');
         });

      });

      describe('segment spanning', () => {

         it('does not call back when terminator not found in current non-final segment', () => {
            source.addSegment('IAmAWord');

            source.getToTerminator([ 'x' ], pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(0);
         });

         it('does not call back when no seguments have been added', () => {
            source.getToTerminator([ 'x' ], pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(0);
         });

         it('calls back with undefined at EOF', () => {
            source.addSegment('', true);
            source.getToTerminator([ 'x' ], pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
         });

         it('can cope with several empty segments', () => {
            source.addSegment('', false);
            source.addSegment('', false);
            source.addSegment('', true);
            source.getToTerminator([ 'x' ], pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
         });

         it('calls back with contents that span segments', () => {
            source.addSegment('Te', false);
            source.addSegment('xt', false);
            source.addSegment('10', true);

            source.getToTerminator([ '0' ], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'Text1' ]);
         });

         it('calls back with all content up to EOF when no match found', () => {
            source.addSegment('Te', false);
            source.addSegment('xt', false);
            source.addSegment('20', true);

            source.getToTerminator([ '9' ], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'Text20' ]);
         });

         it('calls back with all content up to match even when match at eof', () => {
            source.addSegment('Te', false);
            source.addSegment('xt', false);
            source.addSegment('30 ', true);

            source.getToTerminator([ '0' ], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'Text3' ]);
         });

         it('calls back with segment spanning text when match found before EOF', () => {
            source.addSegment('Te', false);
            source.addSegment('xt', false);
            source.addSegment('40', true);

            source.getToTerminator([ '0' ], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'Text4' ]);
         });

         it('calls back with text even when final needed segment added after the call', () => {
            source.addSegment('Te', false);
            source.addSegment('xt', false);
            source.getToTerminator([ '0' ], pluckedSpy);
            expect(pluckedSpy.calls.count()).toEqual(0);

            source.addSegment('50 ', false);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'Text5' ]);
         });

         it('calls back with text for a terminator that spans multiple segments', () => {
            source.addSegment('Te', false);
            source.addSegment('xt<', false);
            source.addSegment('!', false);
            source.addSegment('-', false);
            source.addSegment('-', true);
            source.getToTerminator([ '<!--' ], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'Text' ]);
         });

         it('calls back with the full text if it finds a terminator does not across multiple segments', () => {
            source.addSegment('Te', false);
            source.addSegment('xt<', false);
            source.addSegment('!', false);
            source.addSegment('-', false);
            source.addSegment('-X', true);
            source.getToTerminator([ '<!---' ], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'Text<!--X' ]);
         });
      });

      describe('terminators', () => {

         it('calls back with match of the second terminator', () => {
            source.addSegment('text10 ', false);

            source.getToTerminator([ '0', '1' ], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'text' ]);
         });

         it('calls back with match of a multi character terminator', () => {
            source.addSegment('text2 234', true);

            source.getToTerminator([ '0', '234' ], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'text2 ' ]);
         });

      });

   });

   describe('getMarkup()', () => {

      describe('basic behavior', () => {

         it('calls back with a chunk with the next bit of markup', () => {
            source.addSegment('<foo', true);

            source.getMarkup(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '<' ]);
         });

         it('calls back with undefined when no markup at the offset', () => {
            source.addSegment('ssss', true);

            source.getMarkup(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
         });

         it('throws an error if called without a function', () => {
            source.addSegment('012345', true);

            expect(() => {
               source.getMarkup();
            }).toThrowError('Must pass a callback function of the form function(chunk|undefined):void to getMarkup().');
         });

      });

      describe('segment spanning', () => {

         it('does not call callback if no data is passed to source', () => {
            source.getMarkup(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(0);
         });

         it('calls back with undefined when at the end of input', () => {
            source.addSegment('', true);

            source.getMarkup(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
         });

         it('calls back with a markup char when segment added later', () => {
            source.getMarkup(pluckedSpy);

            source.addSegment('<start>', true);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '<' ]);
         });

         it('calls back with a markup char when in middle of segment', () => {
            source.addSegment('123<!--', true);
            source.getDigits(pluckedSpy);

            source.getMarkup(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '123', '<!--' ]);
         });

         it('calls back with markup at end of segment', () => {
            source.addSegment('123<?', true);
            source.getDigits(pluckedSpy);

            source.getMarkup(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '123', '<?' ]);
         });

         it('calls back with markup at start of subsequent segment', () => {
            source.addSegment('123', true);
            source.addSegment('<start>', true);
            source.getDigits(pluckedSpy);

            source.getMarkup(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '123', '<' ]);
         });

      });

      describe('all markup', () => {

         it('calls back with a <!--', () => {
            source.addSegment('<!--bar ', true);

            source.getMarkup(pluckedSpy);

            expect(pluckedSpy.calls.argsFor(0)[0]).toEqualChunkText('<!--');
         });

         it('calls back with a <!', () => {
            source.addSegment('<!foo', true);

            source.getMarkup(pluckedSpy);

            expect(pluckedSpy.calls.argsFor(0)[0]).toEqualChunkText('<!');
         });

         it('calls back with a <', () => {
            source.addSegment('<start>', true);

            source.getMarkup(pluckedSpy);

            expect(pluckedSpy.calls.argsFor(0)[0]).toEqualChunkText('<');
         });

         it('calls back with a <?', () => {
            source.addSegment('<?xml?>', true);

            source.getMarkup(pluckedSpy);

            expect(pluckedSpy.calls.argsFor(0)[0]).toEqualChunkText('<?');
         });

         it('calls back with a &', () => {
            source.addSegment('&testEntity;', true);

            source.getMarkup(pluckedSpy);

            expect(pluckedSpy.calls.argsFor(0)[0]).toEqualChunkText('&');
         });

         it('calls back with </', () => {
            source.addSegment('</end>', true);

            source.getMarkup(pluckedSpy);

            expect(pluckedSpy.calls.argsFor(0)[0]).toEqualChunkText('</');
         });

      });

   });

   describe('getClose()', () => {

      describe('basic behavior', () => {

         it('calls back with a chunk with the close', () => {
            source.addSegment(']]>', true);

            source.getClose(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ ']]>' ]);
         });

         it('calls back with undefined when no close at the offset', () => {
            source.addSegment('ssss', true);

            source.getClose(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
         });

         it('throws an error if called without a function', () => {
            source.addSegment('012345', true);

            expect(() => {
               source.getClose();
            }).toThrowError('Must pass a callback function of the form function(chunk|undefined):void to getClose().');
         });

      });

      describe('segment spanning', () => {

         it('does not call callback if no data is passed to source', () => {
            source.getClose(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(0);
         });

         it('calls back with undefined when at the end of input', () => {
            source.addSegment('', true);

            source.getClose(pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
         });

         it('calls back with a close char when segment added later', () => {
            source.getClose(pluckedSpy);

            source.addSegment(']]>', true);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ ']]>' ]);
         });

         it('calls back with a close char when in middle of segment', () => {
            source.addSegment('123]]>', true);
            source.getDigits(pluckedSpy);

            source.getClose(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '123', ']]>' ]);
         });

         it('calls back with close at end of segment', () => {
            source.addSegment('123]]>', true);
            source.getDigits(pluckedSpy);

            source.getClose(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '123', ']]>' ]);
         });

         it('calls back with close at start of subsequent segment', () => {
            source.addSegment('123', false);
            source.addSegment(']]>', true);
            source.getDigits(pluckedSpy);

            source.getClose(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '123', ']]>' ]);
         });

         it('calls back with close when it spans segments', () => {
            source.addSegment('123]', false);
            source.addSegment(']>', true);
            source.getDigits(pluckedSpy);

            source.getClose(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '123', ']]>' ]);
         });

      });

      describe('all closes', () => {

         it('calls back with a ]', () => {
            source.addSegment(']]x', true);

            source.getClose(pluckedSpy);

            expect(pluckedSpy.calls.argsFor(0)[0]).toEqualChunkText(']');
         });

         it('calls back with a ]]>', () => {
            source.addSegment(']]>', true);

            source.getClose(pluckedSpy);

            expect(pluckedSpy.calls.argsFor(0)[0]).toEqualChunkText(']]>');
         });

      });

   });

   describe('undo()', () => {

      describe('basic behavior', () => {

         it('puts the previous text back', () => {
            source.addSegment('123 one', true);

            source.getDigits(pluckedSpy);
            source.undo(pluckedSpy.calls.argsFor(0)[0]);
            source.getDigits(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '123', '123' ]);
         });

         it('does nothing if passed undefined', () => {
            source.addSegment('123 one', true);

            source.getDigits(pluckedSpy);
            source.undo(undefined);
            source.getSpace(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '123', ' ' ]);
         });

         it('throws an error if called something other than undefined or a chunk', () => {
            source.addSegment('012345', true);

            expect(() => {
               source.undo(55);
            }).toThrowError('Must pass a Chunk or undefined to undo().');
         });

      });

      describe('segment spanning', () => {

         it('erroniously allows one to undo a chunk before any segments added', () => {
            source.undo(new Chunk('one x', 'one x'));
            source.getWord([], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'one' ]);
         });

         it('will add to the current segment', () => {
            source.addSegment('123 one', true);
            source.getDigits(pluckedSpy);

            source.undo(pluckedSpy.calls.argsFor(0)[0]);
            source.getDigits(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '123', '123' ]);
         });

         it('will add to a spanning segment location', () => {
            source.addSegment('12', false);
            source.addSegment('3 one', true);
            source.getDigits(pluckedSpy);

            source.undo(pluckedSpy.calls.argsFor(0)[0]);
            source.getDigits(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '123', '123' ]);
         });

         it('will add to before the remaining segment', () => {
            source.addSegment('123', false);
            source.addSegment(' one', true);
            source.getDigits(pluckedSpy);

            source.undo(pluckedSpy.calls.argsFor(0)[0]);
            source.getDigits(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '123', '123' ]);
         });

         it('will add text that can then be retrieved with a different routine', () => {
            source.addSegment('123', false);
            source.addSegment(' o<ne', true);
            source.getToTerminator([ '<' ], pluckedSpy);

            source.undo(pluckedSpy.calls.argsFor(0)[0]);
            source.getDigits(pluckedSpy);
            source.getSpace(pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '123 o', '123', ' ' ]);
         });

         it('throws an error if the value that is undone is not correct', () => {
            source.addSegment('0123zzz', true);
            source.getDigits(pluckedSpy);

            expect(() => {
               source.undo(new Chunk('999', '999'));
            }).toThrowError('Chunk does not match target location.');
         });

         it('throws an error if the value that is undone is not correct', () => {
            source.addSegment('012', true);
            source.addSegment('3zzz', true);
            source.getDigits(pluckedSpy);

            expect(() => {
               source.undo(new Chunk('0124', '0124'));
            }).toThrowError('Chunk does not match target location.');
         });

      });

   });

   describe('encoding', () => {

      it('sets the encoding using the options (whitebox)', () => {
         source = new ChunkSource(entityMetaData1dot0, { encoding: 'utf8' });

         expect(source._encoding).toEqual('utf8');
      });

      it('sets no encoding if no option passed (whitebox)', () => {
         source = new ChunkSource(entityMetaData1dot0);

         expect(source._encoding).toBeUndefined();
      });

      it('makes no opinion on a string with no XML or Text Declaration', () => {
         source.addSegment('no declaration');

         expect(source._encoding).toEqual('UNENCODED');
      });

      describe('from file start', () => {

         describe('in strings', () => {

            it('identifies a non-encoded string as non-encoded', () => {
               source.addSegment('<?xml version="1.0"?>');

               expect(source._encoding).toBeUndefined();
            });

            it('identifies a EBCDIC encoding', () => {
               source.addSegment('\u004C\u006F\u00A7\u0094');

               expect(source._encoding).toBe('EBCDIC');
            });

            it('identifies a UCS-4 big endian encoding', () => {
               source.addSegment('\u0000\u0000\u0000\u003C');

               expect(source._encoding).toBe('UCS-4BE');
            });

            it('identifies a UCS-4 little endian encoding', () => {
               source.addSegment('\u003C\u0000\u0000\u0000');

               expect(source._encoding).toEqual('UCS-4LE');
            });

            it('identifies a UCS-4 unusual1 order encoding', () => {
               source.addSegment('\u0000\u0000\u003C\u0000');

               expect(source._encoding).toEqual('UCS-4UNUSUAL1');
            });

            it('identifies a UCS-4 unusual2 order encoding', () => {
               source.addSegment('\u0000\u003C\u0000\u0000');

               expect(source._encoding).toBe('UCS-4UNUSUAL2');
            });

            it('identifies a UTF-16 big endian encoding', () => {
               source.addSegment('\u0000\u003C\u0000\u003F');

               expect(source._encoding).toBe('UTF-16BE');
            });

            it('identifies a UTF-16 little endian encoding', () => {
               source.addSegment('\u003C\u0000\u003F\u0000');

               expect(source._encoding).toBe('UTF-16LE');
            });

            it('identifies a UCS-4 big endian with BOM encoding', () => {
               source.addSegment('\u0000\u0000\u00FE\u00FF');

               expect(source._encoding).toBe('UCS-4BE/BOM');
            });

            it('identifies a UCS-4 little endian with BOM encoding', () => {
               source.addSegment('\u00FF\u00FE\u0000\u0000');

               expect(source._encoding).toBe('UCS-4LE/BOM');
            });

            it('identifies a UCS-4 unusal1 with BOM encoding', () => {
               source.addSegment('\u0000\u0000\u00FF\u00FE');

               expect(source._encoding).toBe('UCS-4UNUSUAL1/BOM');
            });

            it('identifies a UCS-4 unusal2 with BOM encoding', () => {
               source.addSegment('\u00FE\u00FF\u0000\u0000');

               expect(source._encoding).toBe('UCS-4UNUSUAL2/BOM');
            });

            it('identifies a UTF-16BE with BOM encoding', () => {
               source.addSegment('\u00FE\u00FF\u0001\u0000');

               expect(source._encoding).toBe('UTF-16BE/BOM');
            });

            it('identifies a UTF-16LE with BOM encoding', () => {
               source.addSegment('\u00FF\u00FE\u0000\u0001');

               expect(source._encoding).toBe('UTF-16LE/BOM');
            });

            it('identifies a UTF-8 with BOM encoding', () => {
               source.addSegment('\u00EF\u00BB\u00BFA');

               expect(source._encoding).toBe('UTF-8/BOM');
            });

         });

         describe('in buffer', () => {

            it('identifies a non-encoded string as non-encoded', () => {
               // '<?xml version="1.0"?>'
               source.addSegment(new Buffer([ 60, 63, 120, 109, 108, 32, 118, 101, 114, 115, 105, 111, 110, 61, 34,
                  49, 46, 48, 34, 63, 62 ]));

               expect(source._encoding).toBeUndefined();
            });

            it('identifies a EBCDIC encoding', () => {
               source.addSegment(new Buffer([ 0x4C, 0x6F, 0xA7, 0x94 ]));

               expect(source._encoding).toBe('EBCDIC');
            });

         });

      });

      describe('from declaration', () => {

         it('identifies the name mentioned in the encoding clause', () => {
            source.addSegment('<?xml version="1.0" encoding="frooz" ?>');

            expect(source._encoding).toEqual('frooz');
         });

         it('identifies the name mentioned in the encoding clause in single quotes', () => {
            source.addSegment('<?xml version="1.0" encoding=\'single-quotes\' ?>');

            expect(source._encoding).toEqual('single-quotes');
         });

         it('identifies the name mentioned in the encoding clause even when formatted badly', () => {
            source.addSegment('<?xml version="1.0" ENCODING = "three" ?>');

            expect(source._encoding).toEqual('three');
         });

         it('identifies the type name across multiple segments', () => {
            source.addSegment('<?xml version="1.0" encodin');
            source.addSegment('g="fo');
            source.addSegment('ur" ?>');

            expect(source._encoding).toEqual('four');
         });

         it('identifies the type name across multiple buffer segments', () => {
            // <?xml version="1.0" encoding="five" ?>
            source.addSegment(new Buffer([ 60, 63, 120, 109, 108, 32, 118, 101, 114, 115, 105, 111, 110, 61, 34, 49 ]));
            source.addSegment(new Buffer([ 46, 48, 34, 32, 69, 78, 67, 79, 68, 73, 78, 71, 32, 61, 32, 34, 102 ]));
            source.addSegment(new Buffer([ 105, 118, 101, 34, 32, 63, 62 ]));

            expect(source._encoding).toEqual('five');
         });
      });

   });

   describe('decoding', () => {

      describe('UTF-16BE', () => {

         it('identifies a UTF-16 big endian encoding', () => {
            source.addSegment('\u0000\u003c\u0000\u003f\u0000\u0078\u0000\u006d\u0000\u006c\u0000\u0020\u0000\u0076' +
               '\u0000\u0065\u0000\u0072\u0000\u0073\u0000\u0069\u0000\u006f\u0000\u006e\u0000\u003d\u0000\u0022' +
               '\u0000\u0031\u0000\u002e\u0000\u0030\u0000\u0022\u0000\u003f\u0000\u003e');

            source.getToTerminator([ '1' ], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '<?xml version="' ]);
         });

      });

   });

});
