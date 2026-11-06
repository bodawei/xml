/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { GeneralEntityDeclarationPToken, TextPToken } from 'pToken';
import { STokenSource, SToken, toSToken } from 'basic';

import { parseDeclaration } from '../declaration';

describe('declaration (integration)', () => {

   describe('parseDeclaration()', () => {
      let confVer: ConformanceVersion;
      let source: STokenSource;
      let start: SToken;

      beforeEach(() => {
         confVer = new ConformanceVersion();
         source = new STokenSource();
         start = toSToken('<!');
      });

      it('parses an Entity declaration', (done) => {
         source = new STokenSource();
         source.addText('ENTITY foo "theValue">');
         source.endText();

         parseDeclaration(source, start, (parsing) => {
            expect(parsing).toEqualRangeless(new GeneralEntityDeclarationPToken({
               open: start,
               declType: toSToken('ENTITY'),
               declTypeSpace: toSToken(' '),
               name: toSToken('foo'),
               nameSpace: toSToken(' '),
               openQuote: toSToken('"'),
               value: [ new TextPToken({ text: toSToken('theValue') }) ],
               closeQuote: toSToken('"'),
               close: toSToken('>'),
            }));

            done();
         });
      });

   });

});
