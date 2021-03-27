/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { toSToken } from 'sToken';
import { ElementStartPToken } from 'token';
import attribute from '../../../token/common/attribute';

import { ElementStartXToken } from '../elementStartXToken';

describe('elementStartXToken (unit)', () => {
   let elementStartPToken: ElementStartPToken;
   let elementStartPTokenWithLeading: ElementStartPToken;
   let mtc: jest.MockedFunction<typeof attribute.makeTokenCompatible>;

   beforeEach(() => {
      elementStartPTokenWithLeading = new ElementStartPToken({
         open: toSToken('<'),
         openSpace: toSToken(' '),
         name: toSToken('elemName'),
         nameSpace: toSToken(' '),
         close: toSToken('>'),
      });
      elementStartPToken = new ElementStartPToken({
         open: toSToken('<'),
         openSpace: undefined,
         name: toSToken('elemName'),
         nameSpace: toSToken(' '),
         close: toSToken('>'),
      });

      mtc = jest.spyOn(attribute, 'makeTokenCompatible') as jest.MockedFunction<
         typeof attribute.makeTokenCompatible
      >;
   });

   it('asks the attribute system to provide the attributes', () => {
      elementStartPToken = new ElementStartPToken({
         open: toSToken('<'),
         openSpace: toSToken(' '),
         name: toSToken('elemName'),
         nameSpace: toSToken(' '),
         attributes: [{}],
         close: toSToken('>'),
      });

      new ElementStartXToken(elementStartPToken);

      expect(attribute.makeTokenCompatible).toHaveBeenCalledWith(elementStartPToken.attributes);
   });

   it('returns a token with the expected fields defined', () => {
      mtc.mockReturnValue([{ name: 'foo', value: [] }]);

      const token = new ElementStartXToken(elementStartPTokenWithLeading);

      expect(token).toMatchObject({
         name: 'elemName',
         attributes: [{ name: 'foo', value: [] }],
         pToken: elementStartPTokenWithLeading,
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
