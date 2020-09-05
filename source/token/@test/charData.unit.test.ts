/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { ConformanceVersion } from 'basic';
import { MockErrorCollector } from'error-test';
import { makeSTokenMaker, MockSTokenSource } from 'sToken-test';

import misc from '../common/misc';
import { CharDataPToken, CharDataXToken, parseCharData } from '../charData';

describe('charData', () => {
   let charDataPToken: CharDataPToken;

   beforeEach(() => {
      const expectedSToken = makeSTokenMaker();
      charDataPToken = new CharDataPToken({
         text: expectedSToken('test text'),
      });
   });

   describe('parse()', () => {
      let callback: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('returns simple values', () => {
         const mockSource = new MockSTokenSource([
            [ 'test text', 'all', [ '<', '&', ']]>' ] ],
         ]);

         parseCharData(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(charDataPToken);
      });

      it('responds to other terminators passed in', () => {
         const mockSource = new MockSTokenSource([
            [ 'test text', 'all', [ '<', '&', ']]>', '$' ] ],
         ]);

         parseCharData(mockSource, [ '$' ], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(charDataPToken);
      });

      it('returns undefined if no text returned', () => {
         const mockSource = new MockSTokenSource([
            undefined,
         ]);

         parseCharData(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.argsFor(0)).toEqual([ undefined ]);
      });

      it('returns a PToken that can provide the STokens', () => {
         const mockSource = new MockSTokenSource([
            'test text',
         ]);

         parseCharData(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.argsFor(0)[0].toSTokenArray()).toEqual([
            charDataPToken.text,
         ]);
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector: MockErrorCollector;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         spyOn(misc, 'checkCharWellFormed');
      });

      it('asks the checks the text is well formed', () => {
         const confVer = new ConformanceVersion();

         charDataPToken.checkWellFormed(mockErrorCollector, confVer);

         expect(misc.checkCharWellFormed).toHaveBeenCalledWith(charDataPToken.text, mockErrorCollector, confVer);
      });

   });

   describe('pTokenToXToken()', () => {

      it('returns a token with the expected fields defined', () => {
         const token = charDataPToken.toXToken();

         expect(token).toEqual(new CharDataXToken('test text', charDataPToken));
      });

   });

});
