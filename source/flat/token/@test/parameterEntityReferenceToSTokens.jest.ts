/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { toSToken } from 'basic';
import { ParameterEntityReferencePToken } from 'pToken';

import { parameterEntityReferenceToSTokens } from '../parameterEntityReferenceToSTokens';

describe('parameterEntityReferenceToSTokens()', () => {
   it('returns all the STokens', () => {
      const pePToken = new ParameterEntityReferencePToken({
         open: toSToken('%'),
         openSpace: toSToken(' '),
         name: toSToken('entityName'),
         nameSpace: toSToken(' '),
         close: toSToken(';'),
      });

      expect(parameterEntityReferenceToSTokens(pePToken)).toEqual([
         pePToken.open,
         pePToken.openSpace,
         pePToken.name,
         pePToken.nameSpace,
         pePToken.close,
      ]);
   });
});
