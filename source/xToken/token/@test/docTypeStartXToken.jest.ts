/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { TextPToken } from 'pToken';
import { toSToken } from 'sToken';
import { DocTypeStartPToken } from 'token';

import { ExternalIdX } from '../../common/externalIdX';
import { DOCTYPE_START_XTOKEN, DocTypeStartXToken } from '../docTypeStartXToken';

describe('docTypeStart (unit)', () => {
   let docTypeStartPToken: DocTypeStartPToken;

   it('returns a token when constructed with a string and an ExternalIdX', () => {
      const token = new DocTypeStartXToken('foo', new ExternalIdX('system', 'public'));

      expect(token).toEqual({
         type: DOCTYPE_START_XTOKEN,
         name: 'foo',
         externalId: {
            publicId: 'public',
            systemId: 'system',
         },
      });
   });

   it('returns a token with an empty string if no name was found', () => {
      docTypeStartPToken = new DocTypeStartPToken({
         open: toSToken('<!'),
         nameSpace: toSToken(' '),
         externalId: {},
         externalIdSpace: toSToken(' '),
         openSubset: toSToken('['),
      });

      const token = new DocTypeStartXToken(docTypeStartPToken);

      expect(token.name).toEqual('');
   });

   it('returns a token with an external Id', () => {
      docTypeStartPToken = new DocTypeStartPToken({
         open: toSToken('<!'),
         name: toSToken('rootElement'),
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
         openSubset: toSToken('['),
      });

      const token = new DocTypeStartXToken(docTypeStartPToken);

      expect(token.externalId).toEqual(new ExternalIdX('system.xml', '- // public'));
   });
});
