/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { Offset } from '../offset';
import { EntityId } from '../../token/entityId';

describe('Offset', () => {
   describe('construction', () => {
      it('accepts no row/column parameters', () => {
         const offset = new Offset(new EntityId());

         expect(offset.index).toEqual(0);
         expect(offset.row).toEqual(0);
         expect(offset.column).toEqual(0);
      });

      it('accepts all parameters', () => {
         const offset = new Offset(new EntityId('s', 'p'), 1, 2, 3);
         const entityId: EntityId = offset.entityId;

         expect(entityId.systemId).toEqual('s');
         expect(entityId.publicId).toEqual('p');
         expect(offset.index).toEqual(1);
         expect(offset.row).toEqual(2);
         expect(offset.column).toEqual(3);
      });
   });

   describe('clone()', () => {
      it('cloned object has same values', () => {
         const offset = new Offset(new EntityId('s', 'p'), 1, 2, 3);

         const clone = offset.clone();

         expect(offset.entityId).toEqual(clone.entityId);
         expect(offset.index).toEqual(clone.index);
         expect(offset.row).toEqual(clone.row);
         expect(offset.column).toEqual(clone.column);
      });
   });

   describe('equal()', () => {
      it('reports true when match', () => {
         const offset1 = new Offset(new EntityId('s', 'p'), 1, 2, 3);
         const offset2 = new Offset(new EntityId('s', 'p'), 1, 2, 3);

         expect(offset1.equals(offset2)).toEqual(true);
      });

      it('reports false when ranges do not match', () => {
         const offset1 = new Offset(new EntityId('s', 'p'), 1, 2, 3);
         const offset2 = new Offset(new EntityId('s', 'p'), 1, 999, 3);

         expect(offset1.equals(offset2)).toEqual(false);
      });

      it('reports false when location in ranges do not match', () => {
         const offset1 = new Offset(new EntityId('s', 'p'), 1, 2, 3);
         const offset2 = new Offset(new EntityId('s', 'p2'), 1, 2, 3);

         expect(offset1.equals(offset2)).toEqual(false);
      });
   });
});
