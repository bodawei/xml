/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from 'basic';
import { ErrorCollector, WellFormedError } from 'error';
import { defaultExtractors } from 'extractor';
import { STokenSource, SToken } from 'sToken';
import { makeSTokenMaker } from 'sToken-test';

import { parseTextDeclaration, TextDeclarationPToken } from '../textDeclaration';
import { InstructionStart } from '../bridge/instruction';

describe('textDeclaration (integration)', () => {
   let start: InstructionStart;

   beforeEach(() => {
      beforeEach(() => {
         start = {
            open: SToken.fromString('<?'),
            openSpace: undefined,
            target: SToken.fromString('xml'),
            targetSpace: SToken.fromString(' '),
         };
      });
   });

   describe('parseXmlDeclaration()', () => {

      it('parses the input, including the parameters which use literal.parse()', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('version="1.0" encoding="ascii" ?>');
         source.endText();

         parseTextDeclaration(source, start, (parsing) => {
            expect(parsing.params[0].name.str).toEqual('version');
            done();
         });
      });

      it('converts the value from literal.parse() to a single SToken', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('version="1.0" encoding="ascii" ?>');
         source.endText();

         parseTextDeclaration(source, start, (parsing) => {
            expect(parsing.params[1].value!.str).toEqual('ascii');
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

      it('reports an error when the target text is malformed (check misc.checkCharWellFormed())', (done) => {
         source.addText('version "1.0" encoding="usascii"?>');
         start.target = SToken.fromString('\u0001xml');

         parseTextDeclaration(source, start, (result) => {
            const ec = new ErrorCollector(start.open, WellFormedError);

            result.checkWellFormed(ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
            done();
         });
      });

      it('reports an error when the param value is malformed (check misc.checkCharWellFormed())', (done) => {
         source.addText('version="\u00011.0" encoding="usascii"?>');

         parseTextDeclaration(source, start, (result) => {
            const ec = new ErrorCollector(start.open, WellFormedError);

            result.checkWellFormed(ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
            done();
         });
      });

   });

   describe('pToken.toSTokenArray()', () => {

      it('returns the STokens', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('version="1.0" encoding="ascii" ?>');
         source.endText();

         parseTextDeclaration(source, start, (parsing) => {
            const result = parsing.toSTokenArray();

            expect(result[0]).toEqual(SToken.fromString('<?'));
            done();
         });
      });

   });

});
