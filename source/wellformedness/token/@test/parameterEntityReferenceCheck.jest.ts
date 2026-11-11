/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { toSToken } from 'basic';
import { ParamCollector } from 'basic-test';
import { ParameterEntityReferencePToken } from 'pToken';
import { vi } from 'vitest';

import * as util from '../../common/nameCheck';
import { wellFormedErrorCodes } from '../../error/wellFormedError';
import { parameterEntityReferenceCheck } from '../parameterEntityReferenceCheck';

const WFEID = wellFormedErrorCodes.id;

describe('parameterEntityReferenceCheck()', () => {
   let confVer: ConformanceVersion;
   let collector: ParamCollector;
   let pePToken: ParameterEntityReferencePToken;

   beforeEach(() => {
      confVer = new ConformanceVersion();
      collector = new ParamCollector();

      pePToken = new ParameterEntityReferencePToken({
         close: toSToken(';'),
         name: toSToken('entityName'),
         nameSpace: toSToken(' '),
         open: toSToken('%'),
         openSpace: toSToken(' '),
      });

      vi.spyOn(util, 'nameCheck').mockImplementation(() => undefined);
   });

   it('checks that the name is a valid name ', () => {
      parameterEntityReferenceCheck(pePToken, collector, confVer);

      expect(util.nameCheck).toHaveBeenCalledWith(
         pePToken.name,
         collector,
         confVer,
         WFEID.PEREF_NAME_INVALID,
      );
   });

   it('reports an error if there is a space after the opening % (syntax)', () => {
      parameterEntityReferenceCheck(pePToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.PEREF_XTRA_SPACE,
         params: ['entityName'],
         position: pePToken.openSpace,
      });
   });

   it('reports an error if there is no name (syntax)', () => {
      pePToken = new ParameterEntityReferencePToken({
         close: toSToken(';'),
         name: undefined,
         nameSpace: undefined,
         open: toSToken('%'),
         openSpace: undefined,
      });

      parameterEntityReferenceCheck(pePToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.PEREF_NO_NAME,
         lastPosition: pePToken.open,
         params: [],
      });
   });

   it('reports an error if there is a space after the entity name (syntax)', () => {
      parameterEntityReferenceCheck(pePToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.PEREF_XTRA_TRAILING_SPACE,
         params: ['entityName'],
         position: pePToken.nameSpace,
      });
   });

   it('reports an error if there was no closing (syntax)', () => {
      pePToken = new ParameterEntityReferencePToken({
         close: undefined,
         name: toSToken('refName'),
         nameSpace: undefined,
         open: toSToken('%'),
         openSpace: undefined,
      });

      parameterEntityReferenceCheck(pePToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.PEREF_NO_SEMICOLON,
         lastPosition: pePToken.name,
         params: ['refName'],
      });
   });
});
