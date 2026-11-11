/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion } from 'basic';
import { toSToken } from 'basic';
import { ParamCollector } from 'basic-test';
import { ElementEndPToken } from 'token';

import { nameCheck } from '../../common/nameCheck';
import { nameXmlCheck } from '../../common/nameXmlCheck';
import { warningCodes } from '../../error/warningCodes';
import { wellFormedErrorCodes } from '../../error/wellFormedError';
import { elementEndCheck } from '../elementEndCheck';

jest.mock('../../common/nameCheck');
jest.mock('../../common/nameXmlCheck');

const WFEID = wellFormedErrorCodes.id;
const WID = warningCodes.id;

describe('elementEndCheck()', () => {
   let confVer: ConformanceVersion;
   let collector: ParamCollector;
   let elementEndPToken: ElementEndPToken;

   beforeEach(() => {
      elementEndPToken = new ElementEndPToken({
         close: toSToken('>'),
         name: toSToken('elemName'),
         nameSpace: toSToken(' '),
         open: toSToken('</'),
         openSpace: undefined,
      });

      confVer = new ConformanceVersion();
      collector = new ParamCollector();
   });

   it('asks the misc module to look for errors in the name', () => {
      elementEndCheck(elementEndPToken, collector, confVer);

      expect(nameCheck).toHaveBeenCalledWith(
         elementEndPToken.name,
         collector,
         confVer,
         WFEID.ELEMENT_NAME_INVALID,
      );
   });

   it('asks the misc module to look for warnings in the name', () => {
      elementEndCheck(elementEndPToken, collector, confVer);

      expect(nameXmlCheck).toHaveBeenCalledWith(
         elementEndPToken.name,
         collector,
         confVer,
         'ELEMENT',
         WID.ELEMENT_NAME_XMLCOLON_RESERVED,
         WID.ELEMENT_NAME_XML_RESERVED,
      );
   });

   it('reports no errors if everything is in order', () => {
      elementEndCheck(elementEndPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports an error if there is a space after the opening "<"', () => {
      elementEndPToken = new ElementEndPToken({
         ...elementEndPToken,
         openSpace: toSToken(' '),
      });

      elementEndCheck(elementEndPToken, collector, confVer);

      // @ts-expect-error ts2339 types for matchers not right
      expect(collector).toHaveWellFormedError({
         id: WFEID.ELEMENT_XTRA_LEADING_SPACE,
         params: [],
         position: elementEndPToken.openSpace,
      });
   });

   it('reports an error if there is no elment name', () => {
      elementEndPToken = new ElementEndPToken({
         ...elementEndPToken,
         name: undefined,
      });

      elementEndCheck(elementEndPToken, collector, confVer);

      // @ts-expect-error ts2339 types for matchers not right
      expect(collector).toHaveWellFormedError({
         id: WFEID.ELEMENT_NO_NAME,
         lastPosition: undefined,
         params: [],
      });
   });

   it('reports whether there is a close', () => {
      elementEndPToken = new ElementEndPToken({
         ...elementEndPToken,
         close: undefined,
      });

      elementEndCheck(elementEndPToken, collector, confVer);

      // @ts-expect-error ts2339 types for matchers not right
      expect(collector).toHaveWellFormedError({
         id: WFEID.ELEMENT_NO_CLOSE,
         lastPosition: elementEndPToken.nameSpace,
         params: [],
      });
   });
});
