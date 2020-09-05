/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityId, Range } from 'basic';

import SToken from '../SToken';

describe('SToken', () => {

   describe('construction', () => {

      it('creates an SToken with the provided parameters', () => {
         const sToken = new SToken('one', 'two', new Range(new EntityId()));

         expect(sToken).toEqualProps({
            str: 'one',
            originalStr: 'two',
            ranges: [ new Range(new EntityId()) ],
         });
      });

      it('creates an SToken with an empty range if none provided', () => {
         const sToken = new SToken('one', 'two', []);

         expect(sToken).toEqualProps({
            str: 'one',
            originalStr: 'two',
            ranges: [ ],
         });
      });

      it('creates an SToken with a the provided range array', () => {
         const sToken = new SToken('one', 'two', [ new Range(new EntityId()), new Range(new EntityId()) ]);

         expect(sToken).toEqualProps({
            str: 'one',
            originalStr: 'two',
            ranges: [ new Range(new EntityId()), new Range(new EntityId()) ],
         });
      });

   });

   describe('SToken.fromString()', () => {

      it('creates an SToken using just the single provided string', () => {
         const sToken = SToken.fromString('one');

         expect(sToken).toEqualProps({
            str: 'one',
            originalStr: 'one',
            ranges: [ new Range(new EntityId()) ],
         });
      });

   });

   describe('.clone()', () => {

      it('makes a copy of the current token', () => {
         const sToken1 = new SToken(' \n', ' \r\n', new Range(new EntityId(), 1, 2, 3));

         const clone = sToken1.clone();

         expect(clone).not.toBe(sToken1);

         (sToken1.ranges[0] as any).startIndex = 1000;

         expect(clone).toEqual(new SToken(' \n', ' \r\n', new Range(new EntityId(), 1, 2, 3)));
      });

   });

   describe('.firstRange', () => {

      it('is undefined if there is no first range', () => {
         const sToken = new SToken(' \n', ' \r\n', []);

         expect(sToken.firstRange).toBeUndefined();
      });

      it('returns the first range', () => {
         const sToken = new SToken(' \n', ' \r\n', [
            new Range(new EntityId(), 1, 2, 3, 4, 5, 6),
            new Range(new EntityId(), 10, 22, 33, 44, 55, 66),
         ]);

         expect(sToken.firstRange).toEqual(new Range(new EntityId(), 1, 2, 3, 4, 5, 6));
      });

   });

   describe('.lastRange', () => {

      it('is undefined if there is no last range', () => {
         const sToken = new SToken(' \n', ' \r\n', []);

         expect(sToken.lastRange).toBeUndefined();
      });

      it('returns the first range', () => {
         const sToken = new SToken(' \n', ' \r\n', [
            new Range(new EntityId(), 1, 2, 3, 4, 5, 6),
            new Range(new EntityId(), 10, 22, 33, 44, 55, 66),
         ]);

         expect(sToken.lastRange).toEqual(new Range(new EntityId(), 10, 22, 33, 44, 55, 66));
      });

   });

   describe('.merge()', () => {

      it('merges a second Stoken with the first', () => {
         const sToken1 = new SToken(' \n', ' \r\n', []);
         const sToken2 = new SToken('two', 'two', []);

         sToken1.merge(sToken2);

         expect(sToken1).toEqualProps({
            str: ' \ntwo',
            originalStr: ' \r\ntwo',
            ranges: [],
         });
      });

      it('returns the target SToken', () => {
         const sToken1 = new SToken(' \n', ' \r\n', []);
         const sToken2 = new SToken('two', 'two', []);

         const result = sToken1.merge(sToken2);

         expect(result).toBe(sToken1);
      });

      it('combines range if first has no range', () => {
         const sToken1 = new SToken(' \n', ' \r\n', []);
         const sToken2 = new SToken('two', 'two', new Range(new EntityId(), 1, 2, 3));

         sToken1.merge(sToken2);

         expect(sToken1).toEqualProps({
            str: ' \ntwo',
            originalStr: ' \r\ntwo',
            ranges: [ new Range(new EntityId(), 1, 2, 3) ],
         });
      });

      it('combines range if second has no range', () => {
         const sToken1 = new SToken(' \n', ' \r\n', new Range(new EntityId(), 1, 2, 3));
         const sToken2 = new SToken('two', 'two', []);

         sToken1.merge(sToken2);

         expect(sToken1).toEqualProps({
            str: ' \ntwo',
            originalStr: ' \r\ntwo',
            ranges: [ new Range(new EntityId(), 1, 2, 3) ],
         });
      });

      it('simply concatnates the ranges if the two have no overlap', () => {
         const sToken1 = new SToken(' \n', ' \r\n', new Range(new EntityId('here'), 1, 2, 3));
         const sToken2 = new SToken('two', 'two', new Range(new EntityId('there'), 1, 2, 3));

         sToken1.merge(sToken2);

         expect(sToken1.ranges).toEqual([
            new Range(new EntityId('here'), 1, 2, 3),
            new Range(new EntityId('there'), 1, 2, 3),
         ]);
      });

      it('fuses ranges if they seem to touch', () => {
         const sToken1 = new SToken(' \n', ' \r\n', [
            new Range(new EntityId('here'), 1, 2, 3),
            new Range(new EntityId('foo'), 1, 0, 1, 2, 0, 2),
         ]);
         const sToken2 = new SToken('two', 'two', [
            new Range(new EntityId('foo'), 2, 0, 2, 5, 2, 1),
            new Range(new EntityId('there'), 1, 2, 3),
         ]);

         sToken1.merge(sToken2);

         expect(sToken1.ranges).toEqual([
            new Range(new EntityId('here'), 1, 2, 3),
            new Range(new EntityId('foo'), 1, 0, 1, 5, 2, 1),
            new Range(new EntityId('there'), 1, 2, 3),
         ]);
      });

   });

});
