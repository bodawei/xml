/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { TextPToken } from 'pToken';
import { STokenSource,  toSToken } from 'basic';

import { DocTypeStartPToken, parseDocTypeStart } from '../docTypeStart';

describe('docTypeStart (integration)', () => {
   let docTypeStartPToken: DocTypeStartPToken;

   beforeEach(() => {
      docTypeStartPToken = new DocTypeStartPToken({
         open: toSToken('<!'),
         name: toSToken('rootElement'),
         nameSpace: toSToken(' '),
         externalId: {
            externalType: toSToken('SYSTEM'),
            externalTypeSpace: toSToken(' '),
            system: {
               openQuote: toSToken('"'),
               value: [ new TextPToken({ text: toSToken('sys.dtd') }) ],
               closeQuote: toSToken('"'),
            },
         },
         externalIdSpace: toSToken(' '),
         openSubset: toSToken('['),
      });
   });

   describe('parse()', () => {

      it('parses the doctype start', (done) => {
         const source = new STokenSource();
         source.addText('rootElement SYSTEM "sys.dtd" [');
         source.endText();

         parseDocTypeStart(source, { open: toSToken('<!'), } as any, (parsing) => {
            expect(parsing).toEqualRangeless(docTypeStartPToken);
            done();
         });
      });

   });
});
