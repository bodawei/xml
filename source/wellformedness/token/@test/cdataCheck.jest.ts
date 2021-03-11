/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { MockErrorCollector } from 'basic-test';
import { toSToken } from 'sToken';
import { CdataPToken } from 'token';

import { WellFormedError } from '../../error/WellFormedError';
import * as misc from '../../../token/common/misc';

import { cdataCheck } from '../cdataCheck';

describe('cdataCheck()', () => {
   let mockErrorCollector: MockErrorCollector;
   let confVer: ConformanceVersion;
   let cdataPToken: CdataPToken;

   beforeEach(() => {
      cdataPToken = new CdataPToken({
         open: toSToken('<!['),
         sectionType: toSToken('CDATA'),
         bracket: toSToken('['),
         text: toSToken('test text'),
         close: toSToken(']]>'),
      });
      mockErrorCollector = new MockErrorCollector();
      confVer = new ConformanceVersion();
      jest.spyOn(misc, 'checkCharWellFormed');
   });

   it('checks the text is well formed', () => {
      cdataCheck(cdataPToken, mockErrorCollector, confVer);

      expect(misc.checkCharWellFormed).toHaveBeenCalledWith(
         cdataPToken.text,
         mockErrorCollector,
         confVer,
      );
   });

   it('reports an error if there is no section type provided', () => {
      cdataPToken = new CdataPToken({
         open: toSToken('<!['),
         bracket: toSToken('['),
         text: toSToken('test text'),
         close: toSToken(']]>'),
      });

      cdataCheck(cdataPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.CDATA_NO_TYPE,
         params: undefined,
         position: undefined,
         lastPosition: cdataPToken.open,
      });
   });

   it('reports an error if the type is not capitalized', () => {
      cdataPToken = new CdataPToken({
         open: toSToken('<!['),
         sectionType: toSToken('cdata'),
         bracket: toSToken('['),
         text: toSToken('test text'),
         close: toSToken(']]>'),
      });

      cdataCheck(cdataPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.CDATA_INVALID_CASE,
         params: ['CDATA', 'cdata'],
         position: cdataPToken.sectionType,
      });
   });

   it('reports an error if there is a no bracket after the type', () => {
      cdataPToken = new CdataPToken({
         open: toSToken('<!['),
         sectionType: toSToken('CDATA'),
         text: toSToken('test text'),
         close: toSToken(']]>'),
      });

      cdataCheck(cdataPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.CDATA_NO_SECOND_BRACKET,
         params: ['CDATA'],
         lastPosition: cdataPToken.sectionType,
      });
   });

   it('reports an error if there is a space after the <![', () => {
      cdataPToken = new CdataPToken({
         open: toSToken('<!['),
         openSpace: toSToken(' '),
         sectionType: toSToken('CDATA'),
         bracket: toSToken('['),
         text: toSToken('test text'),
         close: toSToken(']]>'),
      });

      cdataCheck(cdataPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.CDATA_XTRA_SPACE_AFTER_OPEN,
         params: ['CDATA'],
         position: cdataPToken.openSpace,
      });
   });

   it('reports an error if there is a space after the section type', () => {
      cdataPToken = new CdataPToken({
         open: toSToken('<!['),
         sectionType: toSToken('CDATA'),
         sectionTypeSpace: toSToken(' '),
         bracket: toSToken('['),
         text: toSToken('test text'),
         close: toSToken(']]>'),
      });

      cdataCheck(cdataPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.CDATA_XTRA_SPACE_AFTER_TYPE,
         params: ['CDATA'],
         position: cdataPToken.sectionTypeSpace,
      });
   });

   it('reports an error if there is no close', () => {
      cdataPToken = new CdataPToken({
         open: toSToken('<!['),
         sectionType: toSToken('CDATA'),
         bracket: toSToken('['),
         text: toSToken('test text'),
      });

      cdataCheck(cdataPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.CDATA_NO_CLOSE,
         params: undefined,
         lastPosition: cdataPToken.text,
      });
   });
});
