/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { EntityMetaData } from 'basic';
import { WellFormedError } from 'error';
import { MockErrorCollector } from'error-test';
import { SToken } from 'sToken';
import { makeSTokenMaker, MockSTokenSource } from 'sToken-test';

import misc from '../common/misc';
import { SectionStart } from '../bridge/section';
import { parseCdata, CdataXToken, CdataPToken } from '../cdata';

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

   describe('pToken.checkWellFormed()', () => {
      let mockErrorCollector: MockErrorCollector;
      let emd: EntityMetaData;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         emd = new EntityMetaData();
         spyOn(misc, 'checkWellFormedText');
      });

      it('checks the text is well formed', () => {
         cDataPToken.checkWellFormed(mockErrorCollector, emd);

         expect(misc.checkWellFormedText).toHaveBeenCalledWith(cDataPToken.text, mockErrorCollector, emd);
      });

      it('calls misc.checkWellFormedText() on the type', () => {
         cDataPToken.checkWellFormed(mockErrorCollector, emd);

         expect(misc.checkWellFormedText)
            .toHaveBeenCalledWith(cDataPToken.sectionType, mockErrorCollector, emd);
      });

      it('reports an error if there is no section type provided', () => {
         delete (cDataPToken as any).sectionType;

         cDataPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CDATA_NO_TYPE,
            params: undefined,
            position: undefined,
            lastPosition: cDataPToken.open,
         });
      });

      it('reports an error if the type is not capitalized', () => {
         (cDataPToken as any).sectionType.str = 'cdata';

         cDataPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CDATA_INVALID_CASE,
            params: [ 'CDATA', 'cdata' ],
            position: cDataPToken.sectionType,
         });
      });

      it('reports an error if there is a no bracket after the type', () => {
         delete (cDataPToken as any).bracket;

         cDataPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CDATA_NO_SECOND_BRACKET,
            params: [ 'CDATA' ],
            lastPosition: cDataPToken.sectionType,
         });
      });

      it('reports an error if there is a space after the <![', () => {
         (cDataPToken as any).openSpace = SToken.fromString(' ');

         cDataPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CDATA_XTRA_SPACE_AFTER_OPEN,
            params: [ 'CDATA' ],
            position: cDataPToken.openSpace,
         });
      });

      it('reports an error if there is a space after the section type', () => {
         (cDataPToken as any).sectionTypeSpace = SToken.fromString(' ');

         cDataPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CDATA_XTRA_SPACE_AFTER_TYPE,
            params: [ 'CDATA' ],
            position: cDataPToken.sectionTypeSpace,
         });
      });

      it('reports an error if there is no close', () => {
         delete (cDataPToken as any).close;

         cDataPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CDATA_NO_CLOSE,
            params: undefined,
            lastPosition: cDataPToken.text,
         });
      });

   });

   describe('pToken.toXToken()', () => {

      it('returns a token with the expected fields defined', () => {
         const token = cDataPToken.toXToken();
         const expected = new CdataXToken('test text', cDataPToken);

         expect(token).toEqual(expected);
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
