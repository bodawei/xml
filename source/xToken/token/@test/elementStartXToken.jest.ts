/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { toSToken } from 'sToken';
import { ElementStartPToken } from 'token';

import { AttributeX } from '../../common/attributeX';
import { ElementStartXToken } from '../elementStartXToken';

jest.mock('../../common/attributeX');

describe('elementStartXToken (unit)', () => {
   let elementStartPToken: ElementStartPToken;

   beforeEach(() => {
      elementStartPToken = new ElementStartPToken({
         open: toSToken('<'),
         openSpace: toSToken(' '),
         name: toSToken('elemName'),
         nameSpace: toSToken(' '),
         attributes: [{}],
         close: toSToken('>'),
      });
   });

   it('asks the attribute system to provide the attributes', () => {
      new ElementStartXToken(elementStartPToken);

      expect(AttributeX).toHaveBeenCalledWith({});
   });

   it('returns a token with the expected fields defined', () => {
      (AttributeX as jest.Mock).mockImplementation(() => ({ name: 'foo', value: [] }));

      const token = new ElementStartXToken(elementStartPToken);

      expect(token).toMatchObject({
         name: 'elemName',
         attributes: [{ name: 'foo', value: [] }],
         pToken: elementStartPToken,
      });
   });

   it('returns a token with an empty string if no name was found', () => {
      elementStartPToken = new ElementStartPToken({
         open: toSToken('<'),
         openSpace: toSToken(' '),
         nameSpace: toSToken(' '),
         close: toSToken('>'),
      });

      const token = new ElementStartXToken(elementStartPToken);

      expect(token.name).toEqual('');
   });
});
