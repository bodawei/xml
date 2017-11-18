/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { MockErrorCollector } from '../error/test';
import { makeSTokenMaker, MockSTokenSource } from '../sToken/test';

import * as space from './space.js';

describe('space (unit)', () => {
   let spacePToken;
   let makeSToken;

   beforeEach(() => {
      makeSToken = makeSTokenMaker();
      spacePToken = new space.PToken({
         text: makeSToken(' '),
      });
   });

   describe('PToken', () => {

      describe('getSTokenStream()', () => {

         it('returns all the STokens', () => {
            expect(spacePToken.getSTokenArray()).toEqual([
               spacePToken.text,
            ]);
         });

      });

   });

   describe('parse()', () => {
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does a simple parse', () => {
         const mockSource = new MockSTokenSource([
            [ ' ', 'space', undefined ],
         ]);

         space.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(spacePToken);
      });

      it('copes with EOF', () => {
         spacePToken.text = undefined;
         const mockSource = new MockSTokenSource([
            [ undefined, 'space', undefined ],
         ]);

         space.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(spacePToken);
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let emd;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         emd = new EntityMetaData();
      });

      it('reports no errors when checking a good PToken', () => {
         space.checkWellFormed(spacePToken, mockErrorCollector, emd);

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

   });

   describe('pTokenToXToken()', () => {

      it('returns space token with the whitespace', () => {
         const token = space.pTokenToXToken(spacePToken);

         expect(token.text).toEqual(' ');
      });

      it('returns the text as an empty string if nothing was found in the source', () => {
         delete spacePToken.text;

         const token = space.pTokenToXToken(spacePToken);

         expect(token.text).toEqual('');
      });

   });

});
