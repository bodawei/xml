/* Copyright ® 2021-2026 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ProblemCodes } from '../problemCodes';

describe('ProblemCodes()', () => {
   it('populates the instance variables with the provided mapping data', () => {
      const result = new ProblemCodes({
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
         ProblemCodes {
           "code": {
             "ID": 1,
             "ID2": 2,
           },
           "id": {
             "ID": "ID",
             "ID2": "ID2",
           },
           "mapping": {
             "ID": {
               "code": 1,
               "message": "whee",
             },
             "ID2": {
               "code": 2,
               "message": "whee {0} {{1} {1} {0}",
             },
           },
         }
      `);
   });

   describe('codeFor()', () => {
      it('returns the code for the specified ID', () => {
         const result = new ProblemCodes({
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
         const result = new ProblemCodes({
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
         const result = new ProblemCodes({
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
         const result = new ProblemCodes({
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
         const result = new ProblemCodes({
            ID2: {
               code: 2,
               message: 'whee {0} {{} {1} {0}',
            },
         });

         expect(result.messageFor('BOGUS', ['a', 'b'])).toEqual('');
      });

      it('returns an an unchanged message template if no parameters are provided', () => {
         const result = new ProblemCodes({
            ID2: {
               code: 2,
               message: 'whee {0} {{} {1} {0}',
            },
         });

         expect(result.messageFor('ID2', undefined)).toEqual('whee {0} { {1} {0}');
      });

      it('returns string with variables replaced by the provided params', () => {
         const result = new ProblemCodes({
            ID2: {
               code: 2,
               message: 'whee {0} {{} {1} {0}',
            },
         });

         expect(result.messageFor('ID2', ['a', 'b'])).toEqual('whee a { b a');
      });

      it('returns does not replace some variables if no parameters are provided', () => {
         const result = new ProblemCodes({
            ID2: {
               code: 2,
               message: 'whee {0} {{} {1} {0}',
            },
         });

         expect(result.messageFor('ID2', ['a'])).toEqual('whee a { {1} a');
      });

      it('returns does not replace some variables if no parameters are provided', () => {
         const result = new ProblemCodes({
            ID2: {
               code: 2,
               message: 'whee {0} {{} {1} {0}',
            },
         });

         expect(result.messageFor('ID2', ['a'])).toEqual('whee a { {1} a');
      });

      it('ignores extra parameters if provided', () => {
         const result = new ProblemCodes({
            ID2: {
               code: 2,
               message: 'whee {0} {{} {1} {0}',
            },
         });

         expect(result.messageFor('ID2', ['a', true, 'extra'])).toEqual('whee a { true a');
      });
   });
});
