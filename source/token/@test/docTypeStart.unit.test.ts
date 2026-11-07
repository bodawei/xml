/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */


import {  STokenSource, toSToken } from 'basic';
import { MockSTokenSource } from 'pToken-test';

import { DocTypeStartPToken, parseDocTypeStart } from '../docTypeStart';
import * as externalId from '../../pToken/common/externalId';

describe('docTypeStart (unit)', () => {
   let docTypeStartPToken: DocTypeStartPToken;

   beforeEach(() => {
      docTypeStartPToken = new DocTypeStartPToken({
         open: toSToken('<!'),
         name: toSToken('rootElement'),
         nameSpace: toSToken(' '),
         externalId: { },
         externalIdSpace: toSToken(' '),
         openSubset: toSToken('['),
      });
   });

   describe('parseDocTypeStart()', () => {
      let callback: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         spyOn(externalId, 'parseExternalId').and.callFake((sTokenSource: STokenSource, tokens: any, cb: any) => {
            cb({ externalId: { } });
         });
      });

      it('parses a full element start', () => {
         const mockSource = new MockSTokenSource([
            [ 'rootElement', 'word', [ '[', '>' ] ],
            [ ' ', 'space' ],
            [ ' ', 'space' ],
            [ '[', 'match', '[' ],
         ]);

         parseDocTypeStart(mockSource, { open: toSToken('<!') } as any, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless(docTypeStartPToken);
      });

      it('handles EOF', () => {
         const mockSource = new MockSTokenSource([
            undefined,
            undefined,
            undefined,
            undefined,
         ]);

         parseDocTypeStart(mockSource, {} as any, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps({
            name: undefined,
            nameSpace: undefined,
            externalIdSpace: undefined,
            externalId: { },
            openSubset: undefined,
         });
      });

   });

});
