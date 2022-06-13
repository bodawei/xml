/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion } from 'basic';
import { ParamCollector } from 'basic-test';
import { toSToken } from 'basic';
import { CdataPToken } from 'token';

import { charCheck } from '../../common/charCheck';
import { wellFormedErrorCodes } from '../../error/wellFormedError';

import { cdataCheck } from '../cdataCheck';

jest.mock('../../common/charCheck');

const WFEID = wellFormedErrorCodes.id;

describe('cdataCheck()', () => {
   let collector: ParamCollector;
   let confVer: ConformanceVersion;
   let cdataPToken: CdataPToken;

   beforeEach(() => {
      cdataPToken = new CdataPToken({
         bracket: toSToken('['),
         close: toSToken(']]>'),
         open: toSToken('<!['),
         sectionType: toSToken('CDATA'),
         text: toSToken('test text'),
      });
      collector = new ParamCollector();
      confVer = new ConformanceVersion();
   });

   it('checks the text is well formed', () => {
      cdataCheck(cdataPToken, collector, confVer);

      expect(charCheck).toHaveBeenCalledWith(cdataPToken.text, collector, confVer, false);
   });

   it('reports an error if there is no section type provided', () => {
      cdataPToken = new CdataPToken({
         open: toSToken('<!['),
         bracket: toSToken('['),
         text: toSToken('test text'),
         close: toSToken(']]>'),
      });

      cdataCheck(cdataPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.CDATA_NO_TYPE,
         lastPosition: cdataPToken.open,
         params: [],
         position: undefined,
      });
   });

   it('reports an error if the type is not capitalized', () => {
      cdataPToken = new CdataPToken({
         open: toSToken('<!['),
         sectionType: toSToken('cdata'),
         bracket: toSToken('['),
         text: toSToken('test text'),
         close: toSToken(']]>'),
      });

      cdataCheck(cdataPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.CDATA_INVALID_CASE,
         params: ['CDATA', 'cdata'],
         position: cdataPToken.sectionType,
      });
   });

   it('reports an error if there is a no bracket after the type', () => {
      cdataPToken = new CdataPToken({
         open: toSToken('<!['),
         sectionType: toSToken('CDATA'),
         text: toSToken('test text'),
         close: toSToken(']]>'),
      });

      cdataCheck(cdataPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.CDATA_NO_SECOND_BRACKET,
         lastPosition: cdataPToken.sectionType,
         params: ['CDATA'],
      });
   });

   it('reports an error if there is a space after the <![', () => {
      cdataPToken = new CdataPToken({
         open: toSToken('<!['),
         openSpace: toSToken(' '),
         sectionType: toSToken('CDATA'),
         bracket: toSToken('['),
         text: toSToken('test text'),
         close: toSToken(']]>'),
      });

      cdataCheck(cdataPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.CDATA_XTRA_SPACE_AFTER_OPEN,
         params: ['CDATA'],
         position: cdataPToken.openSpace,
      });
   });

   it('reports an error if there is a space after the section type', () => {
      cdataPToken = new CdataPToken({
         open: toSToken('<!['),
         sectionType: toSToken('CDATA'),
         sectionTypeSpace: toSToken(' '),
         bracket: toSToken('['),
         text: toSToken('test text'),
         close: toSToken(']]>'),
      });

      cdataCheck(cdataPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.CDATA_XTRA_SPACE_AFTER_TYPE,
         params: ['CDATA'],
         position: cdataPToken.sectionTypeSpace,
      });
   });

   it('reports an error if there is no close', () => {
      cdataPToken = new CdataPToken({
         open: toSToken('<!['),
         sectionType: toSToken('CDATA'),
         bracket: toSToken('['),
         text: toSToken('test text'),
      });

      cdataCheck(cdataPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.CDATA_NO_CLOSE,
         lastPosition: cdataPToken.text,
         params: [],
      });
   });
});
