/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { ConformanceVersion } from 'basic';
import { ErrorCollector, WellFormedError, XmlWarning } from 'error';
import { defaultExtractors } from 'extractor';
import { STokenSource, SToken } from 'sToken';
import { makeSTokenMaker } from 'sToken-test';

import { ElementEndPToken, parseElementEnd } from '../elementEnd';

describe('elementEnd (integration)', () => {
   let elementEndPToken: ElementEndPToken;

   beforeEach(() => {
      const makeSToken = makeSTokenMaker();
      elementEndPToken = new ElementEndPToken({
         open: SToken.fromString('<'),
         openSpace: undefined,
         name: makeSToken('elemName'),
         nameSpace: makeSToken(' '),
         close: makeSToken('>'),
      });
      (elementEndPToken as any).open = makeSToken('</');
   });

   describe('parse()', () => {

      it('parses the end of the element when called', (done) => {
         const source = new STokenSource(defaultExtractors);
         source.addText('elemName >');
         source.endText();

         parseElementEnd(source, elementEndPToken.open, (parsing) => {
            expect(parsing).toEqual(new ElementEndPToken(elementEndPToken));
            done();
         });
      });

   });

   describe('checkWellFormed()', () => {
      let confVer: ConformanceVersion;
      let source: STokenSource;

      beforeEach(() => {
         confVer = new ConformanceVersion();
         source = new STokenSource(defaultExtractors);
      });

      it('reports an error with "xml" in name (check misc.checkWellFormedNameRecommendation)', (done) => {
         source.addText('xmlElementName>');
         source.endText();
         parseElementEnd(source, elementEndPToken.open, (pToken) => {
            const ec = new ErrorCollector(pToken.open, WellFormedError);

            pToken.checkWellFormed(ec, confVer);

            expect(ec.getErrors()[0].id).toEqual(XmlWarning.ID.ELEMENT_NAME_XML_RESERVED);
            done();
         });
      });

      it('reports an error when name starts with "$" (check misc.checkName)', (done) => {
         source.addText('$elementName>');
         source.endText();
         parseElementEnd(source, elementEndPToken.open, (pToken) => {
            const ec = new ErrorCollector(pToken.open, WellFormedError);

            pToken.checkWellFormed(ec, confVer);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ELEMENT_NAME_INVALID);
            done();
         });
      });

   });

});
