/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { ErrorCollector, WellFormedError, XmlWarning } from '../error';
import { LTokenSource, defaultExtractors } from '../lToken';
import { makeLTokenMaker } from '../lToken/test';

import * as elementEnd from './elementEnd.js';

describe('elementEnd', () => {
   let elementEndParsed;

   beforeEach(() => {
      const sourceLToken = makeLTokenMaker();
      elementEndParsed = {
         type: 'ELEMENT_END',
         postOpenSpace: undefined,
         name: sourceLToken('elemName'),
         postNameSpace: sourceLToken(' '),
         close: sourceLToken('>'),
      };
      elementEndParsed.open = sourceLToken('</');
   });

   describe('parse()', () => {

      it('parses the end of the element when called', (done) => {
         const source = new LTokenSource(defaultExtractors, new EntityMetaData());
         source.addText('elemName >');
         source.endText();

         elementEnd.parse(source, elementEndParsed.open, (parsing) => {
            expect(parsing).toEqual(elementEndParsed);
            done();
         });
      });

   });

   describe('checkWellFormed()', () => {
      let emd;
      let source;

      beforeEach(() => {
         emd = new EntityMetaData();
         source = new LTokenSource(defaultExtractors, emd);
      });

      it('reports an error with "xml" in name (check misc.checkWellFormedNameRecommendation)', (done) => {
         source.addText('xmlElementName>');
         source.endText();
         elementEnd.parse(source, elementEndParsed.open, (parsed) => {
            const ec = new ErrorCollector(parsed.open, WellFormedError);

            elementEnd.checkWellFormed(parsed, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(XmlWarning.ID.ELEMENT_NAME_XML_RESERVED);
            done();
         });
      });

      it('reports an error when name starts with "$" (check misc.checkName)', (done) => {
         source.addText('$elementName>');
         source.endText();
         elementEnd.parse(source, elementEndParsed.open, (parsed) => {
            const ec = new ErrorCollector(parsed.open, WellFormedError);

            elementEnd.checkWellFormed(parsed, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ELEMENT_NAME_INVALID);
            done();
         });
      });

   });

});
