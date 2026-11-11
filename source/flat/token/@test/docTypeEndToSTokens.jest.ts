/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { toSToken } from 'basic';
import { DocTypeStartPToken, DocTypeEndPToken } from 'token';

import { docTypeEndToSTokens } from '../docTypeEndToSTokens';

describe('docTypeEndToSTokens (unit)', () => {
   it('returns the Stokens', () => {
      const startPToken = new DocTypeStartPToken({ open: toSToken('<!'), openSubset: true });
      const docTypeEndPToken = new DocTypeEndPToken({
         docTypeStartPToken: startPToken,
         closeSubset: toSToken(']'),
         closeSubsetSpace: toSToken(' '),
         close: toSToken('>'),
      });

      expect(docTypeEndToSTokens(docTypeEndPToken)).toEqual([
         docTypeEndPToken.closeSubset,
         docTypeEndPToken.closeSubsetSpace,
         docTypeEndPToken.close,
      ]);
   });
});
