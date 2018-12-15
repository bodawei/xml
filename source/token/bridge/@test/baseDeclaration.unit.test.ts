/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from 'basic';
import { WellFormedError } from 'error';
import { MockErrorCollector } from '../../../error/@test/helper';
import { SToken } from 'sToken';
import { makeSTokenMaker, MockSTokenSource } from '../../../sToken/@test/helper';

import declaration, { DeclarationPToken } from '../baseDeclaration';

describe('declaration (unit)', () => {
   let declarationPToken: DeclarationPToken;
   let emd: EntityMetaData;

   beforeEach(() => {
      emd = new EntityMetaData();
      const makeSToken = makeSTokenMaker();
      declarationPToken = {
         type: declaration.PTYPE,
         open: makeSToken('<!'),
         postOpenSpace: makeSToken(' '),
         declType: makeSToken('DOCTYPE'),
         postDeclTypeSpace: makeSToken(' '),
      } as any;
   });

   describe('PToken', () => {

      describe('getSTokenStream()', () => {

         it('returns all the STokens', () => {
            const pToken = new declaration.PToken(undefined, declarationPToken);

            expect(pToken.getSTokenArray()).toEqual([
               pToken.open,
               pToken.postOpenSpace,
               pToken.declType,
               pToken.postDeclTypeSpace,
            ] as Array<SToken>);
         });

      });

   });

   describe('parse()', () => {
      let mockSource: MockSTokenSource;
      let callback: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does an ordinary full parsing', () => {
         mockSource = new MockSTokenSource([
            [ ' ', 'space' ],
            [ 'DOCTYPE', 'word', [ '>' ] ],
            [ ' ', 'space' ],
         ], 2, 0, 2);

         declaration.parse(mockSource, declarationPToken.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(declarationPToken);
      });

      it('copes with EOF', () => {
         mockSource = new MockSTokenSource([
            undefined,
            undefined,
            undefined,
         ]);
         declarationPToken.postOpenSpace = undefined;
         declarationPToken.declType = undefined;
         declarationPToken.postDeclTypeSpace = undefined;

         declaration.parse(mockSource, declarationPToken.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(declarationPToken);
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector: MockErrorCollector;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         delete declarationPToken.postOpenSpace;
      });

      it('returns an an error collector', () => {
         const errors = declaration.checkWellFormed(declarationPToken, mockErrorCollector, emd);

         expect(errors).toEqual(mockErrorCollector);
      });

      it('reports an error if there is a space after the opening <!', () => {
         const makeSToken = makeSTokenMaker();
         declarationPToken.postOpenSpace = makeSToken(' ');

         declaration.checkWellFormed(declarationPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.DECL_OPEN_XTRA_SPACE_AFTER,
            params: undefined,
            position: declarationPToken.postOpenSpace,
         });
      });

      it('reports an error if there is no declaration type provided', () => {
         delete declarationPToken.declType;

         declaration.checkWellFormed(declarationPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.DECL_NO_DECLTYPE,
            params: undefined,
            position: undefined,
            lastPosition: declarationPToken.open,
         });
      });

      it('reports an error if the type is not capitalized', () => {
         (declarationPToken as any).declType.str = 'docType';

         declaration.checkWellFormed(declarationPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.DECL_DECLTYPE_INVALID_CASE,
            params: [ 'DOCTYPE', 'docType' ],
            position: declarationPToken.declType,
         });
      });

      it('reports an error if the type is not a valid type', () => {
         (declarationPToken as any).declType.str = 'BOGUSTYPE';

         declaration.checkWellFormed(declarationPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.DECL_UNKNOWN,
            params: [ 'BOGUSTYPE' ],
            position: declarationPToken.declType,
         });
      });

   });

   describe('pTokenToXToken()', () => {

      it('returns a token with the tokens found in the PToken', () => {
         const token = declaration.pTokenToXToken(declarationPToken);

         expect(token).toEqual(new declaration.XToken(declarationPToken));
      });

   });

});
