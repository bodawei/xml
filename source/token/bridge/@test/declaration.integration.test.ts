/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { ConformanceVersion } from 'basic';
import { defaultExtractors } from 'extractor';
import { STokenSource, SToken } from 'sToken';
import { GeneralEntityDeclarationPToken } from 'token';

import { parseDeclaration } from '../declaration';
import { TextPToken } from 'source/token/text';

describe('declaration (integration)', () => {

   describe('parseDeclaration()', () => {
      let confVer: ConformanceVersion;
      let source: STokenSource;
      let start: SToken;

      beforeEach(() => {
         confVer = new ConformanceVersion();
         source = new STokenSource(defaultExtractors);
         start = SToken.fromString('<!');
      });

      it('parses an Entity declaration', (done) => {
         source = new STokenSource(defaultExtractors);
         source.addText('ENTITY foo "theValue">');
         source.endText();

         parseDeclaration(source, start, (parsing) => {
            expect(parsing).toEqualRangeless(new GeneralEntityDeclarationPToken({
               open: start,
               declType: SToken.fromString('ENTITY'),
               declTypeSpace: SToken.fromString(' '),
               name: SToken.fromString('foo'),
               value: [ new TextPToken({ text: SToken.fromString('theValue') }) ],
               close: SToken.fromString('>'),
            }));

            done();
         });
      });

   });

});
