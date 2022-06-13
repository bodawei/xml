/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { toSToken } from 'basic';
import { makeSTokenMaker, MockSTokenSource } from 'pToken-test';

import { SectionStart } from '../bridge/section';
import { parseCdata, CdataPToken } from '../cdata';

describe('cdata (unit)', () => {
   let sectionStart: SectionStart;
   let cDataPToken: CdataPToken;

   beforeEach(() => {
      const expectedSToken = makeSTokenMaker();
      sectionStart = {
         open: toSToken('<!['),
         sectionType: toSToken('CDATA'),
      };
      cDataPToken = new CdataPToken({
         open: toSToken('<!['),
         sectionType: toSToken('CDATA'),
         bracket: expectedSToken('['),
         text: expectedSToken('test text'),
         close: expectedSToken(']]>'),
      });
   });

   describe('parseCdata()', () => {
      let callback: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('returns simple values', () => {
         const mockSource = new MockSTokenSource([
            [ '[', 'match', '[' ],
            [ 'test text', 'all', [ ']]>' ] ],
            [ ']]>', 'match', ']]>' ],
         ]);
         delete (cDataPToken as any).sectionType;

         parseCdata(mockSource, sectionStart, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(cDataPToken);
      });

      it('handles EOF', () => {
         const mockSource = new MockSTokenSource([
            undefined,
            undefined,
            undefined,
         ]);

         parseCdata(mockSource, sectionStart, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps({
            text: undefined,
            close: undefined,
         });
      });

   });

});
