/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../../basic';
import { ErrorCollector, WellFormedError, XmlWarning } from '../../error';
import { defaultExtractors } from '../../extractor';
import { STokenSource } from '../../sToken';

import * as instruction from './instruction.js';

describe('instruction (integration)', () => {

   describe('checkWellFormed()', () => {
      let ec;
      let emd;
      let source;

      beforeEach(() => {
         emd = new EntityMetaData();
         source = new STokenSource(defaultExtractors, emd);
         ec = new ErrorCollector(undefined, WellFormedError);
      });

      it('reports if the target has invalid text (checking misc.checkWellFormedText)', (done) => {
         source.addText('f\u0000o asdf ?>');
         source.endText();

         instruction.parse(source, {}, (parsing) => {
            instruction.checkWellFormed(parsing, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
            done();
         });
      });

      it('reports if the target violates checkWellFormedNameRecommendation())', (done) => {
         source.addText('xml-foo asdf ?>');
         source.endText();

         instruction.parse(source, {}, (parsing) => {
            instruction.checkWellFormed(parsing, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(XmlWarning.ID.PI_TARGET_XML_RESERVED);
            done();
         });
      });

   });

});
