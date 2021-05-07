/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { ConformanceVersion } from 'basic';
import { SToken } from 'sToken';
import { makeSTokenMaker, MockSTokenSource } from 'sToken-test';

import declaration, { DeclarationPToken } from '../baseDeclaration';

describe('declaration (unit)', () => {
   let declarationPToken: DeclarationPToken;
   let confVer: ConformanceVersion;

   beforeEach(() => {
      confVer = new ConformanceVersion();
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

});
