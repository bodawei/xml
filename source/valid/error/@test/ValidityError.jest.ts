/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { EntityId, Offset, XML_ERROR_TOKEN } from 'basic';
import { toSToken } from 'sToken';

import { VALIDITY_ERROR_SUBTYPE, ValidityError } from '../ValidityError';

describe('ValidityError()', () => {
   it('constructs an instance with just an id', () => {
      const result = new ValidityError('ELEMENT_UNDECLARED');

      expect(result).toEqual({
         code: 1147,
         context: undefined,
         id: 'ELEMENT_UNDECLARED',
         message: 'Element found without a corresponding declaration (§3.0.0). Found "{0}".',
         place: undefined,
         subtype: VALIDITY_ERROR_SUBTYPE,
         type: XML_ERROR_TOKEN,
      });
   });

   it('constructs an instance with all parameters', () => {
      const result = new ValidityError(
         'ELEMENT_UNDECLARED',
         ['a'],
         toSToken('foo'),
         new Offset(new EntityId(), 12, 3, 4),
      );

      expect(result).toEqual({
         code: 1147,
         context: new Offset(new EntityId(), 12, 3, 4),
         id: 'ELEMENT_UNDECLARED',
         message: 'Element found without a corresponding declaration (§3.0.0). Found "a".',
         place: new Offset(new EntityId(), 0, 0, 0),
         subtype: VALIDITY_ERROR_SUBTYPE,
         type: XML_ERROR_TOKEN,
      });
   });
});
