/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ExternalIdP } from 'pToken';
import { toSToken } from 'basic';

import { literalToSTokens } from '../literalToSTokens';

import { externalIdToSTokens } from '../externalIdToSTokens';

jest.mock('../literalToSTokens');

describe('externalIdToSTokens()', () => {
   beforeEach(() => {
      (literalToSTokens as jest.Mock).mockReturnValue([toSToken('literal')]);
   });

   it('calls literalToSTokens() for the PUBLIC value', () => {
      const pTokenPart: ExternalIdP = {};

      externalIdToSTokens(pTokenPart);

      expect(literalToSTokens).toHaveBeenCalledWith(pTokenPart.public);
   });

   it('calls literalToSTokens() for the SYSTEM value', () => {
      const pTokenPart: ExternalIdP = {};

      externalIdToSTokens(pTokenPart);

      expect(literalToSTokens).toHaveBeenCalledWith(pTokenPart.system);
   });

   it('returns the STokens that made up the external ID', () => {
      const pTokenPart = {
         peRefPlus: [],
         externalType: toSToken('PUBLIC'),
         externalTypeSpace: toSToken(' '),
         publicSpace: toSToken(' '),
      };

      const results = externalIdToSTokens(pTokenPart);

      expect(results).toEqual([
         pTokenPart.externalType,
         pTokenPart.externalTypeSpace,
         toSToken('literal'),
         pTokenPart.publicSpace,
         toSToken('literal'),
      ]);
   });

   it('returns an empty array if given nothing', () => {
      const results = externalIdToSTokens(undefined);

      expect(results).toEqual([]);
   });
});
