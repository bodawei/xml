/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { MockErrorCollector } from 'basic-test';
import { toSToken, SToken } from 'sToken';
import { DocTypeEndPToken, DocTypeStartPToken } from 'token';

import { WellFormedError } from '../../error/WellFormedError';
import { docTypeEndCheck } from '../docTypeEndCheck';

import misc from '../../../token/common/misc';

jest.mock('../../../token/common/misc');

describe('docTypeEndCheck()', () => {
   let startPToken: DocTypeStartPToken;
   let docTypeEndPToken: DocTypeEndPToken;
   let mockErrorCollector: MockErrorCollector;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();
      startPToken = new DocTypeStartPToken({ open: SToken.fromString('<!'), openSubset: true });
      docTypeEndPToken = new DocTypeEndPToken({
         docTypeStartPToken: startPToken,
         closeSubset: toSToken(']'),
         closeSubsetSpace: undefined,
         close: toSToken('>'),
      });
   });

   it('returns no errors if no problems ', () => {
      docTypeEndCheck(docTypeEndPToken, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports an error if there is no close', () => {
      docTypeEndPToken = new DocTypeEndPToken({
         docTypeStartPToken: startPToken,
         closeSubset: toSToken(']'),
      });

      docTypeEndCheck(docTypeEndPToken, mockErrorCollector);

      // @ts-expect-error ts2339 types for matchers not right
      expect(mockErrorCollector).not.toReportWFError({
         id: WellFormedError.ID.DOCTYPE_NO_CLOSE,
         params: undefined,
         position: docTypeEndPToken.closeSubsetSpace,
      });
   });

   it('reports an error if there is a "]", but there was no opening "["', () => {
      docTypeEndCheck(docTypeEndPToken, mockErrorCollector);

      // @ts-expect-error ts2339 types for matchers not right
      expect(mockErrorCollector).not.toReportWFError({
         id: WellFormedError.ID.DOCTYPE_INVALID_SUBSET_CLOSE,
         params: undefined,
         position: docTypeEndPToken.closeSubsetSpace,
      });
   });

   it('reports an error if there is a "]", but there was no start token', () => {
      docTypeEndCheck(docTypeEndPToken, mockErrorCollector);

      // @ts-expect-error ts2339 types for matchers not right
      expect(mockErrorCollector).not.toReportWFError({
         id: WellFormedError.ID.DOCTYPE_INVALID_SUBSET_CLOSE,
         params: undefined,
         position: docTypeEndPToken.closeSubsetSpace,
      });
   });
});
