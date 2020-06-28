/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { EntityMetaData } from 'basic';
import { MockErrorCollector } from'error-test';
import { SToken, STokenSource } from 'sToken';
import { makeSTokenMaker, MockSTokenSource } from 'sToken-test';
import { WellFormedError } from 'error';

import declaration from '../bridge/baseDeclaration';
import { DocTypeStartPToken, parseDocTypeStart } from '../docTypeStart';
import { EXTERNAL_ID } from '../common/externalId';
import * as externalId from '../common/externalId';
import misc from '../common/misc';

describe('docTypeStart (unit)', () => {
   let docTypeStartPToken: DocTypeStartPToken;

   beforeEach(() => {
      const makeSToken = makeSTokenMaker();
      docTypeStartPToken = new DocTypeStartPToken({
         open: SToken.fromString('<!'),
         name: makeSToken('rootElement'),
         nameSpace: makeSToken(' '),
         externalId: { type: EXTERNAL_ID },
         externalIdSpace: makeSToken(' '),
         openSubset: makeSToken('['),
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

         expect(callback).toContainPTokenProps(docTypeStartPToken);
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

   describe('checkWellFormed()', () => {
      let declCheckWellFormedSpy: jasmine.Spy;
      let mockErrorCollector: MockErrorCollector;
      let emd: EntityMetaData;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         emd = new EntityMetaData();

         declCheckWellFormedSpy = spyOn(declaration, 'checkWellFormed');
         spyOn(misc, 'checkName');
         spyOn(externalId, 'checkExternalIdWellFormed');
      });

      it('asks the declaration module to look for problems in the declaration part', () => {
         docTypeStartPToken.checkWellFormed(mockErrorCollector, emd);

         expect(declCheckWellFormedSpy).toHaveBeenCalledWith(docTypeStartPToken, mockErrorCollector, emd);
      });

      it('asks the misc.checkName() to validate the name', () => {
         docTypeStartPToken.checkWellFormed(mockErrorCollector, emd);

         expect(misc.checkName).toHaveBeenCalledWith(docTypeStartPToken.name,
            mockErrorCollector, emd, WellFormedError.ID.DOCTYPE_NAME_INVALID);
      });

      it('checks whether externalId is valid', () => {
         docTypeStartPToken.checkWellFormed(mockErrorCollector, emd);

         expect(externalId.checkExternalIdWellFormed)
            .toHaveBeenCalledWith(docTypeStartPToken.externalId, mockErrorCollector, emd);
      });

      it('reports an error if there is no elment name', () => {
         (docTypeStartPToken as any).name = undefined;

         docTypeStartPToken.checkWellFormed(mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.DOCTYPE_NO_NAME,
            params: undefined,
            lastPosition: undefined, // would be pToken.postDeclTypeSpace, but we're mocking that out
         });
      });

      it('reports no error if there is an elment name', () => {
         docTypeStartPToken.checkWellFormed(mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).not.toReportError({
            id: WellFormedError.ID.DOCTYPE_NO_NAME,
            params: undefined,
            position: undefined,
         });
      });

   });

   describe('toXToken()', () => {

      beforeEach(() => {
         spyOn(externalId, 'makeEntityLocation');
      });

      it('calls externalId.makeEntityLocation', () => {
         docTypeStartPToken.toXToken();

         expect(externalId.makeEntityLocation).toHaveBeenCalledWith(docTypeStartPToken.externalId);
      });

      it('returns a token with an empty string if no name was found', () => {
         delete (docTypeStartPToken as any).name;

         const token = docTypeStartPToken.toXToken();

         expect(token.name).toEqual('');
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
