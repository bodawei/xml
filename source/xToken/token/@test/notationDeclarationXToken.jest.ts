/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { TextPToken, NotationDeclarationPToken } from 'pToken';
import { describe, expect, it } from 'vitest';

import { ExternalIdX } from '../../common/externalIdX';
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

      expect(result).toEqual({
         type: NOTATION_DECLARATION_XTOKEN,
         name: 'notationName',
         externalId: new ExternalIdX('system.xml', '- // public'),
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

      expect(result).toEqual({
         type: NOTATION_DECLARATION_XTOKEN,
         name: '',
         externalId: undefined,
         pToken: notationPToken,
      });
   });

   it('returns a notation declaration when provided with specific parameters', () => {
      const externalId = new ExternalIdX('system.xml', '- // public');
      const result = new NotationDeclarationXToken('one', externalId);

      expect(result).toEqual({
         type: NOTATION_DECLARATION_XTOKEN,
         name: 'one',
         externalId,
      });
   });
});
