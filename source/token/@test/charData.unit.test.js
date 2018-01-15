/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { EntityMetaData } from '../../basic';
import { MockErrorCollector } from '../../error/@test/helper';
import { makeSTokenMaker, MockSTokenSource } from '../../sToken/@test/helper';

import misc from '../common/misc.js';
import * as charData from '../charData.js';

describe('charData', () => {
   let charDataPToken;

   beforeEach(() => {
      const expectedSToken = makeSTokenMaker();
      charDataPToken = {
         type: 'CHARDATA',
         text: expectedSToken('test text'),
      };
   });

   describe('parse()', () => {
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('returns simple values', () => {
         const mockSource = new MockSTokenSource([
            [ 'test text', 'all', [ '<', '&', ']]>' ] ],
         ]);

         charData.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(charDataPToken);
      });

      it('responds to other terminators passed in', () => {
         const mockSource = new MockSTokenSource([
            [ 'test text', 'all', [ '<', '&', ']]>', '$' ] ],
         ]);

         charData.parse(mockSource, [ '$' ], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(charDataPToken);
      });

      it('returns undefined if no text returned', () => {
         const mockSource = new MockSTokenSource([
            undefined,
         ]);

         charData.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps({
            text: undefined,
         });
      });

      it('returns a PToken that can provide the STokens', () => {
         const mockSource = new MockSTokenSource([
            'test text',
         ]);

         charData.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.argsFor(0)[0].getSTokenArray()).toEqual([
            charDataPToken.text,
         ]);
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         spyOn(misc, 'checkWellFormedText');
      });

      it('asks the checks the text is well formed', () => {
         const emd = new EntityMetaData();

         charData.checkWellFormed(charDataPToken, mockErrorCollector, emd);

         expect(misc.checkWellFormedText).toHaveBeenCalledWith(charDataPToken.text, mockErrorCollector, emd);
      });

   });

   describe('pTokenToXToken()', () => {

      it('returns a token with the expected fields defined', () => {
         const token = charData.pTokenToXToken(charDataPToken);

         expect(token).toEqual(new charData.XToken('test text', charDataPToken));
      });

   });

});
