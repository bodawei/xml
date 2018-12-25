/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import Offset from '../Offset';
import Range from '../Range';
import EntityLocation from '../EntityLocation';

describe('Range', () => {

   describe('construction', () => {

      it('accepts all parameters', () => {
         const range = new Range(new EntityLocation('s', 'p'), 1, 2, 3, 4, 5, 6);
         const entityLocation: EntityLocation = (range.location as any); // typeHack

         expect(entityLocation.systemId).toEqual('s');
         expect(entityLocation.publicId).toEqual('p');
         expect(range.startIndex).toEqual(1);
         expect(range.startRow).toEqual(2);
         expect(range.startColumn).toEqual(3);
         expect(range.endIndex).toEqual(4);
         expect(range.endRow).toEqual(5);
         expect(range.endColumn).toEqual(6);
      });

      it('can be constructed with an offset', () => {
         const range = new Range(new Offset(new EntityLocation('s', 'p'), 6, 5, 4));
         const entityLocation: EntityLocation = (range.location as any); // typeHack

         expect(entityLocation.systemId).toEqual('s');
         expect(entityLocation.publicId).toEqual('p');
         expect(range.startIndex).toEqual(6);
         expect(range.startRow).toEqual(5);
         expect(range.startColumn).toEqual(4);
         expect(range.endIndex).toEqual(6);
         expect(range.endRow).toEqual(5);
         expect(range.endColumn).toEqual(4);
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

   describe('getStartOffset()', () => {

      it('returns an Offset that is the start of the Range', () => {
         const range = new Range(new EntityLocation('s', 'p'), 1, 2, 3, 4, 5, 6);

         expect(range.getStartOffset()).toEqual(new Offset(new EntityLocation('s', 'p'), 1, 2, 3));
      });

      it('returns an Offset that is a copy of that in the range', () => {
         const range = new Range(new EntityLocation('s', 'p'), 1, 2, 3, 4, 5, 6);

         const offset = range.getStartOffset();
         range.startIndex = 999;

         expect(offset).toEqual(new Offset(new EntityLocation('s', 'p'), 1, 2, 3));
      });

   });

   describe('getEndOffset()', () => {

      it('returns an Offset that is the start of the Range', () => {
         const range = new Range(new EntityLocation('s', 'p'), 1, 2, 3, 4, 5, 6);

         expect(range.getEndOffset()).toEqual(new Offset(new EntityLocation('s', 'p'), 4, 5, 6));
      });

      it('returns an Offset that is a copy of that in the range', () => {
         const range = new Range(new EntityLocation('s', 'p'), 1, 2, 3, 4, 5, 6);

         const offset = range.getEndOffset();
         range.endIndex = 999;

         expect(offset).toEqual(new Offset(new EntityLocation('s', 'p'), 4, 5, 6));
      });

   });

   describe('equals()', () => {

      it('reports true when ranges match', () => {
         const range1 = new Range(new EntityLocation('s', 'p'), 1, 2, 3, 4, 5, 6);
         const range2 = new Range(new EntityLocation('s', 'p'), 1, 2, 3, 4, 5, 6);

         expect(range1.equals(range2)).toEqual(true);
      });

      it('reports false when ranges do not match', () => {
         const range1 = new Range(new EntityLocation('s', 'p'), 1, 2, 3, 4, 5, 6);
         const range2 = new Range(new EntityLocation('s', 'p'), 1, 999, 3, 4, 5, 6);

         expect(range1.equals(range2)).toEqual(false);
      });

      it('reports false when location in ranges do not match', () => {
         const range1 = new Range(new EntityLocation('s', 'p'), 1, 2, 3, 4, 5, 6);
         const range2 = new Range(new EntityLocation('s', 'p2'), 1, 2, 3, 4, 5, 6);

         expect(range1.equals(range2)).toEqual(false);
      });

      it('reports false when only one location is undefined', () => {
         const range1 = new Range(new EntityLocation(), 1, 2, 3, 4, 5, 6);
         const range2 = new Range(new EntityLocation('s', 'p'), 1, 2, 3, 4, 5, 6);

         expect(range1.equals(range2)).toEqual(false);
      });

      it('reports true when both locations are undefined', () => {
         const range1 = new Range(new EntityLocation(), 1, 2, 3, 4, 5, 6);
         const range2 = new Range(new EntityLocation(), 1, 2, 3, 4, 5, 6);

         expect(range1.equals(range2)).toEqual(true);
      });

   });

});
