/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const iconvLite = require('iconv-lite');

const EntityLocation = require('./shared/EntityLocation.js');
const Offset = require('./shared/Offset.js');
const EntityMetaData = require('./shared/EntityMetaData.js');
const PlainChunk = require('./shared/TextChunk.js').PlainChunk;
const WordChunk = require('./shared/TextChunk.js').WordChunk;
const WithSpaceChunk = require('./shared/TextChunk.js').WithSpaceChunk;
const DigitChunk = require('./shared/TextChunk.js').DigitChunk;
const XmlStringCursor = require('./XmlStringCursor.js');
const TYPE = require('./shared/TextChunk.js').TYPE;

describe('XmlStringCursor', () => {
   let defaultLoc;
   let entityMetaData1dot1;

   beforeEach(() => {
      defaultLoc = new EntityLocation();
      entityMetaData1dot1 = new EntityMetaData(EntityMetaData.TYPE.DOCUMENT, 1.1, 2, defaultLoc);
   });

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

      describe('location', () => {

         it('accepts undefined as a value and produces a default EntityMetaData', () => {
            const c = new XmlStringCursor('hi');
            const defaultEntityMetaData = new EntityMetaData();

            expect(c.entityMd).toEqual(defaultEntityMetaData);
         });

         it('accepts a URL as a value and produces an otherwise default EntityMetaData', () => {
            const c = new XmlStringCursor('hi', 'http://test.com');
            const loc = new EntityLocation('http://test.com');
            const derivedEntityMetaData = new EntityMetaData(EntityMetaData.TYPE.DOCUMENT, 1.0, 5, loc);

            expect(c.entityMd).toEqual(derivedEntityMetaData);
         });

         it('accepts an EntityMetaData as a value', () => {
            const loc = new EntityLocation('http://foo.com');
            const customEntityMetaData = new EntityMetaData(EntityMetaData.TYPE.DOCUMENT, 1.0, 5, loc);
            const c = new XmlStringCursor('hi', customEntityMetaData);

            expect(c.entityMd).toEqual(customEntityMetaData);
         });

         it('accepts an EntityLocation as a value and produces an otherwise default EntityMetaData', () => {
            const loc = new EntityLocation('http://foo.com');
            const c = new XmlStringCursor('hi', loc);
            const derivedEntityMetaData = new EntityMetaData(EntityMetaData.TYPE.DOCUMENT, 1.0, 5, loc);

            expect(c.entityMd).toEqual(derivedEntityMetaData);
         });

         it('throws an error if some unexpected value is passed in as the info', () => {
            expect(() => {
               new XmlStringCursor('hi', 44);
            }).toThrowError('Must pass an EntityMetaData, or something that can become one, into XmlStringCursor.');
         });

      });

      describe('options', () => {

         it('sets _specifiedEncoding to undefined if no options provided', () => {
            const c = new XmlStringCursor('hi');

            expect(c._encoding.specifiedEncoding).toBeUndefined();
         });

         it('sets _specifiedEncoding to the value passed in through options', () => {
            const c = new XmlStringCursor('hi', undefined, { encoding: 'UTF-8' });

            expect(c._encoding.specifiedEncoding).toEqual('UTF-8');
         });

      });

      describe('autodetection of encoding', () => {

         it('makes no opinion on a string with no XML or Text Declaration', () => {
            const c = new XmlStringCursor('e.g. an external entity');

            expect(c._encoding.autodetectedEncoding).toBeUndefined();
         });

         it('identifies a non-encoded string as non-encoded', () => {
            const c = new XmlStringCursor('<?xml version="1.0"?>');

            expect(c._encoding.autodetectedEncoding).toBe('UNENCODED');
         });

         it('identifies a EBCDIC encoding', () => {
            spyOn(XmlStringCursor.prototype, '_decodeSource'); // Block the actual decoding which will barf
            const c = new XmlStringCursor('\u004C\u006F\u00A7\u0094');

            expect(c._encoding.autodetectedEncoding).toBe('EBCDIC');
            expect(c._bestEncoding(c._encoding.autodetectedEncoding)).toBe('EBCDIC');
         });

         it('identifies a UCS-4 big endian encoding', () => {
            spyOn(XmlStringCursor.prototype, '_decodeSource'); // Block the actual decoding which will barf
            const c = new XmlStringCursor('\u0000\u0000\u0000\u003C');

            expect(c._encoding.autodetectedEncoding).toBe('UCS-4BE');
            expect(c._bestEncoding(c._encoding.autodetectedEncoding)).toBe('UCS-4BE');
         });

         it('identifies a UCS-4 little endian encoding', () => {
            spyOn(XmlStringCursor.prototype, '_decodeSource'); // Block the actual decoding which will barf
            const c = new XmlStringCursor('\u003C\u0000\u0000\u0000');

            expect(c._encoding.autodetectedEncoding).toBe('UCS-4LE');
            expect(c._bestEncoding(c._encoding.autodetectedEncoding)).toBe('UCS-4LE');
         });

         it('identifies a UCS-4 unusual1 order encoding', () => {
            spyOn(XmlStringCursor.prototype, '_decodeSource'); // Block the actual decoding which will barf
            const c = new XmlStringCursor('\u0000\u0000\u003C\u0000');

            expect(c._encoding.autodetectedEncoding).toBe('UCS-4UNUSUAL1');
            expect(c._bestEncoding(c._encoding.autodetectedEncoding)).toBe('UCS-4UNUSUAL1');
         });

         it('identifies a UCS-4 unusual2 order encoding', () => {
            spyOn(XmlStringCursor.prototype, '_decodeSource'); // Block the actual decoding which will barf
            const c = new XmlStringCursor('\u0000\u003C\u0000\u0000');

            expect(c._encoding.autodetectedEncoding).toBe('UCS-4UNUSUAL2');
            expect(c._bestEncoding(c._encoding.autodetectedEncoding)).toBe('UCS-4UNUSUAL2');
         });

         it('identifies a UTF-16 big endian encoding', () => {
            const c = new XmlStringCursor('\u0000\u003C\u0000\u003F');

            expect(c._encoding.autodetectedEncoding).toBe('UTF-16BE');
         });

         it('identifies a UTF-16 little endian encoding', () => {
            const c = new XmlStringCursor('\u003C\u0000\u003F\u0000');

            expect(c._encoding.autodetectedEncoding).toBe('UTF-16LE');
         });

         it('identifies a UCS-4 big endian with BOM encoding', () => {
            spyOn(XmlStringCursor.prototype, '_decodeSource'); // Block the actual decoding which will barf
            const c = new XmlStringCursor('\u0000\u0000\u00FE\u00FF');

            expect(c._encoding.autodetectedEncoding).toBe('UCS-4BE/BOM');
            expect(c._bestEncoding(c._encoding.autodetectedEncoding)).toBe('UCS-4BE');
         });

         it('identifies a UCS-4 little endian with BOM encoding', () => {
            spyOn(XmlStringCursor.prototype, '_decodeSource'); // Block the actual decoding which will barf
            const c = new XmlStringCursor('\u00FF\u00FE\u0000\u0000');

            expect(c._encoding.autodetectedEncoding).toBe('UCS-4LE/BOM');
            expect(c._bestEncoding(c._encoding.autodetectedEncoding)).toBe('UCS-4LE');
         });

         it('identifies a UCS-4 unusal1 with BOM encoding', () => {
            spyOn(XmlStringCursor.prototype, '_decodeSource'); // Block the actual decoding which will barf
            const c = new XmlStringCursor('\u0000\u0000\u00FF\u00FE');

            expect(c._encoding.autodetectedEncoding).toBe('UCS-4UNUSUAL1/BOM');
            expect(c._bestEncoding(c._encoding.autodetectedEncoding)).toBe('UCS-4UNUSUAL1');
         });

         it('identifies a UCS-4 unusal2 with BOM encoding', () => {
            spyOn(XmlStringCursor.prototype, '_decodeSource'); // Block the actual decoding which will barf
            const c = new XmlStringCursor('\u00FE\u00FF\u0000\u0000');

            expect(c._encoding.autodetectedEncoding).toBe('UCS-4UNUSUAL2/BOM');
            expect(c._bestEncoding(c._encoding.autodetectedEncoding)).toBe('UCS-4UNUSUAL2');
         });

         it('identifies a UTF-16BE with BOM encoding', () => {
            const c = new XmlStringCursor('\u00FE\u00FF\u0001\u0000');

            expect(c._encoding.autodetectedEncoding).toBe('UTF-16BE/BOM');
         });

         it('identifies a UTF-16LE with BOM encoding', () => {
            const c = new XmlStringCursor('\u00FF\u00FE\u0000\u0001');

            expect(c._encoding.autodetectedEncoding).toBe('UTF-16LE/BOM');
         });

         it('identifies a UTF-8 with BOM encoding', () => {
            const c = new XmlStringCursor('\u00EF\u00BB\u00BFA');

            expect(c._encoding.autodetectedEncoding).toBe('UTF-8/BOM');
         });

      });

      describe('decoding', () => {

         it('decodes a UTF-8/BOM into a decoded string', () => {
            const c = new XmlStringCursor('\u00EF\u00BB\u00BF<?xml version="1.0"?>');

            expect(c.getChar().text).toEqual('\uFEFF');
            expect(c.getChar().text).toEqual('<');
         });

         it('decodes a UTF-16BE into a decoded string', () => {
            const c = new XmlStringCursor('\u0000\u003C\u0000\u003F');

            expect(c.getChar().text).toEqual('<');
            expect(c.getChar().text).toEqual('?');
         });

         it('decodes a UTF-16BE/BOM into a decoded string', () => {
            const c = new XmlStringCursor('\u00FE\u00FF\u0000\u003C\u0000\u003F');

            expect(c.getChar().text).toEqual('\uFEFF');
            expect(c.getChar().text).toEqual('<');
            expect(c.getChar().text).toEqual('?');
         });

         it('decodes a UTF-16LE into a decoded string', () => {
            const c = new XmlStringCursor('\u003C\u0000\u003F\u0000');

            expect(c.getChar().text).toEqual('<');
            expect(c.getChar().text).toEqual('?');
         });

         it('decodes a UTF-16LE/BOM into a decoded string', () => {
            const c = new XmlStringCursor('\u00FF\u00FE\u003C\u0000\u003F\u0000');

            expect(c.getChar().text).toEqual('\uFEFF');
            expect(c.getChar().text).toEqual('<');
            expect(c.getChar().text).toEqual('?');
         });

         it('can not decode a UCS-4LE string', () => {
            expect(() => {
               new XmlStringCursor('\u00FF\u00FE\u0000\u0000');
            }).toThrowError('Can not decode a string in UCS-4LE encoding.');
         });

         // Seems like an error, but the cursor can't prove that this isn't actually OK
         it('does not decode a UTF-16BE string when encoding is specified as UNENCODED', () => {
            const c = new XmlStringCursor('\u0000\u003C\u0000\u003F', undefined, {
               encoding: 'UNENCODED'
            });

            expect(c.getChar().text).toEqual('\u0000');
            expect(c.getChar().text).toEqual('\u003C');
         });

         /*
          * This seems like an error, but technically could be correct,
          * except for the fact that the sequence \u00EF\u00BB is an incomplete
          * UTF-8 character. Really, this should be more of an error, but
          * iconv-lite just gives us a 'bad char' rather than a big complaint
          */
         it('does a butchering job of decoding a UTF-16BE as UTF-8 if encoding is specified as UTF-8', () => {
            const c = new XmlStringCursor('\u0000\u003C\u0000\u003F\u00EF\u00BB', undefined, {
               encoding: 'UTF-8'
            });

            expect(c.getChar().text).toEqual('\u0000');
            expect(c.getChar().text).toEqual('\u003C');
            expect(c.getChar().text).toEqual('\u0000');
            expect(c.getChar().text).toEqual('\u003F');
            expect(c.getChar().text).toEqual('\uFFFD');
         });

         // Seems like an error, but technically we can't prove it isn't UTF-16
         it('forces decoding an unencoded string to UTF-16BE with a UTF-16BE encoding', () => {
            const c = new XmlStringCursor('<?xml version="1.0"?>', undefined, {
               encoding: 'UTF-16BE'
            });

            expect(c.getChar().text).toEqual('\u3C3F');
         });

         it('does no decoding in what looks like an unecoded string (but is actually UTF-8 encoded)', () => {
            const c = new XmlStringCursor('<?xm\u00e4\u00bd\u00a0'); // e4bda0 is 你 in utf8

            expect(c.getChar().text).toEqual('<');
            expect(c.getChar().text).toEqual('?');
            expect(c.getChar().text).toEqual('x');
            expect(c.getChar().text).toEqual('m');
            expect(c.getChar().text).toEqual('ä');
         });

         it('forces decoding what looks like an unecoded string as UTF-8 with a UTF-8 encoding', () => {
            const c = new XmlStringCursor('<?xm\u00e4\u00bd\u00a0', undefined, { // e4bda0 is 你 in utf8
               encoding: 'UTF-8'
            });

            expect(c.getChar().text).toEqual('<');
            expect(c.getChar().text).toEqual('?');
            expect(c.getChar().text).toEqual('x');
            expect(c.getChar().text).toEqual('m');
            expect(c.getChar().text).toEqual('你');
         });

      });

   });

   describe('specifiedEncoding', () => {

      it('decodes as UTF-8 if specified as UTF-8', () => {
         const c = new XmlStringCursor('<?xm\u00e4\u00bd\u00a0');

         expect(c.getChar().text).toEqual('<');
         expect(c.getChar().text).toEqual('?');
         expect(c.getChar().text).toEqual('x');
         expect(c.getChar().text).toEqual('m');

         c.specifiedEncoding = 'UTF-8';

         expect(c.getChar().text).toEqual('你');
      });

      it('does not decode to UTF-8 if specified as UTF-8, but encoding parameter was UNENCODED', () => {
         const c = new XmlStringCursor('<?xm\u00e4\u00bd\u00a0', undefined, { encoding: 'UNENCODED' });

         expect(c.getChar().text).toEqual('<');
         expect(c.getChar().text).toEqual('?');
         expect(c.getChar().text).toEqual('x');
         expect(c.getChar().text).toEqual('m');

         c.specifiedEncoding = 'UTF-8';

         expect(c.getChar().text).toEqual('\u00e4');
      });

      /*
       * This feels like it should be an error. First, we autodetected
       * UTF-16, so UTF-8 seems contradictory, yet the UTF-16 could conceivably
       * be legit UTF-8. Note: this is a malformed XML document because 0x00 is
       * not allowed. However, That's beyond the scope of the cursor to know.
       */
      it('decodes as UTF-16 if specified as UTF-8', () => {
         const c = new XmlStringCursor('\u0000\u003C\u0000\u003F');

         expect(c.getChar().text).toEqual('<');

         c.specifiedEncoding = 'UTF-8';

         /*
          * First we converted the text from utf16, and then read the
          * first character. Then, we converted the original from UTF-8
          * and readjusted offsets.
          */
         expect(c.getChar().text).toEqual('\u0000');
      });

      it('does not re-decode a UTF-16 string since it was converted at start time (whitebox)', () => {
         const c = new XmlStringCursor('\u003C\u0000\u003F\u0000');
         expect(c.getChar().text).toEqual('<');

         spyOn(iconvLite, 'decode');

         c.specifiedEncoding = 'UTF-16LE';

         expect(iconvLite.decode).not.toHaveBeenCalled();
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
         const c = new XmlStringCursor('\u0085', entityMetaData1dot1);

         expect(c.peekType()).toEqual(TYPE.SPACE);
      });

      it('returns that \\u2028 is SPACE if this is parsing as 1.1', () => {
         const c = new XmlStringCursor('\u2028', entityMetaData1dot1);

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

         expect(c.peekChar()).toEqual(new PlainChunk('<', new Offset(0, 0, 0), new Offset(0, 1, 1), defaultLoc));
      });

      it('returns undefined if there is no next character', () => {
         const c = new XmlStringCursor('');

         expect(c.peekChar()).toBeUndefined();
      });

      it('returns the next character even if it is a \\n', () => {
         const c = new XmlStringCursor('\n foo');

         expect(c.peekChar()).toEqual(new PlainChunk('\n', new Offset(0, 0, 0), new Offset(1, 0, 1), defaultLoc));
      });

      it('returns the next character as \\n if it is a \\r', () => {
         const c = new XmlStringCursor('\r foo');

         expect(c.peekChar()).toEqual(new PlainChunk('\n', new Offset(0, 0, 0), new Offset(1, 0, 1), defaultLoc));
      });

      it('returns the next character as \\u0085 if it is \\u0085 and this is 1.0', () => {
         const c = new XmlStringCursor('\u0085 foo');

         expect(c.peekChar()).toEqual(new PlainChunk('\u0085', new Offset(0, 0, 0), new Offset(0, 1, 1), defaultLoc));
      });

      it('returns the next character as \\u2028 iof it is \\u2028 and this is 1.0', () => {
         const c = new XmlStringCursor('\u2028 foo');

         expect(c.peekChar()).toEqual(new PlainChunk('\u2028', new Offset(0, 0, 0), new Offset(0, 1, 1), defaultLoc));
      });

      it('returns the next character as \\n if it is \\u0085 and this is 1.1', () => {
         const c = new XmlStringCursor('\u0085 foo', entityMetaData1dot1);

         expect(c.peekChar()).toEqual(new PlainChunk('\n', new Offset(0, 0, 0), new Offset(1, 0, 1), defaultLoc));
      });

      it('returns the next character as \\n if it is \\u2028 and this is 1.1', () => {
         const c = new XmlStringCursor('\u2028 foo', entityMetaData1dot1);

         expect(c.peekChar()).toEqual(new PlainChunk('\n', new Offset(0, 0, 0), new Offset(1, 0, 1), defaultLoc));
      });

      it('returns the next character as \\n if it is both a \\r\\n pair', () => {
         const c = new XmlStringCursor('\r\n foo');

         expect(c.peekChar()).toEqual(new PlainChunk('\n', new Offset(0, 0, 0), new Offset(1, 0, 2), defaultLoc));
      });

      it('returns a \\n if next characters are \\r\\u0085 (and does not consume the latter) and this is 1.0', () => {
         const c = new XmlStringCursor('\r\u0085 foo');

         expect(c.peekChar()).toEqual(new PlainChunk('\n', new Offset(0, 0, 0), new Offset(1, 0, 1), defaultLoc));
      });

      it('returns the next character as \\n if it is a \\r\\u0085 if this is 1.1', () => {
         const c = new XmlStringCursor('\r\u0085 foo', entityMetaData1dot1);

         expect(c.peekChar()).toEqual(new PlainChunk('\n', new Offset(0, 0, 0), new Offset(1, 0, 2), defaultLoc));
      });

      it('returns the next character even when the cursor has incremented past start of string', () => {
         const c = new XmlStringCursor('x\r\n foo');
         c.getChar();

         expect(c.peekChar()).toEqual(new PlainChunk('\n', new Offset(0, 1, 1), new Offset(1, 0, 3), defaultLoc));
      });

      it('adds an array of invalid character indexes when a bad character is found', () => {
         const c = new XmlStringCursor('\u0000');

         expect(c.peekChar().invalidChars).toEqual([ 0 ]);
      });

      it('adds the index for all invalid characters below 256 in 1.0', () => {
         for (let index = 0; index <= 255; index++) {
            const c = new XmlStringCursor(String.fromCharCode(index));
            const expected = {
               index: index.toString(16),  // to let failures be more understandable
               result: undefined
            };

            if (index < 0x20 && index !== 0x09 && index !== 0x0A && index !== 0x0D) {
               expected.result = [ 0 ];
            }

            expect({
               index: index.toString(16),
               result: c.peekChar().invalidChars
            }).toEqual(expected);
         }
      });

      it('adds the index for all invalid characters between D7FE and E001 in 1.0', () => {
         for (let index = 0xFFFD; index <= 0xFFFF; index++) {
            const c = new XmlStringCursor(String.fromCharCode(index));
            const expected = {
               index: index.toString(16),
               result: undefined
            };

            if (index !== 0xFFFD) {
               expected.result = [ 0 ];
            }

            expect({
               index: index.toString(16),
               result: c.peekChar().invalidChars
            }).toEqual(expected);
         }
      });

      it('adds the index for all invalid characters below 256 in 1.1', () => {
         for (let index = 0; index <= 255; index++) {
            const c = new XmlStringCursor(String.fromCharCode(index),
               new EntityMetaData(EntityMetaData.TYPE.DOCUMENT, 1.1, 2));
            const expected = {
               index: index.toString(16),  // to let failures be more understandable
               result: undefined
            };

            if ((index < 0x20 && index !== 0x09 && index !== 0x0A && index !== 0x0D) ||
               (index >= 0x7F && index <= 0x9F && index !== 0x85)) {
               expected.result = [ 0 ];
            }

            expect({
               index: index.toString(16),
               result: c.peekChar().invalidChars
            }).toEqual(expected);
         }
      });

      it('adds the index for all invalid characters between D7FE and E001 in 1.1/2', () => {
         for (let index = 0xFFFD; index <= 0xFFFF; index++) {
            const c = new XmlStringCursor(String.fromCharCode(index),
               new EntityMetaData(EntityMetaData.TYPE.DOCUMENT, 1.1, 2));
            const expected = {
               index: index.toString(16),
               result: undefined
            };

            if (index !== 0xFFFD) {
               expected.result = [ 0 ];
            }

            expect({
               index: index.toString(16),
               result: c.peekChar().invalidChars
            }).toEqual(expected);
         }
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

         expect(c.getSpace()).toEqual(new WithSpaceChunk('    ', '    ', new Offset(0, 0, 0),
            new Offset(0, 4, 4), defaultLoc));
      });

      it('returns undefined if the first available character is ot a space', () => {
         const c = new XmlStringCursor('hi');

         expect(c.getSpace()).toBeUndefined();
      });

      it('returns the a mixture of tabs and spaces', () => {
         const c = new XmlStringCursor(' \t \t hi');

         expect(c.getSpace()).toEqual(new WithSpaceChunk(' \t \t ', ' \t \t ',
            new Offset(0, 0, 0), new Offset(0, 5, 5), defaultLoc));
      });

      it('returns the a mixture of tabs and spaces and newlines', () => {
         const c = new XmlStringCursor(' \n \t \n hi');

         expect(c.getSpace()).toEqual(new WithSpaceChunk(' \n \t \n ', ' \n \t \n ',
            new Offset(0, 0, 0), new Offset(2, 1, 7), defaultLoc));
      });

      it('treats a CR like a LF', () => {
         const c = new XmlStringCursor(' \rhi');
         const expected = new WithSpaceChunk(' \n', ' \r', new Offset(0, 0, 0), new Offset(1, 0, 2), defaultLoc);

         expect(c.getSpace()).toEqual(expected);
      });

      it('treats a CR LF like a LF', () => {
         const c = new XmlStringCursor(' \r\nhi');
         const expected = new WithSpaceChunk(' \n', ' \r\n', new Offset(0, 0, 0), new Offset(1, 0, 3), defaultLoc);

         expect(c.getSpace()).toEqual(expected);
      });

      it('treats a \\u0085 like non-space if this is 1.0', () => {
         const c = new XmlStringCursor(' \u0085hi');
         const expected = new WithSpaceChunk(' ', ' ', new Offset(0, 0, 0), new Offset(0, 1, 1), defaultLoc);

         expect(c.getSpace()).toEqual(expected);
      });

      it('treats a \\u2028 like a non-space if this is 1.0', () => {
         const c = new XmlStringCursor(' \u2028hi');
         const expected = new WithSpaceChunk(' ', ' ', new Offset(0, 0, 0), new Offset(0, 1, 1), defaultLoc);

         expect(c.getSpace()).toEqual(expected);
      });

      it('treats a \\u0085 like a \\n if this is 1.1', () => {
         const c = new XmlStringCursor(' \u0085hi', entityMetaData1dot1);
         const expected = new WithSpaceChunk(' \n', ' \u0085', new Offset(0, 0, 0), new Offset(1, 0, 2), defaultLoc);

         expect(c.getSpace()).toEqual(expected);
      });

      it('treats a \\u2028 like a \\n if this is 1.1', () => {
         const c = new XmlStringCursor(' \u2028hi', entityMetaData1dot1);
         const expected = new WithSpaceChunk(' \n', ' \u2028', new Offset(0, 0, 0), new Offset(1, 0, 2), defaultLoc);

         expect(c.getSpace()).toEqual(expected);
      });

      it('treats a mixture of CRLF and CR and LF as just the right set of LF', () => {
         const c = new XmlStringCursor(' \r\n \n \r hi');
         const expected = new WithSpaceChunk(' \n \n \n ', ' \r\n \n \r ', new Offset(0, 0, 0),
            new Offset(3, 1, 8), defaultLoc);

         expect(c.getSpace()).toEqual(expected);
      });

      it('treats a \\r\\u0085 like \\n\\u0085 if this is 1.0', () => {
         const c = new XmlStringCursor(' \r\u0085hi');
         const expected = new WithSpaceChunk(' \n', ' \r', new Offset(0, 0, 0), new Offset(1, 0, 2), defaultLoc);

         expect(c.getSpace()).toEqual(expected);
      });

      it('treats a \\r\\u0085 like a \\n if this is 1.1', () => {
         const c = new XmlStringCursor(' \r\u0085hi', entityMetaData1dot1);
         const expected = new WithSpaceChunk(' \n', ' \r\u0085', new Offset(0, 0, 0), new Offset(1, 0, 3), defaultLoc);

         expect(c.getSpace()).toEqual(expected);
      });

      it('returns the original text, without line ending changes', () => {
         const c = new XmlStringCursor(' \r \n \r\n \t');

         expect(c.getSpace().originalText).toEqual(' \r \n \r\n \t');
      });

      it('reads a space string from the middle of the string', () => {
         const c = new XmlStringCursor('one twp');
         c.getWord([]);

         expect(c.getSpace()).toEqual(new WithSpaceChunk(' ', ' ', new Offset(0, 3, 3),
            new Offset(0, 4, 4), defaultLoc));
      });

      it('adds the space chunk to the recent chunks', () => {
         const c = new XmlStringCursor(' \t\n');
         c.getSpace();

         expect(c.getRecentChunks()).toEqual([
            new WithSpaceChunk(' \t\n', ' \t\n', new Offset(0, 0, 0), new Offset(1, 0, 3), defaultLoc)
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

         const expected = new WordChunk('one', new Offset(0, 0, 0), new Offset(0, 3, 3), defaultLoc);
         expect(c.getWord([])).toEqual(expected);
      });

      it('returns the next word, even if a single letter', () => {
         const c = new XmlStringCursor('o two');

         const expected = new WordChunk('o', new Offset(0, 0, 0), new Offset(0, 1, 1), defaultLoc);
         expect(c.getWord([])).toEqual(expected);
      });

      it('can get multiple words in a row', () => {
         const c = new XmlStringCursor('one two');
         c.getWord([]);
         c.getSpace();

         const expected = new WordChunk('two', new Offset(0, 4, 4), new Offset(0, 7, 7), defaultLoc);
         expect(c.getWord([])).toEqual(expected);
      });

      it('considers the word terminated at the specified terminator', () => {
         const c = new XmlStringCursor('oneX');

         const expected = new WordChunk('one', new Offset(0, 0, 0), new Offset(0, 3, 3), defaultLoc);
         expect(c.getWord([ 'X' ])).toEqual(expected);
      });

      it('does not terminate at \\u0085 in 1.0', () => {
         const c = new XmlStringCursor('one\u0085X');
         const expected = new WordChunk('one\u0085X', new Offset(0, 0, 0),
            new Offset(0, 5, 5), defaultLoc);

         expect(c.getWord([ ])).toEqual(expected);
      });

      it('does not terminate at \\u2028 in 1.0', () => {
         const c = new XmlStringCursor('one\u2028X');
         const expected = new WordChunk('one\u2028X', new Offset(0, 0, 0),
            new Offset(0, 5, 5), defaultLoc);

         expect(c.getWord([ ])).toEqual(expected);
      });

      it('does terminate at \\u0085 in 1.1', () => {
         const c = new XmlStringCursor('one\u0085X', entityMetaData1dot1);
         const expected = new WordChunk('one', new Offset(0, 0, 0), new Offset(0, 3, 3), defaultLoc);

         expect(c.getWord([ ])).toEqual(expected);
      });

      it('does terminate at \\u2028 in 1.1', () => {
         const c = new XmlStringCursor('one\u2028X', entityMetaData1dot1);
         const expected = new WordChunk('one', new Offset(0, 0, 0), new Offset(0, 3, 3), defaultLoc);

         expect(c.getWord([ ])).toEqual(expected);
      });

      it('considers the word terminated at any of the specified terminators', () => {
         const c1 = new XmlStringCursor('oneX');
         const c2 = new XmlStringCursor('one?');
         const c3 = new XmlStringCursor('one/]]>');

         const expected = new WordChunk('one', new Offset(0, 0, 0), new Offset(0, 3, 3), defaultLoc);
         expect(c1.getWord([ 'X', '?', '/]]>' ])).toEqual(expected);
         expect(c2.getWord([ 'X', '?', '/]]>' ])).toEqual(expected);
         expect(c3.getWord([ 'X', '?', '/]]>' ])).toEqual(expected);
      });

      it('identifies a word even if not at the start of the cursor', () => {
         const c = new XmlStringCursor('one> twoX');
         c.getWord([ '>', 'X' ]);
         c.getChar();
         c.getSpace();

         const expected = new WordChunk('two', new Offset(0, 5, 5), new Offset(0, 8, 8), defaultLoc);
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
         const expected = new WordChunk('test', new Offset(0, 0, 0), new Offset(0, 4, 4), defaultLoc);

         expect(c.getRecentChunks()).toEqual([ expected ]);
      });

      it('assigns a location to the created chunk', () => {
         const loc = new EntityLocation('http://test.com/foo.bar');
         const c = new XmlStringCursor('one two', loc);

         expect(c.getWord([]).entityLocation).toEqual(loc);
      });

   });

   describe('getDigits()', () => {

      it('returns the next space-terminated set of decimal digits', () => {
         const c = new XmlStringCursor('123 ');

         const expected = new DigitChunk('123', true, new Offset(0, 0, 0), new Offset(0, 3, 3), defaultLoc);
         expect(c.getDigits()).toEqual(expected);
      });

      it('returns the next space-terminated set of hex digits', () => {
         const c = new XmlStringCursor('12AbCdE3 ');

         const expected = new DigitChunk('12AbCdE3', false, new Offset(0, 0, 0), new Offset(0, 8, 8), defaultLoc);
         expect(c.getDigits()).toEqual(expected);
      });

      it('returns all the possible digits', () => {
         const c = new XmlStringCursor('0123456789AaBbCcDdEeFf');

         const expected = new DigitChunk('0123456789AaBbCcDdEeFf', false, new Offset(0, 0, 0),
            new Offset(0, 22, 22), defaultLoc);
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

         expect(c.getDigits()).toEqual(new DigitChunk('12', true, new Offset(0, 0, 0),
            new Offset(0, 2, 2), defaultLoc));
      });

      it('stops processing at EOF', () => {
         const c = new XmlStringCursor('12');

         expect(c.getDigits()).toEqual(new DigitChunk('12', true, new Offset(0, 0, 0),
            new Offset(0, 2, 2), defaultLoc));
      });

      it('returns the digits even when not at the start of the cursor', () => {
         const c = new XmlStringCursor('foo 123');
         c.getWord([]);
         c.getSpace();

         expect(c.getDigits()).toEqual(new DigitChunk('123', true, new Offset(0, 4, 4),
            new Offset(0, 7, 7), defaultLoc));
      });

      it('adds the digit chunk to the recent chunks', () => {
         const c = new XmlStringCursor('123 ');
         c.getDigits();
         const expected = new DigitChunk('123', true, new Offset(0, 0, 0), new Offset(0, 3, 3), defaultLoc);

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

         expect(c.getChar()).toEqual(new PlainChunk('<', new Offset(0, 0, 0), new Offset(0, 1, 1), defaultLoc));
      });

      it('returns undefined if there are no more characters', () => {
         const c = new XmlStringCursor('');

         expect(c.getChar()).toBeUndefined();
      });

      it('returns the next character even if it is a newline', () => {
         const c = new XmlStringCursor('\n foo');

         expect(c.getChar()).toEqual(new PlainChunk('\n', new Offset(0, 0, 0), new Offset(1, 0, 1), defaultLoc));
      });

      it('returns the next character even if it is a return', () => {
         const c = new XmlStringCursor('\r foo');

         expect(c.getChar()).toEqual(new PlainChunk('\n', new Offset(0, 0, 0), new Offset(1, 0, 1), defaultLoc));
      });

      it('returns the next character even if it is both a return and newline pair', () => {
         const c = new XmlStringCursor('\r\n foo');

         expect(c.getChar()).toEqual(new PlainChunk('\n', new Offset(0, 0, 0), new Offset(1, 0, 2), defaultLoc));
      });

      it('returns the next character even when the cursor is not at the beginning', () => {
         const c = new XmlStringCursor('x\r\n foo');
         c.getChar();

         expect(c.getChar()).toEqual(new PlainChunk('\n', new Offset(0, 1, 1), new Offset(1, 0, 3), defaultLoc));
      });

      it('adds the char chunk to the recent chunks', () => {
         const c = new XmlStringCursor('test ');
         c.getChar();

         expect(c.getRecentChunks()).toEqual([
            new PlainChunk('t', new Offset(0, 0, 0), new Offset(0, 1, 1), defaultLoc)
         ]);
      });

      it('assigns a location to the created chunk', () => {
         const loc = new EntityLocation('http://test.com/foo.bar');
         const c = new XmlStringCursor('<foo>', loc);

         expect(c.getChar().entityLocation).toEqual(loc);
      });

      // Whitebox: Not testing invalid character ranges.  this is covered in peekChar() which covers this
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
             new Offset(0, 1, 1), defaultLoc));
      });

      it('returns a chunk with markup if the next is just &', () => {
         const c = new XmlStringCursor('&frog');

         expect(c.getMarkup()).toEqual(new PlainChunk('&', new Offset(0, 0, 0),
             new Offset(0, 1, 1), defaultLoc));
      });

      it('returns a markup chunk if the next is </', () => {
         const c = new XmlStringCursor('</frog');

         expect(c.getMarkup()).toEqual(new PlainChunk('</', new Offset(0, 0, 0),
             new Offset(0, 2, 2), defaultLoc));
      });

      it('returns a chunk with markup if the next is <!--', () => {
         const c = new XmlStringCursor('<!--frog');

         expect(c.getMarkup()).toEqual(new PlainChunk('<!--', new Offset(0, 0, 0),
             new Offset(0, 4, 4), defaultLoc));
      });

      it('returns a chunk with markup if the next is <?', () => {
         const c = new XmlStringCursor('<?frog');

         expect(c.getMarkup()).toEqual(new PlainChunk('<?', new Offset(0, 0, 0),
             new Offset(0, 2, 2), defaultLoc));
      });

      it('returns a chunk with markup if the next is <!', () => {
         const c = new XmlStringCursor('<!frog');

         expect(c.getMarkup()).toEqual(new PlainChunk('<!', new Offset(0, 0, 0),
             new Offset(0, 2, 2), defaultLoc));
      });

      it('returns a chunk with markup if the next is </', () => {
         const c = new XmlStringCursor('</frog');

         expect(c.getMarkup()).toEqual(new PlainChunk('</', new Offset(0, 0, 0),
             new Offset(0, 2, 2), defaultLoc));
      });

      it('returns a chunk with markup from the middle of the source string', () => {
         const c = new XmlStringCursor(' \r  </frog');
         c.getSpace();

         expect(c.getMarkup()).toEqual(new PlainChunk('</', new Offset(1, 2, 4),
             new Offset(1, 4, 6), defaultLoc));
      });

      it('adds the chunk with < markup to the recent chunks', () => {
         const c = new XmlStringCursor('<test>');
         c.getMarkup();

         expect(c.getRecentChunks()).toEqual([
            new PlainChunk('<', new Offset(0, 0, 0), new Offset(0, 1, 1), defaultLoc)
         ]);
      });

      it('adds the chunk with & markup to the recent chunks', () => {
         const c = new XmlStringCursor('&test>');
         c.getMarkup();

         expect(c.getRecentChunks()).toEqual([
            new PlainChunk('&', new Offset(0, 0, 0), new Offset(0, 1, 1), defaultLoc)
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
             new Offset(0, 1, 1), defaultLoc));
      });

      it('returns a chunk with the coose if the next ]]>', () => {
         const c = new XmlStringCursor(']]>frog');

         expect(c.getClose()).toEqual(new PlainChunk(']]>', new Offset(0, 0, 0),
             new Offset(0, 3, 3), defaultLoc));
      });

      it('adds the chunk with ]]> close to the recent chunks', () => {
         const c = new XmlStringCursor(']]>foo');
         c.getClose();

         expect(c.getRecentChunks()).toEqual([
            new PlainChunk(']]>', new Offset(0, 0, 0), new Offset(0, 3, 3), defaultLoc)
         ]);
      });

      it('adds the chunk with "]" to the recent chunks', () => {
         const c = new XmlStringCursor(']>');
         c.getClose();

         expect(c.getRecentChunks()).toEqual([
            new PlainChunk(']', new Offset(0, 0, 0), new Offset(0, 1, 1), defaultLoc)
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

         expect(c.getMatch('fro')).toEqual(new PlainChunk('fro', new Offset(0, 0, 0), new Offset(0, 3, 3), defaultLoc));
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

         expect(c.getMatch('ne')).toEqual(new PlainChunk('ne', new Offset(0, 1, 1), new Offset(0, 3, 3), defaultLoc));
      });

      it('adds the matched chunk to the recent chunks', () => {
         const c = new XmlStringCursor('Testing');
         c.getMatch('Tes');

         expect(c.getRecentChunks()).toEqual([
            new PlainChunk('Tes', new Offset(0, 0, 0), new Offset(0, 3, 3), defaultLoc)
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
            chunk: new WithSpaceChunk('frog', 'frog', new Offset(0, 0, 0), new Offset(0, 4, 4), defaultLoc),
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
            chunk: new WithSpaceChunk('frog', 'frog', new Offset(0, 0, 0), new Offset(0, 4, 4), defaultLoc),
            terminator: undefined
         });
      });

      it('returns the string up to the first terminator when there are multiple', () => {
         const c = new XmlStringCursor('frogDandD');

         expect(c.getToTerminator([ 'D' ])).toEqual({
            chunk: new WithSpaceChunk('frog', 'frog', new Offset(0, 0, 0), new Offset(0, 4, 4), defaultLoc),
            terminator: 'D'
         });
      });

      it('returns the string with newlines appropriately adjusted', () => {
         const c = new XmlStringCursor('line1\nline2\rline3\r\nline4!');
         const chunk = new WithSpaceChunk('line1\nline2\nline3\nline4', 'line1\nline2\rline3\r\nline4',
            new Offset(0, 0, 0), new Offset(3, 4, 24), defaultLoc);

         expect(c.getToTerminator([ '!' ])).toEqual({
            chunk: chunk,
            terminator: '!'
         });
      });

      it('returns the string with \\u0085 and \\u2028 not adjusted if this is 1.0', () => {
         const c = new XmlStringCursor('line1\u0085line2\u2028line3\r\u0085line4!');
         const chunk = new WithSpaceChunk('line1\u0085line2\u2028line3\n\u0085line4',
            'line1\u0085line2\u2028line3\r\u0085line4',
            new Offset(0, 0, 0), new Offset(1, 5, 24), defaultLoc);

         expect(c.getToTerminator([ '!' ])).toEqual({
            chunk: chunk,
            terminator: '!'
         });
      });

      it('returns the string with \\u0085 and \\u2028 adjusted if this is 1.1', () => {
         const c = new XmlStringCursor('line1\u0085line2\u2028line3\r\u0085line4!', entityMetaData1dot1);

         const chunk = new WithSpaceChunk('line1\nline2\nline3\nline4', 'line1\u0085line2\u2028line3\r\u0085line4',
            new Offset(0, 0, 0), new Offset(3, 4, 24), defaultLoc);
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
            chunk: new WithSpaceChunk('rog', 'rog', new Offset(0, 1, 1), new Offset(0, 4, 4), defaultLoc),
            terminator: 'D'
         });
      });

      it('adds the returned chunk to the recent chunk', () => {
         const c = new XmlStringCursor('This is a Test');
         c.getToTerminator([ 'Tes' ]);

         expect(c.getRecentChunks()).toEqual([
            new WithSpaceChunk('This is a ', 'This is a ', new Offset(0, 0, 0), new Offset(0, 10, 10), defaultLoc)
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

         const firstWord = new WordChunk('one', new Offset(0, 0, 0), new Offset(0, 3, 3), defaultLoc);
         const secondWord = new WordChunk('two', new Offset(0, 4, 4), new Offset(0, 7, 7), defaultLoc);

         expect(c.getRecentChunks()).toEqual([
            firstWord,
            new WithSpaceChunk(' ', ' ', new Offset(0, 3, 3), new Offset(0, 4, 4), defaultLoc),
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
