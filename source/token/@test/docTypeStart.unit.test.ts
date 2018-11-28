/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { EntityMetaData } from 'basic';
import { MockErrorCollector } from '../../error/@test/helper';
import { SToken } from '../../sToken';
import { makeSTokenMaker, MockSTokenSource } from '../../sToken/@test/helper';
import { WellFormedError } from '../../error';

import declaration from '../bridge/declaration';
import * as docTypeStart from '../docTypeStart';
import externalId from '../common/externalId';
import misc from '../common/misc';

describe('docTypeStart (unit)', () => {
   let docTypeStartPToken: docTypeStart.DocTypeStartPToken;

   beforeEach(() => {
      const makeSToken = makeSTokenMaker();
      docTypeStartPToken = new docTypeStart.DocTypeStartPToken({
         type: 'DOCTYPE_START',
         name: makeSToken('rootElement'),
         postNameSpace: makeSToken(' '),
         externalId: { externalId: true },
         postExternalIdSpace: makeSToken(' '),
         startInternalSubset: makeSToken('['),
      });
   });

   describe('PToken', () => {

      describe('getSTokenStream()', () => {

         it('returns all the STokens', () => {
            const pToken = new docTypeStart.PToken(docTypeStartPToken);

            expect(pToken.getSTokenArray()).toEqual([
               SToken.fromString(''),
               docTypeStartPToken.name,
               docTypeStartPToken.postNameSpace,
               docTypeStartPToken.postExternalIdSpace,
               docTypeStartPToken.startInternalSubset,
            ]);
         });

      });

      it('returns all the STokens', () => {
         spyOn(externalId, 'getSTokens');
         const pToken = new docTypeStart.PToken(docTypeStartPToken);

         pToken.getSTokenArray();
         expect(externalId.getSTokens).toHaveBeenCalledWith(docTypeStartPToken.externalId);
      });
   });

   describe('parse()', () => {
      let callback: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         spyOn(externalId, 'parse').and.callFake((ignored1: any, ignored2: any, cb: any) => {
            cb({ externalId: true });
         });
      });

      it('parses a full element start', () => {
         const mockSource = new MockSTokenSource([
            [ 'rootElement', 'word', [ '[', '>' ] ],
            [ ' ', 'space' ],
            [ ' ', 'space' ],
            [ '[', 'match', '[' ],
         ]);

         docTypeStart.parse(mockSource, {} as any, callback);
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

         docTypeStart.parse(mockSource, {} as any, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps({
            type: 'DOCTYPE_START',
            name: undefined,
            postNameSpace: undefined,
            postExternalIdSpace: undefined,
            externalId: { externalId: true },
            startInternalSubset: undefined,
         });
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector: MockErrorCollector;
      let emd: EntityMetaData;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         emd = new EntityMetaData();

         spyOn(declaration, 'checkWellFormed');
         spyOn(misc, 'checkName');
         spyOn(externalId, 'checkWellFormed');
      });

      it('asks the declaration module to look for problems in the declaration part', () => {
         const decl = { decl: true };

         docTypeStart.checkWellFormed(decl as any, mockErrorCollector, emd);

         expect(declaration.checkWellFormed).toHaveBeenCalledWith(decl, mockErrorCollector, emd);
      });

      it('asks the misc.checkName() to validate the name', () => {
         docTypeStart.checkWellFormed(docTypeStartPToken, mockErrorCollector, emd);

         expect(misc.checkName).toHaveBeenCalledWith(docTypeStartPToken.name,
            mockErrorCollector, emd, WellFormedError.ID.DOCTYPE_NAME_INVALID);
      });

      it('checks whether externalId is valid', () => {
         docTypeStart.checkWellFormed(docTypeStartPToken, mockErrorCollector, emd);

         expect(externalId.checkWellFormed)
            .toHaveBeenCalledWith(docTypeStartPToken.externalId, mockErrorCollector, emd);
      });

      it('reports an error if there is no elment name', () => {
         docTypeStartPToken.name = undefined;

         docTypeStart.checkWellFormed(docTypeStartPToken, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.DOCTYPE_NO_NAME,
            params: undefined,
            lastPosition: undefined, // would be pToken.postDeclTypeSpace, but we're mocking that out
         });
      });

      it('reports no error if there is an elment name', () => {
         docTypeStart.checkWellFormed(docTypeStartPToken, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).not.toReportError({
            id: WellFormedError.ID.DOCTYPE_NO_NAME,
            params: undefined,
            position: undefined,
         });
      });

   });

   describe('pTokenToXToken()', () => {

      beforeEach(() => {
         spyOn(externalId, 'makeEntityLocation');
      });

      it('calls externalId.makeEntityLocation', () => {
         docTypeStart.pTokenToXToken(docTypeStartPToken);

         expect(externalId.makeEntityLocation).toHaveBeenCalledWith(docTypeStartPToken.externalId);
      });

      it('returns a token with an empty string if no name was found', () => {
         delete docTypeStartPToken.name;

         const token = docTypeStart.pTokenToXToken(docTypeStartPToken);

         expect(token.name).toEqual('');
      });

   });

});
