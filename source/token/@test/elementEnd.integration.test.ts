/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from 'basic';
import { ErrorCollector, WellFormedError, XmlWarning } from 'error';
import { defaultExtractors } from 'extractor';
import { STokenSource } from 'sToken';
import { makeSTokenMaker } from 'sToken-test';

import * as elementEnd from '../elementEnd';

describe('elementEnd', () => {
   let elementEndPToken: elementEnd.ElementEndPToken;

   beforeEach(() => {
      const makeSToken = makeSTokenMaker();
      elementEndPToken = new elementEnd.ElementEndPToken({
         postOpenSpace: undefined,
         name: makeSToken('elemName'),
         postNameSpace: makeSToken(' '),
         close: makeSToken('>'),
      });
      elementEndPToken.open = makeSToken('</');
   });

   describe('parse()', () => {

      it('parses the end of the element when called', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('elemName >');
         source.endText();

         elementEnd.parse(source, elementEndPToken.open, (parsing) => {
            expect(parsing).toEqual(new elementEnd.PToken(elementEndPToken));
            done();
         });
      });

   });

   describe('checkWellFormed()', () => {
      let emd: EntityMetaData;
      let source: STokenSource;

      beforeEach(() => {
         emd = new EntityMetaData();
         source = new STokenSource(defaultExtractors, emd);
      });

      it('reports an error with "xml" in name (check misc.checkWellFormedNameRecommendation)', (done) => {
         source.addText('xmlElementName>');
         source.endText();
         elementEnd.parse(source, elementEndPToken.open, (pToken) => {
            const ec = new ErrorCollector(pToken.open, WellFormedError);

            elementEnd.checkWellFormed(pToken, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(XmlWarning.ID.ELEMENT_NAME_XML_RESERVED);
            done();
         });
      });

      it('reports an error when name starts with "$" (check misc.checkName)', (done) => {
         source.addText('$elementName>');
         source.endText();
         elementEnd.parse(source, elementEndPToken.open, (pToken) => {
            const ec = new ErrorCollector(pToken.open, WellFormedError);

            elementEnd.checkWellFormed(pToken, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ELEMENT_NAME_INVALID);
            done();
         });
      });

   });

});
