/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

const toReportErrorMatcher = require('./test.js').toReportError;

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

      it('returns a message indicating failure, on success', () => {
         expect(toReportErrorMatcher({ equals: () => true }).compare(
            {
               errors: [ {
                  id: 'TEST_ID',
                  params: undefined,
                  position: undefined,
               } ],
            },
            {
               id: 'TEST_ID',
               params: undefined,
               position: undefined,
            })).toEqual({
               pass: true,
               message: 'Error matching TEST_ID was found, but should not have been.',
            });
      });

      it('reports a failure when the specified ID is not found', () => {
         expect(toReportErrorMatcher({ equals: () => true }).compare(
            {
               errors: [ {
                  id: 'TEST_ID',
                  params: undefined,
                  position: undefined,
               } ],
            }, {
               id: 'BOGUS_ID',
               params: undefined,
               position: undefined,
            })).toEqual({
               pass: false,
               message: 'No error with the id BOGUS_ID reported.',
            });
      });

      it('reports a failure when the the params do not match', () => {
         expect(toReportErrorMatcher({ equals: (a, b) => (a === b) }).compare(
            {
               errors: [ {
                  id: 'TEST_ID',
                  params: undefined,
                  position: undefined,
               } ],
            }, {
               id: 'TEST_ID',
               params: [ 1 ],
               position: undefined,
            })).toEqual({
               pass: false,
               message: 'Parameters for TEST_ID do not match:\n  Actual: undefined\n  Expected: 1',
            });
      });

      it('reports a failure when the the positions do not match', () => {
         expect(toReportErrorMatcher({ equals: (a, b) => (a === b) }).compare(
            {
               errors: [ {
                  id: 'TEST_ID',
                  params: 1,
                  position: 5,
               } ],
            }, {
               id: 'TEST_ID',
               params: 1,
               position: 6,
            })).toEqual({
               pass: false,
               message: 'Positions for TEST_ID do not match:\n  Actual: 5\n  Expected: 6',
            });
      });

      it('reports a failure when there is a lastPosition and it does not match', () => {
         expect(toReportErrorMatcher({ equals: (a, b) => (a === b) }).compare(
            {
               errors: [ {
                  id: 'TEST_ID',
                  params: 1,
                  position: 5,
                  lastPosition: 1,
               } ],
            }, {
               id: 'TEST_ID',
               params: 1,
               position: 5,
               lastPosition: 2,
            })).toEqual({
               pass: false,
               message: 'Last positions for TEST_ID do not match:\n  Actual: 1\n  Expected: 2',
            });
      });

   });

});
