/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion, ProblemCollector } from 'basic';
import { STokenSource, toSToken } from 'basic';
import { parseElementEnd } from 'token';

import { warningCodes } from '../../error/warningCodes';
import { wellFormedErrorCodes, WellFormedError } from '../../error/wellFormedError';
import { elementEndCheck } from '../elementEndCheck';

const WFEID = wellFormedErrorCodes.id;
const WID = warningCodes.id;

describe('elementEndCheck() (integration)', () => {
   let confVer: ConformanceVersion;
   let source: STokenSource;

   beforeEach(() => {
      confVer = new ConformanceVersion();
      source = new STokenSource();
   });

   it('reports an error with "xml" in name (check nameXmlCheck)', (done) => {
      source.addText('xmlElementName>');
      source.endText();
      parseElementEnd(source, toSToken('</'), (pToken) => {
         const collector = new ProblemCollector(pToken.open, WellFormedError);

         elementEndCheck(pToken, collector, confVer);

         expect(collector.getProblems()[0].id).toEqual(WID.ELEMENT_NAME_XML_RESERVED);
         done();
      });
   });

   it('reports an error when name starts with "$" (check nameCheck)', (done) => {
      source.addText('$elementName>');
      source.endText();
      parseElementEnd(source, toSToken('</'), (pToken) => {
         const collector = new ProblemCollector(pToken.open, WellFormedError);

         elementEndCheck(pToken, collector, confVer);

         expect(collector.getProblems()[0].id).toEqual(WFEID.ELEMENT_NAME_INVALID);
         done();
      });
   });
});
