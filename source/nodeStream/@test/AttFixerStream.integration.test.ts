/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { gatherStreamResults } from 'basic-test';
import { PTokenStream } from 'pTokenStream';
import { toSToken, SToken, STokenSource } from 'sToken';
import { XmlDeclarationPToken, XMLDECL_PTOKEN, TextPToken, ParseToken } from 'pToken';
import { ElementStartPToken } from 'token';

import { AttFixerStream } from '../AttFixerStream';
import { defaultExtractors } from 'extractor';

describe('AttFixerStream (integration)', () => {
   let pTokenStream: PTokenStream;
   let fixer: AttFixerStream;

   beforeEach(() => {
      pTokenStream = new PTokenStream(new STokenSource(defaultExtractors));
      fixer = new AttFixerStream();
      pTokenStream.pipe(fixer);
   });

   it('passes a non-ElementStart value through without changes', (done) => {
      pTokenStream.addText('<?xml version="1.0"?>');
      pTokenStream.endText();

      gatherStreamResults<ParseToken>(fixer, (results) => {
         const result = results.find(r => r.type === XMLDECL_PTOKEN);

         expect(result).toEqualRangeless(new XmlDeclarationPToken({
            open: toSToken('<?'),
            target: toSToken('xml'),
            targetSpace: toSToken(' '),
            fields: [{
               name: toSToken('version'),
               nameSpace: undefined,
               equal: toSToken('='),
               equalSpace: undefined,
               openQuote: toSToken('"'),
               value: toSToken('1.0'),
               valueSpace: undefined,
               closeQuote: toSToken('"'),
            }],
            close: toSToken('?>'),
         }));
         done();
      });
   });

   it('passes an ElementStart value through with value normalized', (done) => {
      pTokenStream.addText(`<?xml version="1.0"?>
      <!DOCTYPE test [
         <!ELEMENT root ANY>
         <!ATTLIST root
            nmtok NMTOKEN #REQUIRED>
      ]>
      <root nmtok="  3   4  "/>`);
      pTokenStream.endText();

      gatherStreamResults<ParseToken>(fixer, (results) => {
         expect((results[14] as ElementStartPToken).attributes).toEqualRangeless([{
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
            }],
         );
         done();
      });
   });

});
