/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { EntityId, Offset, XML_ERROR_TOKEN } from 'basic';
import { toSToken } from 'sToken';

import { VALIDITY_ERROR_SUBTYPE, ValidityError } from '../validityError';

describe('ValidityError()', () => {
   it('constructs an instance with just an id', () => {
      const result = new ValidityError('ELEMENT_NO_DECLARATION');

      expect(result).toEqual({
         code: 1156,
         context: undefined,
         id: 'ELEMENT_NO_DECLARATION',
         message: 'Missing declaration for element type "{0}" (§3.0.0).',
         place: undefined,
         subtype: VALIDITY_ERROR_SUBTYPE,
         type: XML_ERROR_TOKEN,
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
         subtype: VALIDITY_ERROR_SUBTYPE,
         type: XML_ERROR_TOKEN,
      });
   });
});
