/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion } from 'basic';
import { MockErrorCollector } from 'basic-test';
import { toSToken, SToken } from 'sToken';
import { DocTypeStartPToken } from 'token';

import { externalIdCheck } from '../../common/externalIdCheck';
import { WellFormedError } from '../../error/WellFormedError';
import { docTypeStartCheck } from '../docTypeStartCheck';
import { nameCheck } from '../../common/nameCheck';

jest.mock('../../common/nameCheck');
jest.mock('../../common/externalIdCheck');

describe('docTypeStartCheck()', () => {
   let confVer: ConformanceVersion;
   let mockErrorCollector: MockErrorCollector;
   let docTypeStartPToken: DocTypeStartPToken;

   beforeEach(() => {
      docTypeStartPToken = new DocTypeStartPToken({
         open: SToken.fromString('<!'),
         name: toSToken('rootElement'),
         nameSpace: toSToken(' '),
         externalId: {},
         externalIdSpace: toSToken(' '),
         openSubset: toSToken('['),
      });

      confVer = new ConformanceVersion();
      mockErrorCollector = new MockErrorCollector();
   });

   it('asks the nameCheck() to validate the name', () => {
      docTypeStartCheck(docTypeStartPToken, mockErrorCollector, confVer);

      expect(nameCheck).toHaveBeenCalledWith(
         docTypeStartPToken.name,
         mockErrorCollector,
         confVer,
         WellFormedError.ID.DOCTYPE_NAME_INVALID,
      );
   });

   it('checks whether externalId is valid', () => {
      docTypeStartCheck(docTypeStartPToken, mockErrorCollector, confVer);

      expect(externalIdCheck).toHaveBeenCalledWith(
         docTypeStartPToken.externalId,
         false,
         mockErrorCollector,
         confVer,
      );
   });

   it('reports an error if there is no elment name', () => {
      docTypeStartPToken = new DocTypeStartPToken({
         open: SToken.fromString('<!'),
         nameSpace: toSToken(' '),
         externalId: {},
         externalIdSpace: toSToken(' '),
         openSubset: toSToken('['),
      });

      docTypeStartCheck(docTypeStartPToken, mockErrorCollector, new ConformanceVersion());

      // @ts-expect-error ts2339 types for matchers not right
      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.DOCTYPE_NO_NAME,
         params: undefined,
         lastPosition: docTypeStartPToken.open,
      });
   });

   it('reports no error if there is an elment name', () => {
      docTypeStartCheck(docTypeStartPToken, mockErrorCollector, new ConformanceVersion());

      // @ts-expect-error ts2339 types for matchers not right
      expect(mockErrorCollector).not.toReportWFError({
         id: WellFormedError.ID.DOCTYPE_NO_NAME,
         params: undefined,
         position: undefined,
      });
   });
});
