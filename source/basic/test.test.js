/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

const toReportErrorMatcher = require('./test.js').toReportError;
const toReportWarningMatcher = require('./test.js').toReportWarning;

describe('toReportError()', () => {

   describe('raw matcher', () => {

      it('returns a compare function', () => {
         expect(typeof toReportErrorMatcher().compare === 'function').toEqual(true);
      });

      it('throws an error if called without a parameter', () => {
         expect(() => {
            toReportErrorMatcher().compare(undefined, {});
         }).toThrowError('Did not get a mock error collector as expected');
      });

      it('returns a message if the specified string does not exist', () => {
         expect(toReportErrorMatcher({ equals: () => true }).compare(
            {
               errors: [ {
                  id: 'BOGUS_ERR',
                  params: undefined,
                  position: undefined,
               } ],
            },
            {
               id: 'BOGUS_ERR',
               params: undefined,
               position: undefined,
            })).toEqual({
               pass: false,
               message: 'The error BOGUS_ERR is not a legal error ID.',
            });
      });

      it('returns a message if the actual string does not exist', () => {
         expect(toReportErrorMatcher({ equals: () => true }).compare(
            {
               errors: [ {
                  id: undefined,
                  params: undefined,
                  position: undefined,
               } ],
            },
            {
               id: undefined,
               params: undefined,
               position: undefined,
            })).toEqual({
               pass: false,
               message: 'The error undefined is not a legal error ID.',
            });
      });

      it('returns a message if the parameter count does not match the error', () => {
         expect(toReportErrorMatcher({ equals: () => true }).compare(
            {
               errors: [ {
                  id: 'XMLDECL_ATTR_INVALID_CASE', // only has 2 params
                  params: [ 1, 2, 3 ],
                  position: undefined,
               } ],
            },
            {
               id: 'XMLDECL_ATTR_INVALID_CASE',
               params: undefined,
               position: undefined,
            })).toEqual({
               pass: false,
               message: 'XMLDECL_ATTR_INVALID_CASE expects 2 parameters, but 3 found.',
            });
      });

      it('returns a message indicating failure, on success', () => {
         expect(toReportErrorMatcher({ equals: () => true }).compare(
            {
               errors: [ {
                  id: 'XMLDECL_NO_CLOSE',
                  params: undefined,
                  position: undefined,
               } ],
            },
            {
               id: 'XMLDECL_NO_CLOSE',
               params: undefined,
               position: undefined,
            })).toEqual({
               pass: true,
               message: 'Error matching XMLDECL_NO_CLOSE was found, but should not have been.',
            });
      });

      it('reports a failure when the specified ID is not found', () => {
         expect(toReportErrorMatcher({ equals: () => true }).compare(
            {
               errors: [ {
                  id: 'XMLDECL_NO_CLOSE',
                  params: undefined,
                  position: undefined,
               } ],
            }, {
               id: 'XMLDECL_ENCODING_INVALID_ORDER',
               params: undefined,
               position: undefined,
            })).toEqual({
               pass: false,
               message: 'No error with the id XMLDECL_ENCODING_INVALID_ORDER reported.',
            });
      });

      it('reports a failure when the the params do not match', () => {
         expect(toReportErrorMatcher({ equals: (a, b) => (a === b) }).compare(
            {
               errors: [ {
                  id: 'XMLDECL_NO_CLOSE',
                  params: undefined,
                  position: undefined,
               } ],
            }, {
               id: 'XMLDECL_NO_CLOSE',
               params: [ 1 ],
               position: undefined,
            })).toEqual({
               pass: false,
               message: 'Parameters for XMLDECL_NO_CLOSE do not match:\n  Actual: undefined\n  Expected: 1',
            });
      });

      it('reports a failure when the the positions do not match', () => {
         expect(toReportErrorMatcher({ equals: (a, b) => (a === b) }).compare(
            {
               errors: [ {
                  id: 'XMLDECL_NO_CLOSE',
                  params: undefined,
                  position: 5,
               } ],
            }, {
               id: 'XMLDECL_NO_CLOSE',
               params: undefined,
               position: 6,
            })).toEqual({
               pass: false,
               message: 'Positions for XMLDECL_NO_CLOSE do not match:\n  Actual: 5\n  Expected: 6',
            });
      });

      it('reports a failure when there is a lastPosition and it does not match', () => {
         expect(toReportErrorMatcher({ equals: (a, b) => (a === b) }).compare(
            {
               errors: [ {
                  id: 'XMLDECL_NO_CLOSE',
                  params: undefined,
                  position: 5,
                  lastPosition: 1,
               } ],
            }, {
               id: 'XMLDECL_NO_CLOSE',
               params: undefined,
               position: 5,
               lastPosition: 2,
            })).toEqual({
               pass: false,
               message: 'Last positions for XMLDECL_NO_CLOSE do not match:\n  Actual: 1\n  Expected: 2',
            });
      });

   });

   describe('toReportWarning()', () => {

      describe('raw matcher', () => {

         it('returns a compare function', () => {
            expect(typeof toReportWarningMatcher().compare === 'function').toEqual(true);
         });

         it('throws an error if called without a parameter', () => {
            expect(() => {
               toReportWarningMatcher().compare(undefined, {});
            }).toThrowError('Did not get a mock error collector as expected');
         });

         it('returns a message if the specified string does not exist', () => {
            expect(toReportWarningMatcher({ equals: () => true }).compare(
               {
                  errors: [ {
                     id: 'BOGUS_ERR',
                     params: undefined,
                     position: undefined,
                  } ],
               },
               {
                  id: 'BOGUS_ERR',
                  params: undefined,
                  position: undefined,
               })).toEqual({
                  pass: false,
                  message: 'The error BOGUS_ERR is not a legal error ID.',
               });
         });

      });

   });

});
