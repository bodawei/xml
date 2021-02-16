/* Copyright ® 2018-2019 by 柏大衛. All rights reserved. */

import { isName, isNmToken, isSpace, isChar, isRestrictedChar } from '../chars';

type Data = Array<{
   description: string;
   text: string;
   version: 1.0 | 1.1;
   revision: 1 | 2 | 3 | 4 | 5 | 6;
   result: boolean;
}>;

describe('util', () => {
   describe('isName()', () => {
      ([
         {
            description: 'accepts a name that is just plain letters',
            text: 'good',
            version: 1.0,
            revision: 5,
            result: true,
         },
         {
            description: 'accepts a name that has a hyphen, period or digit',
            text: 'on.-8',
            version: 1.0,
            revision: 5,
            result: true,
         },
         {
            description: 'accepts a name that has the allowable chars above ascii in it',
            text: 'o\u00B7\u0310\u2040e',
            version: 1.0,
            revision: 5,
            result: true,
         },
         {
            description: 'accepts a name that starts with an astral character (e.g. an emoji)',
            text: '\uD83D\uDC04moo',
            version: 1.0,
            revision: 5,
            result: true,
         },
         {
            description: 'accepts a name that has many of the characters in it',
            text:
               'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:_' +
               '\u00CE\u01F8\u0371\u047F\u200C\u2080\u2CCC\u4001\uF901\uFDF1',
            version: 1.0,
            revision: 5,
            result: true,
         },
         {
            description: 'accepts a name that has a uFDF1 in it',
            text: 'o\uFDF1e',
            version: 1.0,
            revision: 5,
            result: true,
         },
         {
            description: 'rejects a name with a $ in it',
            text: 'o$e',
            version: 1.0,
            revision: 5,
            result: false,
         },
         {
            description: 'rejects a name that starts with a digit',
            text: '1ne',
            version: 1.0,
            revision: 5,
            result: false,
         },
         {
            description: 'rejects a name that starts with a hyphen',
            text: '-ne',
            version: 1.0,
            revision: 5,
            result: false,
         },
         {
            description: 'rejects a name that starts with a period',
            text: '.ne',
            version: 1.0,
            revision: 5,
            result: false,
         },
         {
            description: 'rejects a name that starts with a u00B7',
            text: '\u00B7ne',
            version: 1.0,
            revision: 5,
            result: false,
         },
         {
            description: 'rejects a name that starts with a u0320',
            text: '\u0320ne',
            version: 1.0,
            revision: 5,
            result: false,
         },
         {
            description: 'rejects a name that starts with a u2040',
            text: '\u2040',
            version: 1.0,
            revision: 5,
            result: false,
         },
         {
            description: 'rejects a name that has u03F4 in version 1.0/4',
            text: '\u03F4',
            version: 1.0,
            revision: 4,
            result: false,
         },
         {
            description: 'accepts a name that has u03F4 in version 1.0/5',
            text: '\u03F4',
            version: 1.0,
            revision: 5,
            result: true,
         },
         {
            description: 'accepts a name that has u03F4 in version 1.1',
            text: '\u03F4',
            version: 1.1,
            revision: 1,
            result: true,
         },
         {
            description:
               'rejects a name that contains with some bad 1.0 characters in version 1.0/4',
            text: '\u0eceb',
            version: 1.0,
            revision: 4,
            result: false,
         },
         {
            description:
               'accepts a name that contains with some bad 1.0 characters in version 1.0/5',
            text: '\u0eceb',
            version: 1.0,
            revision: 5,
            result: true,
         },
         {
            description: 'accepts a name that contains with some bad 1.0 characters in version 1.1',
            text: '\u0eceb',
            version: 1.1,
            revision: 1,
            result: true,
         },
         {
            description: 'allows default values for version and revision',
            text: '\u0eceb',
            version: undefined,
            revision: undefined,
            result: true,
         },
         {
            description: 'disallows a single surrogate half',
            text: '\uD83Dbooo',
            version: 1.0,
            revision: 5,
            result: false,
         },
         {
            description: 'disallows a single surrogate half after the name start',
            text: 'b\uD83Dooo',
            version: 1.0,
            revision: 5,
            result: false,
         },
      ] as Data).forEach((data) => {
         it(data.description, () => {
            expect(isName(data.text, data.version, data.revision)).toEqual(data.result);
         });
      });
   });

   describe('isNmToken()', () => {
      ([
         {
            description: 'accepts an Nmtoken that is just plain letters',
            text: 'good',
            version: 1.0,
            revision: 5,
            result: true,
         },
         {
            description: 'accepts an Nmtoken that has a hyphen, period or digit',
            text: 'on.-8',
            version: 1.0,
            revision: 5,
            result: true,
         },
         {
            description: 'accepts an Nmtoken that has the allowable chars above ascii in it',
            text: 'o\u00B7\u0310\u2040e',
            version: 1.0,
            revision: 5,
            result: true,
         },
         {
            description: 'accepts an Nmtoken that starts with an astral character (e.g. an emoji)',
            text: '\uD83D\uDC04moo',
            version: 1.0,
            revision: 5,
            result: true,
         },
         {
            description: 'accepts an Nmtoken that contains a bunch of valid values',
            text:
               'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:_' +
               '\u00CE\u01F8\u0371\u047F\u200C\u2080\u2CCC\u4001\uF901\uFDF1',
            version: 1.0,
            revision: 5,
            result: true,
         },
         {
            description: 'accepts an Nmtoken that has a uFDF1 in it',
            text: 'o\uFDF1e',
            version: 1.0,
            revision: 5,
            result: true,
         },
         {
            description: 'rejects an Nmtoken with a $ in it',
            text: 'o$e',
            version: 1.0,
            revision: 5,
            result: false,
         },
         {
            description: 'allows an Nmtoken that starts with a digit',
            text: '1ne',
            version: 1.0,
            revision: 5,
            result: true,
         },
         {
            description: 'accepts an Nmtoken that starts with a hyphen',
            text: '-ne',
            version: 1.0,
            revision: 5,
            result: true,
         },
         {
            description: 'accepts an Nmtoken that starts with a period',
            text: '.ne',
            version: 1.0,
            revision: 5,
            result: true,
         },
         {
            description:
               'accepts an Nmtoken that starts with a u00B7 (a namechar that is not a namestartchar)',
            text: '\u00B7ne',
            version: 1.0,
            revision: 5,
            result: true,
         },
         {
            description:
               'accepts an Nmtoken that starts with a u0320 (a namechar that is not a namestartchar)',
            text: '\u0320ne',
            version: 1.0,
            revision: 5,
            result: true,
         },
         {
            description:
               'accepts an Nmtoken that starts with a u2040 (a namechar that is not a namestartchar)',
            text: '\u2040',
            version: 1.0,
            revision: 5,
            result: true,
         },
         {
            description: 'rejects an Nmtoken that has u03F4 in version 1.0/4',
            text: '\u03F4',
            version: 1.0,
            revision: 4,
            result: false,
         },
         {
            description: 'accepts an Nmtoken that has u03F4 in version 1.0/5',
            text: '\u03F4',
            version: 1.0,
            revision: 5,
            result: true,
         },
         {
            description: 'accepts an Nmtoken that has u03F4 in version 1.1/1',
            text: '\u03F4',
            version: 1.1,
            revision: 1,
            result: true,
         },
         {
            description: 'rejects an Nmtoken in 1.0/4 that has characters that are bad in 1.0/4',
            text: 'f\u0eceb',
            version: 1.0,
            revision: 4,
            result: false,
         },
         {
            description:
               'accepts an Nmtoken in 1.0/5 that has characters that are bad in 1.0/4 but ok in version 1.0/5',
            text: 'f\u0eceb',
            version: 1.0,
            revision: 5,
            result: true,
         },
         {
            description:
               'accepts an Nmtoken in 1.1 that has characters that are bad in 1.0 but ok in version 1.1',
            text: 'f\u0eceb',
            version: 1.1,
            revision: 2,
            result: true,
         },
         {
            description: 'defaults version and revision if none passed',
            text: 'f\u0eceb',
            version: undefined,
            revision: undefined,
            result: true,
         },
         {
            description: 'disallows a single surrogate half',
            text: '\uD83Dbooo',
            version: 1.0,
            revision: 5,
            result: false,
         },
         {
            description: 'disallows a single surrogate half after the name start',
            text: 'b\uD83Dooo',
            version: 1.0,
            revision: 5,
            result: false,
         },
      ] as Data).forEach((data) => {
         it(data.description, () => {
            expect(isNmToken(data.text, data.version, data.revision)).toEqual(data.result);
         });
      });
   });

   describe('isSpace()', () => {
      ([
         {
            description: 'accepts space',
            text: ' ',
            version: 1.0,
            revision: 1,
            result: true,
         },
         {
            description: 'accepts \\r',
            text: '\r',
            version: 1.0,
            revision: 1,
            result: true,
         },
         {
            description: 'accepts \\t',
            text: '\t',
            version: 1.0,
            revision: 5,
            result: true,
         },
         {
            description: 'accepts \\n',
            text: '\n',
            version: 1.0,
            revision: 5,
            result: true,
         },
         {
            description: 'rejects x',
            text: 'x',
            version: 1.0,
            revision: 5,
            result: false,
         },
         {
            description: 'rejects \\0085 in 1.0',
            text: '\u0085',
            version: 1.0,
            revision: 1,
            result: false,
         },
         {
            description: 'rejects \\2028 in 1.0',
            text: '\u2028',
            version: 1.0,
            revision: 1,
            result: false,
         },
         {
            description: 'accepts \\0085 in 1.1',
            text: '\u0085',
            version: 1.1,
            revision: 1,
            result: true,
         },
         {
            description: 'accepts \\2028 in 1.1',
            text: '\u2028',
            version: 1.1,
            revision: 1,
            result: true,
         },
      ] as Data).forEach((data) => {
         it(data.description, () => {
            expect(isSpace(data.text, data.version)).toEqual(data.result);
         });
      });
   });

   describe('isChar()', () => {
      ([
         {
            description: 'null is not a Char in 1.0/*',
            text: '\u0000',
            version: 1.0,
            revision: 1,
            result: false,
         },
         {
            description: 'null is not a Char in 1.1/*',
            text: '\u0000',
            version: 1.1,
            revision: 1,
            result: false,
         },
         {
            description: 'control characters are not Chars in 1.0/*',
            text: '\u0001',
            version: 1.0,
            revision: 1,
            result: false,
         },
         {
            description: 'control characters are Chars in 1.1/*',
            text: '\u0001',
            version: 1.1,
            revision: 1,
            result: true,
         },
         {
            description: 'defaults to 1.0/* if no version specified',
            text: '\u0001',
            version: undefined,
            revision: 1,
            result: false,
         },
         {
            description: 'accepts a character > 0xFFFF',
            text: '\ud848\udcf2',
            version: 1.0,
            revision: 5,
            result: true,
         },
         {
            description: 'rejects a three character string',
            text: '123',
            version: 1.0,
            revision: 5,
            result: false,
         },
      ] as Data).forEach((data) => {
         it(data.description, () => {
            expect(isChar(data.text, data.version)).toEqual(data.result);
         });
      });
   });

   describe('isRestrictedChar()', () => {
      ([
         {
            description: 'control characters are not restricted characters in 1.0/*',
            text: '\u0008',
            version: 1.0,
            revision: 1,
            result: false,
         },
         {
            description: 'control characters are restricted characters in 1.1/*',
            text: '\u0008',
            version: 1.1,
            revision: 1,
            result: true,
         },
         {
            description: 'defaults to 1.0/* if no version specified',
            text: '\u0008',
            version: undefined,
            revision: 1,
            result: false,
         },
      ] as Data).forEach((data) => {
         it(data.description, () => {
            expect(isRestrictedChar(data.text, data.version)).toEqual(data.result);
         });
      });
   });
});
