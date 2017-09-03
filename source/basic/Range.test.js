/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import Range from './Range.js';
import EntityLocation from './EntityLocation.js';

describe('Range', () => {

   describe('construction', () => {

      it('it will accept no parameters', () => {
         const range = new Range();

         expect(range.location).toBeUndefined();
         expect(range.startIndex).toEqual(0);
         expect(range.startRow).toEqual(0);
         expect(range.startColumn).toEqual(0);
         expect(range.endIndex).toEqual(0);
         expect(range.endRow).toEqual(0);
         expect(range.endColumn).toEqual(0);
      });

      it('it will accept all parameters', () => {
         const range = new Range(new EntityLocation('s', 'p'), 1, 2, 3, 4, 5, 6);

         expect(range.location.systemId).toEqual('s');
         expect(range.location.publicId).toEqual('p');
         expect(range.startIndex).toEqual(1);
         expect(range.startRow).toEqual(2);
         expect(range.startColumn).toEqual(3);
         expect(range.endIndex).toEqual(4);
         expect(range.endRow).toEqual(5);
         expect(range.endColumn).toEqual(6);
      });

   });

   describe('clone()', () => {

      it('cloned object has same values', () => {
         const range = new Range(new EntityLocation('s', 'p'), 1, 2, 3, 4, 5, 6);

         const clone = range.clone();

         expect(range.location).toEqual(clone.location);
         expect(range.startIndex).toEqual(clone.startIndex);
         expect(range.startRow).toEqual(clone.startRow);
         expect(range.startColumn).toEqual(clone.startColumn);
         expect(range.endIndex).toEqual(clone.endIndex);
         expect(range.endRow).toEqual(clone.endRow);
         expect(range.endColumn).toEqual(clone.endColumn);
      });

   });

   describe('toString()', () => {

      it('represents the range as a string', () => {
         const range = new Range(new EntityLocation('s', 'p'), 1, 2, 3, 4, 5, 6);

         expect(range.toString()).toEqual('{"location":{"systemId":"s","publicId":"p"},"startIndex":1,"startRow":2,' +
            '"startColumn":3,"endIndex":4,"endRow":5,"endColumn":6}');
      });

   });

   describe('equal()', () => {

      it('reports true when ranges match', () => {
         const range1 = new Range(new EntityLocation('s', 'p'), 1, 2, 3, 4, 5, 6);
         const range2 = new Range(new EntityLocation('s', 'p'), 1, 2, 3, 4, 5, 6);

         expect(range1.equal(range2)).toEqual(true);
      });

      it('reports false when ranges do not match', () => {
         const range1 = new Range(new EntityLocation('s', 'p'), 1, 2, 3, 4, 5, 6);
         const range2 = new Range(new EntityLocation('s', 'p'), 1, 999, 3, 4, 5, 6);

         expect(range1.equal(range2)).toEqual(false);
      });

      it('reports false when location in ranges do not match', () => {
         const range1 = new Range(new EntityLocation('s', 'p'), 1, 2, 3, 4, 5, 6);
         const range2 = new Range(new EntityLocation('s', 'p2'), 1, 2, 3, 4, 5, 6);

         expect(range1.equal(range2)).toEqual(false);
      });

   });

});
