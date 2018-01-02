/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, Range } from '../../basic';

import SToken from '../SToken.js';

describe('SToken', () => {

   describe('construction', () => {

      it('creates an SToken with the provided parameters', () => {
         const sToken = new SToken('one', 'two', new Range());

         expect(sToken).toEqualProps({
            text: 'one',
            originalText: 'two',
            ranges: [ new Range() ],
         });
      });

      it('creates an SToken with an empty range if none provided', () => {
         const sToken = new SToken('one', 'two');

         expect(sToken).toEqualProps({
            text: 'one',
            originalText: 'two',
            ranges: [],
         });
      });

      it('creates an SToken with a the provided range array', () => {
         const sToken = new SToken('one', 'two', [ new Range(), new Range() ]);

         expect(sToken).toEqualProps({
            text: 'one',
            originalText: 'two',
            ranges: [ new Range(), new Range() ],
         });
      });

   });

   describe('SToken.fromString()', () => {

      it('creates an SToken using just the single provided string', () => {
         const sToken = SToken.fromString('one');

         expect(sToken).toEqualProps({
            text: 'one',
            originalText: 'one',
            ranges: [],
         });
      });

   });

   describe('.firstRange', () => {

      it('is undefined if there is no first range', () => {
         const sToken = new SToken(' \n', ' \r\n');

         expect(sToken.firstRange).toBeUndefined();
      });

      it('returns the first range', () => {
         const sToken = new SToken(' \n', ' \r\n', [
            new Range(undefined, 1, 2, 3, 4, 5, 6),
            new Range(undefined, 10, 22, 33, 44, 55, 66),
         ]);

         expect(sToken.firstRange).toEqual(new Range(undefined, 1, 2, 3, 4, 5, 6));
      });

   });

   describe('.lastRange', () => {

      it('is undefined if there is no last range', () => {
         const sToken = new SToken(' \n', ' \r\n');

         expect(sToken.lastRange).toBeUndefined();
      });

      it('returns the first range', () => {
         const sToken = new SToken(' \n', ' \r\n', [
            new Range(undefined, 1, 2, 3, 4, 5, 6),
            new Range(undefined, 10, 22, 33, 44, 55, 66),
         ]);

         expect(sToken.lastRange).toEqual(new Range(undefined, 10, 22, 33, 44, 55, 66));
      });

   });

   describe('.merge()', () => {

      it('throws an error if it is not passed an SToken', () => {
         const sToken = SToken.fromString('one');

         expect(() => sToken.merge({})).toThrowError('Can only merge with another SToken.');
      });

      it('merges a second Stoken with the first', () => {
         const sToken1 = new SToken(' \n', ' \r\n');
         const sToken2 = new SToken('two', 'two');

         sToken1.merge(sToken2);

         expect(sToken1).toEqualProps({
            text: ' \ntwo',
            originalText: ' \r\ntwo',
            ranges: [],
         });
      });

      it('returns the target SToken', () => {
         const sToken1 = new SToken(' \n', ' \r\n');
         const sToken2 = new SToken('two', 'two');

         const result = sToken1.merge(sToken2);

         expect(result).toBe(sToken1);
      });

      it('combines range if first has no range', () => {
         const sToken1 = new SToken(' \n', ' \r\n');
         const sToken2 = new SToken('two', 'two', new Range(undefined, 1, 2, 3));

         sToken1.merge(sToken2);

         expect(sToken1).toEqualProps({
            text: ' \ntwo',
            originalText: ' \r\ntwo',
            ranges: [ new Range(undefined, 1, 2, 3) ],
         });
      });

      it('combines range if second has no range', () => {
         const sToken1 = new SToken(' \n', ' \r\n', new Range(undefined, 1, 2, 3));
         const sToken2 = new SToken('two', 'two');

         sToken1.merge(sToken2);

         expect(sToken1).toEqualProps({
            text: ' \ntwo',
            originalText: ' \r\ntwo',
            ranges: [ new Range(undefined, 1, 2, 3) ],
         });
      });

      it('simply concatnates the ranges if the two have no overlap', () => {
         const sToken1 = new SToken(' \n', ' \r\n', new Range(new EntityLocation('here'), 1, 2, 3));
         const sToken2 = new SToken('two', 'two', new Range(new EntityLocation('there'), 1, 2, 3));

         sToken1.merge(sToken2);

         expect(sToken1.ranges).toEqual([
            new Range(new EntityLocation('here'), 1, 2, 3),
            new Range(new EntityLocation('there'), 1, 2, 3),
         ]);
      });

      it('fuses ranges if they seem to touch', () => {
         const sToken1 = new SToken(' \n', ' \r\n', [
            new Range(new EntityLocation('here'), 1, 2, 3),
            new Range(new EntityLocation('foo'), 1, 0, 1, 2, 0, 2),
         ]);
         const sToken2 = new SToken('two', 'two', [
            new Range(new EntityLocation('foo'), 2, 0, 2, 5, 2, 1),
            new Range(new EntityLocation('there'), 1, 2, 3),
         ]);

         sToken1.merge(sToken2);

         expect(sToken1.ranges).toEqual([
            new Range(new EntityLocation('here'), 1, 2, 3),
            new Range(new EntityLocation('foo'), 1, 0, 1, 5, 2, 1),
            new Range(new EntityLocation('there'), 1, 2, 3),
         ]);
      });

   });

});
