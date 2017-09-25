/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { ErrorCollector, WellFormedError } from '../error';
import { LTokenSource, defaultExtractors } from '../lToken';
import { makeLTokenMaker } from '../lToken/test';

import * as xmlDeclaration from './xmlDeclaration.js';

describe('xmlDeclaration (integration)', () => {

   describe('checkWellFormed()', () => {
      let parsed;
      let expectedLToken;
      let emd;
      let source;

      beforeEach(() => {
         expectedLToken = makeLTokenMaker();
         parsed = {
            open: expectedLToken('<?'),
            target: expectedLToken('xml'),
            postTargetSpace: expectedLToken(' '),
         };
         emd = new EntityMetaData();
         source = new LTokenSource(defaultExtractors, emd);
      });

      it('reports errors in the PI initial part (instruction.checkWellFormed())', (done) => {
         parsed.postOpenSpace = expectedLToken(' ');
         source.addText('version="1.1"?>');
         xmlDeclaration.parse(source, parsed, (result) => {
            const ec = new ErrorCollector(parsed.open, WellFormedError);

            xmlDeclaration.checkWellFormed(result, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.PI_SPACE_AFTER_OPEN);
            done();
         });
      });

      it('reports an error when a param is malformed (check attribute.checkWellFormed())', (done) => {
         source.addText('version "1.0" encoding="usascii"?>');
         xmlDeclaration.parse(source, parsed, (result) => {
            const ec = new ErrorCollector(parsed.open, WellFormedError);

            xmlDeclaration.checkWellFormed(result, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ATTRIBUTE_NO_EQUAL);
            done();
         });
      });

   });

});
