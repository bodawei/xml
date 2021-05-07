/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { toSToken } from 'sToken';
import { AttributePToken } from 'token';

import { AttributeX } from '../attributeX';
import { makeLiteralValueX } from '../makeLiteralValueX';

jest.mock('../makeLiteralValueX');

describe('attribute (unit)', () => {
   let attribute: AttributePToken;

   beforeEach(() => {
      attribute = {
         name: toSToken('version'),
         postNameSpace: toSToken(' '),
         equal: toSToken('='),
         postEqualSpace: toSToken(' '),
         value: [],
         trailingSpace: toSToken(' '),
      };
   });

   it('calls makeLiteralValueX()', () => {
      new AttributeX(attribute);

      expect(makeLiteralValueX).toHaveBeenCalledWith(attribute.value);
   });

   it('returns name value pairs from the parsing', () => {
      (makeLiteralValueX as jest.Mock).mockReturnValue([{ foo: true }]);
      const attrX = new AttributeX(attribute);

      expect(attrX).toEqual({
         name: 'version',
         value: [{ foo: true } as any],
      });
   });
});
