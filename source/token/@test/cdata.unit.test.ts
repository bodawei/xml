/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { SToken } from 'sToken';
import { makeSTokenMaker, MockSTokenSource } from 'sToken-test';

import { SectionStart } from '../bridge/section';
import { parseCdata, CdataPToken } from '../cdata';

describe('cdata (unit)', () => {
   let sectionStart: SectionStart;
   let cDataPToken: CdataPToken;

   beforeEach(() => {
      const expectedSToken = makeSTokenMaker();
      sectionStart = {
         open: SToken.fromString('<!['),
         sectionType: SToken.fromString('CDATA'),
      };
      cDataPToken = new CdataPToken({
         open: SToken.fromString('<!['),
         sectionType: SToken.fromString('CDATA'),
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


   describe('pToken.toSTokenArray()', () => {

      it('returns all the STokens', () => {
         expect(cDataPToken.toSTokenArray()).toEqual([
            cDataPToken.open,
            cDataPToken.sectionType,
            cDataPToken.bracket,
            cDataPToken.text,
            cDataPToken.close,
         ] as Array<SToken>);
      });

   });

});
