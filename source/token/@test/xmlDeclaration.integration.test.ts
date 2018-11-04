/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../../basic';
import { ErrorCollector, WellFormedError } from '../../error';
import { defaultExtractors } from '../../extractor';
import { STokenSource, SToken } from '../../sToken';
import { makeSTokenMaker } from '../../sToken/@test/helper';

import { parseXmlDeclaration, XmlDeclarationPToken } from '../xmlDeclaration';
import { InstructionStart } from '../bridge/instruction';

describe('xmlDeclaration (integration)', () => {

   describe('parseXmlDeclaration()', () => {

      it('parses the input, including the parameters which use literal.parse()', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('version="1.0" encoding="ascii" ?>');
         source.endText();

         parseXmlDeclaration(source, {} as any, (parsing) => {
            expect(parsing.params[0].name.str).toEqual('version');
            done();
         });
      });

      it('converts the value from literal.parse() to a single SToken', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('version="1.0" encoding="ascii" ?>');
         source.endText();

         parseXmlDeclaration(source, {} as any, (parsing) => {
            expect(parsing.params[1].value!.str).toEqual('ascii');
            done();
         });
      });

   });

   describe('checkWellFormed()', () => {
      let emd: EntityMetaData;
      let source: STokenSource;
      let start: InstructionStart;
   
      beforeEach(() => {
         emd = new EntityMetaData();
         source = new STokenSource(defaultExtractors, emd);
         start = {
            open: SToken.fromString('<?'),
            openSpace: undefined,
            target: SToken.fromString('xml'),
            targetSpace: SToken.fromString(' '),
         };         
      });

      it('reports an error when the target text is malformed (check misc.checkWellFormedText())', (done) => {
         source.addText('version "1.0" encoding="usascii"?>');
         start.target = SToken.fromString('\u0001xml');

         parseXmlDeclaration(source, start, (result) => {
            const ec = new ErrorCollector(start.open, WellFormedError);

            result.checkWellFormed(ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
            done();
         });
      });

      it('reports an error when the param value is malformed (check misc.checkWellFormedText())', (done) => {
         source.addText('version="\u00011.0" encoding="usascii"?>');

         parseXmlDeclaration(source, start, (result) => {
            const ec = new ErrorCollector(start.open, WellFormedError);

            result.checkWellFormed(ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
            done();
         });
      });

   });

});
