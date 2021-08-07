/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { EntityId } from '../../EntityId';
import Offset from '../../Offset';
import { toSToken } from 'sToken';

import { WARNING_SUBTYPE, WarningToken } from '../warningToken';
import { XML_ERROR_TOKEN } from '../XmlErrorToken';

describe('warningToken()', () => {
   it('constructs an instance with just an id', () => {
      const result = new WarningToken('ATTLISTDECL_ATTR_NAME_DUPLICATE');

      expect(result).toEqual({
         code: 415,
         context: undefined,
         id: 'ATTLISTDECL_ATTR_NAME_DUPLICATE',
         message:
            'Attribute names should not be listed multiple times in an ATTLIST declaration (§3.3.0). Found "{0}".',
         place: undefined,
         subtype: WARNING_SUBTYPE,
         type: XML_ERROR_TOKEN,
      });
   });

   it('constructs an instance with all parameters', () => {
      const result = new WarningToken(
         'ATTLISTDECL_ATTR_NAME_DUPLICATE',
         ['a'],
         toSToken('foo'),
         new Offset(new EntityId(), 12, 3, 4),
      );

      expect(result).toEqual({
         code: 415,
         context: new Offset(new EntityId(), 12, 3, 4),
         id: 'ATTLISTDECL_ATTR_NAME_DUPLICATE',
         message:
            'Attribute names should not be listed multiple times in an ATTLIST declaration (§3.3.0). Found "a".',
         place: new Offset(new EntityId(), 0, 0, 0),
         subtype: WARNING_SUBTYPE,
         type: XML_ERROR_TOKEN,
      });
   });
});
