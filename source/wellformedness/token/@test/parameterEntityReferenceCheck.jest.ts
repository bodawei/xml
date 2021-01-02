/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { WellFormedError } from 'error';
import { MockErrorCollector } from 'error-test';
import { toSToken } from 'sToken';
import { ParameterEntityReferencePToken } from 'token';

import * as util from '../util/nameCheck';
import { parameterEntityReferenceCheck } from '../parameterEntityReferenceCheck';

describe('parameterEntityReferenceCheck()', () => {
   let confVer: ConformanceVersion;
   let mockErrorCollector: MockErrorCollector;
   let pePToken: ParameterEntityReferencePToken;

   beforeEach(() => {
      confVer = new ConformanceVersion();
      mockErrorCollector = new MockErrorCollector();

      pePToken = new ParameterEntityReferencePToken({
         open: toSToken('%'),
         openSpace: toSToken(' '),
         name: toSToken('entityName'),
         nameSpace: toSToken(' '),
         close: toSToken(';'),
      });

      jest.spyOn(util, 'nameCheck').mockImplementation();
   });

   it('checks that the name is a valid name ', () => {
      parameterEntityReferenceCheck(pePToken, mockErrorCollector, confVer);

      expect(util.nameCheck).toHaveBeenCalledWith(
         pePToken.name,
         mockErrorCollector,
         confVer,
         WellFormedError.ID.PEREF_NAME_INVALID,
      );
   });

   it('reports an error if there is a space after the opening % (syntax)', () => {
      parameterEntityReferenceCheck(pePToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.PEREF_XTRA_SPACE,
         params: ['entityName'],
         position: pePToken.openSpace,
      });
   });

   it('reports an error if there is no name (syntax)', () => {
      pePToken = new ParameterEntityReferencePToken({
         open: toSToken('%'),
         openSpace: undefined,
         name: undefined,
         nameSpace: undefined,
         close: toSToken(';'),
      });

      parameterEntityReferenceCheck(pePToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.PEREF_NO_NAME,
         params: undefined,
         lastPosition: pePToken.open,
      });
   });

   it('reports an error if there is a space after the entity name (syntax)', () => {
      parameterEntityReferenceCheck(pePToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.PEREF_XTRA_TRAILING_SPACE,
         params: ['entityName'],
         position: pePToken.nameSpace,
      });
   });

   it('reports an error if there was no closing (syntax)', () => {
      pePToken = new ParameterEntityReferencePToken({
         open: toSToken('%'),
         openSpace: undefined,
         name: toSToken('refName'),
         nameSpace: undefined,
         close: undefined,
      });

      parameterEntityReferenceCheck(pePToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.PEREF_NO_SEMICOLON,
         params: ['refName'],
         lastPosition: pePToken.name,
      });
   });
});
