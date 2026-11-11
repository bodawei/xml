/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { gatherStreamResults } from 'basic-test';
import { toSToken, SToken, STokenSource } from 'basic';
import { XmlDeclarationPToken, XMLDECL_PTOKEN, TextPToken, ParseToken } from 'pToken';
import { ElementStartPToken } from 'token';

import { PTokenStream } from '../pTokenStream';
import { AttFixerStream } from '../AttFixerStream';

describe('AttFixerStream (integration)', () => {
   let sTokenSource: STokenSource;
   let pTokenStream: PTokenStream;
   let fixer: AttFixerStream;

   beforeEach(() => {
      sTokenSource = new STokenSource();
      pTokenStream = new PTokenStream(sTokenSource);
      fixer = new AttFixerStream();
      pTokenStream.pipe(fixer);
   });

   it('passes a non-ElementStart value through without changes', (done) => {
      sTokenSource.addText('<?xml version="1.0"?>');
      sTokenSource.endText();

      gatherStreamResults<ParseToken>(fixer, (results) => {
         const result = results.find((r) => r.type === XMLDECL_PTOKEN);

         expect(result).toEqualRangeless(
            new XmlDeclarationPToken({
               open: toSToken('<?'),
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
                     valueSpace: undefined,
                     closeQuote: toSToken('"'),
                  },
               ],
               close: toSToken('?>'),
            }),
         );
         done();
      });
   });

   it('passes an ElementStart value through with value normalized', (done) => {
      sTokenSource.addText(`<?xml version="1.0"?>
      <!DOCTYPE test [
         <!ELEMENT root ANY>
         <!ATTLIST root
            nmtok NMTOKEN #REQUIRED>
      ]>
      <root nmtok="  3   4  "/>`);
      sTokenSource.endText();

      gatherStreamResults<ParseToken>(fixer, (results) => {
         expect((results[12] as ElementStartPToken).attributes).toEqualRangeless([
            {
               name: toSToken('nmtok'),
               value: [new TextPToken({ text: new SToken('3 4', '  3   4  ', []) })],
               postNameSpace: undefined,
               equal: toSToken('='),
               postEqualSpace: undefined,
               openQuote: toSToken('"'),
               closeQuote: toSToken('"'),
               trailingSpace: undefined,
               normalized: true,
               dtdChangedNormalization: true,
            },
         ]);
         done();
      });
   });
});
