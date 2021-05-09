/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { toSToken } from 'sToken';
import { ElementEmptyPToken } from 'token';

import { AttributeX } from '../../common/attributeX';
import { ElementEmptyXToken, ELEMENT_EMPTY_XTOKEN } from '../ElementEmptyXToken';

jest.mock('../../common/attributeX');

describe('ElementEmptyXToken (unit)', () => {
   let elementEmptyPToken: ElementEmptyPToken;

   beforeEach(() => {
      elementEmptyPToken = new ElementEmptyPToken({
         open: toSToken('<'),
         name: toSToken('elemName'),
         nameSpace: toSToken(' '),
         attributes: [{}],
         close: toSToken('>'),
      });
   });

   it('constructs with a string and attributes', () => {
      const result = new ElementEmptyXToken('foo', [
         {
            name: 'attr',
            value: [],
         },
      ]);

      expect(result).toEqual({
         type: ELEMENT_EMPTY_XTOKEN,
         name: 'foo',
         attributes: [
            {
               name: 'attr',
               value: [],
            },
         ],
      });
   });

   it('constructs with just a string for the name', () => {
      const result = new ElementEmptyXToken('foo');

      expect(result).toEqual({
         type: ELEMENT_EMPTY_XTOKEN,
         name: 'foo',
         attributes: [],
      });
   });

   it('asks the attribute system to provide the attributes', () => {
      new ElementEmptyXToken(elementEmptyPToken);

      expect(AttributeX).toHaveBeenCalledWith({});
   });

   it('returns a token with the expected fields defined', () => {
      (AttributeX as jest.Mock).mockImplementation(() => ({ name: 'foo', value: [] }));

      const token = new ElementEmptyXToken(elementEmptyPToken);

      expect(token).toMatchObject({
         name: 'elemName',
         attributes: [{ name: 'foo', value: [] }],
         pToken: elementEmptyPToken,
      });
   });

   it('returns a token with an empty string if no name was found', () => {
      elementEmptyPToken = new ElementEmptyPToken({
         open: toSToken('<'),
         openSpace: toSToken(' '),
         nameSpace: toSToken(' '),
         close: toSToken('>'),
      });

      const token = new ElementEmptyXToken(elementEmptyPToken);

      expect(token.name).toEqual('');
   });
});
