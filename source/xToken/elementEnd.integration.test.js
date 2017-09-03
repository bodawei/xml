/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData, ErrorCollector } from '../basic';
import { WellFormedError, XmlWarning } from '../error';
import { LTokenSource, defaultExtractors } from '../lToken';
import { makeLTokenMaker } from '../lToken/test';

import * as elementEnd from './elementEnd.js';

describe('elementEnd', () => {

   describe('checkWellFormed()', () => {
      let open;
      let expectedLToken;
      let emd;
      let source;

      beforeEach(() => {
         expectedLToken = makeLTokenMaker();
         open = expectedLToken('</');
         emd = new EntityMetaData();
         source = new LTokenSource(defaultExtractors, emd);
      });

      it('reports an error when name starts with "xml" (check misc callthrough)', (done) => {
         source.addText('xmlElementName>');
         source.endText();
         elementEnd.parse(source, open, (parsed) => {
            const ec = new ErrorCollector(parsed.open, WellFormedError);

            elementEnd.checkWellFormed(parsed, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(XmlWarning.ID.ELEMENT_NAME_XML_RESERVED);
            done();
         });
      });

   });

});
