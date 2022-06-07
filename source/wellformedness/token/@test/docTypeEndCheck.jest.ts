/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ParamCollector } from 'basic-test';
import { toSToken } from 'sToken';
import { DocTypeEndPToken, DocTypeStartPToken } from 'token';

import { wellFormedErrorCodes } from '../../error/wellFormedError';
import { docTypeEndCheck } from '../docTypeEndCheck';

const WFEID = wellFormedErrorCodes.id;

describe('docTypeEndCheck()', () => {
   let startPToken: DocTypeStartPToken;
   let docTypeEndPToken: DocTypeEndPToken;
   let collector: ParamCollector;

   beforeEach(() => {
      collector = new ParamCollector();
      startPToken = new DocTypeStartPToken({ open: toSToken('<!'), openSubset: true });
      docTypeEndPToken = new DocTypeEndPToken({
         close: toSToken('>'),
         closeSubset: toSToken(']'),
         closeSubsetSpace: undefined,
         docTypeStartPToken: startPToken,
      });
   });

   it('returns no errors if no problems ', () => {
      docTypeEndCheck(docTypeEndPToken, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports an error if there is no close', () => {
      docTypeEndPToken = new DocTypeEndPToken({
         closeSubset: toSToken(']'),
         docTypeStartPToken: startPToken,
      });

      docTypeEndCheck(docTypeEndPToken, collector);

      // @ts-expect-error ts2339 types for matchers not right
      expect(collector).toHaveWellFormedError({
         id: WFEID.DOCTYPE_NO_CLOSE,
         lastPosition: docTypeEndPToken.closeSubset,
         params: [],
      });
   });

   it('reports an error if there is a "]", but there was no opening "["', () => {
      docTypeEndPToken = new DocTypeEndPToken({
         closeSubset: toSToken(']'),
         docTypeStartPToken: new DocTypeStartPToken({ open: toSToken('<!'), openSubset: false }),
      });

      docTypeEndCheck(docTypeEndPToken, collector);

      // @ts-expect-error ts2339 types for matchers not right
      expect(collector).toHaveWellFormedError({
         id: WFEID.DOCTYPE_INVALID_SUBSET_CLOSE,
         params: [],
         position: docTypeEndPToken.closeSubset,
      });
   });
});
