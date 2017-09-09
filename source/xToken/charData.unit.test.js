/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { MockErrorCollector } from '../error/test';
import { makeLTokenMaker, MockLTokenSource } from '../lToken/test';

import * as misc from './common/misc.js';
import * as charData from './charData.js';

describe('charData', () => {
   let parsed;
   let expectedLToken;

   beforeEach(() => {
      expectedLToken = makeLTokenMaker();
      parsed = {
         type: 'CHARDATA',
         text: expectedLToken('test text'),
      };
   });

   describe('parse()', () => {
      let mockSource;
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('returns simple values', () => {
         mockSource = new MockLTokenSource([
            'test text',
         ]);

         charData.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.argsFor(0)).toEqual([ parsed ]);
      });

      it('returns undefined if no text returned', () => {
         mockSource = new MockLTokenSource([
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

         charData.checkWellFormed(parsed, mockErrorCollector, emd);

         expect(misc.checkWellFormedText).toHaveBeenCalledWith(parsed.text, mockErrorCollector, emd);
      });

   });

   describe('makeToken()', () => {

      it('returns a token with the expected fields defined', () => {
         const token = charData.makeToken(parsed);

         expect(token).toEqual(new charData.Token('test text', [
            parsed.text,
         ]));
      });

   });

});
