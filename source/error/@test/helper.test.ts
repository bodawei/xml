/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { SToken } from 'sToken';

import { XmlWarning } from '../XmlWarning';

import { MockErrorCollector } from './helper';

describe('error helper', () => {

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
