/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { TextPToken } from 'pToken';
import { SToken, STokenSource, toSToken } from 'sToken';
import { MockSTokenSource } from 'sToken-test';

import { DocTypeStartPToken, parseDocTypeStart } from '../docTypeStart';
import { EXTERNAL_ID } from '../common/externalId';
import * as externalId from '../common/externalId';
import { ExternalIdX } from 'xToken';

describe('docTypeStart (unit)', () => {
   let docTypeStartPToken: DocTypeStartPToken;

   beforeEach(() => {
      docTypeStartPToken = new DocTypeStartPToken({
         open: SToken.fromString('<!'),
         name: toSToken('rootElement'),
         nameSpace: toSToken(' '),
         externalId: { type: EXTERNAL_ID },
         externalIdSpace: toSToken(' '),
         openSubset: toSToken('['),
      });
   });

   describe('parseDocTypeStart()', () => {
      let callback: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         spyOn(externalId, 'parseExternalId').and.callFake((sTokenSource: STokenSource, tokens: any, allowPERefs: boolean, cb: any) => {
            cb({ externalId: { type: EXTERNAL_ID } });
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
            externalId: { type: EXTERNAL_ID },
            openSubset: undefined,
         });
      });

   });

   describe('toXToken()', () => {

      it('returns a token with an empty string if no name was found', () => {
         delete (docTypeStartPToken as any).name;

         const token = docTypeStartPToken.toXToken();

         expect(token.name).toEqual('');
      });

      it('returns a token with an external Id', () => {
         docTypeStartPToken = new DocTypeStartPToken({
            open: SToken.fromString('<!'),
            name: toSToken('rootElement'),
            nameSpace: toSToken(' '),
            externalId: { type: EXTERNAL_ID, system: {
               value: [ new TextPToken({ text: toSToken('system.xml') }) ],
            }, public: {
               value: [ new TextPToken({ text: toSToken('- // public') }) ],
             },
            },
            externalIdSpace: toSToken(' '),
            openSubset: toSToken('['),
         });

         const token = docTypeStartPToken.toXToken();

         expect(token.externalId).toEqual(new ExternalIdX('system.xml', '- // public'));
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

      it('calls externalId getSTokens', () => {
         spyOn(externalId, 'getSTokens');
         const pToken = new DocTypeStartPToken(docTypeStartPToken);

         pToken.toSTokenArray();

         expect(externalId.getSTokens).toHaveBeenCalledWith(docTypeStartPToken.externalId);
      });

   });

});
