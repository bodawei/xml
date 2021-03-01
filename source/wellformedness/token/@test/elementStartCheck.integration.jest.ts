/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion, ErrorCollector, XmlWarning } from 'basic';
import { defaultExtractors } from 'extractor';
import { STokenSource, toSToken } from 'sToken';
import { ElementStartPToken, parseElementStart } from 'token';

import { WellFormedError } from '../../error/WellFormedError';

import { elementStartCheck } from '../elementStartCheck';

describe('elementStartCheck() (integration)', () => {
   let source: STokenSource;
   let confVer: ConformanceVersion;
   let elementStartPToken: ElementStartPToken;

   beforeEach(() => {
      source = new STokenSource(defaultExtractors);
      elementStartPToken = new ElementStartPToken({
         open: toSToken('<'),
         openSpace: undefined,
         name: toSToken('elemName'),
         nameSpace: toSToken(' '),
         close: toSToken('>'),
      });

      confVer = new ConformanceVersion();
   });

   it('reports an error when name starts with "xml" (check misc.check...Recommendation)', (done) => {
      source.addText('xmlElementName>');
      source.endText();

      parseElementStart(source, elementStartPToken.open, (pToken) => {
         const ec = new ErrorCollector(pToken!.open, WellFormedError);

         elementStartCheck(pToken!, ec, confVer);

         expect(ec.getErrors()[0].id).toEqual(XmlWarning.ID.ELEMENT_NAME_XML_RESERVED);
         done?.();
      });
   });

   it('reports an error when name starts with "$" (check misc.checkName)', (done) => {
      source.addText('$elementName>');
      source.endText();

      parseElementStart(source, elementStartPToken.open, (pToken) => {
         const ec = new ErrorCollector(pToken!.open, WellFormedError);

         elementStartCheck(pToken!, ec, confVer);

         expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ELEMENT_NAME_INVALID);
         done?.();
      });
   });

   it('reports an error when an attribute is malformed (check attribute.checkWellFormed())', (done) => {
      source.addText('foo blah "value">');

      parseElementStart(source, elementStartPToken.open, (pToken) => {
         const ec = new ErrorCollector(pToken!.open, WellFormedError);

         elementStartCheck(pToken!, ec, confVer);

         expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ATTRIBUTE_NO_EQUAL);
         done?.();
      });
   });
});
