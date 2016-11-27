/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const EntityLocation = require('./EntityLocation.js');
const Offset = require('./Offset.js');
const EntityInfo = require('./util/EntityInfo.js');
const PlainChunk = require('./TextChunk.js').PlainChunk;
const WordChunk = require('./TextChunk.js').WordChunk;
const WithSpaceChunk = require('./TextChunk.js').WithSpaceChunk;
const DigitChunk = require('./TextChunk.js').DigitChunk;
const XmlStringCursor = require('./XmlStringCursor.js');
const TYPE = require('./TextChunk.js').TYPE;

describe('XmlStringCursor', () => {

   describe('construction', () => {

      it('can be constructed with a string', () => {
         expect(() => {
            new XmlStringCursor('hi');
         }).not.toThrow();
      });

      it('throws an error if it is called with a non-string', () => {
         expect(() => {
            new XmlStringCursor(5);
         }).toThrowError('Must pass a string to a StringCursor.');
      });

      it('throws no error if called with a String() instance', () => {
         /* eslint-disable no-new-wrappers */
         expect(() => {
            new XmlStringCursor(new String('5'));
         }).not.toThrow();
      });

   });

   describe('peekType()', () => {

      it('returns MARKUP if there is a < next', () => {
         const c = new XmlStringCursor('<foo>');

         expect(c.peekType()).toEqual(TYPE.MARKUP);
      });

      it('returns MARKUP if there is a & next', () => {
         const c = new XmlStringCursor('&foo>');

         expect(c.peekType()).toEqual(TYPE.MARKUP);
      });

      it('returns SPACE if that is what is next', () => {
         const c = new XmlStringCursor(' \t\n ');

         expect(c.peekType()).toEqual(TYPE.SPACE);
      });

      it('returns that \\u0085 is STRING if this is parsing as 1.0', () => {
         const c = new XmlStringCursor('\u0085');

         expect(c.peekType()).toEqual(TYPE.STRING);
      });

      it('returns that \\u2028 is STRING if this is parsing as 1.0', () => {
         const c = new XmlStringCursor('\u2028');

         expect(c.peekType()).toEqual(TYPE.STRING);
      });

      it('returns that \\u0085 is SPACE if this is parsing as 1.1', () => {
         const c = new XmlStringCursor('\u0085');
         const pk = new EntityInfo();
         pk.version = 1.1;
         c.setEntityInfo(pk);

         expect(c.peekType()).toEqual(TYPE.SPACE);
      });

      it('returns that \\u2028 is SPACE if this is parsing as 1.1', () => {
         const c = new XmlStringCursor('\u2028');
         const pk = new EntityInfo();
         pk.version = 1.1;
         c.setEntityInfo(pk);

         expect(c.peekType()).toEqual(TYPE.SPACE);
      });

      it('returns STRING if the next is neither markup or space', () => {
         const c = new XmlStringCursor('one');

         expect(c.peekType()).toEqual(TYPE.STRING);
      });

      it('returns CLOSE if the next is a square bracket', () => {
         const c = new XmlStringCursor(']<');

         expect(c.peekType()).toEqual(TYPE.CLOSE);
      });

      it('returns CLOSE if the next the end of a conditional section', () => {
         const c = new XmlStringCursor(']]>');

         expect(c.peekType()).toEqual(TYPE.CLOSE);
      });

      it('returns undefined if at the end of the input', () => {
         const c = new XmlStringCursor('');

         expect(c.peekType()).toBeUndefined();
      });

      it('works correctly when cursor has incremented past start of string', () => {
         const c = new XmlStringCursor('h<foo>');
         c.getChar();

         expect(c.peekType()).toEqual(TYPE.MARKUP);
      });

      it('adds nothing to the recent chunks', () => {
         const c = new XmlStringCursor('h<foo>');
         c.peekType();

         expect(c.getRecentChunks()).toEqual([]);
      });

   });

   describe('peekChar()', () => {

      it('returns the next character', () => {
         const c = new XmlStringCursor('<foo>');

         expect(c.peekChar()).toEqual(new PlainChunk('<', new Offset(0, 0, 0), new Offset(0, 1, 1)));
      });

      it('returns undefined if there is no next character', () => {
         const c = new XmlStringCursor('');

         expect(c.peekChar()).toBeUndefined();
      });

      it('returns the next character even if it is a \\n', () => {
         const c = new XmlStringCursor('\n foo');

         expect(c.peekChar()).toEqual(new PlainChunk('\n', new Offset(0, 0, 0), new Offset(1, 0, 1)));
      });

      it('returns the next character as \\n if it is a \\r', () => {
         const c = new XmlStringCursor('\r foo');

         expect(c.peekChar()).toEqual(new PlainChunk('\n', new Offset(0, 0, 0), new Offset(1, 0, 1)));
      });

      it('returns the next character as \\u0085 if it is \\u0085 and this is 1.0', () => {
         const c = new XmlStringCursor('\u0085 foo');

         expect(c.peekChar()).toEqual(new PlainChunk('\u0085', new Offset(0, 0, 0), new Offset(0, 1, 1)));
      });

      it('returns the next character as \\u2028 iof it is \\u2028 and this is 1.0', () => {
         const c = new XmlStringCursor('\u2028 foo');

         expect(c.peekChar()).toEqual(new PlainChunk('\u2028', new Offset(0, 0, 0), new Offset(0, 1, 1)));
      });

      it('returns the next character as \\n if it is \\u0085 and this is 1.1', () => {
         const c = new XmlStringCursor('\u0085 foo');
         const pk = new EntityInfo();
         pk.version = 1.1;
         c.setEntityInfo(pk);

         expect(c.peekChar()).toEqual(new PlainChunk('\n', new Offset(0, 0, 0), new Offset(1, 0, 1)));
      });

      it('returns the next character as \\n if it is \\u2028 and this is 1.1', () => {
         const c = new XmlStringCursor('\u2028 foo');
         const pk = new EntityInfo();
         pk.version = 1.1;
         c.setEntityInfo(pk);

         expect(c.peekChar()).toEqual(new PlainChunk('\n', new Offset(0, 0, 0), new Offset(1, 0, 1)));
      });

      it('returns the next character as \\n if it is both a \\r\\n pair', () => {
         const c = new XmlStringCursor('\r\n foo');

         expect(c.peekChar()).toEqual(new PlainChunk('\n', new Offset(0, 0, 0), new Offset(1, 0, 2)));
      });

      it('returns a \\n if next characters are \\r\\u0085 (and does not consume the latter) and this is 1.0', () => {
         const c = new XmlStringCursor('\r\u0085 foo');

         expect(c.peekChar()).toEqual(new PlainChunk('\n', new Offset(0, 0, 0), new Offset(1, 0, 1)));
      });

      it('returns the next character as \\n if it is a \\r\\u0085 if this is 1.1', () => {
         const c = new XmlStringCursor('\r\u0085 foo');
         const pk = new EntityInfo();
         pk.version = 1.1;
         c.setEntityInfo(pk);

         expect(c.peekChar()).toEqual(new PlainChunk('\n', new Offset(0, 0, 0), new Offset(1, 0, 2)));
      });

      it('returns the next character even when the cursor has incremented past start of string', () => {
         const c = new XmlStringCursor('x\r\n foo');
         c.getChar();

         expect(c.peekChar()).toEqual(new PlainChunk('\n', new Offset(0, 1, 1), new Offset(1, 0, 3)));
      });

      it('adds nothing to the recent chunks', () => {
         const c = new XmlStringCursor('h<foo>');
         c.peekChar();

         expect(c.getRecentChunks()).toEqual([]);
      });

   });

   describe('getSpace()', () => {

      it('returns the next run of spaces', () => {
         const c = new XmlStringCursor('    hi');

         expect(c.getSpace()).toEqual(new WithSpaceChunk('    ', '    ', new Offset(0, 0, 0), new Offset(0, 4, 4)));
      });

      it('returns undefined if the first available character is ot a space', () => {
         const c = new XmlStringCursor('hi');

         expect(c.getSpace()).toBeUndefined();
      });

      it('returns the a mixture of tabs and spaces', () => {
         const c = new XmlStringCursor(' \t \t hi');

         expect(c.getSpace()).toEqual(new WithSpaceChunk(' \t \t ', ' \t \t ',
            new Offset(0, 0, 0), new Offset(0, 5, 5)));
      });

      it('returns the a mixture of tabs and spaces and newlines', () => {
         const c = new XmlStringCursor(' \n \t \n hi');

         expect(c.getSpace()).toEqual(new WithSpaceChunk(' \n \t \n ', ' \n \t \n ',
            new Offset(0, 0, 0), new Offset(2, 1, 7)));
      });

      it('treats a CR like a LF', () => {
         const c = new XmlStringCursor(' \rhi');
         const expected = new WithSpaceChunk(' \n', ' \r', new Offset(0, 0, 0), new Offset(1, 0, 2));

         expect(c.getSpace()).toEqual(expected);
      });

      it('treats a CR LF like a LF', () => {
         const c = new XmlStringCursor(' \r\nhi');
         const expected = new WithSpaceChunk(' \n', ' \r\n', new Offset(0, 0, 0), new Offset(1, 0, 3));

         expect(c.getSpace()).toEqual(expected);
      });

      it('treats a \\u0085 like non-space if this is 1.0', () => {
         const c = new XmlStringCursor(' \u0085hi');
         const expected = new WithSpaceChunk(' ', ' ', new Offset(0, 0, 0), new Offset(0, 1, 1));

         expect(c.getSpace()).toEqual(expected);
      });

      it('treats a \\u2028 like a non-space if this is 1.0', () => {
         const c = new XmlStringCursor(' \u2028hi');
         const expected = new WithSpaceChunk(' ', ' ', new Offset(0, 0, 0), new Offset(0, 1, 1));

         expect(c.getSpace()).toEqual(expected);
      });

      it('treats a \\u0085 like a \\n if this is 1.1', () => {
         const c = new XmlStringCursor(' \u0085hi');
         const expected = new WithSpaceChunk(' \n', ' \u0085', new Offset(0, 0, 0), new Offset(1, 0, 2));
         const pk = new EntityInfo();
         pk.version = 1.1;
         c.setEntityInfo(pk);

         expect(c.getSpace()).toEqual(expected);
      });

      it('treats a \\u2028 like a \\n if this is 1.1', () => {
         const c = new XmlStringCursor(' \u2028hi');
         const expected = new WithSpaceChunk(' \n', ' \u2028', new Offset(0, 0, 0), new Offset(1, 0, 2));
         const pk = new EntityInfo();
         pk.version = 1.1;
         c.setEntityInfo(pk);

         expect(c.getSpace()).toEqual(expected);
      });

      it('treats a CR LF like a LF', () => {
         const c = new XmlStringCursor(' \r\nhi');
         const expected = new WithSpaceChunk(' \n', ' \r\n', new Offset(0, 0, 0), new Offset(1, 0, 3));

         expect(c.getSpace()).toEqual(expected);
      });

      it('treats a mixture of CRLF and CR and LF as just the right set of LF', () => {
         const c = new XmlStringCursor(' \r\n \n \r hi');
         const expected = new WithSpaceChunk(' \n \n \n ', ' \r\n \n \r ', new Offset(0, 0, 0), new Offset(3, 1, 8));

         expect(c.getSpace()).toEqual(expected);
      });

      it('treats a \\r\\u0085 like \\n\\u0085 if this is 1.0', () => {
         const c = new XmlStringCursor(' \r\u0085hi');
         const expected = new WithSpaceChunk(' \n', ' \r', new Offset(0, 0, 0), new Offset(1, 0, 2));

         expect(c.getSpace()).toEqual(expected);
      });

      it('treats a \\r\\u0085 like a \\n if this is 1.1', () => {
         const c = new XmlStringCursor(' \r\u0085hi');
         const expected = new WithSpaceChunk(' \n', ' \r\u0085', new Offset(0, 0, 0), new Offset(1, 0, 3));
         const pk = new EntityInfo();
         pk.version = 1.1;
         c.setEntityInfo(pk);

         expect(c.getSpace()).toEqual(expected);
      });

      it('returns the original text, without line ending changes', () => {
         const c = new XmlStringCursor(' \r \n \r\n \t');

         expect(c.getSpace().originalText).toEqual(' \r \n \r\n \t');
      });

      it('reads a space string from the middle of the string', () => {
         const c = new XmlStringCursor('one twp');
         c.getWord([]);

         expect(c.getSpace()).toEqual(new WithSpaceChunk(' ', ' ', new Offset(0, 3, 3), new Offset(0, 4, 4)));
      });

      it('adds the space chunk to the recent chunks', () => {
         const c = new XmlStringCursor(' \t\n');
         c.getSpace();

         expect(c.getRecentChunks()).toEqual([
            new WithSpaceChunk(' \t\n', ' \t\n', new Offset(0, 0, 0), new Offset(1, 0, 3))
         ]);
      });

      it('assigns a location to the created chunk', () => {
         const loc = new EntityLocation('http://test.com/foo.bar');
         const c = new XmlStringCursor(' hi', loc);

         expect(c.getSpace().entityLocation).toEqual(loc);
      });

   });

   describe('getWord()', () => {

      it('throws an error if passed a terminator with spaces', () => {
         const c = new XmlStringCursor('');

         expect(() => {
            c.getWord([ '< <' ]);
         }).toThrowError('Terminators may not have any space characters (space, tab, newline, etc).');
      });

      it('returns the next space-terminated word', () => {
         const c = new XmlStringCursor('one two');

         const expected = new WordChunk('one', true, true, new Offset(0, 0, 0), new Offset(0, 3, 3));
         expect(c.getWord([])).toEqual(expected);
      });

      it('returns the next word, even if a single letter', () => {
         const c = new XmlStringCursor('o two');

         const expected = new WordChunk('o', true, true, new Offset(0, 0, 0), new Offset(0, 1, 1));
         expect(c.getWord([])).toEqual(expected);
      });

      it('can get multiple words in a row', () => {
         const c = new XmlStringCursor('one two');
         c.getWord([]);
         c.getSpace();

         const expected = new WordChunk('two', true, true, new Offset(0, 4, 4), new Offset(0, 7, 7));
         expect(c.getWord([])).toEqual(expected);
      });

      it('considers the word terminated at the specified terminator', () => {
         const c = new XmlStringCursor('oneX');

         const expected = new WordChunk('one', true, true, new Offset(0, 0, 0), new Offset(0, 3, 3));
         expect(c.getWord([ 'X' ])).toEqual(expected);
      });

      it('does not terminate at \\u0085 in 1.0', () => {
         const c = new XmlStringCursor('one\u0085X');
         const expected = new WordChunk('one\u0085X', false, false, new Offset(0, 0, 0), new Offset(0, 5, 5));

         expect(c.getWord([ ])).toEqual(expected);
      });

      it('does not terminate at \\u2028 in 1.0', () => {
         const c = new XmlStringCursor('one\u2028X');
         const expected = new WordChunk('one\u2028X', false, false, new Offset(0, 0, 0), new Offset(0, 5, 5));

         expect(c.getWord([ ])).toEqual(expected);
      });

      it('does terminate at \\u0085 in 1.1', () => {
         const c = new XmlStringCursor('one\u0085X');
         const expected = new WordChunk('one', true, true, new Offset(0, 0, 0), new Offset(0, 3, 3));
         const pk = new EntityInfo();
         pk.version = 1.1;
         c.setEntityInfo(pk);

         expect(c.getWord([ ])).toEqual(expected);
      });

      it('does terminate at \\u2028 in 1.1', () => {
         const c = new XmlStringCursor('one\u2028X');
         const expected = new WordChunk('one', true, true, new Offset(0, 0, 0), new Offset(0, 3, 3));
         const pk = new EntityInfo();
         pk.version = 1.1;
         c.setEntityInfo(pk);

         expect(c.getWord([ ])).toEqual(expected);
      });

      it('considers the word terminated at any of the specified terminators', () => {
         const c1 = new XmlStringCursor('oneX');
         const c2 = new XmlStringCursor('one?');
         const c3 = new XmlStringCursor('one/]]>');

         const expected = new WordChunk('one', true, true, new Offset(0, 0, 0), new Offset(0, 3, 3));
         expect(c1.getWord([ 'X', '?', '/]]>' ])).toEqual(expected);
         expect(c2.getWord([ 'X', '?', '/]]>' ])).toEqual(expected);
         expect(c3.getWord([ 'X', '?', '/]]>' ])).toEqual(expected);
      });

      it('identifies a word even if not at the start of the cursor', () => {
         const c = new XmlStringCursor('one> twoX');
         c.getWord([ '>', 'X' ]);
         c.getChar();
         c.getSpace();

         const expected = new WordChunk('two', true, true, new Offset(0, 5, 5), new Offset(0, 8, 8));
         expect(c.getWord([ '>', 'X' ])).toEqual(expected);
      });

      it('returns undefined if there is a space at the cursor', () => {
         const c = new XmlStringCursor(' one two');

         expect(c.getWord([])).toBeUndefined();
      });

      it('returns undefined if there is another word terminator at the cursor', () => {
         const c = new XmlStringCursor('?>one two');

         expect(c.getWord([ '?>' ])).toBeUndefined();
      });

      it('returns undefined if cursor is at the end of the input', () => {
         const c = new XmlStringCursor('');

         expect(c.getWord([])).toBeUndefined();
      });

      it('adds the word chunk to the recent chunks', () => {
         const c = new XmlStringCursor('test ');
         c.getWord([]);
         const expected = new WordChunk('test', true, true, new Offset(0, 0, 0), new Offset(0, 4, 4));

         expect(c.getRecentChunks()).toEqual([ expected ]);
      });

      it('assigns a location to the created chunk', () => {
         const loc = new EntityLocation('http://test.com/foo.bar');
         const c = new XmlStringCursor('one two', loc);

         expect(c.getWord([]).entityLocation).toEqual(loc);
      });

      describe('couldBeName flag', () => {

         it('marks a word as a possible name if it is just letters', () => {
            const c = new XmlStringCursor('one two');

            const firstWord = new WordChunk('one', true, true, new Offset(0, 0, 0),
               new Offset(0, 3, 3));

            expect(c.getWord([])).toEqual(firstWord);
         });

         it('marks a word as a possible name if it has a hyphen, period or digit in it', () => {
            const c = new XmlStringCursor('on.-8 two');

            const firstWord = new WordChunk('on.-8', true, true, new Offset(0, 0, 0),
               new Offset(0, 5, 5));

            expect(c.getWord([])).toEqual(firstWord);
         });

         it('marks a word as a possible name if it has the allowable chars above ascii in it', () => {
            const c = new XmlStringCursor('o\u00B7\u0310\u2040e two');

            const firstWord = new WordChunk('o\u00B7\u0310\u2040e', true, true,
                new Offset(0, 0, 0), new Offset(0, 5, 5));

            expect(c.getWord([])).toEqual(firstWord);
         });

         it('marks a word as a possible name if it has an astral character in it (e.g. an emoji)', () => {
            const c = new XmlStringCursor('o\uD83D\uDC04e two'); // Cow emoji 0x1F404

            expect(c.getWord([]).couldBeName).toEqual(true);
         });

         it('marks a word as a possible name starts with an astral character (e.g. an emoji)', () => {
            const c = new XmlStringCursor('\uD83D\uDC04moo two'); // Cow emoji 0x1F404

            expect(c.getWord([]).couldBeName).toEqual(true);
         });

         it('marks a word as a possible name if it has a bunch of the name chars in it', () => {
            const word = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:_\u00CE' +
               '\u01F8\u0371\u047F\u200C\u2080\u2CCC\u4001\uF901\uFDF1';
            const c = new XmlStringCursor(word + ' two');

            const firstWord = new WordChunk(word, true, true, new Offset(0, 0, 0),
               new Offset(0, word.length, word.length));

            expect(c.getWord([])).toEqual(firstWord);
         });

         it('marks a word as a possible name if it has a uFDF1 in it', () => {
            const c = new XmlStringCursor('o\uFDF1e two');

            const firstWord = new WordChunk('o\uFDF1e', true, true,
                new Offset(0, 0, 0), new Offset(0, 3, 3));

            expect(c.getWord([])).toEqual(firstWord);
         });

         it('marks a word as a non-name if it has a $ in it', () => {
            const c = new XmlStringCursor('o$e two');

            const expected = new WordChunk('o$e', false, false, new Offset(0, 0, 0),
               new Offset(0, 3, 3));

            expect(c.getWord([])).toEqual(expected);
         });

         it('marks a word as a non-name if it starts with a digit', () => {
            const c = new XmlStringCursor('9ne two');

            const firstWord = new WordChunk('9ne', false, true, new Offset(0, 0, 0),
               new Offset(0, 3, 3));

            expect(c.getWord([])).toEqual(firstWord);
         });

         it('marks a word as a non-name if it starts with a hyphen', () => {
            const c = new XmlStringCursor('-ne two');

            const firstWord = new WordChunk('-ne', false, true, new Offset(0, 0, 0),
               new Offset(0, 3, 3));

            expect(c.getWord([])).toEqual(firstWord);
         });

         it('marks a word as a non-name if it starts with a period', () => {
            const c = new XmlStringCursor('.ne two');

            const firstWord = new WordChunk('.ne', false, true, new Offset(0, 0, 0),
               new Offset(0, 3, 3));

            expect(c.getWord([])).toEqual(firstWord);
         });

         it('marks a word as a non-name if it starts with a u00B7', () => {
            const c = new XmlStringCursor('\u00B7ne two');

            const firstWord = new WordChunk('\u00B7ne', false, true, new Offset(0, 0, 0),
               new Offset(0, 3, 3));

            expect(c.getWord([])).toEqual(firstWord);
         });

         it('marks a word as a non-name if it starts with a u0320', () => {
            const c = new XmlStringCursor('\u0320ne two');

            const firstWord = new WordChunk('\u0320ne', false, true, new Offset(0, 0, 0),
               new Offset(0, 3, 3));

            expect(c.getWord([])).toEqual(firstWord);
         });

         it('marks a word as a non-name if it starts with a u2040', () => {
            const c = new XmlStringCursor('\u2040ne two');

            const firstWord = new WordChunk('\u2040ne', false, true, new Offset(0, 0, 0),
               new Offset(0, 3, 3));

            expect(c.getWord([])).toEqual(firstWord);
         });

      });

      describe('couldBeNmToken flag', () => {

         it('marks a word as a possible name token if it is just letters', () => {
            const c = new XmlStringCursor('one two');

            const firstWord = new WordChunk('one', true, true, new Offset(0, 0, 0),
               new Offset(0, 3, 3));

            expect(c.getWord([])).toEqual(firstWord);
         });

         it('marks a word as a possible name token if it has a hyphen, period or digit in it', () => {
            const c = new XmlStringCursor('on.-8 two');

            const firstWord = new WordChunk('on.-8', true, true, new Offset(0, 0, 0),
               new Offset(0, 5, 5));

            expect(c.getWord([])).toEqual(firstWord);
         });

         it('marks a word as a possible name token if starts with the allowable chars above ascii in it', () => {
            const c = new XmlStringCursor('\u00B7\u0310\u2040e two');

            const firstWord = new WordChunk('\u00B7\u0310\u2040e', false, true,
                new Offset(0, 0, 0), new Offset(0, 4, 4));

            expect(c.getWord([])).toEqual(firstWord);
         });

         it('marks a word as a possible name token if it starts with an astral character in it (e.g. an emoji)', () => {
            const c = new XmlStringCursor('\uD83D\uDC04e two'); // Cow emoji 0x1F404

            expect(c.getWord([]).couldBeNmToken).toEqual(true);
         });

         it('marks a word as a possible name token if it has a bunch of the name chars in it', () => {
            const word = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:_\u00CE' +
               '\u01F8\u0371\u047F\u200C\u2080\u2CCC\u4001\uF901\uFDF1';
            const c = new XmlStringCursor(word + ' two');

            const firstWord = new WordChunk(word, true, true, new Offset(0, 0, 0),
               new Offset(0, word.length, word.length));

            expect(c.getWord([])).toEqual(firstWord);
         });

         it('marks a word as a possible name token if starts with a uFDF1', () => {
            const c = new XmlStringCursor('\uFDF1e two');

            const firstWord = new WordChunk('\uFDF1e', true, true,
                new Offset(0, 0, 0), new Offset(0, 2, 2));

            expect(c.getWord([])).toEqual(firstWord);
         });

         it('marks a word as a non-name token if it has a $ in it', () => {
            const c = new XmlStringCursor('o$e two');

            const expected = new WordChunk('o$e', false, false, new Offset(0, 0, 0),
               new Offset(0, 3, 3));

            expect(c.getWord([])).toEqual(expected);
         });

         it('marks a word as a possible name token if it starts with a digit', () => {
            const c = new XmlStringCursor('9ne two');

            const firstWord = new WordChunk('9ne', false, true, new Offset(0, 0, 0),
               new Offset(0, 3, 3));

            expect(c.getWord([])).toEqual(firstWord);
         });

         it('marks a word as a possible name token if it starts with a hyphen', () => {
            const c = new XmlStringCursor('-ne two');

            const firstWord = new WordChunk('-ne', false, true, new Offset(0, 0, 0),
               new Offset(0, 3, 3));

            expect(c.getWord([])).toEqual(firstWord);
         });

         it('marks a word as a possible name token if it starts with a period', () => {
            const c = new XmlStringCursor('.ne two');

            const firstWord = new WordChunk('.ne', false, true, new Offset(0, 0, 0),
               new Offset(0, 3, 3));

            expect(c.getWord([])).toEqual(firstWord);
         });

         it('marks a word as a possible name token if it starts with a u00B7', () => {
            const c = new XmlStringCursor('\u00B7ne two');

            const firstWord = new WordChunk('\u00B7ne', false, true, new Offset(0, 0, 0),
               new Offset(0, 3, 3));

            expect(c.getWord([])).toEqual(firstWord);
         });

         it('marks a word as a possible name token if it starts with a u0320', () => {
            const c = new XmlStringCursor('\u0320ne two');

            const firstWord = new WordChunk('\u0320ne', false, true, new Offset(0, 0, 0),
               new Offset(0, 3, 3));

            expect(c.getWord([])).toEqual(firstWord);
         });

         it('marks a word as a possible name token if it starts with a u2040', () => {
            const c = new XmlStringCursor('\u2040ne two');

            const firstWord = new WordChunk('\u2040ne', false, true, new Offset(0, 0, 0),
               new Offset(0, 3, 3));

            expect(c.getWord([])).toEqual(firstWord);
         });

      });

   });

   describe('getDigits()', () => {

      it('returns the next space-terminated set of decimal digits', () => {
         const c = new XmlStringCursor('123 ');

         const expected = new DigitChunk('123', true, new Offset(0, 0, 0), new Offset(0, 3, 3));
         expect(c.getDigits()).toEqual(expected);
      });

      it('returns the next space-terminated set of hex digits', () => {
         const c = new XmlStringCursor('12AbCdE3 ');

         const expected = new DigitChunk('12AbCdE3', false, new Offset(0, 0, 0), new Offset(0, 8, 8));
         expect(c.getDigits()).toEqual(expected);
      });

      it('returns all the possible digits', () => {
         const c = new XmlStringCursor('0123456789AaBbCcDdEeFf');

         const expected = new DigitChunk('0123456789AaBbCcDdEeFf', false, new Offset(0, 0, 0), new Offset(0, 22, 22));
         expect(c.getDigits()).toEqual(expected);
      });

      it('returns undefined if there is a space at the cursor', () => {
         const c = new XmlStringCursor(' one two');

         expect(c.getDigits([])).toBeUndefined();
      });

      it('returns undefined if cursor is at the end of the input', () => {
         const c = new XmlStringCursor('');

         expect(c.getDigits([])).toBeUndefined();
      });

      it('stops processing at a non-digit', () => {
         const c = new XmlStringCursor('12;');

         expect(c.getDigits()).toEqual(new DigitChunk('12', true, new Offset(0, 0, 0), new Offset(0, 2, 2)));
      });

      it('stops processing at EOF', () => {
         const c = new XmlStringCursor('12');

         expect(c.getDigits()).toEqual(new DigitChunk('12', true, new Offset(0, 0, 0), new Offset(0, 2, 2)));
      });

      it('returns the digits even when not at the start of the cursor', () => {
         const c = new XmlStringCursor('foo 123');
         c.getWord([]);
         c.getSpace();

         expect(c.getDigits()).toEqual(new DigitChunk('123', true, new Offset(0, 4, 4), new Offset(0, 7, 7)));
      });

      it('adds the digit chunk to the recent chunks', () => {
         const c = new XmlStringCursor('123 ');
         c.getDigits();
         const expected = new DigitChunk('123', true, new Offset(0, 0, 0), new Offset(0, 3, 3));

         expect(c.getRecentChunks()).toEqual([ expected ]);
      });

      it('assigns a location to the created chunk', () => {
         const loc = new EntityLocation('http://test.com/foo.bar');
         const c = new XmlStringCursor('123 ', loc);

         expect(c.getDigits().entityLocation).toEqual(loc);
      });

   });

   describe('getChar()', () => {

      it('returns the next character', () => {
         const c = new XmlStringCursor('<foo>');

         expect(c.getChar()).toEqual(new PlainChunk('<', new Offset(0, 0, 0), new Offset(0, 1, 1)));
      });

      it('returns undefined if there are no more characters', () => {
         const c = new XmlStringCursor('');

         expect(c.getChar()).toBeUndefined();
      });

      it('returns the next character even if it is a newline', () => {
         const c = new XmlStringCursor('\n foo');

         expect(c.getChar()).toEqual(new PlainChunk('\n', new Offset(0, 0, 0), new Offset(1, 0, 1)));
      });

      it('returns the next character even if it is a return', () => {
         const c = new XmlStringCursor('\r foo');

         expect(c.getChar()).toEqual(new PlainChunk('\n', new Offset(0, 0, 0), new Offset(1, 0, 1)));
      });

      it('returns the next character even if it is both a return and newline pair', () => {
         const c = new XmlStringCursor('\r\n foo');

         expect(c.getChar()).toEqual(new PlainChunk('\n', new Offset(0, 0, 0), new Offset(1, 0, 2)));
      });

      it('returns the next character even when the cursor is not at the beginning', () => {
         const c = new XmlStringCursor('x\r\n foo');
         c.getChar();

         expect(c.getChar()).toEqual(new PlainChunk('\n', new Offset(0, 1, 1), new Offset(1, 0, 3)));
      });

      it('adds the char chunk to the recent chunks', () => {
         const c = new XmlStringCursor('test ');
         c.getChar();

         expect(c.getRecentChunks()).toEqual([
            new PlainChunk('t', new Offset(0, 0, 0), new Offset(0, 1, 1))
         ]);
      });

      it('assigns a location to the created chunk', () => {
         const loc = new EntityLocation('http://test.com/foo.bar');
         const c = new XmlStringCursor('<foo>', loc);

         expect(c.getChar().entityLocation).toEqual(loc);
      });

   });

   describe('getMarkup()', () => {

      it('returns undefined if cursor is at the end of the input', () => {
         const c = new XmlStringCursor('');

         expect(c.getMarkup()).toBeUndefined();
      });

      it('returns undefined if the next character is not < or &', () => {
         const c = new XmlStringCursor('frog');

         expect(c.getMarkup()).toBeUndefined();
      });

      it('returns a chunk with markup if the next is just <', () => {
         const c = new XmlStringCursor('<frog');

         expect(c.getMarkup()).toEqual(new PlainChunk('<', new Offset(0, 0, 0),
             new Offset(0, 1, 1)));
      });

      it('returns a chunk with markup if the next is just &', () => {
         const c = new XmlStringCursor('&frog');

         expect(c.getMarkup()).toEqual(new PlainChunk('&', new Offset(0, 0, 0),
             new Offset(0, 1, 1)));
      });

      it('returns a markup chunk if the next is </', () => {
         const c = new XmlStringCursor('</frog');

         expect(c.getMarkup()).toEqual(new PlainChunk('</', new Offset(0, 0, 0),
             new Offset(0, 2, 2)));
      });

      it('returns a chunk with markup if the next is <!--', () => {
         const c = new XmlStringCursor('<!--frog');

         expect(c.getMarkup()).toEqual(new PlainChunk('<!--', new Offset(0, 0, 0),
             new Offset(0, 4, 4)));
      });

      it('returns a chunk with markup if the next is <?', () => {
         const c = new XmlStringCursor('<?frog');

         expect(c.getMarkup()).toEqual(new PlainChunk('<?', new Offset(0, 0, 0),
             new Offset(0, 2, 2)));
      });

      it('returns a chunk with markup if the next is <!', () => {
         const c = new XmlStringCursor('<!frog');

         expect(c.getMarkup()).toEqual(new PlainChunk('<!', new Offset(0, 0, 0),
             new Offset(0, 2, 2)));
      });

      it('returns a chunk with markup if the next is </', () => {
         const c = new XmlStringCursor('</frog');

         expect(c.getMarkup()).toEqual(new PlainChunk('</', new Offset(0, 0, 0),
             new Offset(0, 2, 2)));
      });

      it('returns a chunk with markup from the middle of the source string', () => {
         const c = new XmlStringCursor(' \r  </frog');
         c.getSpace();

         expect(c.getMarkup()).toEqual(new PlainChunk('</', new Offset(1, 2, 4),
             new Offset(1, 4, 6)));
      });

      it('adds the chunk with < markup to the recent chunks', () => {
         const c = new XmlStringCursor('<test>');
         c.getMarkup();

         expect(c.getRecentChunks()).toEqual([
            new PlainChunk('<', new Offset(0, 0, 0), new Offset(0, 1, 1))
         ]);
      });

      it('adds the chunk with & markup to the recent chunks', () => {
         const c = new XmlStringCursor('&test>');
         c.getMarkup();

         expect(c.getRecentChunks()).toEqual([
            new PlainChunk('&', new Offset(0, 0, 0), new Offset(0, 1, 1))
         ]);
      });

      it('assigns a location to the created chunk', () => {
         const loc = new EntityLocation('http://test.com/foo.bar');
         const c = new XmlStringCursor('<frog', loc);

         expect(c.getMarkup().entityLocation).toEqual(loc);
      });

   });

   describe('getClose()', () => {

      it('returns undefined if cursor is at the end of the input', () => {
         const c = new XmlStringCursor('');

         expect(c.getClose()).toBeUndefined();
      });

      it('returns undefined if the next character is not ]', () => {
         const c = new XmlStringCursor('frog');

         expect(c.getClose()).toBeUndefined();
      });

      it('returns a chunk with the close if the next is just ]', () => {
         const c = new XmlStringCursor(']frog');

         expect(c.getClose()).toEqual(new PlainChunk(']', new Offset(0, 0, 0),
             new Offset(0, 1, 1)));
      });

      it('returns a chunk with the coose if the next ]]>', () => {
         const c = new XmlStringCursor(']]>frog');

         expect(c.getClose()).toEqual(new PlainChunk(']]>', new Offset(0, 0, 0),
             new Offset(0, 3, 3)));
      });

      it('adds the chunk with ]]> close to the recent chunks', () => {
         const c = new XmlStringCursor(']]>foo');
         c.getClose();

         expect(c.getRecentChunks()).toEqual([
            new PlainChunk(']]>', new Offset(0, 0, 0), new Offset(0, 3, 3))
         ]);
      });

      it('adds the chunk with "]" to the recent chunks', () => {
         const c = new XmlStringCursor(']>');
         c.getClose();

         expect(c.getRecentChunks()).toEqual([
            new PlainChunk(']', new Offset(0, 0, 0), new Offset(0, 1, 1))
         ]);
      });

      it('assigns a location to the created chunk', () => {
         const loc = new EntityLocation('http://test.com/foo.bar');
         const c = new XmlStringCursor(']frog', loc);

         expect(c.getClose().entityLocation).toEqual(loc);
      });

   });

   describe('getMatch()', () => {

      it('throws an error if called without a parameter', () => {
         const c = new XmlStringCursor('one two');

         expect(() => {
            c.getMatch();
         }).toThrowError('Must pass a non-empty string to getMatch().');
      });

      it('throws an error if passed an empty string', () => {
         const c = new XmlStringCursor('');

         expect(() => {
            c.getMatch('');
         }).toThrowError('Must pass a non-empty string to getMatch().');
      });

      it('throws an error if called with whitespace in the parameter', () => {
         const c = new XmlStringCursor('one two');

         expect(() => {
            c.getMatch('one two');
         }).toThrowError('Parameter to getMatch() may not contain any whitespace characters.');
      });

      it('throws an error if called with newlines in the parameter', () => {
         const c = new XmlStringCursor('one\ntwo');

         expect(() => {
            c.getMatch('one\ntwo');
         }).toThrowError('Parameter to getMatch() may not contain any whitespace characters.');
      });

      it('returns the matched string', () => {
         const c = new XmlStringCursor('frogD');

         expect(c.getMatch('fro')).toEqual(new PlainChunk('fro', new Offset(0, 0, 0), new Offset(0, 3, 3)));
      });

      it('returns a nothing if the matched string is not found', () => {
         const c = new XmlStringCursor('frog');

         expect(c.getMatch('D')).toBeUndefined();
      });

      it('returns a nothing if at the end of string', () => {
         const c = new XmlStringCursor('');

         expect(c.getMatch('D')).toBeUndefined();
      });

      it('returns the expected value even when not at the start of the cursor data', () => {
         const c = new XmlStringCursor('one');
         c.getChar();

         expect(c.getMatch('ne')).toEqual(new PlainChunk('ne', new Offset(0, 1, 1), new Offset(0, 3, 3)));
      });

      it('adds the matched chunk to the recent chunks', () => {
         const c = new XmlStringCursor('Testing');
         c.getMatch('Tes');

         expect(c.getRecentChunks()).toEqual([
            new PlainChunk('Tes', new Offset(0, 0, 0), new Offset(0, 3, 3))
         ]);
      });

      it('assigns a location to the created chunk', () => {
         const loc = new EntityLocation('http://test.com/foo.bar');
         const c = new XmlStringCursor('frogD', loc);

         expect(c.getMatch('fro').entityLocation).toEqual(loc);
      });

   });

   describe('getToTerminator()', () => {

      it('throws an error if called without a parameter', () => {
         const c = new XmlStringCursor('one two');

         expect(() => {
            c.getToTerminator();
         }).toThrowError('Must pass a non-empty array of terminators to getToTerminator().');
      });

      it('throws an error if terminators have whitespace', () => {
         const c = new XmlStringCursor('');

         expect(() => {
            c.getToTerminator([ '< <' ]);
         }).toThrowError('Terminators may not have any space characters (space, tab, newline, etc).');
      });

      it('throws an error if passed an empty array', () => {
         const c = new XmlStringCursor('one two');

         expect(() => {
            c.getToTerminator([]);
         }).toThrowError('Must pass a non-empty array of terminators to getToTerminator().');
      });

      it('returns the string up to the specified terminator', () => {
         const c = new XmlStringCursor('frogD');

         expect(c.getToTerminator([ 'D' ])).toEqual({
            chunk: new WithSpaceChunk('frog', 'frog', new Offset(0, 0, 0), new Offset(0, 4, 4)),
            terminator: 'D'
         });
      });

      it('returns nothing if already at the terminator', () => {
         const c = new XmlStringCursor('D');

         expect(c.getToTerminator([ 'D' ])).toEqual({
            chunk: undefined,
            terminator: 'D'
         });
      });

      it('returns everything to EOF if terminator not found', () => {
         const c = new XmlStringCursor('frog');

         expect(c.getToTerminator([ 'D' ])).toEqual({
            chunk: new WithSpaceChunk('frog', 'frog', new Offset(0, 0, 0), new Offset(0, 4, 4)),
            terminator: undefined
         });
      });

      it('returns the string up to the first terminator when there are multiple', () => {
         const c = new XmlStringCursor('frogDandD');

         expect(c.getToTerminator([ 'D' ])).toEqual({
            chunk: new WithSpaceChunk('frog', 'frog', new Offset(0, 0, 0), new Offset(0, 4, 4)),
            terminator: 'D'
         });
      });

      it('returns the string with newlines appropriately adjusted', () => {
         const c = new XmlStringCursor('line1\nline2\rline3\r\nline4!');
         const chunk = new WithSpaceChunk('line1\nline2\nline3\nline4', 'line1\nline2\rline3\r\nline4',
            new Offset(0, 0, 0), new Offset(3, 4, 24));

         expect(c.getToTerminator([ '!' ])).toEqual({
            chunk: chunk,
            terminator: '!'
         });
      });

      it('returns the string with \\u0085 and \\u2028 not adjusted if this is 1.0', () => {
         const c = new XmlStringCursor('line1\u0085line2\u2028line3\r\u0085line4!');
         const chunk = new WithSpaceChunk('line1\u0085line2\u2028line3\n\u0085line4',
            'line1\u0085line2\u2028line3\r\u0085line4',
            new Offset(0, 0, 0), new Offset(1, 5, 24));

         expect(c.getToTerminator([ '!' ])).toEqual({
            chunk: chunk,
            terminator: '!'
         });
      });

      it('returns the string with \\u0085 and \\u2028 adjusted if this is 1.1', () => {
         const c = new XmlStringCursor('line1\u0085line2\u2028line3\r\u0085line4!');
         const pk = new EntityInfo();
         pk.version = 1.1;
         c.setEntityInfo(pk);

         const chunk = new WithSpaceChunk('line1\nline2\nline3\nline4', 'line1\u0085line2\u2028line3\r\u0085line4',
            new Offset(0, 0, 0), new Offset(3, 4, 24));
         expect(c.getToTerminator([ '!' ])).toEqual({
            chunk: chunk,
            terminator: '!'
         });
      });

      it('returns the original text before newline replacement', () => {
         const c = new XmlStringCursor('line1\nline2\rline3\r\nline4!');

         expect(c.getToTerminator([ '!' ]).chunk.originalText).toEqual('line1\nline2\rline3\r\nline4');
      });

      it('returns the string even when not at the start of the cursor', () => {
         const c = new XmlStringCursor('frogDandD');
         c.getChar();

         expect(c.getToTerminator([ 'D' ])).toEqual({
            chunk: new WithSpaceChunk('rog', 'rog', new Offset(0, 1, 1), new Offset(0, 4, 4)),
            terminator: 'D'
         });
      });

      it('adds the returned chunk to the recent chunk', () => {
         const c = new XmlStringCursor('This is a Test');
         c.getToTerminator([ 'Tes' ]);

         expect(c.getRecentChunks()).toEqual([
            new WithSpaceChunk('This is a ', 'This is a ', new Offset(0, 0, 0), new Offset(0, 10, 10))
         ]);
      });

      it('assigns a location to the created chunk', () => {
         const loc = new EntityLocation('http://test.com/foo.bar');
         const c = new XmlStringCursor('frogD', loc);

         expect(c.getToTerminator([ 'D' ]).chunk.entityLocation).toEqual(loc);
      });

   });

   describe('unget()', () => {

      it('ungets the most recent chunk', () => {
         const c = new XmlStringCursor('one two');
         const chunk = c.getWord([]);

         c.unget(chunk);

         expect(c.getWord([])).toEqual(chunk);
      });

      it('ungets multiple chunks', () => {
         const c = new XmlStringCursor('one two');
         const chunk = c.getWord([]);
         const chunk2 = c.getSpace();

         c.unget(chunk2);
         c.unget(chunk);

         expect(c.getWord([])).toEqual(chunk);
      });

      it('throws an error if nothing has been retrieved', () => {
         const c = new XmlStringCursor('one two');

         expect(() => {
            c.unget(new WithSpaceChunk(' ', ' ', new Offset(0, 3, 3), new Offset(0, 4, 4)));
         }).toThrowError('Chunk passed to unget() is not the most recent chunk returned.');
      });

   });

   describe('getRecentChunks()', () => {

      it('returns nothing initially', () => {
         const c = new XmlStringCursor('one two');

         expect(c.getRecentChunks()).toEqual([]);
      });

      it('returns the three chunks most recently returned', () => {
         const c = new XmlStringCursor('one two');
         c.getWord([]);
         c.getSpace();
         c.getWord([]);

         const firstWord = new WordChunk('one', true, true, new Offset(0, 0, 0), new Offset(0, 3, 3));
         const secondWord = new WordChunk('two', true, true, new Offset(0, 4, 4), new Offset(0, 7, 7));

         expect(c.getRecentChunks()).toEqual([
            firstWord,
            new WithSpaceChunk(' ', ' ', new Offset(0, 3, 3), new Offset(0, 4, 4)),
            secondWord
         ]);
      });

      it('returns an empty array of chunks once it has already been called', () => {
         const c = new XmlStringCursor('one two');
         c.getWord([]);
         c.getSpace();
         c.getWord([]);
         c.getRecentChunks();

         expect(c.getRecentChunks()).toEqual([]);
      });

   });

});
