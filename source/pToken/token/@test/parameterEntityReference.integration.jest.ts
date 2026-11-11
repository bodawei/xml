/* Copyright ® 2018-2026 by 柏大衛. All rights reserved. */

import { STokenSource, toSToken } from 'basic';

import {
   parseParameterEntityReference,
   ParameterEntityReferencePToken,
} from '../parameterEntityReference';

describe('ParameterEntityReferencePToken (integration)', () => {
   describe('parseParameterEntityReference()', () => {
      it('constructs a PToken from the input', () =>
         new Promise<void>((done) => {
            const source = new STokenSource();
            source.addText('% foo ;');
            source.endText();

            parseParameterEntityReference(source, (parsing) => {
               expect(parsing).toEqualRangeless(
                  new ParameterEntityReferencePToken({
                     open: toSToken('%'),
                     openSpace: toSToken(' '),
                     name: toSToken('foo'),
                     nameSpace: toSToken(' '),
                     close: toSToken(';'),
                  }),
               );
               done();
            });
         }));
   });
});
