/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { XmlWarning } from '../error';
import { MockErrorCollector } from '../error/@test/helper';
import { makeSTokenMaker, MockSTokenSource } from '../sToken/@test/helper';
import { WellFormedError } from '../error';

import * as declaration from './bridge/declaration.js';
import * as notationDeclaration from './notationDeclaration.js';
import externalId from './common/externalId.js';
import misc from './common/misc.js';

describe('notationdeDlaration (unit)', () => {
   let notationPToken;
   let makeSToken;

   beforeEach(() => {
      makeSToken = makeSTokenMaker();
      notationPToken = new notationDeclaration.PToken({
         open: makeSToken('<!'),
         postOpenSpace: undefined,
         declType: makeSToken('NOTATION'),
         postDeclTypeSpace: makeSToken(' '),
         name: makeSToken('notationName'),
         postNameSpace: makeSToken(' '),
         externalId: { externalId: true },
         postExternalIdSpace: makeSToken(' '),
         close: makeSToken('>'),
      });
   });

   describe('PToken', () => {

      describe('getSTokenStream()', () => {

         it('returns all the STokens', () => {
            notationPToken.postOpenSpace = notationPToken.postNameSpace;
            expect(notationPToken.getSTokenArray()).toEqual([
               notationPToken.open,
               notationPToken.postOpenSpace,
               notationPToken.declType,
               notationPToken.postDeclTypeSpace,
               notationPToken.name,
               notationPToken.postNameSpace,
               notationPToken.postExternalIdSpace,
               notationPToken.close,
            ]);
         });

      });

      it('asks the attribute to provide the STokens', () => {
         spyOn(externalId, 'getSTokens');

         notationPToken.getSTokenArray();

         expect(externalId.getSTokens).toHaveBeenCalledWith(notationPToken.externalId);
      });

   });

   describe('parse()', () => {
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         spyOn(externalId, 'parse');
         externalId.parse.and.callFake((source, terminators, cb) => {
            cb({ externalId: true });
         });
      });

      it('calls externalId.parse()', () => {
         const mockSource = new MockSTokenSource([
            'name',
            ' ',
            undefined,
            '>',
         ]);

         notationDeclaration.parse(mockSource, notationPToken, callback);
         mockSource.respondInAsyncTime();

         expect(externalId.parse.calls.argsFor(0)[0]).toEqual(mockSource);
         expect(externalId.parse.calls.argsFor(0)[1]).toEqual([ '>' ]);
         expect(externalId.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
      });

      it('does a simple parse', () => {
         // delete the things that our mocking of declaration will not return
         delete notationPToken.open;
         delete notationPToken.postOpenSpace;
         delete notationPToken.declType;
         delete notationPToken.postDeclTypeSpace;
         const mockSource = new MockSTokenSource([
            'notationName',
            ' ',
            // Skipping externalId parsing here
            ' ',
            '>',
         ], 11, 0, 11);

         notationDeclaration.parse(mockSource, {
            type: notationPToken.type,
         }, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(notationPToken);
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         spyOn(declaration, 'checkWellFormed');
         spyOn(externalId, 'checkWellFormed');
         spyOn(misc, 'checkName');
         spyOn(misc, 'checkWellFormedNameRecommendation');
      });

      it('asks the declaration module to look for problems in the declaration part', () => {
         const emd = new EntityMetaData();

         notationDeclaration.checkWellFormed(notationPToken, mockErrorCollector, emd);

         expect(declaration.checkWellFormed).toHaveBeenCalledWith(notationPToken, mockErrorCollector, emd);
      });

      it('asks the externalId module to look for well formed problems', () => {
         const emd = new EntityMetaData();

         notationDeclaration.checkWellFormed(notationPToken, mockErrorCollector, emd);

         expect(externalId.checkWellFormed)
            .toHaveBeenCalledWith(notationPToken.externalId, mockErrorCollector, emd);
      });

      it('reports an error if there is no name', () => {
         delete notationPToken.name;

         notationDeclaration.checkWellFormed(notationPToken, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.NOTATIONDECL_NO_NAME,
            params: undefined,
            position: undefined,
            lastPosition: undefined,   // this would be the space after NOTATION, but it is mocked out
         });
      });

      it('calls misc.checkName() to report on bad names', () => {
         const emd = new EntityMetaData();

         notationDeclaration.checkWellFormed(notationPToken, mockErrorCollector, emd);

         expect(misc.checkName).toHaveBeenCalledWith(notationPToken.name,
            mockErrorCollector, emd, WellFormedError.ID.NOTATIONDECL_NAME_INVALID);
      });

      it('calls misc.checkWellFormedNameRecommendation() to report on bad names', () => {
         const emd = new EntityMetaData();

         notationDeclaration.checkWellFormed(notationPToken, mockErrorCollector, emd);

         expect(misc.checkWellFormedNameRecommendation).toHaveBeenCalledWith(notationPToken.name,
            mockErrorCollector, emd, XmlWarning.ID.NOTATIONDECL_NAME_XMLDASH_RESERVED,
            XmlWarning.ID.NOTATIONDECL_NAME_XML_RESERVED);
      });

      it('reports an error if there is no space after the name', () => {
         delete notationPToken.postNameSpace;

         notationDeclaration.checkWellFormed(notationPToken, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.NOTATIONDECL_NO_SPACE_AFTER_NAME,
            params: [ 'notationName' ],
            position: undefined,
            lastPosition: notationPToken.name,
         });
      });

      it('reports an error if there is no external ID', () => {
         notationPToken.externalId = undefined;

         notationDeclaration.checkWellFormed(notationPToken, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.NOTATIONDECL_NO_EXTERNALID,
            params: undefined,
            lastPosition: notationPToken.postNameSpace,
         });
      });

      it('reports an error if there was no closing', () => {
         delete notationPToken.close;

         notationDeclaration.checkWellFormed(notationPToken, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.NOTATIONDECL_NO_CLOSE,
            params: [ notationPToken.name.str ],
            position: undefined,
            lastPosition: notationPToken.postExternalIdSpace,
         });
      });

   });

   describe('pTokenToXToken()', () => {

      beforeEach(() => {
         spyOn(externalId, 'makeEntityLocation');
      });

      it('calls externalId.makeEntityLocation()', () => {
         notationDeclaration.pTokenToXToken(notationPToken);

         expect(externalId.makeEntityLocation).toHaveBeenCalledWith(notationPToken.externalId);
      });

      it('returns notation declaration token with the name from the parsing', () => {
         const token = notationDeclaration.pTokenToXToken(notationPToken);

         expect(token).toEqual(new notationDeclaration.XToken('notationName', undefined, notationPToken));
      });

      it('returns a notation declaration with a blank name if there is no name', () => {
         delete notationPToken.name;
         const token = notationDeclaration.pTokenToXToken(notationPToken);

         expect(token).toEqual(new notationDeclaration.XToken('', undefined, notationPToken));
      });

   });

});
