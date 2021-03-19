/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { MockErrorCollector } from 'basic-test';
import { GeneralEntityReferencePToken } from 'pToken';
import { toSToken } from 'sToken';

import * as util from '../../common/nameCheck';
import { WellFormedError } from '../../error/WellFormedError';

import { generalEntityReferenceCheck } from '../generalEntityReferenceCheck';

describe('generalEntityReferenceCheck()', () => {
   let confVer: ConformanceVersion;
   let mockErrorCollector: MockErrorCollector;
   let gePToken: GeneralEntityReferencePToken;

   beforeEach(() => {
      confVer = new ConformanceVersion();
      mockErrorCollector = new MockErrorCollector();

      gePToken = new GeneralEntityReferencePToken({
         open: toSToken('%'),
         openSpace: toSToken(' '),
         name: toSToken('entityName'),
         nameSpace: toSToken(' '),
         close: toSToken(';'),
      });

      jest.spyOn(util, 'nameCheck').mockImplementation();
   });

   it('checks that the name is a valid name', () => {
      generalEntityReferenceCheck(gePToken, mockErrorCollector, confVer);

      expect(util.nameCheck).toHaveBeenCalledWith(
         gePToken.name,
         mockErrorCollector,
         confVer,
         WellFormedError.ID.REFERENCE_NAME_INVALID,
      );
   });

   it('reports an error if there is a space after the opening %', () => {
      generalEntityReferenceCheck(gePToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.REFERENCE_XTRA_SPACE,
         params: ['entityName'],
         position: gePToken.openSpace,
      });
   });

   it('reports an error if there is no name', () => {
      gePToken = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         openSpace: undefined,
         name: undefined,
         nameSpace: undefined,
         close: toSToken(';'),
      });

      generalEntityReferenceCheck(gePToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.REFERENCE_NO_NAME,
         params: undefined,
         lastPosition: gePToken.open,
      });
   });

   it('reports an error if there is a space after the entity name', () => {
      generalEntityReferenceCheck(gePToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.REFERENCE_XTRA_TRAILING_SPACE,
         params: ['entityName'],
         position: gePToken.nameSpace,
      });
   });

   it('reports an error if there was no closing', () => {
      gePToken = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         openSpace: undefined,
         name: toSToken('refName'),
         nameSpace: undefined,
         close: undefined,
      });

      generalEntityReferenceCheck(gePToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.REFERENCE_NO_SEMICOLON,
         params: ['refName'],
         lastPosition: gePToken.name,
      });
   });
});
