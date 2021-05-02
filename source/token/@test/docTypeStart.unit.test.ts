/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { SToken, STokenSource, toSToken } from 'sToken';
import { MockSTokenSource } from 'sToken-test';

import { DocTypeStartPToken, parseDocTypeStart } from '../docTypeStart';
import * as externalId from '../../pToken/common/externalId';

describe('docTypeStart (unit)', () => {
   let docTypeStartPToken: DocTypeStartPToken;

   beforeEach(() => {
      docTypeStartPToken = new DocTypeStartPToken({
         open: SToken.fromString('<!'),
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

         parseDocTypeStart(mockSource, { open: SToken.fromString('<!') } as any, callback);
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

   describe('getSTokenStream()', () => {

      it('returns all the STokens', () => {
         const pToken = new DocTypeStartPToken(docTypeStartPToken);

         expect(pToken.toSTokenArray()).toEqual([
            docTypeStartPToken.open,
            docTypeStartPToken.name,
            docTypeStartPToken.nameSpace,
            docTypeStartPToken.externalIdSpace,
            docTypeStartPToken.openSubset,
         ] as any);
      });

      // it('calls externalId getSTokens', () => {
      //    spyOn(externalId, 'getSTokens');
      //    const pToken = new DocTypeStartPToken(docTypeStartPToken);

      //    pToken.toSTokenArray();

      //    expect(externalId.getSTokens).toHaveBeenCalledWith(docTypeStartPToken.externalId);
      // });

   });

});
