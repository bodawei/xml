/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { defaultExtractors } from 'extractor';
import { STokenSource, SToken } from 'sToken';

import {
   parseParameterEntityReference,
   ParameterEntityReferencePToken,
} from '../parameterEntityReference';

describe('ParameterEntityReferencePToken (integration)', () => {
   describe('parseParameterEntityReference()', () => {
      it('constructs a PToken from the input', (done) => {
         const source = new STokenSource(defaultExtractors);
         source.addText('% foo ;');
         source.endText();

         parseParameterEntityReference(source, (parsing) => {
            expect(parsing).toEqualRangeless(
               new ParameterEntityReferencePToken({
                  open: SToken.fromString('%'),
                  openSpace: SToken.fromString(' '),
                  name: SToken.fromString('foo'),
                  nameSpace: SToken.fromString(' '),
                  close: SToken.fromString(';'),
               }),
            );
            done();
         });
      });
   });
});
