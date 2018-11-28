/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from 'basic';
import { defaultExtractors } from 'extractor';
import { STokenSource, SToken } from 'sToken';

import { parseGeneralEntityReference, GeneralEntityReferencePToken } from '../generalEntityReference';

describe('generalEntityReference (integration)', () => {

   describe('parseGeneralEntityReference()', () => {

      it('parses the input', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText(' foo ;');
         source.endText();

         parseGeneralEntityReference(source, SToken.fromString('&'), (parsing) => {
            expect(parsing).toEqualRangeless(new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               openSpace: SToken.fromString(' '),
               name: SToken.fromString('foo'),
               nameSpace: SToken.fromString(' '),
               close: SToken.fromString(';'),
            }));
            done();
         });
      });

   });

});
