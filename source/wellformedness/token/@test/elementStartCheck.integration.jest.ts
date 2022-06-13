/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion, ProblemCollector } from 'basic';
import { STokenSource, toSToken } from 'basic';
import { ElementStartPToken, parseElementStart } from 'token';

import { wellFormedErrorCodes, WellFormedError } from '../../error/wellFormedError';
import { warningCodes } from '../../error/warningCodes';

import { elementStartCheck } from '../elementStartCheck';

const WFEID = wellFormedErrorCodes.id;
const WID = warningCodes.id;

describe('elementStartCheck() (integration)', () => {
   let source: STokenSource;
   let confVer: ConformanceVersion;
   let elementStartPToken: ElementStartPToken;

   beforeEach(() => {
      source = new STokenSource();
      elementStartPToken = new ElementStartPToken({
         close: toSToken('>'),
         name: toSToken('elemName'),
         nameSpace: toSToken(' '),
         open: toSToken('<'),
         openSpace: undefined,
      });

      confVer = new ConformanceVersion();
   });

   it('reports an error when name starts with "xml" (check misc.check...Recommendation)', (done) => {
      source.addText('xmlElementName>');
      source.endText();

      parseElementStart(source, elementStartPToken.open, (pToken) => {
         const collector = new ProblemCollector(pToken!.open, WellFormedError);

         elementStartCheck(pToken!, collector, confVer);

         expect(collector.getProblems()[0].id).toEqual(WID.ELEMENT_NAME_XML_RESERVED);
         done();
      });
   });

   it('reports an error when name starts with "$" (check nameCheck)', (done) => {
      source.addText('$elementName>');
      source.endText();

      parseElementStart(source, elementStartPToken.open, (pToken) => {
         const collector = new ProblemCollector(pToken!.open, WellFormedError);

         elementStartCheck(pToken!, collector, confVer);

         expect(collector.getProblems()[0].id).toEqual(WFEID.ELEMENT_NAME_INVALID);
         done();
      });
   });

   it('reports an error when an attribute is malformed (check checkWellFormed())', (done) => {
      source.addText('foo blah "value">');

      parseElementStart(source, elementStartPToken.open, (pToken) => {
         const collector = new ProblemCollector(pToken!.open, WellFormedError);

         elementStartCheck(pToken!, collector, confVer);

         expect(collector.getProblems()[0].id).toEqual(WFEID.ATTRIBUTE_NO_EQUAL);
         done();
      });
   });
});
