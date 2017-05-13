
/* Copyright ® 2017 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const Buffer = require('buffer').Buffer;
const Chunk = require('./Chunk.js');
const ChunkSource = require('./ChunkSource.js');
const EntityLocation = require('../shared/EntityLocation.js');
const EntityMetaData = require('../shared/EntityMetaData.js');
const Range = require('./Range.js');

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

   describe('construction', () => {

      it('throws an error if called without an entity meta data', () => {
         expect(() => {
            new ChunkSource();
         }).toThrowError('Must pass an EntityMetaData, or something that can become one, into ChunkSource.');
      });

   });

   describe('multiple calls', () => {

      it('made before any segments added', () => {
         source.extract('space', undefined, pluckedSpy);
         source.extract('digits', undefined, pluckedSpy);
         source.extract('word', [], pluckedSpy);

         source.addSegment(' 123Test');
         source.endSegments();

         expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ ' ', '123', 'Test' ]);
      });

      it('made after segments added', () => {
         source.addSegment(' 123Test');
         source.endSegments();

         source.extract('space', undefined, pluckedSpy);
         source.extract('digits', undefined, pluckedSpy);
         source.extract('word', [], pluckedSpy);

         expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ ' ', '123', 'Test' ]);
      });

      it('made across segment addition', () => {
         source.addSegment(' ');

         source.extract('space', undefined, pluckedSpy);
         source.addSegment('\t123');
         source.extract('digits', undefined, pluckedSpy);
         source.addSegment('456TestV');
         source.extract('word', [], pluckedSpy);
         source.addSegment('alue ');
         source.endSegments();

         expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ ' \t', '123456', 'TestValue' ]);
      });

   });

   describe('legacy', () => {

      it('getDigits() calls back with a chunk with digits when digits are in the segment', () => {
         source.addSegment('012345');
         source.endSegments();

         const chunk = source.getDigits();

         expect(chunk).toEqualChunkText('012345');
      });

      it('peekIsSpace() calls back with true if there is a space', () => {
         source.addSegment('   xxx');

         const chunk = source.peekIsSpace();

         expect(chunk).toEqual(true);
      });

      it('getSpace() calls back with a chunk with spaces when spaces are in the segment', () => {
         source.addSegment('  \r\n');
         source.endSegments();

         const chunk = source.getSpace();

         expect(chunk).toEqualChunkText({ text: '  \n', originalText: '  \r\n' });
      });

      it('peekChar() calls back with a chunk with a char', () => {
         source.addSegment('frog');

         const chunk = source.peekChar();

         expect(chunk).toEqualChunkText('f');
      });

      it('getChar() calls back with a chunk with a char', () => {
         source.addSegment('frog');

         const chunk = source.getChar();

         expect(chunk).toEqualChunkText('f');
      });

      it('getWord() calls back with a word', () => {
         source.addSegment('frog');
         source.endSegments();

         const chunk = source.getWord([]);

         expect(chunk).toEqualChunkText('frog');
      });

      it('getToTerminator() calls back with text up to the terminator', () => {
         source.addSegment('frog');

         const chunk = source.getToTerminator([ 'o' ]);

         expect(chunk).toEqualChunkText('fr');
      });

      it('getMatch() calls back with the matched text', () => {
         source.addSegment('frog');

         const chunk = source.getMatch('fro');

         expect(chunk).toEqualChunkText('fro');
      });

      it('getMarkup() calls back with the markup', () => {
         source.addSegment('<!FOO>');

         const chunk = source.getMarkup();

         expect(chunk).toEqualChunkText('<!');
      });

      it('getClose() calls back with the close', () => {
         source.addSegment(']]>');
         source.endSegments(); // needed since encoding scanning still waiting

         const chunk = source.getClose();

         expect(chunk).toEqualChunkText(']]>');
      });

   });

   describe('extract("peekIsSpace")', () => {

      describe('basic behavior', () => {

         it('calls back with true if there is a space as the next character', () => {
            source.addSegment(' foo');

            source.extract('peekIsSpace', undefined, pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toEqual(true);
         });

         it('calls back with false if there is no space as the next character', () => {
            source.addSegment('foo');
            source.endSegments();

            source.extract('peekIsSpace', undefined, pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toEqual(false);
         });

         it('calls back with false when nothing in the source', () => {
            source.addSegment('');
            source.endSegments();

            source.extract('peekIsSpace', undefined, pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toEqual(false);
         });

      });

      describe('segment spanning', () => {

         it('calls back with false if at the end of all segments', () => {
            source.addSegment('');
            source.endSegments();

            source.extract('peekIsSpace', undefined, pluckedSpy);

            expect(pluckedSpy.calls.argsFor(0)[0]).toEqual(false);
         });

         it('does not call back when no seguments have been added', () => {
            source.extract('peekIsSpace', undefined, pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(0);
         });

         it('returns true if the character in the next segment is a space', () => {
            source.addSegment('');
            source.addSegment(' x');
            source.endSegments();

            source.extract('peekIsSpace', undefined, pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toEqual(true);
         });

         it('returns true if the next character is a carriage return', () => {
            source.addSegment('\r');
            source.addSegment('x');
            source.endSegments();

            source.extract('peekIsSpace', undefined, pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toEqual(true);
         });

         it('returns true if the next character is a carriage return/newline', () => {
            source.addSegment('\r');
            source.addSegment('\nx');
            source.endSegments();

            source.extract('peekIsSpace', undefined, pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toEqual(true);
         });

      });

      describe('terminators', () => {

         it('returns true if a space is the next character', () => {
            source.addSegment(' a');
            source.endSegments();

            source.extract('peekIsSpace', undefined, pluckedSpy);
            source.extract('char', undefined, pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(2);
            expect(pluckedSpy.calls.argsFor(0)[0]).toEqual(true);
            expect(pluckedSpy.calls.argsFor(1)[0]).toEqualChunkText(' ');
         });

         it('returns true if a tab is the next character', () => {
            source.addSegment('\ta');
            source.endSegments();

            source.extract('peekIsSpace', undefined, pluckedSpy);
            source.extract('char', undefined, pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(2);
            expect(pluckedSpy.calls.argsFor(0)[0]).toEqual(true);
            expect(pluckedSpy.calls.argsFor(1)[0]).toEqualChunkText('\t');
         });

         it('returns true if a carriage return is the next character', () => {
            source.addSegment('\ra');
            source.endSegments();

            source.extract('peekIsSpace', undefined, pluckedSpy);
            source.extract('char', undefined, pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(2);
            expect(pluckedSpy.calls.argsFor(0)[0]).toEqual(true);
            expect(pluckedSpy.calls.argsFor(1)).toEqualChunkTexts([ { text: '\n', originalText: '\r' } ]);
         });

         it('returns true if a newline is the next character', () => {
            source.addSegment('\na');
            source.endSegments();

            source.extract('peekIsSpace', undefined, pluckedSpy);
            source.extract('char', undefined, pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(2);
            expect(pluckedSpy.calls.argsFor(0)[0]).toEqual(true);
            expect(pluckedSpy.calls.argsFor(1)[0]).toEqualChunkText('\n');
         });

         it('returns false if a \\u2028 is the next character in v. 1.0', () => {
            source.addSegment('\na');
            source.endSegments();

            source.extract('peekIsSpace', undefined, pluckedSpy);
            source.extract('char', undefined, pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(2);
            expect(pluckedSpy.calls.argsFor(0)[0]).toEqual(true);
            expect(pluckedSpy.calls.argsFor(1)[0]).toEqualChunkText('\n');
         });

         it('returns true if a \\u2028 is the next character in v. 1.1', () => {
            source = new ChunkSource(entityMetaData1dot1);
            source.addSegment('\u2028');
            source.endSegments();

            source.extract('peekIsSpace', undefined, pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toEqual(true);
         });

      });

   });

   // Whitebox note: Code is the same for peekChar and getChar except for index handling. Just test the latter here
   describe('peekChar', () => {

      describe('basic behavior', () => {

         it('calls back with the char', () => {
            source.addSegment(' foo');

            source.extract('peekChar', undefined, pluckedSpy);
            source.extract('char', undefined, pluckedSpy);

            const chunks = pluckedSpy.calls.allArgs().map((arg) => arg[0]);
            expect(chunks).toEqualChunkTexts([ ' ', ' ' ]);
         });

         it('calls back with undefined when nothing in the source', () => {
            source.addSegment('');
            source.endSegments();

            source.extract('peekChar', undefined, pluckedSpy);
            source.extract('char', undefined, pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(2);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
            expect(pluckedSpy.calls.argsFor(1)[0]).toBeUndefined();
         });

      });

      describe('segment spanning', () => {

         it('calls back with undefined if at the end of all segments', () => {
            source.addSegment('');
            source.endSegments();

            source.extract('peekChar', undefined, pluckedSpy);
            source.extract('char', undefined, pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(2);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
            expect(pluckedSpy.calls.argsFor(1)[0]).toBeUndefined();
         });

         it('does not call back when no seguments have been added', () => {
            source.extract('peekChar', undefined, pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(0);
         });

         it('returns the character from the next segment if this one is empty', () => {
            source.addSegment('');
            source.addSegment('x');
            source.endSegments();

            source.extract('peekChar', undefined, pluckedSpy);
            source.extract('char', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'x', 'x' ]);
         });

         it('returns a newline if a carriage return is next', () => {
            source.addSegment('\r');
            source.addSegment('x');
            source.endSegments();

            source.extract('peekChar', undefined, pluckedSpy);
            source.extract('char', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([
               { text: '\n', originalText: '\r' },
               { text: '\n', originalText: '\r' }
            ]);
         });

         it('returns a newline if the next is a carriage return/newline', () => {
            source.addSegment('\r');
            source.addSegment('\nx');
            source.endSegments();

            source.extract('peekChar', undefined, pluckedSpy);
            source.extract('char', undefined, pluckedSpy);
            source.extract('char', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([
               { text: '\n', originalText: '\r\n' },
               { text: '\n', originalText: '\r\n' },
               'x'
            ]);
         });

      });

      describe('ranges', () => {

         it('delivers the a one character range for a single character', () => {
            source.addSegment('012345abcdefX');
            source.endSegments();

            source.extract('peekChar', undefined, pluckedSpy);
            source.extract('char', undefined, pluckedSpy);

            expect(pluckedSpy.calls.argsFor(0)[0]).toEqualChunkRange(new Range(defaultLoc, 0, 0, 0, 1, 0, 1));
            expect(pluckedSpy.calls.argsFor(1)[0]).toEqualChunkRange(new Range(defaultLoc, 0, 0, 0, 1, 0, 1));
         });

         it('delivers the a two character range for a complex newline', () => {
            source.addSegment('\r\n012345abcdefX');
            source.endSegments();

            source.extract('peekChar', undefined, pluckedSpy);
            source.extract('char', undefined, pluckedSpy);

            expect(pluckedSpy.calls.argsFor(0)[0]).toEqualChunkRange(new Range(defaultLoc, 0, 0, 0, 2, 1, 0));
            expect(pluckedSpy.calls.argsFor(1)[0]).toEqualChunkRange(new Range(defaultLoc, 0, 0, 0, 2, 1, 0));
         });

      });

   });

   describe('extract("char")', () => {

      describe('basic behavior', () => {

         it('calls back with a chunk with the next character', () => {
            source.addSegment('x');
            source.endSegments();

            source.extract('char', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'x' ]);
         });

         it('calls back with undefined when no character at the offset', () => {
            source.addSegment('');
            source.endSegments();

            source.extract('char', undefined, pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
         });

      });

      describe('segment spanning', () => {

         it('does not call callback if no data is passed to source', () => {
            source.extract('char', undefined, pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(0);
         });

         it('calls back with undefined when at the end of input', () => {
            source.addSegment('');
            source.endSegments();

            source.extract('char', undefined, pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
         });

         it('calls back with a char when segment added later', () => {
            source.extract('char', undefined, pluckedSpy);

            source.addSegment('abc');
            source.endSegments(); // needed since encoding scanning still waiting

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'a' ]);
         });

         it('calls back with a char at middle of segment', () => {
            source.addSegment('123nun');
            source.extract('digits', undefined, pluckedSpy);

            source.extract('char', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '123', 'n' ]);
         });

         it('calls back with a char at end of segment', () => {
            source.addSegment('123p');
            source.extract('digits', undefined, pluckedSpy);

            source.extract('char', undefined, pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(2);
            expect(pluckedSpy.calls.argsFor(1)[0]).toEqualChunkText('p');
         });

         it('calls back with a char at start of subsequent segment', () => {
            source.addSegment('123');
            source.addSegment('great');
            source.extract('digits', undefined, pluckedSpy);

            source.extract('char', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '123', 'g' ]);
         });

         it('does not call back if there is just a carriage return at the end of a non-terminal segment', () => {
            source.addSegment('\r');

            source.extract('char', undefined, pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(0);
         });

         it('calls back with a newline when a carriage return is found at the end of the terminal segment', () => {
            source.addSegment('\r');
            source.endSegments();

            source.extract('char', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ { text: '\n', originalText: '\r' } ]);
         });

         it('calls back with a single newline after finding a carriage return and newline across segments', () => {
            source.addSegment('\r');
            source.addSegment('\n');
            source.addSegment('x');
            source.endSegments(); // needed since encoding scanning still waiting

            source.extract('char', undefined, pluckedSpy);
            source.extract('char', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ { text: '\n', originalText: '\r\n' }, 'x' ]);
         });

         it('calls back with a single newline after finding a carriage return and \\u0085 across segments', () => {
            source = new ChunkSource(entityMetaData1dot1);
            source.addSegment('\r');
            source.addSegment('\u0085');
            source.addSegment('x');
            source.endSegments(); // needed since encoding scanning still waiting

            source.extract('char', undefined, pluckedSpy);
            source.extract('char', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ { text: '\n', originalText: '\r\u0085' }, 'x' ]);
         });

         it('calls back with a newline after finding a CR at end of one segment and other char at next start', () => {
            source.addSegment('\r');
            source.addSegment('x');
            source.endSegments(); // needed since encoding scanning still waiting

            source.extract('char', undefined, pluckedSpy);
            source.extract('char', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ { text: '\n', originalText: '\r' }, 'x' ]);
         });

      });

      describe('whitespace handling', () => {

         it('calls back with a tab', () => {
            source.addSegment('\t');
            source.endSegments(); // needed since encoding scanning still waiting

            source.extract('char', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '\t' ]);
         });

         it('calls back with a space', () => {
            source.addSegment(' ');
            source.endSegments(); // needed since encoding scanning still waiting

            source.extract('char', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ ' ' ]);
         });

         it('calls back with a newline', () => {
            source.addSegment('\n');
            source.endSegments(); // needed since encoding scanning still waiting

            source.extract('char', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '\n' ]);
         });

         it('calls back with a \\u0085 in 1.0', () => {
            source.addSegment('\u0085');
            source.endSegments();

            source.extract('char', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '\u0085' ]);
         });

         it('calls back with a \\u0085 as a newline in 1.1', () => {
            source = new ChunkSource(entityMetaData1dot1);
            source.addSegment('\u0085');
            source.endSegments();

            source.extract('char', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ { text: '\n', originalText: '\u0085' } ]);
         });

         it('calls back with a \\u2028 in 1.0', () => {
            source.addSegment('\u2028');
            source.endSegments();

            source.extract('char', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '\u2028' ]);
         });

         it('calls back with a \\u2028 as a newlinein 1.1', () => {
            source = new ChunkSource(entityMetaData1dot1);
            source.addSegment('\u2028');
            source.endSegments();

            source.extract('char', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ { text: '\n', originalText: '\u2028' } ]);
         });

         it('calls back with a carriage return as a newline', () => {
            source.addSegment('\rx');
            source.endSegments(); // needed since encoding scanning still waiting

            source.extract('char', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ { text: '\n', originalText: '\r' } ]);
         });

         it('calls back with a carriage return/newline as a newline', () => {
            source.addSegment('\r\n');
            source.endSegments(); // needed since encoding scanning still waiting

            source.extract('char', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ { text: '\n', originalText: '\r\n' } ]);
         });

         it('calls back with a carriage return/\\u0085 as a newline and ignores the latter in 1.0', () => {
            source.addSegment('\r\u0085');
            source.endSegments(); // needed since encoding scanning still waiting

            source.extract('char', undefined, pluckedSpy);
            source.extract('char', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ { text: '\n', originalText: '\r' }, '\u0085' ]);
         });

         it('calls back with a carriage return/\\u0085 as a newline in 1.1', () => {
            source = new ChunkSource(entityMetaData1dot1);
            source.addSegment('\r\u0085x');
            source.endSegments(); // needed since encoding scanning still waiting

            source.extract('char', undefined, pluckedSpy);
            source.extract('char', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ { text: '\n', originalText: '\r\u0085' }, 'x' ]);
         });

         // more about line endings in the segment section, above

      });

      describe('ranges', () => {

         it('delivers the a one character range for a single character', () => {
            source.addSegment('012345abcdefX');
            source.endSegments();

            source.extract('char', undefined, pluckedSpy);

            expect(pluckedSpy.calls.argsFor(0)[0]).toEqualChunkRange(new Range(defaultLoc, 0, 0, 0, 1, 0, 1));
         });

         it('delivers the a two character range for a complex newline', () => {
            source.addSegment('\r\n012345abcdefX');
            source.endSegments();

            source.extract('char', undefined, pluckedSpy);

            expect(pluckedSpy.calls.argsFor(0)[0]).toEqualChunkRange(new Range(defaultLoc, 0, 0, 0, 2, 1, 0));
         });

      });

   });

   describe('extract("digits")', () => {

      describe('basic behavior', () => {

         it('calls back with a chunk with digits when digits are in the segment', () => {
            source.addSegment('012345');
            source.endSegments();

            source.extract('digits', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '012345' ]);
         });

         it('calls back with a chunk with digits when hex digits are in the segment', () => {
            source.addSegment('abcdefABCDEF0123456789');
            source.endSegments();

            source.extract('digits', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'abcdefABCDEF0123456789' ]);
         });

         it('calls back with undefined when no digits at the current offset in source', () => {
            source.addSegment('n012345abcdef');
            source.endSegments();

            source.extract('digits', undefined, pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
         });

         it('throws an error if called without a function', () => {
            source.addSegment('012345');
            source.endSegments();

            expect(() => {
               source.extract('digits', undefined);
            }).toThrowError('Must pass a callback function of the form function(chunk|undefined):void to extract().');
         });

         it('delivers the expected range', () => {
            source.addSegment('012345abcdefX');
            source.endSegments();

            source.extract('digits', undefined, pluckedSpy);

            expect(pluckedSpy.calls.argsFor(0)[0]).toEqualChunkRange(new Range(defaultLoc, 0, 0, 0, 12, 0, 12));
         });

      });

      describe('segment spanning', () => {

         it('calls back with undefined when at the end of input', () => {
            source.addSegment('');
            source.endSegments();

            source.extract('digits', undefined, pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
         });

         it('does not call back if digits go to end of source and nextsegment is not added', () => {
            source.addSegment('012345');

            source.extract('digits', undefined, pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(0);
         });

         it('does not call callback if no data is passed to source', () => {
            source.extract('digits', undefined, pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(0);
         });

         it('calls back with a chunk with digits when digits span segments', () => {
            source.addSegment('012345');
            source.addSegment('aef');
            source.addSegment('12');
            source.endSegments();

            source.extract('digits', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '012345aef12' ]);
         });

         it('calls back with a chunk with digits when digits span segments and digits end before last segment', () => {
            source.addSegment('012345');
            source.addSegment('aef');
            source.addSegment('13last');

            source.extract('digits', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '012345aef13' ]);
         });

         it('calls back even when data added after call', () => {
            source.addSegment('012345');
            source.addSegment('aef');
            source.extract('digits', undefined, pluckedSpy);
            expect(pluckedSpy.calls.count()).toEqual(0);

            source.addSegment('13last');

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '012345aef13' ]);
         });

         it('calls back with digits when called after a different operation (mid-segment)', () => {
            source.addSegment(' \t1234abFred');
            source.endSegments();

            source.extract('space', undefined, pluckedSpy);
            source.extract('digits', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ ' \t', '1234abF' ]);
         });

         it('leaves segment offset right for following operation', () => {
            source.addSegment('1234abF \t');
            source.endSegments();

            source.extract('digits', undefined, pluckedSpy);
            source.extract('space', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '1234abF', ' \t' ]);
         });

         it('delivers the expected range across multiple segments', () => {
            source.addSegment('123');
            source.addSegment('456');
            source.endSegments();

            source.extract('digits', undefined, pluckedSpy);

            expect(pluckedSpy.calls.argsFor(0)[0]).toEqualChunkRange(new Range(defaultLoc, 0, 0, 0, 6, 0, 6));
         });

      });

   });

   describe('extract("space")', () => {

      describe('basic behavior', () => {

         it('calls back with a chunk with space when space at the current offset in the source', () => {
            source.addSegment('    hi');

            source.extract('space', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '    ' ]);
         });

         it('calls back with undefined when no space at the current offset in source', () => {
            source.addSegment('n012345abcdef');
            source.endSegments();

            source.extract('space', undefined, pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
         });

      });

      describe('segment spanning', () => {

         it('does not call back if space goes to end of source and next segment is not added', () => {
            source.addSegment('  \n ');

            source.extract('space', undefined, pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(0);
         });

         it('does not call callback if no data is passed to source', () => {
            source.extract('space', undefined, pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(0);
         });

         it('calls back with undefined when at the end of the input', () => {
            source.addSegment('');
            source.endSegments();

            source.extract('space', undefined, pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
         });

         it('calls back with a chunk with space when space spans segments', () => {
            source.addSegment('  ');
            source.addSegment('\t');
            source.addSegment(' ');
            source.endSegments();

            source.extract('space', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '  \t ' ]);
         });

         it('calls back with a chunk when space spans segments and space ends before last segment', () => {
            source.addSegment('  ');
            source.addSegment('\t');
            source.addSegment(' last');

            source.extract('space', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '  \t ' ]);
         });

         it('calls back even when data added after call', () => {
            source.addSegment('  ');
            source.addSegment('\t');
            source.extract('space', undefined, pluckedSpy);
            expect(pluckedSpy.calls.count()).toEqual(0);

            source.addSegment(' last');

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '  \t ' ]);
         });

      });

      describe('space types', () => {

         it('calls back with a mixture of space and tabs', () => {
            source.addSegment(' \t \t hi');

            source.extract('space', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ ' \t \t ' ]);
         });

         it('recognizes tabs (\\t)', () => {
            source.addSegment(' \t hi');

            source.extract('space', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ ' \t ' ]);
         });

         it('recognizes newlines (\\n)', () => {
            source.addSegment(' \n hi');

            source.extract('space', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ ' \n ' ]);
         });

         it('recognizes carrige returns (\\r) and returns them as newlines', () => {
            source.addSegment(' \r hi');

            source.extract('space', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ { text: ' \n ', originalText: ' \r ' } ]);
         });

         it('recognizes carrige returns/new line combinations (\\r\\n) and returns them as newlines', () => {
            source.addSegment(' \r\n hi');

            source.extract('space', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ { text: ' \n ', originalText: ' \r\n ' } ]);
         });

         it('does not recognize next line (\\u0085) as space if version is 1.0', () => {
            source.addSegment(' \u0085 hi');

            source.extract('space', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ ' ' ]);
         });

         it('does not recognize line separator (\\u2028) as space if version is 1.0', () => {
            source.addSegment(' \u2028 hi');

            source.extract('space', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ ' ' ]);
         });

         it('recognizes next line (\\u0085) as space if version is 1.1 and returns as a new line', () => {
            source = new ChunkSource(entityMetaData1dot1);
            source.addSegment(' \u0085 hi');

            source.extract('space', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ { text: ' \n ', originalText: ' \u0085 ' } ]);
         });

         it('recognizes carriage return and next line (\\r\\u0085) if version is 1.1 and returns as a new line', () => {
            source = new ChunkSource(entityMetaData1dot1);
            source.addSegment(' \r\u0085 hi');

            source.extract('space', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ { text: ' \n ', originalText: ' \r\u0085 ' } ]);
         });

         it('recognizes line separator (\\u2028) as space  if version is 1.1 and returns a new line', () => {
            source = new ChunkSource(entityMetaData1dot1);
            source.addSegment(' \u2028 hi');

            source.extract('space', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ { text: ' \n ', originalText: ' \u2028 ' } ]);
         });

         it('recognizes a combination of line breaks and transforms all to newline', () => {
            source = new ChunkSource(entityMetaData1dot1);
            source.addSegment(' \n\r\r\n \u2028\u0085\r\u0085hi');

            source.extract('space', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ {
               text: ' \n\n\n \n\n\n',
               originalText: ' \n\r\r\n \u2028\u0085\r\u0085'
            } ]);
         });

      });

      describe('ranges', () => {

         it('delivers the space chars', () => {
            source.addSegment(' \t\n\r');
            source.endSegments();

            source.extract('space', undefined, pluckedSpy);

            expect(pluckedSpy.calls.argsFor(0)[0]).toEqualChunkRange(new Range(defaultLoc, 0, 0, 0, 4, 2, 0));
         });

         it('delivers the a complex newlinea', () => {
            source = new ChunkSource(entityMetaData1dot1);
            source.addSegment('\r\n\u2028\u0085\r\u0085');
            source.endSegments();

            source.extract('space', undefined, pluckedSpy);

            expect(pluckedSpy.calls.argsFor(0)[0]).toEqualChunkRange(new Range(defaultLoc, 0, 0, 0, 6, 4, 0));
         });

      });

   });

   describe('extract("word")', () => {

      describe('basic behavior', () => {

         it('calls back with a chunk with a word terminated by a space', () => {
            source.addSegment('word x');

            source.extract('word', [], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'word' ]);
         });

         it('calls back with undefined when no word at the current offset in source', () => {
            source.addSegment(' ');
            source.endSegments();

            source.extract('word', [], pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
         });

      });

      describe('segment spanning', () => {

         it('does not recognize a word if the word reaches to end of segment and new segment not added', () => {
            source.addSegment('IAmAWord');

            source.extract('word', [], pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(0);
         });

         it('does not recognize a word if no segments added', () => {
            source.extract('word', [], pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(0);
         });

         it('recognizes no word when at eof', () => {
            source.addSegment('');
            source.endSegments();
            source.extract('word', [], pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
         });

         it('recognizes a word when it spans segments', () => {
            source.addSegment('Wo');
            source.addSegment('rd');
            source.addSegment('99 ');
            source.endSegments();

            source.extract('word', [], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'Word99' ]);
         });

         it('recognizes a word that ends at the end of the last segment', () => {
            source.addSegment('Wo');
            source.addSegment('rd');
            source.addSegment('98');
            source.endSegments();

            source.extract('word', [], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'Word98' ]);
         });

         it('recognizes a word when it spans segments and the word ends before the last segment arrives', () => {
            source.addSegment('Wo');
            source.addSegment('rd');
            source.addSegment('100 x');

            source.extract('word', [], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'Word100' ]);
         });

         it('recognizes a word even when data added after the call', () => {
            source.addSegment('Wo');
            source.addSegment('r');
            source.extract('word', [], pluckedSpy);
            expect(pluckedSpy.calls.count()).toEqual(0);

            source.addSegment('d101');
            source.endSegments();

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'Word101' ]);
         });

      });

      describe('terminator types', () => {

         it('calls back with a word terminated by a space', () => {
            source.addSegment('word1 ');

            source.extract('word', [], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'word1' ]);
         });

         it('calls back with a word terminated by a tab', () => {
            source.addSegment('word2\t');

            source.extract('word', [], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'word2' ]);
         });

         it('calls back with a word terminated by a newline', () => {
            source.addSegment('word3\n');

            source.extract('word', [], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'word3' ]);
         });

         it('calls back with a word terminated by a carriage return', () => {
            source.addSegment('word4\r');

            source.extract('word', [], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'word4' ]);
         });

         it('does not recognize a word terminated by a \\u0085 in 1.0', () => {
            source.addSegment('word5\u0085\r');

            source.extract('word', [], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'word5\u0085' ]);
         });

         it('does not recognize a word terminated by a \\u2028 in 1.0', () => {
            source.addSegment('word6\u2028\r');

            source.extract('word', [], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'word6\u2028' ]);
         });

         it('recognizes a word terminated by a \\u0085 in 1.1', () => {
            source = new ChunkSource(entityMetaData1dot1);
            source.addSegment('word7\u0085\r');

            source.extract('word', [], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'word7' ]);
         });

         it('recognizes a word terminated by a \\u2028 in 1.1', () => {
            source = new ChunkSource(entityMetaData1dot1);
            source.addSegment('word8\u2028\r');

            source.extract('word', [], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'word8' ]);
         });

         it('recognizes a word terminated by a custom terminator', () => {
            source.addSegment('word9\n');

            source.extract('word', [ 'o' ], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'w' ]);
         });

         it('recognizes a word terminated by a custom multi-character terminator', () => {
            source.addSegment('wordA\n');

            source.extract('word', [ 'rdA' ], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'wo' ]);
         });

         it('recognizes a word terminated by one of several custom terminators', () => {
            source.addSegment('wordA\n');

            source.extract('word', [ 'dA', 'A', 'rd' ], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'wo' ]);
         });

         it('recognizes a word not terminated by a false-postive terminator', () => {
            source.addSegment('wordC\n');

            // d will match, but then r will not
            source.extract('word', [ 'dr' ], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'wordC' ]);
         });

         it('recognizes a word terminated by terminator that spans chunks', () => {
            source.addSegment('wor');
            source.addSegment('dC');

            source.extract('word', [ 'rd' ], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'wo' ]);
         });

      });

   });

   describe('extract("match")', () => {

      describe('basic behavior', () => {

         it('calls back with a chunk that matches the requested match', () => {
            source.addSegment('some stuff');

            source.extract('match', 'som', pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'som' ]);
         });

         it('calls back with undefined when no match at the current offset in source', () => {
            source.addSegment('test');

            source.extract('match', 'xx', pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
         });

      });

      describe('segment spanning', () => {

         it('does recognize a match if the match reaches to end of segment and new segment not added', () => {
            source.addSegment('match');

            source.extract('match', 'match', pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'match' ]);
         });

         it('does not recognize a match if no segments added', () => {
            source.extract('match', 'match', pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(0);
         });

         it('recognizes no match when at eof', () => {
            source.addSegment('');
            source.endSegments();

            source.extract('match', 'match', pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
         });

         it('recognizes a match when it spans segments', () => {
            source.addSegment('Ma');
            source.addSegment('tc');
            source.addSegment('hABxxx');

            source.extract('match', 'Mat', pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'Mat' ]);
         });

         it('recognizes a match that ends at the end of the last segment', () => {
            source.addSegment('Ma');
            source.addSegment('tc');
            source.addSegment('hAB ');
            source.endSegments();

            source.extract('match', 'MatchAB', pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'MatchAB' ]);
         });

         it('recognizes a match when it spans segments and the match ends before the last segment arrives', () => {
            source.addSegment('Ma');
            source.addSegment('tc');
            source.addSegment('hAAxx');

            source.extract('match', 'MatchAA', pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'MatchAA' ]);
         });

         it('recognizes a match even when data added after the call', () => {
            source.addSegment('Ma');
            source.addSegment('t');
            source.extract('match', 'Matc', pluckedSpy);
            expect(pluckedSpy.calls.count()).toEqual(0);

            source.addSegment('ch101 ');

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'Matc' ]);
         });

      });

      describe('interacting calls', () => {

         it('does not increment index on a failed match', () => {
            source.addSegment('on');
            source.addSegment('Click');
            source.endSegments();

            source.extract('match', 'one', pluckedSpy);
            source.extract('word', [], pluckedSpy);

            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
            expect(pluckedSpy.calls.argsFor(1)[0]).toEqualChunkText('onClick');
         });

         it('calls back with value after extract word call', () => {
            source.addSegment('georgeMichael');

            source.extract('word', [ 'M' ], pluckedSpy);
            source.extract('match', 'Micha', pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'george', 'Micha' ]);
         });

         it('calls back with value after an extract match call', () => {
            source.addSegment('testOne');

            source.extract('match', 'test', pluckedSpy);
            source.extract('match', 'One', pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'test', 'One' ]);
         });

         it('calls back with value after an extract match call across segment boundaries', () => {
            source.addSegment('test');
            source.addSegment('Two');
            source.endSegments();

            source.extract('match', 'test', pluckedSpy);
            source.extract('match', 'Two', pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'test', 'Two' ]);
         });

      });

   });

   describe('extract("all")', () => {

      describe('basic behavior', () => {

         it('calls back with a chunk with a word terminated by a space', () => {
            source.addSegment('fox and friends');

            source.extract('all', [ 'x' ], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'fo' ]);
         });

         it('calls back with undefined when nothing in the source', () => {
            source.addSegment('');
            source.endSegments();

            source.extract('all', [ 'x' ], pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
         });

         it('calls back with a chunk with a range for the extracted text', () => {
            source.addSegment('fox and friends');

            source.extract('all', [ 'x' ], pluckedSpy);

            expect(pluckedSpy.calls.argsFor(0)[0]).toEqualChunkRange(new Range(defaultLoc, 0, 0, 0, 2, 0, 2));
         });

         it('calls back with a chunk with a range for the extracted text accounting for newlines', () => {
            source.addSegment('fox\r\nand\nfriends! ');

            source.extract('all', [ '!' ], pluckedSpy);

            expect(pluckedSpy.calls.argsFor(0)[0]).toEqualChunkRange(new Range(defaultLoc, 0, 0, 0, 16, 2, 7));
         });

      });

      describe('segment spanning', () => {

         it('does not call back when terminator not found in current non-final segment', () => {
            source.addSegment('IAmAWord');

            source.extract('all', [ 'x' ], pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(0);
         });

         it('does not call back when no seguments have been added', () => {
            source.extract('all', [ 'x' ], pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(0);
         });

         it('calls back with undefined at EOF', () => {
            source.addSegment('');
            source.endSegments();
            source.extract('all', [ 'x' ], pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
         });

         it('can cope with several empty segments', () => {
            source.addSegment('');
            source.addSegment('');
            source.addSegment('');
            source.endSegments();
            source.extract('all', [ 'x' ], pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
         });

         it('calls back with contents that span segments', () => {
            source.addSegment('Te');
            source.addSegment('xt');
            source.addSegment('10');
            source.endSegments();

            source.extract('all', [ '0' ], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'Text1' ]);
         });

         it('calls back with all content up to EOF when no match found', () => {
            source.addSegment('Te');
            source.addSegment('xt');
            source.addSegment('20');
            source.endSegments();

            source.extract('all', [ '9' ], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'Text20' ]);
         });

         it('calls back with all content up to match even when match at eof', () => {
            source.addSegment('Te');
            source.addSegment('xt');
            source.addSegment('30 ');

            source.extract('all', [ '0' ], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'Text3' ]);
         });

         it('calls back with segment spanning text when match found before EOF', () => {
            source.addSegment('Te');
            source.addSegment('xt');
            source.addSegment('40');
            source.endSegments();

            source.extract('all', [ '0' ], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'Text4' ]);
         });

         it('calls back with text even when final needed segment added after the call', () => {
            source.addSegment('Te');
            source.addSegment('xt');
            source.extract('all', [ '0' ], pluckedSpy);
            expect(pluckedSpy.calls.count()).toEqual(0);

            source.addSegment('50 ');

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'Text5' ]);
         });

         it('calls back with text for a terminator that spans multiple segments', () => {
            source.addSegment('Te');
            source.addSegment('xt<');
            source.addSegment('!');
            source.addSegment('-');
            source.addSegment('-');
            source.endSegments();
            source.extract('all', [ '<!--' ], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'Text' ]);
         });

         it('calls back with the full text if it finds a terminator does not across multiple segments', () => {
            source.addSegment('Te');
            source.addSegment('xt<');
            source.addSegment('!');
            source.addSegment('-');
            source.addSegment('-X');
            source.endSegments();
            source.extract('all', [ '<!---' ], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'Text<!--X' ]);
         });

         it('calls back with a range for the extracted text accounting for newlines across segments', () => {
            source.addSegment('fox\r');
            source.addSegment('and\n');
            source.addSegment('friends! ');

            source.extract('all', [ '!' ], pluckedSpy);

            expect(pluckedSpy.calls.argsFor(0)[0]).toEqualChunkRange(new Range(defaultLoc, 0, 0, 0, 15, 2, 7));
         });

      });

      describe('terminators', () => {

         it('calls back with match of the second terminator', () => {
            source.addSegment('text10 ');

            source.extract('all', [ '0', '1' ], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'text' ]);
         });

         it('calls back with match of a multi character terminator', () => {
            source.addSegment('text2 234');
            source.endSegments();

            source.extract('all', [ '0', '234' ], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'text2 ' ]);
         });

         it('reports the full value back if the input ends in the middle of a terminator', () => {
            source.addSegment('text1<!-');
            source.endSegments();

            source.extract('all', [ '<!--' ], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'text1<!-' ]);
         });

         it('reports the value minus the terminator if the terminator is at the end', () => {
            source.addSegment('text1<!--');
            source.endSegments();

            source.extract('all', [ '<!--' ], pluckedSpy);
            source.extract('all', [ ], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'text1', '<!--' ]);
         });

      });

   });

   describe('extract("markup")', () => {

      describe('basic behavior', () => {

         it('calls back with a chunk with the next bit of markup', () => {
            source.addSegment('<foo');

            source.extract('markup', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '<' ]);
         });

         it('calls back with undefined when no markup at the offset', () => {
            source.addSegment('ssss');

            source.extract('markup', undefined, pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
         });

      });

      describe('segment spanning', () => {

         it('does not call callback if no data is passed to source', () => {
            source.extract('markup', undefined, pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(0);
         });

         it('calls back with undefined when at the end of input', () => {
            source.addSegment('');
            source.endSegments();

            source.extract('markup', undefined, pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
         });

         it('calls back with a markup char when segment added later', () => {
            source.extract('markup', undefined, pluckedSpy);

            source.addSegment('<start>');

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '<' ]);
         });

         it('calls back with a markup char when in middle of segment', () => {
            source.addSegment('123<!--');
            source.endSegments();
            source.extract('digits', undefined, pluckedSpy);

            source.extract('markup', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '123', '<!--' ]);
         });

         it('calls back with markup at end of segment', () => {
            source.addSegment('123<?');
            source.endSegments();
            source.extract('digits', undefined, pluckedSpy);

            source.extract('markup', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '123', '<?' ]);
         });

         it('calls back with markup at start of subsequent segment', () => {
            source.addSegment('123');
            source.addSegment('<start>');
            source.extract('digits', undefined, pluckedSpy);

            source.extract('markup', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '123', '<' ]);
         });

      });

      describe('all markup', () => {

         it('calls back with a <!--', () => {
            source.addSegment('<!--bar ');

            source.extract('markup', undefined, pluckedSpy);

            expect(pluckedSpy.calls.argsFor(0)[0]).toEqualChunkText('<!--');
         });

         it('calls back with a <!', () => {
            source.addSegment('<!foo');

            source.extract('markup', undefined, pluckedSpy);

            expect(pluckedSpy.calls.argsFor(0)[0]).toEqualChunkText('<!');
         });

         it('calls back with a <', () => {
            source.addSegment('<start>');

            source.extract('markup', undefined, pluckedSpy);

            expect(pluckedSpy.calls.argsFor(0)[0]).toEqualChunkText('<');
         });

         it('calls back with a <?', () => {
            source.addSegment('<?xml?>');
            source.endSegments(); // needed since encoding scanning still waiting

            source.extract('markup', undefined, pluckedSpy);

            expect(pluckedSpy.calls.argsFor(0)[0]).toEqualChunkText('<?');
         });

         it('calls back with a &', () => {
            source.addSegment('&testEntity;');

            source.extract('markup', undefined, pluckedSpy);

            expect(pluckedSpy.calls.argsFor(0)[0]).toEqualChunkText('&');
         });

         it('calls back with </', () => {
            source.addSegment('</end>');

            source.extract('markup', undefined, pluckedSpy);

            expect(pluckedSpy.calls.argsFor(0)[0]).toEqualChunkText('</');
         });

      });

   });

   describe('extract("close")', () => {

      describe('basic behavior', () => {

         it('calls back with a chunk with the close', () => {
            source.addSegment(']]>');
            source.endSegments();

            source.extract('close', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ ']]>' ]);
         });

         it('calls back with undefined when no close at the offset', () => {
            source.addSegment('ssss');

            source.extract('close', undefined, pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
         });

      });

      describe('segment spanning', () => {

         it('does not call callback if no data is passed to source', () => {
            source.extract('close', undefined, pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(0);
         });

         it('calls back with undefined when at the end of input', () => {
            source.addSegment('');
            source.endSegments();

            source.extract('close', undefined, pluckedSpy);

            expect(pluckedSpy.calls.count()).toEqual(1);
            expect(pluckedSpy.calls.argsFor(0)[0]).toBeUndefined();
         });

         it('calls back with a close char when segment added later', () => {
            source.extract('close', undefined, pluckedSpy);

            source.addSegment(']]>');
            source.endSegments();

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ ']]>' ]);
         });

         it('calls back with a close char when in middle of segment', () => {
            source.addSegment('123]]>');
            source.endSegments();
            source.extract('digits', undefined, pluckedSpy);

            source.extract('close', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '123', ']]>' ]);
         });

         it('calls back with close at end of segment', () => {
            source.addSegment('123]]>');
            source.endSegments();
            source.extract('digits', undefined, pluckedSpy);

            source.extract('close', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '123', ']]>' ]);
         });

         it('calls back with close at start of subsequent segment', () => {
            source.addSegment('123');
            source.addSegment(']]>');
            source.endSegments();
            source.extract('digits', undefined, pluckedSpy);

            source.extract('close', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '123', ']]>' ]);
         });

         it('calls back with close when it spans segments', () => {
            source.addSegment('123]');
            source.addSegment(']>');
            source.endSegments();
            source.extract('digits', undefined, pluckedSpy);

            source.extract('close', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '123', ']]>' ]);
         });

      });

      describe('all closes', () => {

         it('calls back with a ]', () => {
            source.addSegment(']]x');
            source.endSegments();

            source.extract('close', undefined, pluckedSpy);

            expect(pluckedSpy.calls.argsFor(0)[0]).toEqualChunkText(']');
         });

         it('calls back with a ]]>', () => {
            source.addSegment(']]>');
            source.endSegments();

            source.extract('close', undefined, pluckedSpy);

            expect(pluckedSpy.calls.argsFor(0)[0]).toEqualChunkText(']]>');
         });

      });

   });

   describe('undo()', () => {

      describe('basic behavior', () => {

         it('puts the previous text back', () => {
            source.addSegment('123 one');

            source.extract('digits', undefined, pluckedSpy);
            source.undo(pluckedSpy.calls.argsFor(0)[0]);
            source.extract('digits', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '123', '123' ]);
         });

         it('does nothing if passed undefined', () => {
            source.addSegment('123 one');

            source.extract('digits', undefined, pluckedSpy);
            source.undo(undefined);
            source.extract('space', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '123', ' ' ]);
         });

         it('throws an error if called something other than undefined or a chunk', () => {
            source.addSegment('012345');

            expect(() => {
               source.undo(55);
            }).toThrowError('Must pass a Chunk or undefined to undo().');
         });

      });

      describe('segment spanning', () => {

         it('erroniously allows one to undo a chunk before any segments added', () => {
            source.undo(new Chunk('one x', 'one x'));
            source.extract('word', [], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ 'one' ]);
         });

         it('will add to the current segment', () => {
            source.addSegment('123 one');
            source.extract('digits', undefined, pluckedSpy);

            source.undo(pluckedSpy.calls.argsFor(0)[0]);
            source.extract('digits', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '123', '123' ]);
         });

         it('will add to a spanning segment location', () => {
            source.addSegment('12');
            source.addSegment('3 one');
            source.endSegments();
            source.extract('digits', undefined, pluckedSpy);

            source.undo(pluckedSpy.calls.argsFor(0)[0]);
            source.extract('digits', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '123', '123' ]);
         });

         it('will add to before the remaining segment', () => {
            source.addSegment('123');
            source.addSegment(' one');
            source.extract('digits', undefined, pluckedSpy);

            source.undo(pluckedSpy.calls.argsFor(0)[0]);
            source.extract('digits', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '123', '123' ]);
         });

         it('will add text that can then be retrieved with a different routine', () => {
            source.addSegment('123');
            source.addSegment(' o<ne');
            source.extract('all', [ '<' ], pluckedSpy);

            source.undo(pluckedSpy.calls.argsFor(0)[0]);
            source.extract('digits', undefined, pluckedSpy);
            source.extract('space', undefined, pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '123 o', '123', ' ' ]);
         });

         it('throws an error if the value that is undone is not correct', () => {
            source.addSegment('0123zzz');
            source.extract('digits', undefined, pluckedSpy);

            expect(() => {
               source.undo(new Chunk('999', '999'));
            }).toThrowError('Chunk does not match target location.');
         });

         it('throws an error if the value that is undone is not correct and spans segments', () => {
            source.addSegment('012');
            source.addSegment('3zzz');
            source.extract('digits', undefined, pluckedSpy);

            expect(() => {
               source.undo(new Chunk('0124', '0124'));
            }).toThrowError('Chunk does not match target location.');
         });

      });

   });

   describe('version', () => {

      it('extracts the version from the input', () => {
         source.addSegment('<?');
         source.addSegment('xml version="1.3"?>');
         source.endSegments();

         expect(source._versionFound).toEqual('1.3');
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

      it('makes no opinion on a encoding if it finds a <?xml but then nothing for 100 chars', () => {
         source.addSegment('<?xmlomnamashivayaomnamashivayaomnamashivayaomnamashivayaomnamashivayaomnamashivaya' +
            'omnamashivayaomnamashivayaomnamashivayaomnamashivayaomnamashivaya');

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

      describe('UTF-8/BOM', () => {

         xit('decodes text in this encoding', () => {
            source.addSegment('\u00ef\u00bb\u00bf<?xml version="1.0"?>');
            source.endSegments();

            source.extract('all', [ '?>' ], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '<?xml version="1.0"' ]);
         });

      });

      describe('UTF-16BE', () => {

         it('decodes text in this encoding', () => {
            source.addSegment('\u0000\u003c\u0000\u003f\u0000\u0078\u0000\u006d\u0000\u006c\u0000\u0020\u0000\u0076' +
               '\u0000\u0065\u0000\u0072\u0000\u0073\u0000\u0069\u0000\u006f\u0000\u006e\u0000\u003d\u0000\u0022' +
               '\u0000\u0031\u0000\u002e\u0000\u0030\u0000\u0022\u0000\u003f\u0000\u003e');
            source.endSegments();

            source.extract('all', [ '1' ], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '<?xml version="' ]);
         });

      });

      describe('UTF-16LE', () => {

         it('decodes text in this encoding', () => {
            source.addSegment('\u003c\u0000\u003f\u0000\u0078\u0000\u006d\u0000\u006c\u0000\u0020\u0000\u0076\u0000' +
               '\u0065\u0000\u0072\u0000\u0073\u0000\u0069\u0000\u006f\u0000\u006e\u0000\u003d\u0000\u0022\u0000' +
               '\u0031\u0000\u002e\u0000\u0030\u0000\u0022\u0000\u003f\u0000\u003e\u0000');
            source.endSegments();

            source.extract('all', [ '1' ], pluckedSpy);

            expect(pluckedSpy.calls.allArgs()).toEqualChunkTexts([ '<?xml version="' ]);
         });

      });

   });

});
