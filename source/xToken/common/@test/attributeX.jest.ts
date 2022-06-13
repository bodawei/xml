/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { toSToken } from 'basic';
import { AttributePToken } from 'token';

import { AttributeX } from '../attributeX';
import { TextXToken } from '../../token/textXToken';
import { cloneLiteralValueX, makeLiteralValueX } from '../literalValueX';

jest.mock('../literalValueX');

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

   it('can be constructed with a string and a literalValue', () => {
      (cloneLiteralValueX as jest.Mock).mockReturnValue([new TextXToken('wow')]);

      const attrX = new AttributeX('name', [new TextXToken('wow')]);

      expect(attrX).toEqual({
         name: 'name',
         value: [new TextXToken('wow')],
      });
   });

   it('calls cloneLiteralValueX() when passed a literal string', () => {
      new AttributeX('foo');

      expect(cloneLiteralValueX).toHaveBeenCalledWith(undefined);
   });

   it('calls makeLiteralValueX()', () => {
      new AttributeX(attribute);

      expect(makeLiteralValueX).toHaveBeenCalledWith(attribute.value);
   });

   it('returns name value pairs from the parsing', () => {
      (makeLiteralValueX as jest.Mock).mockReturnValue([new TextXToken('wow')]);
      const attrX = new AttributeX(attribute);

      expect(attrX).toEqual({
         name: 'version',
         value: [new TextXToken('wow')],
      });
   });
});
