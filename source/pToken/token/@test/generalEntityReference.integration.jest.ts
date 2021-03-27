/* Copyright ® 2018-201 by 柏大衛. All rights reserved. */

import { STokenSource, toSToken } from 'sToken';

import {
   parseGeneralEntityReference,
   GeneralEntityReferencePToken,
} from '../generalEntityReference';

describe('generalEntityReference (integration)', () => {
   describe('parseGeneralEntityReference()', () => {
      it('parses the input', (done) => {
         const source = new STokenSource();
         source.addText(' foo ;');
         source.endText();

         parseGeneralEntityReference(source, toSToken('&'), (parsing) => {
            expect(parsing).toEqualRangeless(
               new GeneralEntityReferencePToken({
                  open: toSToken('&'),
                  openSpace: toSToken(' '),
                  name: toSToken('foo'),
                  nameSpace: toSToken(' '),
                  close: toSToken(';'),
               }),
            );
            done();
         });
      });
   });
});
