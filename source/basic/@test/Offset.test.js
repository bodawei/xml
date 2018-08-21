/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import Offset from '../Offset';
import EntityLocation from '../EntityLocation';

describe('Offset', () => {

   describe('construction', () => {

      it('accepts no parameters', () => {
         const offset = new Offset();

         expect(offset.location).toBeUndefined();
         expect(offset.index).toEqual(0);
         expect(offset.row).toEqual(0);
         expect(offset.column).toEqual(0);
      });

      it('accepts all parameters', () => {
         const offset = new Offset(new EntityLocation('s', 'p'), 1, 2, 3);

         expect(offset.location.systemId).toEqual('s');
         expect(offset.location.publicId).toEqual('p');
         expect(offset.index).toEqual(1);
         expect(offset.row).toEqual(2);
         expect(offset.column).toEqual(3);
      });

   });

   describe('clone()', () => {

      it('cloned object has same values', () => {
         const offset = new Offset(new EntityLocation('s', 'p'), 1, 2, 3);

         const clone = offset.clone();

         expect(offset.location).toEqual(clone.location);
         expect(offset.startIndex).toEqual(clone.startIndex);
         expect(offset.startRow).toEqual(clone.startRow);
         expect(offset.startColumn).toEqual(clone.startColumn);
         expect(offset.endIndex).toEqual(clone.endIndex);
         expect(offset.endRow).toEqual(clone.endRow);
         expect(offset.endColumn).toEqual(clone.endColumn);
      });

   });

   describe('equal()', () => {

      it('reports true when match', () => {
         const offset1 = new Offset(new EntityLocation('s', 'p'), 1, 2, 3);
         const offset2 = new Offset(new EntityLocation('s', 'p'), 1, 2, 3);

         expect(offset1.equals(offset2)).toEqual(true);
      });

      it('reports false when a nothing is passed', () => {
         const offset1 = new Offset(new EntityLocation('s', 'p'), 1, 2, 3);

         expect(offset1.equals(undefined)).toEqual(false);
      });

      it('reports false when ranges do not match', () => {
         const offset1 = new Offset(new EntityLocation('s', 'p'), 1, 2, 3);
         const offset2 = new Offset(new EntityLocation('s', 'p'), 1, 999, 3);

         expect(offset1.equals(offset2)).toEqual(false);
      });

      it('reports false when location in ranges do not match', () => {
         const offset1 = new Offset(new EntityLocation('s', 'p'), 1, 2, 3);
         const offset2 = new Offset(new EntityLocation('s', 'p2'), 1, 2, 3);

         expect(offset1.equals(offset2)).toEqual(false);
      });

      it('reports false when only one location is undefined', () => {
         const offset1 = new Offset(undefined, 1, 2, 3);
         const offset2 = new Offset(new EntityLocation('s', 'p'), 1, 2, 3);

         expect(offset1.equals(offset2)).toEqual(false);
      });

      it('reports true when both locations are undefined', () => {
         const offset1 = new Offset(undefined, 1, 2, 3);
         const offset2 = new Offset(undefined, 1, 2, 3);

         expect(offset1.equals(offset2)).toEqual(true);
      });

   });

});
