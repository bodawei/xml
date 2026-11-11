/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { DocTypeStartPToken } from 'token';
import { describe, expect, it, vi, type Mock } from 'vitest';

import { externalIdToSTokens } from '../../common/externalIdToSTokens';
import { docTypeStartToSTokens } from '../docTypeStartToSTokens';

vi.mock('../../common/externalIdToSTokens');

describe('docTypeStartToSTokens() (unit)', () => {
   it('returns all the STokens', () => {
      (externalIdToSTokens as Mock).mockReturnValue([toSToken('externalId')]);
      const docTypeStartPToken = new DocTypeStartPToken({
         open: toSToken('<!'),
         postOpenSpace: toSToken(' '),
         declType: toSToken('DOCTYPE'),
         name: toSToken('rootElement'),
         postDeclTypeSpace: toSToken('\t'),
         nameSpace: toSToken('\n'),
         externalId: {},
         externalIdSpace: toSToken(' '),
         openSubset: toSToken('['),
      });

      expect(docTypeStartToSTokens(docTypeStartPToken)).toEqual([
         docTypeStartPToken.open,
         docTypeStartPToken.postOpenSpace,
         docTypeStartPToken.declType,
         docTypeStartPToken.postDeclTypeSpace,
         docTypeStartPToken.name!,
         docTypeStartPToken.nameSpace!,
         toSToken('externalId'),
         docTypeStartPToken.externalIdSpace!,
         docTypeStartPToken.openSubset!,
      ]);
   });
});
