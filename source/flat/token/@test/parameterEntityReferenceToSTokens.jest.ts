/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { ParameterEntityReferencePToken } from 'pToken';
import { describe, expect, it } from 'vitest';

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
