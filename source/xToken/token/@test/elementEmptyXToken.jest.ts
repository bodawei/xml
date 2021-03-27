/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { toSToken } from 'sToken';
import { ElementEmptyPToken } from 'token';
import attribute from '../../../token/common/attribute';

import { ElementEmptyXToken } from '../ElementEmptyXToken';

describe('ElementEmptyXToken (unit)', () => {
   let elementEmptyPToken: ElementEmptyPToken;
   let mtc: jest.MockedFunction<typeof attribute.makeTokenCompatible>;

   beforeEach(() => {
      elementEmptyPToken = new ElementEmptyPToken({
         open: toSToken('<'),
         name: toSToken('elemName'),
         nameSpace: toSToken(' '),
         attributes: [],
         close: toSToken('>'),
      });

      mtc = jest.spyOn(attribute, 'makeTokenCompatible') as jest.MockedFunction<
         typeof attribute.makeTokenCompatible
      >;
   });

   it('asks the attribute system to provide the attributes', () => {
      elementEmptyPToken = new ElementEmptyPToken({
         open: toSToken('<'),
         openSpace: toSToken(' '),
         name: toSToken('elemName'),
         nameSpace: toSToken(' '),
         attributes: [{}],
         close: toSToken('>'),
      });

      new ElementEmptyXToken(elementEmptyPToken);

      expect(attribute.makeTokenCompatible).toHaveBeenCalledWith(elementEmptyPToken.attributes);
   });

   it('returns a token with the expected fields defined', () => {
      mtc.mockReturnValue([{ name: 'foo', value: [] }]);

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
