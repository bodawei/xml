/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { WellFormedError } from '../error';
import { MockErrorCollector } from '../error/test';
import { makeSTokenMaker, MockSTokenSource } from '../sToken/test';

import * as misc from './common/misc.js';
import * as cdata from './cdata.js';
import * as envelope from './bridge/envelope.js';

describe('cdata', () => {
   let envelopePToken;
   let cDataPToken;

   beforeEach(() => {
      const expectedSToken = makeSTokenMaker();
      envelopePToken = {
      };
      cDataPToken = {
         type: 'CDATA',
         text: expectedSToken('test text'),
         close: expectedSToken(']]>'),
      };
   });

   describe('PToken', () => {

      describe('getSTokenStream()', () => {

         it('returns all the STokens', () => {
            const pToken = new cdata.PToken(envelopePToken);
            pToken.text = cDataPToken.text;
            pToken.close = cDataPToken.close;

            expect(pToken.getSTokenArray()).toEqual([
               pToken.text,
               pToken.close,
            ]);
         });

      });

   });

   describe('parse()', () => {
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('returns simple values', () => {
         const mockSource = new MockSTokenSource([
            [ 'test text', 'all', [ ']]>' ] ],
            [ ']]>', 'match', ']]>' ],
         ]);

         cdata.parse(mockSource, envelopePToken, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(cDataPToken);
      });

      it('handles EOF', () => {
         const mockSource = new MockSTokenSource([
            undefined,
            undefined,
         ]);

         cdata.parse(mockSource, envelopePToken, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps({
            text: undefined,
            close: undefined,
         });
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let emd;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         emd = new EntityMetaData();
         spyOn(envelope, 'checkWellFormed');
         spyOn(misc, 'checkWellFormedText');
      });

      it('checks the envelope is well formed', () => {
         cdata.checkWellFormed(cDataPToken, mockErrorCollector, emd);

         expect(envelope.checkWellFormed).toHaveBeenCalledWith(cDataPToken, false, mockErrorCollector, emd);
      });

      it('checks the text is well formed', () => {
         cdata.checkWellFormed(cDataPToken, mockErrorCollector, emd);

         expect(misc.checkWellFormedText).toHaveBeenCalledWith(cDataPToken.text, mockErrorCollector, emd);
      });

      it('reports an error if there is no close', () => {
         delete cDataPToken.close;

         cdata.checkWellFormed(cDataPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CDATA_NO_CLOSE,
            params: undefined,
            lastPosition: cDataPToken.text,
         });
      });

   });

   describe('pTokenToXToken()', () => {

      it('returns a token with the expected fields defined', () => {
         const token = cdata.pTokenToXToken(cDataPToken);
         const expected = new cdata.XToken('test text', cDataPToken);

         expect(token).toEqual(expected);
      });

   });

});
