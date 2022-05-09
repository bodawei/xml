/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion } from 'basic';
import { MockErrorCollector } from 'basic-test';
import { toSToken } from 'sToken';
import { ElementEndPToken } from 'token';

import { nameCheck } from '../../common/nameCheck';
import { nameXmlCheck } from '../../common/nameXmlCheck';
import { WellFormedError } from '../../error/WellFormedError';
import { wellFormedWarningCodes } from '../../error/wellFormedWarningCodes';

import { elementEndCheck } from '../elementEndCheck';

jest.mock('../../common/nameCheck');
jest.mock('../../common/nameXmlCheck');

describe('elementEndCheck()', () => {
   let confVer: ConformanceVersion;
   let mockErrorCollector: MockErrorCollector;
   let elementEndPToken: ElementEndPToken;

   beforeEach(() => {
      elementEndPToken = new ElementEndPToken({
         open: toSToken('</'),
         openSpace: undefined,
         name: toSToken('elemName'),
         nameSpace: toSToken(' '),
         close: toSToken('>'),
      });

      confVer = new ConformanceVersion();
      mockErrorCollector = new MockErrorCollector();
   });

   it('asks the misc module to look for errors in the name', () => {
      elementEndCheck(elementEndPToken, mockErrorCollector, confVer);

      expect(nameCheck).toHaveBeenCalledWith(
         elementEndPToken.name,
         mockErrorCollector,
         confVer,
         WellFormedError.ID.ELEMENT_NAME_INVALID,
      );
   });

   it('asks the misc module to look for warnings in the name', () => {
      elementEndCheck(elementEndPToken, mockErrorCollector, confVer);

      expect(nameXmlCheck).toHaveBeenCalledWith(
         elementEndPToken.name,
         mockErrorCollector,
         confVer,
         'ELEMENT',
         wellFormedWarningCodes.id.ELEMENT_NAME_XMLCOLON_RESERVED,
         wellFormedWarningCodes.id.ELEMENT_NAME_XML_RESERVED,
      );
   });

   it('reports no errors if everything is in order', () => {
      elementEndCheck(elementEndPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports an error if there is a space after the opening "<"', () => {
      elementEndPToken = new ElementEndPToken({
         ...elementEndPToken,
         openSpace: toSToken(' '),
      });

      elementEndCheck(elementEndPToken, mockErrorCollector, confVer);

      // @ts-expect-error ts2339 types for matchers not right
      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.ELEMENT_XTRA_LEADING_SPACE,
         params: undefined,
         position: elementEndPToken.openSpace,
      });
   });

   it('reports an error if there is no elment name', () => {
      elementEndPToken = new ElementEndPToken({
         ...elementEndPToken,
         name: undefined,
      });

      elementEndCheck(elementEndPToken, mockErrorCollector, confVer);

      // @ts-expect-error ts2339 types for matchers not right
      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.ELEMENT_NO_NAME,
         params: undefined,
         lastPosition: undefined,
      });
   });

   it('reports whether there is a close', () => {
      elementEndPToken = new ElementEndPToken({
         ...elementEndPToken,
         close: undefined,
      });

      elementEndCheck(elementEndPToken, mockErrorCollector, confVer);

      // @ts-expect-error ts2339 types for matchers not right
      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.ELEMENT_NO_CLOSE,
         params: undefined,
         lastPosition: elementEndPToken.nameSpace,
      });
   });
});
