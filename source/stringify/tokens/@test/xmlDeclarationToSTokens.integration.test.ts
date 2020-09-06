/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { defaultExtractors } from 'extractor';
import { parseXmlDeclaration } from 'pToken';
import { toSToken, STokenSource } from 'sToken';

import { xmlDeclarationToSTokens } from '../xmlDeclarationToSTokens';

describe('xmlDeclarationToSTokens (unit)', () => {
      it('returns the STokens', (done) => {
         const start = {
            open: toSToken('<?'),
            openSpace: undefined,
            target: toSToken('xml'),
            targetSpace: toSToken(' '),
         };
            const source = new STokenSource(defaultExtractors);
         source.addText('version="1.0" encoding="ascii" ?>');
         source.endText();

         parseXmlDeclaration(source, start, (parsing) => {
            const result = xmlDeclarationToSTokens(parsing);

            expect(result).toEqualRangeless([
               toSToken('<?'),
               toSToken('xml'),
               toSToken(' '),
               toSToken('version'),
               toSToken('='),
               toSToken('"'),
               toSToken('1.0'),
               toSToken('"'),
               toSToken(' '),
               toSToken('encoding'),
               toSToken('='),
               toSToken('"'),
               toSToken('ascii'),
               toSToken('"'),
               toSToken(' '),
               toSToken('?>'),
            ]);
            done();
         });
      });

});
