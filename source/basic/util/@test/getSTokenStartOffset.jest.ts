/* Copyright ® 2018-2026 by 柏大衛. All rights reserved. */

import { describe, it, expect } from 'vitest';

import { SToken } from '../../sToken/sToken';
import { EntityId } from '../../token/entityId';
import { getSTokenStartOffset } from '../getSTokenStartOffset';
import { Range } from '../range';

describe('getSTokenStartOffset() (unit)', () => {
   it('returns undefined if there is no range', () => {
      const result = getSTokenStartOffset(new SToken('foo', 'bar', []));

      expect(result).toBeUndefined();
   });

   it('returns the offset of the first range', () => {
      const offset = getSTokenStartOffset(
         new SToken('fo', 'bar', [
            new Range(new EntityId(), 1, 2, 3, 4, 5, 6),
            new Range(new EntityId(), 7, 6, 5, 4, 3, 2),
         ]),
      );

      expect(offset).toMatchInlineSnapshot(`
         Offset {
           "column": 3,
           "entityId": EntityId {
             "publicId": undefined,
             "systemId": "",
             "type": "ENTITY_ID",
           },
           "index": 1,
           "row": 2,
         }
      `);
   });
});
