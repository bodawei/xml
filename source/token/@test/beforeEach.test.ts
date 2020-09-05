/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */
/* istanbul ignore */ // For some reason istanbul with Safari is picking up this file

import { EntityId, Range } from 'basic';
import { SToken } from 'sToken';
import { toContainPTokenProps, toEqualRangeless } from './beforeEach';

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

   describe('toEqualRangeless()', () => {

      describe('raw matcher', () => {

         it('returns a compare function', () => {
            expect(typeof toEqualRangeless({}, {}).compare === 'function').toEqual(true);
         });

         it('throws an exception if the callback spy is undefined', () => {
            try {
               toEqualRangeless({}, {}).compare(undefined as any, {});
            } catch (e) {
               expect(e.message).toEqual('Did not get a spy as expected.');
            }
         });

         it('throws an exception if the spy is called more than once', () => {
            const spy = jasmine.createSpy();
            spy({
               one: 'hi',
            });
            spy({
               one: 'hi',
            });

            try {
               toEqualRangeless({}, {}).compare(spy, {});
            } catch (e) {
               expect(e.message).toEqual('toEqualRangeless() wanted one call with one argument. ' +
                  'Got 2 calls with 1 arguments.');
            }
         });

         it('throws an exception if the spy is called with no arguments', () => {
            const spy = jasmine.createSpy();

            try {
               toEqualRangeless({}, {}).compare(spy, {});
            } catch (e) {
               expect(e.message).toEqual('toEqualRangeless() wanted one call with one argument. ' +
                  'Got 0 calls with 0 arguments.');
            }
         });

         it('returns a "not" message on success', () => {
            const spy = jasmine.createSpy();
            spy({
               one: new SToken('one', 'one', new Range(new EntityId(), 1, 0, 1, 3, 0, 3)),
            });

            const result = toEqualRangeless({ equals() { return true; } }, {}).compare(spy, {
               one: SToken.fromString('one'),
            });

            expect(result).toEqual({
               pass: true,
               message: 'Expected properties not to be found in callback, but they were.',
            });
         });

         it('allows the expected value to just be a string', () => {
            const spy = jasmine.createSpy();
            spy({
               one: new SToken('actual', 'actual', new Range(new EntityId(), 1, 0, 1, 3, 0, 3)),
            });

            const result = toEqualRangeless({ equals() { return true; } }, {}).compare(spy, {
               one: 'actual',
            });

            expect(result).toEqual({
               pass: true,
               message: 'Expected properties not to be found in callback, but they were.',
            });
         });

         it('handles objects with child objects as properties', () => {
            const spy = jasmine.createSpy();
            spy({
               one: {
                  child: SToken.fromString('one'),
                  childTwo: true,
               },
            });

            const result = toEqualRangeless({ equals() { return true; } }, {}).compare(spy, {
               one: {
                  child: SToken.fromString('one'),
                  childTwo: true,
               },
            });

            expect(result).toEqual({
               pass: true,
               message: 'Expected properties not to be found in callback, but they were.',
            });
         });

         it('considers undefined values to match', () => {
            const spy = jasmine.createSpy();
            spy(undefined);

            const result = toEqualRangeless({ equals() { return true; } }, {}).compare(spy, undefined);

            expect(result).toEqual({
               pass: true,
               message: 'Expected properties not to be found in callback, but they were.',
            });
         });

         it('returns a message indicating failure, when actual does not have an expected property', () => {
            const spy = jasmine.createSpy();
            spy({
               one: new SToken('actual', 'actual', new Range(new EntityId(), 1, 0, 1, 3, 0, 3)),
            });

            const result = toEqualRangeless({ equals() { return true; } }, {}).compare(spy, {
               one: SToken.fromString('actual'),
               two: SToken.fromString('two'),
            });

            expect(result).toEqual({
               pass: false,
               message: '"two" was not found in callback value.\n',
            });
         });

         it('returns a message indicating failure, when actual and expected do not match', () => {
            const spy = jasmine.createSpy();
            spy({
               one: new SToken('actual', 'actual', new Range(new EntityId(), 1, 0, 1, 3, 0, 3)),
            });

            const result = toEqualRangeless({ equals() { return false; } }, {}).compare(spy, {
               one: new SToken('expected', 'expected', new Range(new EntityId(), 5, 0, 5, 3, 0, 3)),
            });

            expect(result).toEqual({
               pass: false,
               message: '"one"\'s value did not match.\n   Actual:   {"str":"actual","originalStr":"actual","ranges":[]}' +
                  '\n   Expected: {"str":"expected","originalStr":"expected","ranges":[]}\n',
            });
         });

         it('replaces undefined values with a marker', () => {
            const spy = jasmine.createSpy();
            spy({
               one: new SToken('actual', 'actual', new Range(new EntityId(), 1, 0, 1, 3, 0, 3)),
            });

            const result = toEqualRangeless({ equals() { return false; } }, {}).compare(spy, {
               one: undefined,
            });

            expect(result).toEqual({
               pass: false,
               message: '"one"\'s value did not match.\n   Actual:   {"str":"actual","originalStr":"actual","ranges":[]}' +
                  '\n   Expected: "•undefined•"\n',
            });
         });

         it('processes arrays as properties', () => {
            const spy = jasmine.createSpy();
            spy({
               one: [ new SToken('actual', 'actual', new Range(new EntityId(), 1, 0, 1, 3, 0, 3)), 5, undefined],
            });

            const result = toEqualRangeless({ equals() { return false; } }, {}).compare(spy, {
               one: [ new SToken('expected', 'expected', new Range(new EntityId(), 5, 0, 9, 3, 0, 3)), 5, undefined],
            });

            expect(result).toEqual({
               pass: false,
               message: '"one"\'s value did not match.\n' +
                  '   Actual:   [{"str":"actual","originalStr":"actual","ranges":[]},5,"•undefined•"]\n' +
                  '   Expected: [{"str":"expected","originalStr":"expected","ranges":[]},5,"•undefined•"]\n',
            });
         });

         it('processes arrays as the top level argument', () => {
            const spy = jasmine.createSpy();
            spy([ new SToken('actual', 'actual', new Range(new EntityId(), 1, 0, 1, 3, 0, 3)), 5, undefined]);

            const result = toEqualRangeless({ equals(a: any, b: any) {
               return a === b;
            } }, {}).compare(spy,
               [ new SToken('expected', 'expected', new Range(new EntityId(), 5, 0, 9, 3, 0, 3)), 5, undefined]);

            expect(result).toEqual({
               pass: false,
               message: '"0"\'s value did not match.\n   Actual:   {"str":"actual","originalStr":"actual","ranges":[]}' +
                  '\n   Expected: {"str":"expected","originalStr":"expected","ranges":[]}\n',
            });
         });

      });

   });

});
