/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { PROBLEM, EntityId, Offset, FATAL_ERROR_SEVERITY } from 'basic';
import { toSToken } from 'basic';

import { FatalError } from '../fatalError';

describe('FatalError()', () => {
   it('constructs an instance with just an id', () => {
      const result = new FatalError('REFERENCE_INVALID_UNPARSED');

      expect(result).toEqual({
         code: 2003,
         context: undefined,
         id: 'REFERENCE_INVALID_UNPARSED',
         message: 'Must not reference an unparsed entity (§4.9.0). Found "{0}"',
         place: undefined,
         severity: FATAL_ERROR_SEVERITY,
         source: 'wellformed',
         type: PROBLEM,
      });
   });

   it('constructs an instance with all parameters', () => {
      const result = new FatalError(
         'REFERENCE_INVALID_UNPARSED',
         ['a'],
         toSToken('foo'),
         new Offset(new EntityId(), 12, 3, 4),
      );

      expect(result).toEqual({
         code: 2003,
         context: new Offset(new EntityId(), 12, 3, 4),
         id: 'REFERENCE_INVALID_UNPARSED',
         message: 'Must not reference an unparsed entity (§4.9.0). Found "a"',
         place: new Offset(new EntityId(), 0, 0, 0),
         severity: FATAL_ERROR_SEVERITY,
         source: 'wellformed',
         type: PROBLEM,
      });
   });
});
