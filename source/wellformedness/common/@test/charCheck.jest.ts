/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { MockErrorCollector } from 'basic-test';
import { toSToken } from 'sToken';

import { WellFormedError } from '../../error/WellFormedError';
import { wellFormedWarningCodes } from '../../error/wellFormedWarningCodes';

import { charCheck } from '../charCheck';

describe('charCheck()', () => {
   let mockErrorCollector: MockErrorCollector;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();
   });

   it('adds no errors if an SToken is not passed in', () => {
      charCheck(undefined, mockErrorCollector, new ConformanceVersion(), false);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports no errors if the SToken has no bad errors', () => {
      charCheck(toSToken('foo'), mockErrorCollector, new ConformanceVersion(), false);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports an error if the SToken has bad characters', () => {
      const sToken = toSToken('b\u0001x\u0000x\uFDD1x\uFDD2xx');

      charCheck(sToken, mockErrorCollector, new ConformanceVersion(), false);

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.CHARDATA_INVALID_CHAR,
         params: ['1, 3'],
         position: undefined,
      });
   });

   it('reports an error if the 1.1 SToken has bad characters that are only bad in version 1.1', () => {
      const sToken = toSToken('bad\u007F');

      charCheck(sToken, mockErrorCollector, new ConformanceVersion(1.1, 2), false);

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.CHARDATA_INVALID_CHAR,
         params: ['3'],
         position: undefined,
      });
   });

   it('reports no error on a second pass token if the 1.1 SToken has characters that are only bad in the first pass', () => {
      const sToken = toSToken('bad\u007F');

      charCheck(sToken, mockErrorCollector, new ConformanceVersion(1.1, 2), true);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports an error on a second pass token if the 1.1 SToken has has characters that are not valid on a second pass', () => {
      const sToken = toSToken('bad\u0000');

      charCheck(sToken, mockErrorCollector, new ConformanceVersion(1.1, 2), true);

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.CHARDATA_INVALID_CHAR,
         params: ['3'],
         position: undefined,
      });
   });

   it('reports no error if the 1.0 SToken has bad characters that are only bad in version 1.1', () => {
      const sToken = toSToken('bad\u007F');

      charCheck(sToken, mockErrorCollector, new ConformanceVersion(1.0, 5), false);

      expect(mockErrorCollector.errors.length).toEqual(1);
      expect(mockErrorCollector.errors[0].id).not.toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
   });

   it('reports a warning if the SToken has discouraged characters', () => {
      const sToken = toSToken('b\u0001x\u0000x\uFDD1x\uFDD2xx');

      charCheck(sToken, mockErrorCollector, new ConformanceVersion(), false);

      expect(mockErrorCollector).toReportWarning({
         id: wellFormedWarningCodes.id.CHARDATA_DISCOURAGED_CHAR,
         params: ['5, 7'],
         position: undefined,
      });
   });

   it('reports a warning if the 1.0/1 SToken has chars that are only discouraged in version 1.0/>2', () => {
      const sToken = toSToken('bad\u007F');

      charCheck(sToken, mockErrorCollector, new ConformanceVersion(1.0, 1), false);

      expect(mockErrorCollector.errors.length).toEqual(0);
   });

   it('reports a warning if the 1.0/2 SToken has chars that are only discouraged in version 1.0/>2', () => {
      const sToken = toSToken('bad\u007F');

      charCheck(sToken, mockErrorCollector, new ConformanceVersion(1.0, 2), false);

      expect(mockErrorCollector.errors.length).toEqual(0);
   });

   it('reports no warning if the 1.0/3 SToken has chars that are only discouraged in version 1.0/5', () => {
      const sToken = toSToken('bad\uFDEF');

      charCheck(sToken, mockErrorCollector, new ConformanceVersion(1.0, 3), false);

      expect(mockErrorCollector.errors.length).toEqual(0);
   });

   it('reports a warning if the 1.0/5 SToken has chars that are only discouraged in version 1.0/5', () => {
      const sToken = toSToken('bad\uFDEF');

      charCheck(sToken, mockErrorCollector, new ConformanceVersion(1.0, 5), false);

      expect(mockErrorCollector).toReportWarning({
         id: wellFormedWarningCodes.id.CHARDATA_DISCOURAGED_CHAR,
         params: ['3'],
         position: undefined,
      });
   });

   it('reports a warning if the 1.0 SToken has chars that are only discouraged in version 1.0', () => {
      const sToken = toSToken('bad\u007F');

      charCheck(sToken, mockErrorCollector, new ConformanceVersion(1.0, 5), false);

      expect(mockErrorCollector).toReportWarning({
         id: wellFormedWarningCodes.id.CHARDATA_DISCOURAGED_CHAR,
         params: ['3'],
         position: undefined,
      });
   });

   it('reports a warning if the 1.1 SToken has chars that are only discouraged in version 1.0', () => {
      const sToken = toSToken('bad\u007F');

      charCheck(sToken, mockErrorCollector, new ConformanceVersion(1.1, 2), false);

      expect(mockErrorCollector.errors.length).toEqual(1);
      expect(mockErrorCollector.errors[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
   });

   it('reports an error if there is a lone surrogate character in the input string', () => {
      const sToken = toSToken('bad\uD801x');

      charCheck(sToken, mockErrorCollector, new ConformanceVersion(1.1, 2), false);

      expect(mockErrorCollector.errors.length).toEqual(1);
      expect(mockErrorCollector.errors[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
   });

   it('reports an error if the input string consists of a single longe surrogate', () => {
      const sToken = toSToken('\uD801');

      charCheck(sToken, mockErrorCollector, new ConformanceVersion(1.1, 2), false);

      expect(mockErrorCollector.errors.length).toEqual(1);
      expect(mockErrorCollector.errors[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
   });
});
