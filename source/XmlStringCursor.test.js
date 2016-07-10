/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const XmlStringCursor = require('./XmlStringCursor.js');
const XmlStringToken = require('./XmlStringToken.js');
const Offset = require('./Offset.js');

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

      it('returns MARKUP if that is what is next', () => {
         const c = new XmlStringCursor('<foo>');

         expect(c.peekType()).toEqual(XmlStringToken.MARKUP);
      });

      it('returns SPACE if that is what is next', () => {
         const c = new XmlStringCursor(' \t\n ');

         expect(c.peekType()).toEqual(XmlStringToken.SPACE);
      });

      it('returns STRING if the next is neither markup or space', () => {
         const c = new XmlStringCursor('one');

         expect(c.peekType()).toEqual(XmlStringToken.STRING);
      });

      it('returns undefined if at the end of the input', () => {
         const c = new XmlStringCursor('');

         expect(c.peekType()).toBeUndefined();
      });

      it('works correctly when cursor has incremented past start of string', () => {
         const c = new XmlStringCursor('h<foo>');
         c.getChar();

         expect(c.peekType()).toEqual(XmlStringToken.MARKUP);
      });

      it('adds nothing to the recent tokens', () => {
         const c = new XmlStringCursor('h<foo>');
         c.peekType();

         expect(c.getRecentTokens()).toEqual([]);
      });

   });

   describe('peekChar()', () => {

      it('returns the next character', () => {
         const c = new XmlStringCursor('<foo>');

         expect(c.peekChar()).toEqual(new XmlStringToken('<', XmlStringToken.CHAR,
            new Offset(0, 0, 0), new Offset(0, 1, 1)));
      });

      it('returns undefined if there is no next character', () => {
         const c = new XmlStringCursor('');

         expect(c.peekChar()).toBeUndefined();
      });

      it('returns the next character even if it is a newline', () => {
         const c = new XmlStringCursor('\n foo');

         expect(c.peekChar()).toEqual(new XmlStringToken('\n', XmlStringToken.CHAR,
            new Offset(0, 0, 0), new Offset(1, 0, 1)));
      });

      it('returns the next character even if it is a return', () => {
         const c = new XmlStringCursor('\r foo');

         expect(c.peekChar()).toEqual(new XmlStringToken('\n', XmlStringToken.CHAR,
            new Offset(0, 0, 0), new Offset(1, 0, 1)));
      });

      it('returns the next character even if it is both a return and newline pair', () => {
         const c = new XmlStringCursor('\r\n foo');

         expect(c.peekChar()).toEqual(new XmlStringToken('\n', XmlStringToken.CHAR,
            new Offset(0, 0, 0), new Offset(1, 0, 2)));
      });

      it('returns the next character even when the cursor has incremented past start of string', () => {
         const c = new XmlStringCursor('x\r\n foo');
         c.getChar();

         expect(c.peekChar()).toEqual(new XmlStringToken('\n', XmlStringToken.CHAR,
            new Offset(0, 1, 1), new Offset(1, 0, 3)));
      });

      it('adds nothing to the recent tokens', () => {
         const c = new XmlStringCursor('h<foo>');
         c.peekChar();

         expect(c.getRecentTokens()).toEqual([]);
      });

   });

   describe('getSpace()', () => {

      it('returns the next run of spaces', () => {
         const c = new XmlStringCursor('    hi');

         expect(c.getSpace()).toEqual(new XmlStringToken('    ', XmlStringToken.SPACE,
             new Offset(0, 0, 0), new Offset(0, 4, 4)));
      });

      it('returns undefined if the first available character is ot a space', () => {
         const c = new XmlStringCursor('hi');

         expect(c.getSpace()).toBeUndefined();
      });

      it('returns the a mixture of tabs and spaces', () => {
         const c = new XmlStringCursor(' \t \t hi');

         expect(c.getSpace()).toEqual(new XmlStringToken(' \t \t ', XmlStringToken.SPACE,
             new Offset(0, 0, 0), new Offset(0, 5, 5)));
      });

      it('returns the a mixture of tabs and spaces and newlines', () => {
         const c = new XmlStringCursor(' \n \t \n hi');

         expect(c.getSpace()).toEqual(new XmlStringToken(' \n \t \n ', XmlStringToken.SPACE,
             new Offset(0, 0, 0), new Offset(2, 1, 7)));
      });

      it('treats a CR like a LF', () => {
         const c = new XmlStringCursor(' \rhi');

         expect(c.getSpace()).toEqual(new XmlStringToken(' \n', XmlStringToken.SPACE,
             new Offset(0, 0, 0), new Offset(1, 0, 2)));
      });

      it('treats a CR lf like a LF', () => {
         const c = new XmlStringCursor(' \r\nhi');

         expect(c.getSpace()).toEqual(new XmlStringToken(' \n', XmlStringToken.SPACE,
             new Offset(0, 0, 0), new Offset(1, 0, 3)));
      });

      it('treats a mixture of CRLF and CR and LF as just the right set of LF', () => {
         const c = new XmlStringCursor(' \r\n \n \r hi');

         expect(c.getSpace()).toEqual(new XmlStringToken(' \n \n \n ', XmlStringToken.SPACE,
             new Offset(0, 0, 0), new Offset(3, 1, 8)));
      });

      it('reads a space string from the middle of the string', () => {
         const c = new XmlStringCursor('one twp');
         c.getWord([]);

         expect(c.getSpace()).toEqual(new XmlStringToken(' ', XmlStringToken.SPACE,
             new Offset(0, 3, 3), new Offset(0, 4, 4)));
      });

      it('adds the space token to the recent tokens', () => {
         const c = new XmlStringCursor(' \t\n');
         c.getSpace();

         expect(c.getRecentTokens()).toEqual([
            new XmlStringToken(' \t\n', XmlStringToken.SPACE,
             new Offset(0, 0, 0), new Offset(1, 0, 3))
         ]);
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

         const expected = new XmlStringToken('one', XmlStringToken.WORD, new Offset(0, 0, 0), new Offset(0, 3, 3));
         expected.couldBeName = true;
         expect(c.getWord([])).toEqual(expected);
      });

      it('returns the next word, even if a single letter', () => {
         const c = new XmlStringCursor('o two');

         const expected = new XmlStringToken('o', XmlStringToken.WORD, new Offset(0, 0, 0), new Offset(0, 1, 1));
         expected.couldBeName = true;
         expect(c.getWord([])).toEqual(expected);
      });

      it('can get multiple words in a row', () => {
         const c = new XmlStringCursor('one two');
         c.getWord([]);
         c.getSpace();

         const expected = new XmlStringToken('two', XmlStringToken.WORD, new Offset(0, 4, 4), new Offset(0, 7, 7));
         expected.couldBeName = true;
         expect(c.getWord([])).toEqual(expected);
      });

      it('considers the word terminated at the specified terminator', () => {
         const c = new XmlStringCursor('oneX');

         const expected = new XmlStringToken('one', XmlStringToken.WORD, new Offset(0, 0, 0), new Offset(0, 3, 3));
         expected.couldBeName = true;
         expect(c.getWord([ 'X' ])).toEqual(expected);
      });

      it('considers the word terminated at any of the specified terminators', () => {
         const c1 = new XmlStringCursor('oneX');
         const c2 = new XmlStringCursor('one?');
         const c3 = new XmlStringCursor('one/]]>');

         const expected = new XmlStringToken('one', XmlStringToken.WORD, new Offset(0, 0, 0), new Offset(0, 3, 3));
         expected.couldBeName = true;
         expect(c1.getWord([ 'X', '?', '/]]>' ])).toEqual(expected);
         expect(c2.getWord([ 'X', '?', '/]]>' ])).toEqual(expected);
         expect(c3.getWord([ 'X', '?', '/]]>' ])).toEqual(expected);
      });

      it('identifies a word even if not at the start of the cursor', () => {
         const c = new XmlStringCursor('one> twoX');
         c.getWord([ '>', 'X' ]);
         c.getChar();
         c.getSpace();

         const expected = new XmlStringToken('two', XmlStringToken.WORD, new Offset(0, 5, 5), new Offset(0, 8, 8));
         expected.couldBeName = true;
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

      it('adds the word token to the recent tokens', () => {
         const c = new XmlStringCursor('test ');
         c.getWord([]);
         const expected = new XmlStringToken('test', XmlStringToken.WORD,
             new Offset(0, 0, 0), new Offset(0, 4, 4));
         expected.couldBeName = true;

         expect(c.getRecentTokens()).toEqual([ expected ]);
      });

      describe('couldBeName flag', () => {

         it('marks a word as a possible name if it is just letters', () => {
            const c = new XmlStringCursor('one two');

            const firstWord = new XmlStringToken('one', XmlStringToken.WORD, new Offset(0, 0, 0),
               new Offset(0, 3, 3));
            firstWord.couldBeName = true;

            expect(c.getWord([])).toEqual(firstWord);
         });

         it('marks a word as a possible name if it has a hyphen, period or digit in it', () => {
            const c = new XmlStringCursor('on.-8 two');

            const firstWord = new XmlStringToken('on.-8', XmlStringToken.WORD, new Offset(0, 0, 0),
               new Offset(0, 5, 5));
            firstWord.couldBeName = true;

            expect(c.getWord([])).toEqual(firstWord);
         });

         it('marks a word as a possible name if it has the allowable chars above ascii in it', () => {
            const c = new XmlStringCursor('o\u00B7\u0310\u2040e two');

            const firstWord = new XmlStringToken('o\u00B7\u0310\u2040e',
                XmlStringToken.WORD, new Offset(0, 0, 0), new Offset(0, 5, 5));
            firstWord.couldBeName = true;

            expect(c.getWord([])).toEqual(firstWord);
         });

         it('marks a word as a possible name if it has a bunch of the name chars in it', () => {
            const word = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:_\u00CE' +
               '\u01F8\u0371\u047F\u200C\u2080\u2CCC\u4001\uF901\uFDF1';
            const c = new XmlStringCursor(word + ' two');

            const firstWord = new XmlStringToken(word, XmlStringToken.WORD, new Offset(0, 0, 0),
               new Offset(0, word.length, word.length));
            firstWord.couldBeName = true;

            expect(c.getWord([])).toEqual(firstWord);
         });

         it('marks a word as a possible name if it has a uFDF1 in it', () => {
            const c = new XmlStringCursor('o\uFDF1e two');

            const firstWord = new XmlStringToken('o\uFDF1e',
                XmlStringToken.WORD, new Offset(0, 0, 0), new Offset(0, 3, 3));
            firstWord.couldBeName = true;

            expect(c.getWord([])).toEqual(firstWord);
         });

         it('marks a word as a non-name if it has a $ in it', () => {
            const c = new XmlStringCursor('o$e two');

            const expected = new XmlStringToken('o$e', XmlStringToken.WORD, new Offset(0, 0, 0),
               new Offset(0, 3, 3));
            expected.couldBeName = false;

            expect(c.getWord([])).toEqual(expected);
         });

         it('marks a word as a non-name if it starts with a digit', () => {
            const c = new XmlStringCursor('9ne two');

            const firstWord = new XmlStringToken('9ne', XmlStringToken.WORD, new Offset(0, 0, 0),
               new Offset(0, 3, 3));
            firstWord.couldBeName = false;

            expect(c.getWord([])).toEqual(firstWord);
         });

         it('marks a word as a non-name if it starts with a hyphen', () => {
            const c = new XmlStringCursor('-ne two');

            const firstWord = new XmlStringToken('-ne', XmlStringToken.WORD, new Offset(0, 0, 0),
               new Offset(0, 3, 3));
            firstWord.couldBeName = false;

            expect(c.getWord([])).toEqual(firstWord);
         });

         it('marks a word as a non-name if it starts with a period', () => {
            const c = new XmlStringCursor('.ne two');

            const firstWord = new XmlStringToken('.ne', XmlStringToken.WORD, new Offset(0, 0, 0),
               new Offset(0, 3, 3));
            firstWord.couldBeName = false;

            expect(c.getWord([])).toEqual(firstWord);
         });

         it('marks a word as a non-name if it starts with a u00B7', () => {
            const c = new XmlStringCursor('\u00B7ne two');

            const firstWord = new XmlStringToken('\u00B7ne', XmlStringToken.WORD, new Offset(0, 0, 0),
               new Offset(0, 3, 3));
            firstWord.couldBeName = false;

            expect(c.getWord([])).toEqual(firstWord);
         });

         it('marks a word as a non-name if it starts with a u0320', () => {
            const c = new XmlStringCursor('\u0320ne two');

            const firstWord = new XmlStringToken('\u0320ne', XmlStringToken.WORD, new Offset(0, 0, 0),
               new Offset(0, 3, 3));
            firstWord.couldBeName = false;

            expect(c.getWord([])).toEqual(firstWord);
         });

         it('marks a word as a non-name if it starts with a u2040', () => {
            const c = new XmlStringCursor('\u2040ne two');

            const firstWord = new XmlStringToken('\u2040ne', XmlStringToken.WORD, new Offset(0, 0, 0),
               new Offset(0, 3, 3));
            firstWord.couldBeName = false;

            expect(c.getWord([])).toEqual(firstWord);
         });

      });

   });

   describe('getChar()', () => {

      it('returns the next character', () => {
         const c = new XmlStringCursor('<foo>');

         expect(c.getChar()).toEqual(new XmlStringToken('<', XmlStringToken.CHAR,
            new Offset(0, 0, 0), new Offset(0, 1, 1)));
      });

      it('returns undefined if there are no more characters', () => {
         const c = new XmlStringCursor('');

         expect(c.getChar()).toBeUndefined();
      });

      it('returns the next character even if it is a newline', () => {
         const c = new XmlStringCursor('\n foo');

         expect(c.getChar()).toEqual(new XmlStringToken('\n', XmlStringToken.CHAR,
            new Offset(0, 0, 0), new Offset(1, 0, 1)));
      });

      it('returns the next character even if it is a return', () => {
         const c = new XmlStringCursor('\r foo');

         expect(c.getChar()).toEqual(new XmlStringToken('\n', XmlStringToken.CHAR,
            new Offset(0, 0, 0), new Offset(1, 0, 1)));
      });

      it('returns the next character even if it is both a return and newline pair', () => {
         const c = new XmlStringCursor('\r\n foo');

         expect(c.getChar()).toEqual(new XmlStringToken('\n', XmlStringToken.CHAR,
            new Offset(0, 0, 0), new Offset(1, 0, 2)));
      });

      it('returns the next character even when the cursor is not at the beginning', () => {
         const c = new XmlStringCursor('x\r\n foo');
         c.getChar();

         expect(c.getChar()).toEqual(new XmlStringToken('\n', XmlStringToken.CHAR,
            new Offset(0, 1, 1), new Offset(1, 0, 3)));
      });

      it('adds the char token to the recent tokens', () => {
         const c = new XmlStringCursor('test ');
         c.getChar();

         expect(c.getRecentTokens()).toEqual([
            new XmlStringToken('t', XmlStringToken.CHAR,
             new Offset(0, 0, 0), new Offset(0, 1, 1))
         ]);
      });

   });

   describe('getMarkup()', () => {

      it('returns undefined if cursor is at the end of the input', () => {
         const c = new XmlStringCursor('');

         expect(c.getMarkup()).toBeUndefined();
      });

      it('returns undefined if the next character is not <', () => {
         const c = new XmlStringCursor('frog');

         expect(c.getMarkup()).toBeUndefined();
      });

      it('returns a markup token if the next is just <', () => {
         const c = new XmlStringCursor('<frog');

         expect(c.getMarkup()).toEqual(new XmlStringToken('<', XmlStringToken.MARKUP, new Offset(0, 0, 0),
             new Offset(0, 1, 1)));
      });

      it('returns a markup token if the next is </', () => {
         const c = new XmlStringCursor('</frog');

         expect(c.getMarkup()).toEqual(new XmlStringToken('</', XmlStringToken.MARKUP, new Offset(0, 0, 0),
             new Offset(0, 2, 2)));
      });

      it('returns a markup token if the next is <!--', () => {
         const c = new XmlStringCursor('<!--frog');

         expect(c.getMarkup()).toEqual(new XmlStringToken('<!--', XmlStringToken.MARKUP, new Offset(0, 0, 0),
             new Offset(0, 4, 4)));
      });

      it('returns a markup token if the next is <?', () => {
         const c = new XmlStringCursor('<?frog');

         expect(c.getMarkup()).toEqual(new XmlStringToken('<?', XmlStringToken.MARKUP, new Offset(0, 0, 0),
             new Offset(0, 2, 2)));
      });

      it('returns a markup token if the next is <!', () => {
         const c = new XmlStringCursor('<!frog');

         expect(c.getMarkup()).toEqual(new XmlStringToken('<!', XmlStringToken.MARKUP, new Offset(0, 0, 0),
             new Offset(0, 2, 2)));
      });

      it('returns a markup token if the next is </', () => {
         const c = new XmlStringCursor('</frog');

         expect(c.getMarkup()).toEqual(new XmlStringToken('</', XmlStringToken.MARKUP, new Offset(0, 0, 0),
             new Offset(0, 2, 2)));
      });

      it('returns a markup token from the middle of the source string', () => {
         const c = new XmlStringCursor(' \r  </frog');
         c.getSpace();

         expect(c.getMarkup()).toEqual(new XmlStringToken('</', XmlStringToken.MARKUP, new Offset(1, 2, 4),
             new Offset(1, 4, 6)));
      });

      it('adds the markup token to the recent tokens', () => {
         const c = new XmlStringCursor('<test>');
         c.getMarkup();

         expect(c.getRecentTokens()).toEqual([
            new XmlStringToken('<', XmlStringToken.MARKUP,
             new Offset(0, 0, 0), new Offset(0, 1, 1))
         ]);
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

         expect(c.getMatch('fro')).toEqual(new XmlStringToken('fro', XmlStringToken.STRING,
            new Offset(0, 0, 0), new Offset(0, 3, 3)));
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

         expect(c.getMatch('ne')).toEqual(new XmlStringToken('ne', XmlStringToken.STRING,
            new Offset(0, 1, 1), new Offset(0, 3, 3)));
      });

      it('adds the matched token to the recent tokens', () => {
         const c = new XmlStringCursor('Testing');
         c.getMatch('Tes');

         expect(c.getRecentTokens()).toEqual([
            new XmlStringToken('Tes', XmlStringToken.STRING,
             new Offset(0, 0, 0), new Offset(0, 3, 3))
         ]);
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
            token: new XmlStringToken('frog', XmlStringToken.STRING,
               new Offset(0, 0, 0), new Offset(0, 4, 4)),
            terminator: 'D'
         });
      });

      it('returns nothing if already at the terminator', () => {
         const c = new XmlStringCursor('D');

         expect(c.getToTerminator([ 'D' ])).toEqual({
            token: undefined,
            terminator: 'D'
         });
      });

      it('returns everything to EOF if terminator not found', () => {
         const c = new XmlStringCursor('frog');

         expect(c.getToTerminator([ 'D' ])).toEqual({
            token: new XmlStringToken('frog', XmlStringToken.STRING,
               new Offset(0, 0, 0), new Offset(0, 4, 4)),
            terminator: undefined
         });
      });

      it('returns the string up to the first terminator when there are multiple', () => {
         const c = new XmlStringCursor('frogDandD');

         expect(c.getToTerminator([ 'D' ])).toEqual({
            token: new XmlStringToken('frog', XmlStringToken.STRING,
               new Offset(0, 0, 0), new Offset(0, 4, 4)),
            terminator: 'D'
         });
      });

      it('returns the string with newlines appropriately adjusted', () => {
         const c = new XmlStringCursor('line1\nline2\rline3\r\nline4!');

         expect(c.getToTerminator([ '!' ])).toEqual({
            token: new XmlStringToken('line1\nline2\nline3\nline4', XmlStringToken.STRING,
               new Offset(0, 0, 0), new Offset(0, 24, 24)),
            terminator: '!'
         });
      });

      it('returns the string even when not at the start of the cursor', () => {
         const c = new XmlStringCursor('frogDandD');
         c.getChar();

         expect(c.getToTerminator([ 'D' ])).toEqual({
            token: new XmlStringToken('rog', XmlStringToken.STRING,
               new Offset(0, 1, 1), new Offset(0, 4, 4)),
            terminator: 'D'
         });
      });

      it('adds the returned token to the recent tokens', () => {
         const c = new XmlStringCursor('This is a Test');
         c.getToTerminator([ 'Tes' ]);

         expect(c.getRecentTokens()).toEqual([
            new XmlStringToken('This is a ', XmlStringToken.STRING,
             new Offset(0, 0, 0), new Offset(0, 10, 10))
         ]);
      });

   });

   describe('getRecentTokens()', () => {

      it('returns nothing initially', () => {
         const c = new XmlStringCursor('one two');

         expect(c.getRecentTokens()).toEqual([]);
      });

      it('returns the three tokens most recently returned', () => {
         const c = new XmlStringCursor('one two');
         c.getWord([]);
         c.getSpace();
         c.getWord([]);

         const firstWord = new XmlStringToken('one', XmlStringToken.WORD, new Offset(0, 0, 0), new Offset(0, 3, 3));
         firstWord.couldBeName = true;
         const secondWord = new XmlStringToken('two', XmlStringToken.WORD, new Offset(0, 4, 4), new Offset(0, 7, 7));
         secondWord.couldBeName = true;

         expect(c.getRecentTokens()).toEqual([
            firstWord,
            new XmlStringToken(' ', XmlStringToken.SPACE, new Offset(0, 3, 3), new Offset(0, 4, 4)),
            secondWord
         ]);
      });

      it('returns an empty array of tokens once it has already been called', () => {
         const c = new XmlStringCursor('one two');
         c.getWord([]);
         c.getSpace();
         c.getWord([]);
         c.getRecentTokens();

         expect(c.getRecentTokens()).toEqual([]);
      });

   });

});
