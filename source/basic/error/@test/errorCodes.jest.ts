/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ErrorCodes } from '../errorCodes';

describe('ErrorCodes()', () => {
   it('populates the instance variables with the provided mapping data', () => {
      const result = new ErrorCodes({
         ID: {
            code: 1,
            message: 'whee',
         },
         ID2: {
            code: 2,
            message: 'whee {0} {{1} {1} {0}',
         },
      });

      expect(result).toMatchInlineSnapshot(`
         ErrorCodes {
           "code": Object {
             "ID": 1,
             "ID2": 2,
           },
           "id": Object {
             "ID": "ID",
             "ID2": "ID2",
           },
           "mapping": Object {
             "ID": Object {
               "code": 1,
               "message": "whee",
             },
             "ID2": Object {
               "code": 2,
               "message": "whee {0} {{1} {1} {0}",
             },
           },
         }
      `);
   });

   it('can added to the provided mapping at any time', () => {
      const errorCodes = new ErrorCodes({
         ID: {
            code: 1,
            message: 'first',
         },
         ID2: {
            code: 2,
            message: 'second {0} {{1} {1} {0}',
         },
      });

      errorCodes.addMapping({
         ID3: {
            code: 3,
            message: 'third',
         },
      });

      expect(errorCodes).toMatchInlineSnapshot(`
         ErrorCodes {
           "code": Object {
             "ID": 1,
             "ID2": 2,
             "ID3": 3,
           },
           "id": Object {
             "ID": "ID",
             "ID2": "ID2",
             "ID3": "ID3",
           },
           "mapping": Object {
             "ID": Object {
               "code": 1,
               "message": "first",
             },
             "ID2": Object {
               "code": 2,
               "message": "second {0} {{1} {1} {0}",
             },
             "ID3": Object {
               "code": 3,
               "message": "third",
             },
           },
         }
      `);
   });

   describe('codeFor()', () => {
      it('returns the code for the specified ID', () => {
         const result = new ErrorCodes({
            ID: {
               code: 1,
               message: 'whee',
            },
            ID2: {
               code: 2,
               message: 'whee {0} {{1} {1} {0}',
            },
         });

         expect(result.codeFor('ID2')).toEqual(2);
      });

      it('returns 0 when asked for a nonexistent id', () => {
         const result = new ErrorCodes({
            ID: {
               code: 1,
               message: 'whee',
            },
            ID2: {
               code: 2,
               message: 'whee {0} {{1} {1} {0}',
            },
         });

         expect(result.codeFor('BOGUF')).toEqual(0);
      });
   });

   describe('messageTemplateFor()', () => {
      it('returns the code for the specified ID', () => {
         const result = new ErrorCodes({
            ID: {
               code: 1,
               message: 'whee',
            },
            ID2: {
               code: 2,
               message: 'whee {0} {{1} {1} {0}',
            },
         });

         expect(result.messageTemplateFor('ID2')).toEqual('whee {0} {{1} {1} {0}');
      });

      it('returns an empty string for a nonexistent id', () => {
         const result = new ErrorCodes({
            ID: {
               code: 1,
               message: 'whee',
            },
            ID2: {
               code: 2,
               message: 'whee {0} {{1} {1} {0}',
            },
         });

         expect(result.messageTemplateFor('BOGUS')).toEqual('');
      });
   });

   describe('messageFor()', () => {
      it('returns an empty string when an inalid code is provided', () => {
         const result = new ErrorCodes({
            ID2: {
               code: 2,
               message: 'whee {0} {{} {1} {0}',
            },
         });

         expect(result.messageFor('BOGUS', ['a', 'b'])).toEqual('');
      });

      it('returns an an unchanged message template if no parameters are provided', () => {
         const result = new ErrorCodes({
            ID2: {
               code: 2,
               message: 'whee {0} {{} {1} {0}',
            },
         });

         expect(result.messageFor('ID2', undefined)).toEqual('whee {0} { {1} {0}');
      });

      it('returns string with variables replaced by the provided params', () => {
         const result = new ErrorCodes({
            ID2: {
               code: 2,
               message: 'whee {0} {{} {1} {0}',
            },
         });

         expect(result.messageFor('ID2', ['a', 'b'])).toEqual('whee a { b a');
      });

      it('returns does not replace some variables if no parameters are provided', () => {
         const result = new ErrorCodes({
            ID2: {
               code: 2,
               message: 'whee {0} {{} {1} {0}',
            },
         });

         expect(result.messageFor('ID2', ['a'])).toEqual('whee a { {1} a');
      });

      it('returns does not replace some variables if no parameters are provided', () => {
         const result = new ErrorCodes({
            ID2: {
               code: 2,
               message: 'whee {0} {{} {1} {0}',
            },
         });

         expect(result.messageFor('ID2', ['a'])).toEqual('whee a { {1} a');
      });

      it('ignores extra parameters if provided', () => {
         const result = new ErrorCodes({
            ID2: {
               code: 2,
               message: 'whee {0} {{} {1} {0}',
            },
         });

         expect(result.messageFor('ID2', ['a', true, 'extra'])).toEqual('whee a { true a');
      });
   });
});
