/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { WARNING_SEVERITY, PROBLEM, EntityId, Offset } from 'basic';
import { toSToken } from 'basic';

import { Warning } from '../warning';

describe('Warning()', () => {
   it('constructs an instance with just an id', () => {
      const result = new Warning('ATTLISTDECL_ATTR_NAME_DUPLICATE');

      expect(result).toEqual({
         code: 415,
         context: undefined,
         id: 'ATTLISTDECL_ATTR_NAME_DUPLICATE',
         message:
            'Attribute names should not be listed multiple times in an ATTLIST declaration (§3.3.0). Found "{0}".',
         place: undefined,
         severity: WARNING_SEVERITY,
         source: 'wellformed',
         type: PROBLEM,
      });
   });

   it('constructs an instance with all parameters', () => {
      const result = new Warning(
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
         severity: WARNING_SEVERITY,
         source: 'wellformed',
         type: PROBLEM,
      });
   });
});
