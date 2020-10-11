/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { NotationDeclarationPToken } from 'pToken';
import { toSToken } from 'sToken';
// ick
import { EXTERNAL_ID, TextPToken } from 'token';

import { notationDeclarationToSTokens } from '../notationDeclarationToSTokens';

describe('notationDeclarationToSTokens() (unit)', () => {
   it('returns all the STokens', () => {
      const notationPToken = new NotationDeclarationPToken({
         open: toSToken('<!'),
         openSpace: toSToken('\t'),
         declType: toSToken('NOTATION'),
         declTypeSpace: toSToken(' '),
         name: toSToken('notationName'),
         nameSpace: toSToken(' '),
         externalId: {
            type: EXTERNAL_ID,
            system: {
               value: [new TextPToken({ text: toSToken('system.xml') })],
            },
            public: {
               value: [new TextPToken({ text: toSToken('- // public') })],
            },
         },
         externalIdSpace: toSToken(' '),
         close: toSToken('>'),
      });

      expect(notationDeclarationToSTokens(notationPToken)).toEqual([
         toSToken('<!'),
         toSToken('\t'),
         toSToken('NOTATION'),
         toSToken(' '),
         toSToken('notationName'),
         toSToken(' '),
         toSToken('- // public'),
         toSToken('system.xml'),
         toSToken(' '),
         toSToken('>'),
      ]);
   });
});
