/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion, XmlWarning } from 'basic';
import { MockErrorCollector } from 'basic-test';
import { toSToken } from 'sToken';
import { ElementStartPToken } from 'token';

import { WellFormedError } from '../../error/WellFormedError';
import { nameCheck } from '../util/nameCheck';
import { elementStartCheck } from '../elementStartCheck';

import misc from '../../../token/common/misc';
import attribute from '../../../token/common/attribute';

jest.mock('../util/nameCheck');
jest.mock('../../../token/common/attribute');
jest.mock('../../../token/common/misc');

describe('elementStartCheck()', () => {
   let confVer: ConformanceVersion;
   let mockErrorCollector: MockErrorCollector;
   let elementStartPToken: ElementStartPToken;
   let elementStartPTokenWithLeading: ElementStartPToken;

   beforeEach(() => {
      elementStartPTokenWithLeading = new ElementStartPToken({
         open: toSToken('<'),
         openSpace: toSToken(' '),
         name: toSToken('elemName'),
         nameSpace: toSToken(' '),
         close: toSToken('>'),
      });
      elementStartPToken = new ElementStartPToken({
         open: toSToken('<'),
         openSpace: undefined,
         name: toSToken('elemName'),
         nameSpace: toSToken(' '),
         close: toSToken('>'),
      });

      confVer = new ConformanceVersion();
      mockErrorCollector = new MockErrorCollector();

      jest.spyOn(misc, 'checkName');
      jest.spyOn(misc, 'checkWellFormedNameRecommendation');
      jest.spyOn(attribute, 'checkWellFormed');
   });

   it('asks the misc module to look for errors in the name', () => {
      elementStartCheck(elementStartPToken, mockErrorCollector, confVer);

      expect(nameCheck).toHaveBeenCalledWith(
         elementStartPToken.name,
         mockErrorCollector,
         confVer,
         WellFormedError.ID.ELEMENT_NAME_INVALID,
      );
   });

   it('asks the misc module to look for warning problems in the name', () => {
      elementStartCheck(elementStartPToken, mockErrorCollector, confVer);

      expect(misc.checkWellFormedNameRecommendation).toHaveBeenCalledWith(
         elementStartPToken.name,
         mockErrorCollector,
         confVer,
         'ELEMENT',
         XmlWarning.ID.ELEMENT_NAME_XMLCOLON_RESERVED,
         XmlWarning.ID.ELEMENT_NAME_XML_RESERVED,
      );
   });

   it('calls attribute.checkWellFormed', () => {
      const confVer = new ConformanceVersion();
      elementStartCheck(elementStartPToken, mockErrorCollector, confVer);

      expect(attribute.checkWellFormed).toHaveBeenCalledWith(
         elementStartPToken.attributes,
         mockErrorCollector,
         confVer,
         elementStartPToken.nameSpace,
         'NOUN_ATTRIBUTE',
      );
   });

   it('reports no errors if everything is in order', () => {
      elementStartCheck(elementStartPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports an error if there is a space after the opening "<"', () => {
      elementStartCheck(elementStartPTokenWithLeading, mockErrorCollector, confVer);

      // @ts-expect-error ts2339 types for matchers not right
      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.ELEMENT_XTRA_LEADING_SPACE,
         params: undefined,
         position: elementStartPTokenWithLeading.openSpace,
      });
   });

   it('reports an error if there is no elment name', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      (elementStartPToken as any).name = undefined;

      elementStartCheck(elementStartPToken, mockErrorCollector, confVer);

      // @ts-expect-error ts2339 types for matchers not right
      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.ELEMENT_NO_NAME,
         params: undefined,
         lastPosition: undefined,
      });
   });

   it('reports whether there is a close', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      (elementStartPToken as any).close = undefined;

      elementStartCheck(elementStartPToken, mockErrorCollector, confVer);

      // @ts-expect-error ts2339 types for matchers not right
      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.ELEMENT_NO_CLOSE,
         params: undefined,
         lastPosition: elementStartPToken.nameSpace,
      });
   });
});
