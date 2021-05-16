/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { toSToken } from 'sToken';
import { DocTypeStartPToken } from 'token';

import { externalIdToSTokens } from '../../common/externalIdToSTokens';
import { docTypeStartToSTokens } from '../docTypeStartToSTokens';

jest.mock('../../common/externalIdToSTokens');

describe('docTypeStartToSTokens() (unit)', () => {
   it('returns all the STokens', () => {
      (externalIdToSTokens as jest.Mock).mockReturnValue([toSToken('externalId')]);
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
