/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { STokenSource, SToken, toSToken } from 'basic';
import { ProcessingInstructionPToken, TextDeclarationPToken, XmlDeclarationPToken } from 'pToken';

import { parseInstruction } from '../instruction';

describe('parseInstruction (integration)', () => {
   let source: STokenSource;
   let start: SToken;

   beforeEach(() => {
      source = new STokenSource();
      start = toSToken('<?');
   });

   it('parses an XML Declaration', (done) => {
      source = new STokenSource();
      source.addText('xml version="1.0" encoding="ascii"?>');
      source.endText();

      parseInstruction(source, start, true, (parsing) => {
         expect(parsing).toEqualRangeless(
            new XmlDeclarationPToken({
               open: start,
               target: toSToken('xml'),
               targetSpace: toSToken(' '),
               fields: [
                  {
                     name: toSToken('version'),
                     nameSpace: undefined,
                     equal: toSToken('='),
                     equalSpace: undefined,
                     openQuote: toSToken('"'),
                     value: toSToken('1.0'),
                     closeQuote: toSToken('"'),
                     valueSpace: toSToken(' '),
                  },
                  {
                     name: toSToken('encoding'),
                     nameSpace: undefined,
                     equal: toSToken('='),
                     equalSpace: undefined,
                     openQuote: toSToken('"'),
                     value: toSToken('ascii'),
                     closeQuote: toSToken('"'),
                     valueSpace: undefined,
                  },
               ],
               close: toSToken('?>'),
            }),
         );
         done();
      });
   });

   it('parses a Text Declaration', (done) => {
      source = new STokenSource();
      source.addText('xml encoding="ascii"?>');
      source.endText();

      parseInstruction(source, start, false, (parsing) => {
         expect(parsing).toEqualRangeless(
            new TextDeclarationPToken({
               open: start,
               target: toSToken('xml'),
               targetSpace: toSToken(' '),
               fields: [
                  {
                     name: toSToken('encoding'),
                     nameSpace: undefined,
                     equal: toSToken('='),
                     equalSpace: undefined,
                     openQuote: toSToken('"'),
                     value: toSToken('ascii'),
                     closeQuote: toSToken('"'),
                     valueSpace: undefined,
                  },
               ],
               close: toSToken('?>'),
            }),
         );
         done();
      });
   });

   it('parses a ProcessingInstruction', (done) => {
      source = new STokenSource();
      source.addText('foo blah?blah?>');
      source.endText();

      parseInstruction(source, start, false, (parsing) => {
         expect(parsing).toEqualRangeless(
            new ProcessingInstructionPToken({
               open: start,
               target: toSToken('foo'),
               targetSpace: toSToken(' '),
               instruction: toSToken('blah?blah'),
               close: toSToken('?>'),
            }),
         );
         done();
      });
   });
});
