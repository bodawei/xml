/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { WellFormedError } from '../error';
import { MockErrorCollector } from '../error/test';
import { makeLTokenMaker, MockLTokenSource } from '../lToken/test';

import * as misc from './common/misc.js';
import * as cdata from './cdata.js';
import * as envelope from './envelope.js';

describe('cdata', () => {
   let parsedEnvelope;
   let parsedCdata;

   beforeEach(() => {
      const expectedLToken = makeLTokenMaker();
      parsedEnvelope = {
      };
      parsedCdata = {
         type: 'CDATA',
         text: expectedLToken('test text'),
         close: expectedLToken(']]>'),
      };
   });

   describe('parse()', () => {
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('returns simple values', () => {
         const mockSource = new MockLTokenSource([
            [ 'test text', 'all', [ ']]>' ] ],
            [ ']]>', 'match', ']]>' ],
         ]);

         cdata.parse(mockSource, parsedEnvelope, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps(parsedCdata);
      });

      it('handles EOF', () => {
         const mockSource = new MockLTokenSource([
            undefined,
            undefined,
         ]);

         cdata.parse(mockSource, parsedEnvelope, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
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
         cdata.checkWellFormed(parsedCdata, mockErrorCollector, emd);

         expect(envelope.checkWellFormed).toHaveBeenCalledWith(parsedCdata, false, mockErrorCollector, emd);
      });

      it('checks the text is well formed', () => {
         cdata.checkWellFormed(parsedCdata, mockErrorCollector, emd);

         expect(misc.checkWellFormedText).toHaveBeenCalledWith(parsedCdata.text, mockErrorCollector, emd);
      });

      it('reports an error if there is no close', () => {
         parsedCdata.closeLToken = undefined;

         cdata.checkWellFormed(parsedCdata, mockErrorCollector, emd);

         expect(mockErrorCollector).not.toReportError({
            id: WellFormedError.ID.CDATA_NO_CLOSE,
            params: undefined,
            lastPosition: parsedCdata.text,
         });
      });

   });

   describe('makeToken()', () => {

      it('returns a token with the expected fields defined', () => {
         const token = cdata.makeToken(parsedCdata);
         const expected = new cdata.Token('test text', []);
         expected.parsed = parsedCdata;

         expect(token).toEqual(expected);
      });

   });

});
