/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { SToken } from '../../sToken';

import { MockErrorCollector, toReportError, toReportWarning } from './helper';

describe('toReportError()', () => {

   describe('raw matcher', () => {

      it('returns a compare function', () => {
         expect(typeof toReportError().compare === 'function').toEqual(true);
      });

      it('throws an error if called without a parameter', () => {
         expect(() => {
            toReportError().compare(undefined, {});
         }).toThrowError('Did not get a mock error collector as expected');
      });

      it('returns a message if the specified string does not exist', () => {
         expect(toReportError({ equals: () => true }).compare(
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
         expect(toReportError({ equals: () => true }).compare(
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
         expect(toReportError({ equals: () => true }).compare(
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
         expect(toReportError({ equals: () => true }).compare(
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
         expect(toReportError({ equals: () => true }).compare(
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
         expect(toReportError({ equals: (a, b) => (a === b) }).compare(
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
               message: 'Parameters for XMLDECL_NO_CLOSE do not match:\n  Actual:   undefined\n  Expected: 1',
            });
      });

      it('reports a failure when the the positions do not match', () => {
         expect(toReportError({ equals: (a, b) => (a === b) }).compare(
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
               message: 'Positions for XMLDECL_NO_CLOSE do not match:\n  Actual:   5\n  Expected: 6',
            });
      });

      it('reports a failure when there is a lastPosition and it does not match', () => {
         expect(toReportError({ equals: (a, b) => (a === b) }).compare(
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
               message: 'Last positions for XMLDECL_NO_CLOSE do not match:\n  Actual:   1\n  Expected: 2',
            });
      });

      it('reports a failure if both expected last position and position are undefined', () => {
         expect(toReportError({ equals: (a, b) => (a === b) }).compare(
            {
               errors: [ {
                  id: 'XMLDECL_NO_CLOSE',
                  params: undefined,
                  position: undefined,
                  lastPosition: 1,
               } ],
            }, {
               id: 'XMLDECL_NO_CLOSE',
               params: undefined,
               position: undefined,
               lastPosition: undefined,
            })).toEqual({
               pass: false,
               message: 'Last positions for XMLDECL_NO_CLOSE do not match:\n  Actual:   1\n  Expected: undefined',
            });
      });

   });

   describe('toReportWarning()', () => {

      describe('raw matcher', () => {

         it('returns a compare function', () => {
            expect(typeof toReportWarning().compare === 'function').toEqual(true);
         });

         it('throws an error if called without a parameter', () => {
            expect(() => {
               toReportWarning().compare(undefined, {});
            }).toThrowError('Did not get a mock error collector as expected');
         });

         it('returns a message if the specified string does not exist', () => {
            expect(toReportWarning({ equals: () => true }).compare(
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

   describe('MockErrorCollector()', () => {

      it('constructs without an error', () => {
         expect(() => {
            new MockErrorCollector();
         }).not.toThrowError();
      });

      describe('.setPos()', () => {

         it('sets a position which is used in the next report', () => {
            const ec = new MockErrorCollector();
            const sToken = SToken.fromString('testValue');

            ec.setPos(sToken);

            ec.report();

            expect(ec.errors[0].position).toEqual(sToken);
         });

         it('sets a lastPosition which is used if sToken is not passed', () => {
            const ec = new MockErrorCollector();
            const sToken = SToken.fromString('testValue');

            ec.setPos(sToken);
            ec.setPos();

            ec.report();

            expect(ec.errors[0].lastPosition).toEqual(sToken);
         });

      });

      describe('.check()', () => {

         it('calls report() with id and params if passed and condition true', () => {
            const ec = new MockErrorCollector();

            ec.check(true, 2, 3);

            expect(ec.report).toHaveBeenCalledWith(2, 3);
         });

         it('calls report() with id if no params passed and condition true', () => {
            const ec = new MockErrorCollector();

            ec.check(true, 2);

            expect(ec.report).toHaveBeenCalledWith(2);
         });

         it('does not call report() when condition is false', () => {
            const ec = new MockErrorCollector();

            ec.check(false, 2, 3);

            expect(ec.report).not.toHaveBeenCalled();
         });

      });

      describe('.reportError()', () => {

         it('calls report()', () => {
            const ec = new MockErrorCollector();

            ec.reportError(1, 2, 3);

            expect(ec.report).toHaveBeenCalledWith(1, 3);
         });

      });

   });

});
