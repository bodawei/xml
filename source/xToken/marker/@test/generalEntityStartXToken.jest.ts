/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { GeneralEntityReferencePToken } from 'pToken';
import { toSToken } from 'sToken';
import { GeneralEntityStartPToken } from 'token';
import { GeneralEntityStartXToken } from '../generalEntityStartXToken';

describe('GeneralEntityStartXToken (unit)', () => {
   it('is constructed with the specified name', () => {
      const token = new GeneralEntityStartXToken('foo');

      expect(token.name).toEqual('foo');
      expect(token.pToken).toBeUndefined();
   });

   it('will create an xToken from a PToken', () => {
      const token = new GeneralEntityStartPToken(
         new GeneralEntityReferencePToken({
            open: toSToken('&'),
            name: toSToken('foo'),
         }),
      );

      const result = new GeneralEntityStartXToken(token);

      expect(result.name).toEqual('foo');
      expect(result.pToken).toEqual(token);
   });
});
