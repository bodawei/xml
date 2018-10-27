/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */
/* istanbul ignore */ // For some reason istanbul with Safari is picking up this file

import { toContainPTokenProps } from './beforeEach';

describe('token custom matchers', () => {

   describe('toContainPTokenProps()', () => {

      describe('raw matcher', () => {

         it('returns a compare function', () => {
            expect(typeof toContainPTokenProps().compare === 'function').toEqual(true);
         });

         it('throws an exception if the callback spy is undefined', () => {
            try {
               toContainPTokenProps().compare(undefined, {});
            } catch (e) {
               expect(e.message).toEqual('Did not get a spy as expected.');
            }
         });

         it('throws an exception if the callback spy was not called just once with one agument', () => {
            const spy = jasmine.createSpy();
            spy(1);
            spy(2);

            try {
               toContainPTokenProps().compare(spy, {});
            } catch (e) {
               expect(e.message).toEqual('toContainPTokenProps() wanted one call with one argument. Got 2 calls with 1 arguments.');
            }
         });

         it('throws an exception if the callback spy was not called with one value', () => {
            const spy = jasmine.createSpy();
            spy(1, 2);

            try {
               toContainPTokenProps().compare(spy, {});
            } catch (e) {
               expect(e.message).toEqual('toContainPTokenProps() wanted one call with one argument. Got 1 calls with 2 arguments.');
            }
         });

         it('throws an exception if the callback spy is called with no values', () => {
            const spy = jasmine.createSpy();

            try {
               toContainPTokenProps().compare(spy, {});
            } catch (e) {
               expect(e.message).toEqual('toContainPTokenProps() wanted one call with one argument. Got 0 calls with 0 arguments.');
            }
         });

         it('returns a message indicating failure, when the values all match', () => {
            const spy = jasmine.createSpy();
            spy({
               one: 'one',
            });

            const result = toContainPTokenProps({ equals() { return true; } }).compare(spy, {
               one: 'one',
            });

            expect(result).toEqual({
               pass: true,
               message: 'Expected properties not to be found in callback, but they were.',
            });
         });

         it('returns a message indicating failure, when the actual is a literal value', () => {

            const result = toContainPTokenProps({ equals() { return true; } }).compare({
               one: 'one',
            }, {
               one: 'one',
            });

            expect(result).toEqual({
               pass: true,
               message: 'Expected properties not to be found in callback, but they were.',
            });
         });

         it('returns a message indicating failure, when a property is not found in the actual results', () => {
            const spy = jasmine.createSpy();
            spy({
               one: 'one',
            });

            const result = toContainPTokenProps({ equals() { return true; } }).compare(spy, {
               two: 'two',
            });

            expect(result).toEqual({
               pass: false,
               message: 'Did not find the property "two" in callback value.\n',
            });
         });

         it('returns a message indicating failure, when property value does not match', () => {
            const spy = jasmine.createSpy();
            spy({
               one: 'one',
            });

            const result = toContainPTokenProps({ equals() { return false; } }).compare(spy, {
               one: 'five',
            });

            expect(result).toEqual({
               pass: false,
               message: 'one\'s value did not match.\n   Actual:   "one"\n   Expected: "five"\n',
            });
         });

         it('returns a message indicating failure, when multiple things do not work', () => {
            const spy = jasmine.createSpy();
            spy({
               one: 'one',
            });

            const result = toContainPTokenProps({ equals() { return false; } }).compare(spy, {
               one: 'five',
               two: 'two',
            });

            expect(result).toEqual({
               pass: false,
               message: 'one\'s value did not match.\n   Actual:   "one"\n   Expected: "five"\n' +
                  'Did not find the property "two" in callback value.\n',
            });
         });

      });

   });

});
