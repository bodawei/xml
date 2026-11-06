/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { STokenSource, toSToken } from 'basic';
import { makeSTokenMaker } from 'pToken-test';

import { DocTypeStartPToken } from '../docTypeStart';
import { DocTypeEndPToken, parseDocTypeEnd } from '../docTypeEnd';

describe('docTypeEnd (integration)', () => {
   let docTypeEndPToken: DocTypeEndPToken;
   let startToken: DocTypeStartPToken;

   beforeEach(() => {
      startToken = new DocTypeStartPToken({ open: toSToken('<!'), });
      const makeSToken = makeSTokenMaker();
      docTypeEndPToken = new DocTypeEndPToken({
         docTypeStartPToken: startToken,
         closeSubset: makeSToken(']'),
         closeSubsetSpace: makeSToken('\t'),
         close: makeSToken('>'),
      });
   });

   describe('parse()', () => {

      it('produces a full PToken', (done) => {
         const source = new STokenSource();
         source.addText(']\t>');
         source.endText();

         parseDocTypeEnd(source, startToken, (parsing) => {
            expect(parsing).toEqual(docTypeEndPToken);
            done();
         });
      });

   });

});
