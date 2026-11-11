/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion } from 'basic';
import { toSToken } from 'basic';
import { ParamCollector } from 'basic-test';
import { DocTypeStartPToken } from 'token';

import { externalIdCheck } from '../../common/externalIdCheck';
import { nameCheck } from '../../common/nameCheck';
import { wellFormedErrorCodes } from '../../error/wellFormedError';
import { docTypeStartCheck } from '../docTypeStartCheck';

jest.mock('../../common/nameCheck');
jest.mock('../../common/externalIdCheck');

const WFEID = wellFormedErrorCodes.id;

describe('docTypeStartCheck()', () => {
   let confVer: ConformanceVersion;
   let collector: ParamCollector;
   let docTypeStartPToken: DocTypeStartPToken;

   beforeEach(() => {
      docTypeStartPToken = new DocTypeStartPToken({
         externalId: {},
         externalIdSpace: toSToken(' '),
         name: toSToken('rootElement'),
         nameSpace: toSToken(' '),
         open: toSToken('<!'),
         openSubset: toSToken('['),
      });

      confVer = new ConformanceVersion();
      collector = new ParamCollector();
   });

   it('asks the nameCheck() to validate the name', () => {
      docTypeStartCheck(docTypeStartPToken, collector, confVer);

      expect(nameCheck).toHaveBeenCalledWith(
         docTypeStartPToken.name,
         collector,
         confVer,
         WFEID.DOCTYPE_NAME_INVALID,
      );
   });

   it('checks whether externalId is valid', () => {
      docTypeStartCheck(docTypeStartPToken, collector, confVer);

      expect(externalIdCheck).toHaveBeenCalledWith(
         docTypeStartPToken.externalId,
         false,
         collector,
         confVer,
      );
   });

   it('reports an error if there is no elment name', () => {
      docTypeStartPToken = new DocTypeStartPToken({
         externalId: {},
         externalIdSpace: toSToken(' '),
         nameSpace: toSToken(' '),
         open: toSToken('<!'),
         openSubset: toSToken('['),
      });

      docTypeStartCheck(docTypeStartPToken, collector, new ConformanceVersion());

      // @ts-expect-error ts2339 types for matchers not right
      expect(collector).toHaveWellFormedError({
         id: WFEID.DOCTYPE_NO_NAME,
         lastPosition: docTypeStartPToken.open,
         params: [],
      });
   });

   it('reports no error if there is an elment name', () => {
      docTypeStartCheck(docTypeStartPToken, collector, new ConformanceVersion());

      // @ts-expect-error ts2339 types for matchers not right
      expect(collector).not.toHaveWellFormedError({
         id: WFEID.DOCTYPE_NO_NAME,
         params: [],
         position: undefined,
      });
   });
});
