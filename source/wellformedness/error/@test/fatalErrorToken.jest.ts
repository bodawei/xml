/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { XML_ERROR_TOKEN, EntityId, Offset } from 'basic';
import { toSToken } from 'sToken';

import { FATAL_ERROR_SUBTYPE, FatalErrorToken } from '../fatalErrorToken';

describe('FatalErrorToken()', () => {
   it('constructs an instance with just an id', () => {
      const result = new FatalErrorToken('REFERENCE_INVALID_UNPARSED');

      expect(result).toEqual({
         code: 2003,
         context: undefined,
         id: 'REFERENCE_INVALID_UNPARSED',
         message: 'Must not reference an unparsed entity (§4.9.0). Found "{0}"',
         place: undefined,
         subtype: FATAL_ERROR_SUBTYPE,
         type: XML_ERROR_TOKEN,
      });
   });

   it('constructs an instance with all parameters', () => {
      const result = new FatalErrorToken(
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
         subtype: FATAL_ERROR_SUBTYPE,
         type: XML_ERROR_TOKEN,
      });
   });
});
