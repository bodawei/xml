/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { Offset, EntityLocation } from 'basic';
import { SToken } from 'sToken';

import { XmlWarning } from '../XmlWarning';

import { MockErrorCollector, toReportError, toReportWarning } from './helper';

describe('error helper', () => {

   describe('toReportError()', () => {

      describe('matcher', () => {

      it('returns a message if the specified string does not exist', () => {
         try {
            expect(undefined).toReportError({
               id: 'BOGUS_ERR',
               params: undefined,
               position: undefined,
            });
         } catch (err) {
            expect(err.message).toEqual('Did not get a mock error collector as expected.');
         }
      });

      });

      describe('raw matcher', () => {

         it('returns a compare function', () => {
            expect(typeof toReportError(1).compare === 'function').toEqual(true);
         });

         it('reports a message if there is no id passed', () => {
            const mock = new MockErrorCollector();
            (mock as any).errors = [ {
               params: undefined,
               position: undefined,
            } ];
            expect(toReportError({ equals: () => true }).compare(mock,
               {
                  params: undefined,
                  position: undefined,
               } as any)).toEqual({
                  pass: false,
                  message: 'The error undefined is not a legal error ID.',
               });
         });

         it('returns a message if the specified string does not exist', () => {
            const mock = new MockErrorCollector();
            mock.errors = [ {
               id: 'BOGUS_ERR',
               params: undefined,
               position: undefined,
            } ];
            expect(toReportError({ equals: () => true }).compare(mock,
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
            const mock = new MockErrorCollector();
            mock.errors = [ {
               id: 'zzz',
               params: undefined,
               position: undefined,
            } ];

            expect(toReportError({ equals: () => true }).compare(mock,
               {
                  id: 'zzz',
                  params: undefined,
                  position: undefined,
               })).toEqual({
                  pass: false,
                  message: 'The error zzz is not a legal error ID.',
               });
         });

         it('returns a message if the parameter count does not match the error', () => {
            const mock = new MockErrorCollector();
            mock.errors = [ {
               id: 'XMLDECL_PARAM_INVALID_CASE', // only has 2 params
               params: [ '1', '2', '3' ],
               position: undefined,
            } ];

            expect(toReportError({ equals: () => true }).compare(mock,
               {
                  id: 'XMLDECL_PARAM_INVALID_CASE',
                  params: undefined,
                  position: undefined,
               })).toEqual({
                  pass: false,
                  message: 'XMLDECL_PARAM_INVALID_CASE expects 2 parameters, but 3 found.',
               });
         });

         it('returns a message indicating failure, on success', () => {
            const mock = new MockErrorCollector();
            mock.errors = [ {
               id: 'XMLDECL_NO_CLOSE',
               params: undefined,
               position: undefined,
            } ];
            expect(toReportError({ equals: () => true }).compare(mock,
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
            const mock = new MockErrorCollector();
            mock.errors = [ {
               id: 'XMLDECL_NO_CLOSE',
               params: undefined,
               position: undefined,
            } ];
            expect(toReportError({ equals: () => true }).compare(mock,
               {
                  id: 'XMLDECL_ENCODING_INVALID_ORDER',
                  params: undefined,
                  position: undefined,
               })).toEqual({
                  pass: false,
                  message: 'No error with the id XMLDECL_ENCODING_INVALID_ORDER reported.',
               });
         });

         it('reports a failure when the the params do not match', () => {
            const mock = new MockErrorCollector();
            mock.errors = [ {
               id: 'XMLDECL_NO_CLOSE',
               params: undefined,
               position: undefined,
            } ];

            expect(toReportError({ equals: (a: any, b: any) => (a === b) }).compare(mock,
               {
                  id: 'XMLDECL_NO_CLOSE',
                  params: [ '1' ],
                  position: undefined,
               })).toEqual({
                  pass: false,
                  message: 'Parameters for XMLDECL_NO_CLOSE do not match:\n  Actual:   undefined\n  Expected: 1',
               });
         });

         it('reports a failure when the positions do not match', () => {
            const mock = new MockErrorCollector();
            mock.errors = [ {
               id: 'XMLDECL_NO_CLOSE',
               params: undefined,
               position: new Offset(new EntityLocation(), 1, 2, 3),
            } ];
            expect(toReportError({ equals: (a: any, b: any) => (a === b) }).compare(mock,
               {
                  id: 'XMLDECL_NO_CLOSE',
                  params: undefined,
                  position: new Offset(new EntityLocation(), 5, 6, 7),
               })).toEqual({
                  pass: false,
                  message: 'Positions for XMLDECL_NO_CLOSE do not match:\n  Actual:   {"location":{"systemId":""},"index":1,"row":2,"column":3}\n  Expected: {"location":{"systemId":""},"index":5,"row":6,"column":7}',
               });
         });

         it('reports a failure when there is a lastPosition and it does not match', () => {
            const mock = new MockErrorCollector();
            mock.errors = [ {
               id: 'XMLDECL_NO_CLOSE',
               params: undefined,
               position: undefined,
               lastPosition: new Offset(new EntityLocation(), 99, 88, 77),
            } ];

            expect(toReportError({ equals: (a: any, b: any) => (a === b) }).compare(mock,
               {
                  id: 'XMLDECL_NO_CLOSE',
                  params: undefined,
                  position: undefined,
                  lastPosition: new Offset(new EntityLocation(), 99, 88, 11),
               })).toEqual({
                  pass: false,
                  message: 'Last positions for XMLDECL_NO_CLOSE do not match:\n  Actual:   {"location":{"systemId":""},"index":99,"row":88,"column":77}\n  Expected: {"location":{"systemId":""},"index":99,"row":88,"column":11}',
               });
         });

         it('reports a failure if both expected last position and position are undefined', () => {
            const mock = new MockErrorCollector();
            mock.errors = [ {
               id: 'XMLDECL_NO_CLOSE',
               params: undefined,
               position: undefined,
               lastPosition: new Offset(new EntityLocation(), 1, 2, 3),
            } ];

            expect(toReportError({ equals: (a: any, b: any) => (a === b) }).compare(mock,
               {
                  id: 'XMLDECL_NO_CLOSE',
                  params: undefined,
                  position: undefined,
                  lastPosition: undefined,
               })).toEqual({
                  pass: false,
                  message: 'Last positions for XMLDECL_NO_CLOSE do not match:\n  Actual:   {"location":{"systemId":""},"index":1,"row":2,"column":3}\n  Expected: undefined',
               });
         });

      });

   });

   describe('toReportWarning()', () => {

      describe('raw matcher', () => {

         it('returns a compare function', () => {
            expect(typeof toReportWarning(1).compare === 'function').toEqual(true);
         });

         it('returns a message if the specified string does not exist', () => {
            const mock = new MockErrorCollector();
            mock.errors = [ {
               id: 'BOGUS_ERR',
               params: undefined,
               position: undefined,
               lastPosition: new Offset(new EntityLocation(), 1, 2, 3),
            } ];

            expect(toReportWarning({ equals: () => true }).compare(mock,
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

            ec.report('x', []);

            expect(ec.errors[0].position).toEqual(sToken);
         });

         it('sets a lastPosition which is used if sToken is not passed', () => {
            const ec = new MockErrorCollector();
            const sToken = SToken.fromString('testValue');

            ec.setPos(sToken);
            ec.setPos(undefined);

            ec.report('x', []);

            expect(ec.errors[0].lastPosition).toEqual(sToken);
         });

      });

      describe('.check()', () => {

         it('calls report() with id and params if passed and condition true', () => {
            const ec = new MockErrorCollector();

            ec.check(true, 'z', []);

            expect(ec.report).toHaveBeenCalledWith('z', [], undefined);
         });

         it('calls report() with id if no params passed and condition true', () => {
            const ec = new MockErrorCollector();

            ec.check(true, 'w', []);

            expect(ec.report).toHaveBeenCalledWith('w', [], undefined);
         });

         it('does not call report() when condition is false', () => {
            const ec = new MockErrorCollector();

            ec.check(false, 'x', []);

            expect(ec.report).not.toHaveBeenCalled();
         });

      });

      describe('.reportError()', () => {

         it('calls report()', () => {
            const ec = new MockErrorCollector();

            ec.reportError('x', XmlWarning, []);

            expect(ec.report).toHaveBeenCalledWith('x', []);
         });

      });

   });

});
