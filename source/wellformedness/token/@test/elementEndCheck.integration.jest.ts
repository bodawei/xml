/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion, ErrorCollector, XmlWarning } from 'basic';
import { defaultExtractors } from 'extractor';
import { STokenSource, toSToken } from 'sToken';
import { parseElementEnd } from 'token';

import { WellFormedError } from '../../error/WellFormedError';

import { elementEndCheck } from '../elementEndCheck';

describe('elementEndCheck() (integration)', () => {
   let confVer: ConformanceVersion;
   let source: STokenSource;

   beforeEach(() => {
      confVer = new ConformanceVersion();
      source = new STokenSource(defaultExtractors);
   });

   it('reports an error with "xml" in name (check nameXmlCheck)', (done) => {
      source.addText('xmlElementName>');
      source.endText();
      parseElementEnd(source, toSToken('</'), (pToken) => {
         const ec = new ErrorCollector(pToken.open, WellFormedError);

         elementEndCheck(pToken, ec, confVer);

         expect(ec.getErrors()[0].id).toEqual(XmlWarning.ID.ELEMENT_NAME_XML_RESERVED);
         done?.();
      });
   });

   it('reports an error when name starts with "$" (check nameCheck)', (done) => {
      source.addText('$elementName>');
      source.endText();
      parseElementEnd(source, toSToken('</'), (pToken) => {
         const ec = new ErrorCollector(pToken.open, WellFormedError);

         elementEndCheck(pToken, ec, confVer);

         expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ELEMENT_NAME_INVALID);
         done?.();
      });
   });
});
