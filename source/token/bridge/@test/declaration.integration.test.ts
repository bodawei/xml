/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData, EntityKind } from 'basic';
import { defaultExtractors } from 'extractor';
import { STokenSource, SToken } from 'sToken';
import { GeneralEntityDeclarationPToken, text } from 'token';

import { parseDeclaration } from '../declaration';

describe('declaration (integration)', () => {

   describe('parseDeclaration()', () => {
      let emd: EntityMetaData;
      let source: STokenSource;
      let start: SToken;

      beforeEach(() => {
         emd = new EntityMetaData();
         source = new STokenSource(defaultExtractors, emd);
         start = SToken.fromString('<!');
      });

      it('parses an Entity declaration', (done) => {
         source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('ENTITY foo "theValue">');
         source.endText();

         parseDeclaration(source, start, new EntityMetaData(EntityKind.DOCUMENT), (parsing) => {
            expect(parsing).toEqualRangeless(new GeneralEntityDeclarationPToken({
               open: start,
               declType: SToken.fromString('ENTITY'),
               declTypeSpace: SToken.fromString(' '),
               name: SToken.fromString('foo'),
               value: [ new text.PToken({ text: SToken.fromString('theValue') }) ],
               close: SToken.fromString('>'),
            }));

            done();
         });
      });

   });

});
