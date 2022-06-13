/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion } from 'basic';
import { ParamCollector } from 'basic-test';
import { toSToken } from 'basic';
import { ElementStartPToken } from 'token';

import { attributeCheck } from '../../common/attributeCheck';
import { nameCheck } from '../../common/nameCheck';
import { nameXmlCheck } from '../../common/nameXmlCheck';
import { elementStartCheck } from '../elementStartCheck';
import { wellFormedErrorCodes } from '../../error/wellFormedError';
import { warningCodes } from '../../error/warningCodes';

jest.mock('../../common/attributeCheck');
jest.mock('../../common/nameCheck');
jest.mock('../../common/nameXmlCheck');

const WFEID = wellFormedErrorCodes.id;
const WID = warningCodes.id;

describe('elementStartCheck()', () => {
   let confVer: ConformanceVersion;
   let collector: ParamCollector;
   let elementStartPToken: ElementStartPToken;
   let elementStartPTokenWithLeading: ElementStartPToken;

   beforeEach(() => {
      elementStartPTokenWithLeading = new ElementStartPToken({
         close: toSToken('>'),
         name: toSToken('elemName'),
         nameSpace: toSToken(' '),
         open: toSToken('<'),
         openSpace: toSToken(' '),
      });
      elementStartPToken = new ElementStartPToken({
         close: toSToken('>'),
         name: toSToken('elemName'),
         nameSpace: toSToken(' '),
         open: toSToken('<'),
         openSpace: undefined,
      });

      confVer = new ConformanceVersion();
      collector = new ParamCollector();
   });

   it('asks the misc module to look for errors in the name', () => {
      elementStartCheck(elementStartPToken, collector, confVer);

      expect(nameCheck).toHaveBeenCalledWith(
         elementStartPToken.name,
         collector,
         confVer,
         WFEID.ELEMENT_NAME_INVALID,
      );
   });

   it('asks the misc module to look for warning problems in the name', () => {
      elementStartCheck(elementStartPToken, collector, confVer);

      expect(nameXmlCheck).toHaveBeenCalledWith(
         elementStartPToken.name,
         collector,
         confVer,
         'ELEMENT',
         WID.ELEMENT_NAME_XMLCOLON_RESERVED,
         WID.ELEMENT_NAME_XML_RESERVED,
      );
   });

   it('calls attributeCheck', () => {
      const confVer = new ConformanceVersion();
      elementStartCheck(elementStartPToken, collector, confVer);

      expect(attributeCheck).toHaveBeenCalledWith(
         elementStartPToken.attributes,
         collector,
         confVer,
         elementStartPToken.nameSpace,
         'NOUN_ATTRIBUTE',
      );
   });

   it('reports no errors if everything is in order', () => {
      elementStartCheck(elementStartPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports an error if there is a space after the opening "<"', () => {
      elementStartCheck(elementStartPTokenWithLeading, collector, confVer);

      // @ts-expect-error ts2339 types for matchers not right
      expect(collector).toHaveWellFormedError({
         id: WFEID.ELEMENT_XTRA_LEADING_SPACE,
         params: [],
         position: elementStartPTokenWithLeading.openSpace,
      });
   });

   it('reports an error if there is no elment name', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      (elementStartPToken as any).name = undefined;

      elementStartCheck(elementStartPToken, collector, confVer);

      // @ts-expect-error ts2339 types for matchers not right
      expect(collector).toHaveWellFormedError({
         id: WFEID.ELEMENT_NO_NAME,
         lastPosition: undefined,
         params: [],
      });
   });

   it('reports whether there is a close', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      (elementStartPToken as any).close = undefined;

      elementStartCheck(elementStartPToken, collector, confVer);

      // @ts-expect-error ts2339 types for matchers not right
      expect(collector).toHaveWellFormedError({
         id: WFEID.ELEMENT_NO_CLOSE,
         lastPosition: elementStartPToken.nameSpace,
         params: [],
      });
   });
});
