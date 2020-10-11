/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { toSToken } from 'sToken';
//ick
import { ExternalId, EXTERNAL_ID } from 'token';
import literal from '../../../token/common/literal'; // ick

import { externalIdToSTokens } from '../externalIdToSTokens';

jest.mock('../../../token/common/literal'); // ick

describe('externalIdToSTokens()', () => {
   beforeEach(() => {
      const literalMock: jest.Mock = literal.getSTokens as jest.Mock;
      literalMock.mockReturnValue([]);
   });

   it('calls literal.getSTokens() for the PUBLIC value', () => {
      const pTokenPart: ExternalId = {
         type: EXTERNAL_ID,
      };

      externalIdToSTokens(pTokenPart);

      expect(literal.getSTokens).toHaveBeenCalledWith(pTokenPart.public);
   });

   it('calls literal.getSTokens() for the SYSTEM value', () => {
      const pTokenPart: ExternalId = {
         type: EXTERNAL_ID,
      };

      externalIdToSTokens(pTokenPart);

      expect(literal.getSTokens).toHaveBeenCalledWith(pTokenPart.system);
   });

   it('returns the STokens that made up the external ID', () => {
      const pTokenPart = {
         type: EXTERNAL_ID,
         peRefPlus: [],
         externalType: toSToken('PUBLIC'),
         externalTypeSpace: toSToken(' '),
         publicSpace: toSToken(' '),
      };

      const results = externalIdToSTokens(pTokenPart);

      expect(results).toEqual([
         pTokenPart.externalType,
         pTokenPart.externalTypeSpace,
         pTokenPart.publicSpace,
      ]);
   });

   it('returns an empty array if given nothing', () => {
      const results = externalIdToSTokens(undefined);

      expect(results).toEqual([]);
   });
});
