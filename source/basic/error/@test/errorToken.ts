/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { EntityId } from '../../EntityId';
import Offset from '../../Offset';
import { toSToken } from 'sToken';

import { ERROR_SUBTYPE, ErrorToken } from '../errorToken';
import { XML_ERROR_TOKEN } from '../XmlErrorToken';

describe('ErrorToken()', () => {
   it('constructs an instance with just an id', () => {
      const result = new ErrorToken('XMLSPACE_INVALID_VALUE');

      expect(result).toEqual({
         id: 'XMLSPACE_INVALID_VALUE',
         code: 1300,
         context: undefined,
         message:
            'The "xml:space" attribute may only have the value "preserve" or "default". Found "{0}".',
         place: undefined,
         subtype: ERROR_SUBTYPE,
         type: XML_ERROR_TOKEN,
      });
   });

   it('constructs an instance with all parameters', () => {
      const result = new ErrorToken(
         'XMLSPACE_INVALID_VALUE',
         ['a'],
         toSToken('foo'),
         new Offset(new EntityId(), 12, 3, 4),
      );

      expect(result).toEqual({
         id: 'XMLSPACE_INVALID_VALUE',
         code: 1300,
         context: new Offset(new EntityId(), 12, 3, 4),
         message:
            'The "xml:space" attribute may only have the value "preserve" or "default". Found "a".',
         place: new Offset(new EntityId(), 0, 0, 0),
         subtype: ERROR_SUBTYPE,
         type: XML_ERROR_TOKEN,
      });
   });
});
