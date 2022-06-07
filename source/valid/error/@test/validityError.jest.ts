/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { EntityId, ERROR_SEVERITY, Offset, PROBLEM } from 'basic';
import { toSToken } from 'sToken';

import { ValidityError } from '../validityError';

describe('ValidityError()', () => {
   it('constructs an instance with just an id', () => {
      const result = new ValidityError('ELEMENT_NO_DECLARATION');

      expect(result).toEqual({
         code: 1156,
         context: undefined,
         id: 'ELEMENT_NO_DECLARATION',
         message: 'Missing declaration for element type "{0}" (§3.0.0).',
         place: undefined,
         severity: ERROR_SEVERITY,
         source: 'VALIDITY_CONSTRAINT',
         type: PROBLEM,
      });
   });

   it('constructs an instance with all parameters', () => {
      const result = new ValidityError(
         'ELEMENT_NO_DECLARATION',
         ['a'],
         toSToken('foo'),
         new Offset(new EntityId(), 12, 3, 4),
      );

      expect(result).toEqual({
         code: 1156,
         context: new Offset(new EntityId(), 12, 3, 4),
         id: 'ELEMENT_NO_DECLARATION',
         message: 'Missing declaration for element type "a" (§3.0.0).',
         place: new Offset(new EntityId(), 0, 0, 0),
         severity: ERROR_SEVERITY,
         source: 'VALIDITY_CONSTRAINT',
         type: PROBLEM,
      });
   });
});
