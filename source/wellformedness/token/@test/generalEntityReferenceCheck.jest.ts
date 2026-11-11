/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { toSToken } from 'basic';
import { ParamCollector } from 'basic-test';
import { GeneralEntityReferencePToken } from 'pToken';

import * as util from '../../common/nameCheck';
import { wellFormedErrorCodes } from '../../error/wellFormedError';
import { generalEntityReferenceCheck } from '../generalEntityReferenceCheck';

const WFEID = wellFormedErrorCodes.id;

describe('generalEntityReferenceCheck()', () => {
   let confVer: ConformanceVersion;
   let collector: ParamCollector;
   let gePToken: GeneralEntityReferencePToken;

   beforeEach(() => {
      confVer = new ConformanceVersion();
      collector = new ParamCollector();

      gePToken = new GeneralEntityReferencePToken({
         close: toSToken(';'),
         name: toSToken('entityName'),
         nameSpace: toSToken(' '),
         open: toSToken('%'),
         openSpace: toSToken(' '),
      });

      jest.spyOn(util, 'nameCheck').mockImplementation();
   });

   it('checks that the name is a valid name', () => {
      generalEntityReferenceCheck(gePToken, collector, confVer);

      expect(util.nameCheck).toHaveBeenCalledWith(
         gePToken.name,
         collector,
         confVer,
         WFEID.REFERENCE_NAME_INVALID,
      );
   });

   it('reports an error if there is a space after the opening %', () => {
      generalEntityReferenceCheck(gePToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.REFERENCE_XTRA_SPACE,
         params: ['entityName'],
         position: gePToken.openSpace,
      });
   });

   it('reports an error if there is no name', () => {
      gePToken = new GeneralEntityReferencePToken({
         close: toSToken(';'),
         name: undefined,
         nameSpace: undefined,
         open: toSToken('&'),
         openSpace: undefined,
      });

      generalEntityReferenceCheck(gePToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.REFERENCE_NO_NAME,
         lastPosition: gePToken.open,
         params: [],
      });
   });

   it('reports an error if there is a space after the entity name', () => {
      generalEntityReferenceCheck(gePToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.REFERENCE_XTRA_TRAILING_SPACE,
         params: ['entityName'],
         position: gePToken.nameSpace,
      });
   });

   it('reports an error if there was no closing', () => {
      gePToken = new GeneralEntityReferencePToken({
         close: undefined,
         name: toSToken('refName'),
         nameSpace: undefined,
         open: toSToken('&'),
         openSpace: undefined,
      });

      generalEntityReferenceCheck(gePToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.REFERENCE_NO_SEMICOLON,
         lastPosition: gePToken.name,
         params: ['refName'],
      });
   });
});
