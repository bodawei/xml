/* Copyright ® 2018-2019 by 柏大衛. All rights reserved. */

import { expect } from '@jest/globals';

import { isName, isNmToken, isChar, isRestrictedChar, isSpace } from '../chars';

type Data = Array<{
   description: string;
   edition: 1 | 2 | 3 | 4 | 5 | 6;
   result: boolean;
   text: string;
   version: 1.0 | 1.1;
}>;

describe('util', () => {
   describe('isName()', () => {
      (
         [
            {
               description: 'accepts a name that is just plain letters',
               edition: 5,
               result: true,
               text: 'good',
               version: 1.0,
            },
            {
               description: 'accepts a name that has a hyphen, period or digit',
               edition: 5,
               result: true,
               text: 'on.-8',
               version: 1.0,
            },
            {
               description: 'accepts a name that has the allowable chars above ascii in it',
               edition: 5,
               result: true,
               text: 'o\u00B7\u0310\u2040e',
               version: 1.0,
            },
            {
               description: 'accepts a name that starts with an astral character (e.g. an emoji)',
               edition: 5,
               result: true,
               text: '\uD83D\uDC04moo',
               version: 1.0,
            },
            {
               description: 'accepts a name that has many of the characters in it',
               edition: 5,
               result: true,
               text:
                  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:_' +
                  '\u00CE\u01F8\u0371\u047F\u200C\u2080\u2CCC\u4001\uF901\uFDF1',
               version: 1.0,
            },
            {
               description: 'accepts a name that has a uFDF1 in it',
               edition: 5,
               result: true,
               text: 'o\uFDF1e',
               version: 1.0,
            },
            {
               description: 'rejects a name with a $ in it',
               edition: 5,
               result: false,
               text: 'o$e',
               version: 1.0,
            },
            {
               description: 'rejects a name that starts with a digit',
               edition: 5,
               result: false,
               text: '1ne',
               version: 1.0,
            },
            {
               description: 'rejects a name that starts with a hyphen',
               edition: 5,
               result: false,
               text: '-ne',
               version: 1.0,
            },
            {
               description: 'rejects a name that starts with a period',
               edition: 5,
               result: false,
               text: '.ne',
               version: 1.0,
            },
            {
               description: 'rejects a name that starts with a u00B7',
               edition: 5,
               result: false,
               text: '\u00B7ne',
               version: 1.0,
            },
            {
               description: 'rejects a name that starts with a u0320',
               edition: 5,
               result: false,
               text: '\u0320ne',
               version: 1.0,
            },
            {
               description: 'rejects a name that starts with a u2040',
               edition: 5,
               result: false,
               text: '\u2040',
               version: 1.0,
            },
            {
               description: 'rejects a name that has u03F4 in version 1.0/4',
               edition: 4,
               result: false,
               text: '\u03F4',
               version: 1.0,
            },
            {
               description: 'accepts a name that has u03F4 in version 1.0/5',
               edition: 5,
               result: true,
               text: '\u03F4',
               version: 1.0,
            },
            {
               description: 'accepts a name that has u03F4 in version 1.1',
               edition: 1,
               result: true,
               text: '\u03F4',
               version: 1.1,
            },
            {
               description:
                  'rejects a name that contains with some bad 1.0 characters in version 1.0/4',
               edition: 4,
               result: false,
               text: '\u0eceb',
               version: 1.0,
            },
            {
               description:
                  'accepts a name that contains with some bad 1.0 characters in version 1.0/5',
               edition: 5,
               result: true,
               text: '\u0eceb',
               version: 1.0,
            },
            {
               description:
                  'accepts a name that contains with some bad 1.0 characters in version 1.1',
               edition: 1,
               result: true,
               text: '\u0eceb',
               version: 1.1,
            },
            {
               description: 'allows default values for version and edition',
               edition: undefined,
               result: true,
               text: '\u0eceb',
               version: undefined,
            },
            {
               description: 'disallows a single surrogate half',
               edition: 5,
               result: false,
               text: '\uD83Dbooo',
               version: 1.0,
            },
            {
               description: 'disallows a single surrogate half after the name start',
               edition: 5,
               result: false,
               text: 'b\uD83Dooo',
               version: 1.0,
            },
            {
               description: 'disallows surrogate pair out of range for names',
               edition: 5,
               result: false,
               text: 'b\uDBC0\uDC00ooo',
               version: 1.0,
            },
         ] as Data
      ).forEach((data) => {
         it(data.description, () => {
            expect(isName(data.text, data.version, data.edition)).toEqual(data.result);
         });
      });
   });

   describe('isNmToken()', () => {
      (
         [
            {
               description: 'accepts an Nmtoken that is just plain letters',
               edition: 5,
               result: true,
               text: 'good',
               version: 1.0,
            },
            {
               description: 'accepts an Nmtoken that has a hyphen, period or digit',
               edition: 5,
               result: true,
               text: 'on.-8',
               version: 1.0,
            },
            {
               description: 'accepts an Nmtoken that has the allowable chars above ascii in it',
               edition: 5,
               result: true,
               text: 'o\u00B7\u0310\u2040e',
               version: 1.0,
            },
            {
               description:
                  'accepts an Nmtoken that starts with an astral character (e.g. an emoji)',
               edition: 5,
               result: true,
               text: '\uD83D\uDC04moo',
               version: 1.0,
            },
            {
               description: 'accepts an Nmtoken that contains a bunch of valid values',
               edition: 5,
               result: true,
               text:
                  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:_' +
                  '\u00CE\u01F8\u0371\u047F\u200C\u2080\u2CCC\u4001\uF901\uFDF1',
               version: 1.0,
            },
            {
               description: 'accepts an Nmtoken that has a uFDF1 in it',
               edition: 5,
               result: true,
               text: 'o\uFDF1e',
               version: 1.0,
            },
            {
               description: 'rejects an Nmtoken with a $ in it',
               edition: 5,
               result: false,
               text: 'o$e',
               version: 1.0,
            },
            {
               description: 'allows an Nmtoken that starts with a digit',
               edition: 5,
               result: true,
               text: '1ne',
               version: 1.0,
            },
            {
               description: 'accepts an Nmtoken that starts with a hyphen',
               edition: 5,
               result: true,
               text: '-ne',
               version: 1.0,
            },
            {
               description: 'accepts an Nmtoken that starts with a period',
               edition: 5,
               result: true,
               text: '.ne',
               version: 1.0,
            },
            {
               description:
                  'accepts an Nmtoken that starts with a u00B7 (a namechar that is not a namestartchar)',
               edition: 5,
               result: true,
               text: '\u00B7ne',
               version: 1.0,
            },
            {
               description:
                  'accepts an Nmtoken that starts with a u0320 (a namechar that is not a namestartchar)',
               edition: 5,
               result: true,
               text: '\u0320ne',
               version: 1.0,
            },
            {
               description:
                  'accepts an Nmtoken that starts with a u2040 (a namechar that is not a namestartchar)',
               edition: 5,
               result: true,
               text: '\u2040',
               version: 1.0,
            },
            {
               description: 'rejects an Nmtoken that has u03F4 in version 1.0/4',
               edition: 4,
               result: false,
               text: '\u03F4',
               version: 1.0,
            },
            {
               description: 'accepts an Nmtoken that has u03F4 in version 1.0/5',
               edition: 5,
               result: true,
               text: '\u03F4',
               version: 1.0,
            },
            {
               description: 'accepts an Nmtoken that has u03F4 in version 1.1/1',
               edition: 1,
               result: true,
               text: '\u03F4',
               version: 1.1,
            },
            {
               description: 'rejects an Nmtoken in 1.0/4 that has characters that are bad in 1.0/4',
               edition: 4,
               result: false,
               text: 'f\u0eceb',
               version: 1.0,
            },
            {
               description:
                  'accepts an Nmtoken in 1.0/5 that has characters that are bad in 1.0/4 but ok in version 1.0/5',
               edition: 5,
               result: true,
               text: 'f\u0eceb',
               version: 1.0,
            },
            {
               description:
                  'accepts an Nmtoken in 1.1 that has characters that are bad in 1.0 but ok in version 1.1',
               edition: 2,
               result: true,
               text: 'f\u0eceb',
               version: 1.1,
            },
            {
               description: 'defaults version and edition if none passed',
               edition: undefined,
               result: true,
               text: 'f\u0eceb',
               version: undefined,
            },
            {
               description: 'disallows a single surrogate half',
               edition: 5,
               result: false,
               text: '\uD83Dbooo',
               version: 1.0,
            },
            {
               description: 'disallows a single surrogate half after the name start',
               edition: 5,
               result: false,
               text: 'b\uD83Dooo',
               version: 1.0,
            },
            {
               description: 'disallows surrogate pair out of range for nmtokens',
               edition: 5,
               result: false,
               text: 'b\uDBC0\uDC00ooo',
               version: 1.0,
            },
         ] as Data
      ).forEach((data) => {
         it(data.description, () => {
            expect(isNmToken(data.text, data.version, data.edition)).toEqual(data.result);
         });
      });
   });

   describe('isSpace()', () => {
      (
         [
            {
               description: 'accepts space',
               edition: 1,
               result: true,
               text: ' ',
            },
            {
               description: 'accepts \\r',
               edition: 1,
               result: true,
               text: '\r',
            },
            {
               description: 'accepts \\t',
               edition: 5,
               result: true,
               text: '\t',
            },
            {
               description: 'accepts \\n',
               edition: 5,
               result: true,
               text: '\n',
            },
            {
               description: 'rejects x',
               edition: 5,
               result: false,
               text: 'x',
            },
            {
               description: 'rejects \\0085 in 1.0',
               edition: 1,
               result: false,
               text: '\u0085',
            },
            {
               description: 'rejects \\2028 in 1.0',
               edition: 1,
               result: false,
               text: '\u2028',
            },
         ] as Data
      ).forEach((data) => {
         it(data.description, () => {
            expect(isSpace(data.text)).toEqual(data.result);
         });
      });
   });

   describe('isChar()', () => {
      (
         [
            {
               description: 'null is not a Char in 1.0/*',
               edition: 1,
               result: false,
               text: '\u0000',
               version: 1.0,
            },
            {
               description: 'null is not a Char in 1.1/*',
               edition: 1,
               result: false,
               text: '\u0000',
               version: 1.1,
            },
            {
               description: 'control characters are not Chars in 1.0/*',
               edition: 1,
               result: false,
               text: '\u0001',
               version: 1.0,
            },
            {
               description: 'control characters are Chars in 1.1/*',
               edition: 1,
               result: true,
               text: '\u0001',
               version: 1.1,
            },
            {
               description: 'defaults to 1.0/* if no version specified',
               edition: 1,
               result: false,
               text: '\u0001',
               version: undefined,
            },
            {
               description: 'accepts a character > 0xFFFF',
               edition: 5,
               result: true,
               text: '\ud848\udcf2',
               version: 1.0,
            },
            {
               description: 'rejects a three character string',
               edition: 5,
               result: false,
               text: '123',
               version: 1.0,
            },
         ] as Data
      ).forEach((data) => {
         it(data.description, () => {
            expect(isChar(data.text, data.version)).toEqual(data.result);
         });
      });
   });

   describe('isRestrictedChar()', () => {
      (
         [
            {
               description: 'control characters are not restricted characters in 1.0/*',
               edition: 1,
               result: false,
               text: '\u0008',
               version: 1.0,
            },
            {
               description: 'control characters are restricted characters in 1.1/*',
               edition: 1,
               result: true,
               text: '\u0008',
               version: 1.1,
            },
            {
               description: 'defaults to 1.0/* if no version specified',
               edition: 1,
               result: false,
               text: '\u0008',
               version: undefined,
            },
         ] as Data
      ).forEach((data) => {
         it(data.description, () => {
            expect(isRestrictedChar(data.text, data.version)).toEqual(data.result);
         });
      });
   });
});
