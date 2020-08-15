/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from 'basic';
import { ErrorCollector, WellFormedError } from 'error';
import { defaultExtractors } from 'extractor';
import { STokenSource, SToken } from 'sToken';
import { makeSTokenMaker } from 'sToken-test';

import { parseXmlDeclaration, XmlDeclarationPToken } from '../xmlDeclaration';
import { InstructionStart } from '../bridge/instruction';

describe('xmlDeclaration (integration)', () => {
   let start: InstructionStart;

   beforeEach(() => {
      start = {
         open: SToken.fromString('<?'),
         openSpace: undefined,
         target: SToken.fromString('xml'),
         targetSpace: SToken.fromString(' '),
      };
   });

   describe('parseXmlDeclaration()', () => {

      it('parses the input, including the parameters which use literal.parse()', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('version="1.0" encoding="ascii" ?>');
         source.endText();

         parseXmlDeclaration(source, start, (parsing) => {
            expect(parsing.params[0].name.str).toEqual('version');
            done();
         });
      });

      it('converts the value from literal.parse() to a single SToken', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('version="1.0" encoding="ascii" ?>');
         source.endText();

         parseXmlDeclaration(source, start, (parsing) => {
            expect(parsing.params[1].value!.str).toEqual('ascii');
            done();
         });
      });

   });

   describe('pToken.toSTokenArray()', () => {

      it('returns the STokens', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('version="1.0" encoding="ascii" ?>');
         source.endText();

         parseXmlDeclaration(source, start, (parsing) => {
            const result = parsing.toSTokenArray();

            expect(result[0]).toEqual(SToken.fromString('<?'));
            done();
         });
      });

   });

});
