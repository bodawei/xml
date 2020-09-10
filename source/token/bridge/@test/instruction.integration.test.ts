/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { ErrorCollector, WellFormedError } from 'error';
import { defaultExtractors } from 'extractor';
import { TextDeclarationPToken, XmlDeclarationPToken } from 'pToken';
import { STokenSource, SToken } from 'sToken';

import { parseInstruction } from '../instruction';
import { ProcessingInstructionPToken } from 'source/token/processingInstruction';

describe('instruction (integration)', () => {

   describe('parseInstruction()', () => {
      let ec: ErrorCollector;
      let source: STokenSource;
      let start: SToken;

      it('parses an xml declaration', () => {
         source = new STokenSource(defaultExtractors);
         ec = new ErrorCollector(undefined as any, WellFormedError);
         start = SToken.fromString('<?');
      });

      it('parses an XML Declaration', (done) => {
         source = new STokenSource(defaultExtractors);
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
         source = new STokenSource(defaultExtractors);
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
         source = new STokenSource(defaultExtractors);
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
