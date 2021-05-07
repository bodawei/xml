/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { TextPToken } from 'pToken';
import { toSToken } from 'sToken';
import { AttributePToken } from 'token';
import { TextXToken } from 'xToken';

import { AttributeX } from '../attributeX';

describe('attributeX (integration)', () => {
   it('returns name value pairs', () => {
      const attributeP: AttributePToken = {
         name: toSToken('one'),
         postNameSpace: undefined,
         equal: toSToken('='),
         postEqualSpace: undefined,
         openQuote: toSToken('"'),
         value: [new TextPToken({ text: toSToken('1') })],
         closeQuote: toSToken('"'),
         trailingSpace: toSToken('  '),
      };

      const attrX = new AttributeX(attributeP);

      expect(attrX).toEqual({
         name: 'one',
         value: [new TextXToken('1')],
      });
   });
});
