/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { STokenSource, toSToken } from 'basic';
import { DeclarationPToken, parseDocTypeStart } from 'token';
import { describe, expect, it } from 'vitest';

import { ExternalIdX } from '../../common/externalIdX';
import { DocTypeStartXToken } from '../docTypeStartXToken';

describe('docTypeStart (integration)', () => {
   let declaration: DeclarationPToken;

   beforeEach(() => {
      declaration = new DeclarationPToken('FOO', {
         open: toSToken('<!'),
         declType: toSToken('DOCTYPE'),
      });
   });

   it('populates the token with data from the PToken', () =>
      new Promise<void>((done) => {
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
      }));
});
