/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from 'basic';
import { defaultExtractors } from 'extractor';
import { STokenSource, SToken } from 'sToken';

import { parseParameterEntityReference, ParameterEntityReferencePToken } from '../parameterEntityReference';

describe('parameterEntityReference (integration)', () => {

   describe('parseParameterEntityReference()', () => {

      it('parses the input, including the parameters which use literal.parse()', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('% foo ;');
         source.endText();

         parseParameterEntityReference(source, (parsing) => {
            expect(parsing).toEqualRangeless(new ParameterEntityReferencePToken({
               open: SToken.fromString('%'),
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
