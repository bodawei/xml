/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData, EntityKind, EntityLocation, Range } from 'basic';
import { ErrorCollector, WellFormedError, XmlWarning } from 'error';
import { defaultExtractors } from 'extractor';
import { STokenSource, SToken } from 'sToken';

import { parseInstruction } from '../instruction';
import { TextDeclarationPToken } from 'source/token/textDeclaration';
import { XmlDeclarationPToken } from 'source/token/xmlDeclaration';
import { ProcessingInstructionPToken } from 'source/token/processingInstruction';

describe('instruction (integration)', () => {

   describe('parseInstruction()', () => {
      let ec: ErrorCollector;
      let emd: EntityMetaData;
      let source: STokenSource;
      let start: SToken;

      it('parses an xml declaration', () => {
         emd = new EntityMetaData();
         source = new STokenSource(defaultExtractors, emd);
         ec = new ErrorCollector(undefined as any, WellFormedError);
         start = SToken.fromString('<?');
      });

      it('parses an XML Declaration', (done) => {
         source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('xml version="1.0" encoding="ascii"?>');
         source.endText();

         parseInstruction(source, start, true, (parsing) => {
            expect(parsing).toEqualRangeless(new XmlDeclarationPToken({
               open: start,
               target: SToken.fromString('xml'),
               targetSpace: SToken.fromString(' '),
               params: [{
                  name: SToken.fromString('version'),
                  nameSpace: undefined,
                  equal: SToken.fromString('='),
                  equalSpace: undefined,
                  openQuote: SToken.fromString('"'),
                  value: SToken.fromString('1.0'),
                  closeQuote: SToken.fromString('"'),
                  valueSpace: SToken.fromString(' '),
               }, {
                  name: SToken.fromString('encoding'),
                  nameSpace: undefined,
                  equal: SToken.fromString('='),
                  equalSpace: undefined,
                  openQuote: SToken.fromString('"'),
                  value: SToken.fromString('ascii'),
                  closeQuote: SToken.fromString('"'),
                  valueSpace: undefined,
               }],
               close: SToken.fromString('?>'),
            }));
            done();
         });
      });

      it('parses a Text Declaration', (done) => {
         source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('xml encoding="ascii"?>');
         source.endText();

         parseInstruction(source, start, false, (parsing) => {
            expect(parsing).toEqualRangeless(new TextDeclarationPToken({
               open: start,
               target: SToken.fromString('xml'),
               targetSpace: SToken.fromString(' '),
               params: [{
                  name: SToken.fromString('encoding'),
                  nameSpace: undefined,
                  equal: SToken.fromString('='),
                  equalSpace: undefined,
                  openQuote: SToken.fromString('"'),
                  value: SToken.fromString('ascii'),
                  closeQuote: SToken.fromString('"'),
                  valueSpace: undefined,
               }],
               close: SToken.fromString('?>'),
            }));
            done();
         });
      });

      it('parses a ProcessingInstruction', (done) => {
         source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('foo blah?blah?>');
         source.endText();

         parseInstruction(source, start, false, (parsing) => {
            expect(parsing).toEqualRangeless(new ProcessingInstructionPToken({
               open: start,
               target: SToken.fromString('foo'),
               targetSpace: SToken.fromString(' '),
               instruction: SToken.fromString('blah?blah'),
               close: SToken.fromString('?>'),
            }));
            done();
         });
      });

   });

});
