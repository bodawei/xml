/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { DocTypeStartPToken, DocTypeEndPToken } from 'token';
import { describe, expect, it } from 'vitest';

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
