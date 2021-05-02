/* Copyright ® 2017-201 by 柏大衛. All rights reserved. */

import { STokenSource, toSToken } from 'sToken';
import { DeclarationPToken, parseDocTypeStart } from 'token';
import { ExternalIdX } from 'xToken';

import { DocTypeStartXToken } from '../docTypeStartXToken';

describe('docTypeStart (integration)', () => {
   let declaration: DeclarationPToken;

   beforeEach(() => {
      declaration = new DeclarationPToken('FOO', {
         open: toSToken('<!'),
         declType: toSToken('DOCTYPE'),
      });
   });

   it('populates the token with data from the PToken', (done) => {
      const source = new STokenSource();
      source.addText('rootElement SYSTEM "sys.dtd" [');
      source.endText();

      parseDocTypeStart(source, declaration, (pToken) => {
         const token = new DocTypeStartXToken(pToken);

         expect(token.name).toEqual('rootElement');
         expect(token.externalId).toEqual(new ExternalIdX('sys.dtd'));
         expect(token.pToken!.declType).toEqual(declaration.declType);
         done();
      });
   });
});
