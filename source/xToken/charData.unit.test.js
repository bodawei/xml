/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { MockErrorCollector } from '../error/test';
import { makeLTokenMaker, MockLTokenSource } from '../lToken/test';

import * as misc from './common/misc.js';
import * as charData from './charData.js';

describe('charData', () => {
   let parsedCharData;

   beforeEach(() => {
      const expectedLToken = makeLTokenMaker();
      parsedCharData = {
         type: 'CHARDATA',
         text: expectedLToken('test text'),
      };
   });

   describe('parse()', () => {
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('returns simple values', () => {
         const mockSource = new MockLTokenSource([
            [ 'test text', 'all', [ '<', '&', ']]>' ] ],
         ]);

         charData.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps(parsedCharData);
      });

      it('responds to other terminators passed in', () => {
         const mockSource = new MockLTokenSource([
            [ 'test text', 'all', [ '<', '&', ']]>', '$' ] ],
         ]);

         charData.parse(mockSource, [ '$' ], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps(parsedCharData);
      });

      it('returns undefined if no text returned', () => {
         const mockSource = new MockLTokenSource([
            undefined,
         ]);

         charData.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            text: undefined,
         });
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

         charData.checkWellFormed(parsedCharData, mockErrorCollector, emd);

         expect(misc.checkWellFormedText).toHaveBeenCalledWith(parsedCharData.text, mockErrorCollector, emd);
      });

   });

   describe('makeToken()', () => {

      it('returns a token with the expected fields defined', () => {
         const token = charData.makeToken(parsedCharData);

         expect(token).toEqual(new charData.Token('test text', [
            parsedCharData.text,
         ]));
      });

   });

});
