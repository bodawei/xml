/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { toSToken } from 'sToken';
import { NotationDeclarationPToken } from 'pToken';
import { EXTERNAL_ID, TextPToken } from 'token';
import { ExternalIdXToken } from '../externalIdXToken';
import {
   NOTATION_DECLARATION_XTOKEN,
   NotationDeclarationXToken,
} from '../notationDeclarationXToken';

describe('NotationDeclarationXToken', () => {
   it('returns notation declaration token built from a PToken', () => {
      const notationPToken = new NotationDeclarationPToken({
         open: toSToken('<!'),
         openSpace: undefined,
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
      const result = new NotationDeclarationXToken(notationPToken);

      expect(result).toEqualRangeless({
         type: NOTATION_DECLARATION_XTOKEN,
         name: 'notationName',
         externalId: new ExternalIdXToken('system.xml', '- // public'),
         pToken: notationPToken,
      });
   });

   it('returns a notation declaration with a blank name if there is no name', () => {
      const notationPToken = new NotationDeclarationPToken({
         open: toSToken('<!'),

         openSpace: undefined,
         declType: toSToken('NOTATION'),
         declTypeSpace: toSToken(' '),
         name: undefined,
         nameSpace: toSToken(' '),
         externalId: undefined,
         externalIdSpace: toSToken(' '),
         close: toSToken('>'),
      });
      const result = new NotationDeclarationXToken(notationPToken);

      expect(result).toEqualRangeless({
         type: NOTATION_DECLARATION_XTOKEN,
         name: '',
         externalId: undefined,
         pToken: notationPToken,
      });
   });

   it('returns a notation declaration when provided with specific parameters', () => {
      const externalId = new ExternalIdXToken('system.xml', '- // public');
      const result = new NotationDeclarationXToken('one', externalId);

      expect(result).toEqualRangeless({
         type: NOTATION_DECLARATION_XTOKEN,
         name: 'one',
         externalId,
      });
   });
});
