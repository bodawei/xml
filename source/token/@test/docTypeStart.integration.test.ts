/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { defaultExtractors } from 'extractor';
import { TextPToken } from 'pToken';
import { STokenSource, SToken } from 'sToken';
import { makeSTokenMaker } from 'sToken-test';
import { ExternalIdX } from 'xToken';

import { DocTypeStartPToken, parseDocTypeStart } from '../docTypeStart';
import { DeclarationPToken } from '../bridge/baseDeclaration';
import { EXTERNAL_ID } from '../common/externalId';

describe('docTypeStart (integration)', () => {
   let docTypeStartPToken: DocTypeStartPToken;

   beforeEach(() => {
      const makeSToken = makeSTokenMaker();
      docTypeStartPToken = new DocTypeStartPToken({
         open: SToken.fromString('<!'),
         name: makeSToken('rootElement'),
         nameSpace: makeSToken(' '),
         externalId: {
            type: EXTERNAL_ID,
            externalType: makeSToken('SYSTEM'),
            externalTypeSpace: makeSToken(' '),
            public: undefined,
            publicSpace: undefined,
            system: {
               openQuote: makeSToken('"'),
               value: [ new TextPToken({ text: makeSToken('sys.dtd') }) ],
               closeQuote: makeSToken('"'),
            },
         },
         externalIdSpace: makeSToken(' '),
         openSubset: makeSToken('['),
      });
   });

   describe('parse()', () => {

      it('parses the doctype start', (done) => {
         const source = new STokenSource(defaultExtractors);
         source.addText('rootElement SYSTEM "sys.dtd" [');
         source.endText();

         parseDocTypeStart(source, { open: SToken.fromString('<!'), } as any, (parsing) => {
            expect(parsing).toContainPTokenProps(docTypeStartPToken);
            done();
         });
      });

   });

   describe('toXToken()', () => {
      let declaration: DeclarationPToken;

      beforeEach(() => {
         const makeSToken = makeSTokenMaker();
         declaration = new DeclarationPToken('FOO', {
            open: makeSToken('<!'),
            declType: makeSToken('DOCTYPE'),
         });
      });

      it('populates the token with data from the PToken', (done) => {
         const source = new STokenSource(defaultExtractors);
         source.addText('rootElement SYSTEM "sys.dtd" [');
         source.endText();

         parseDocTypeStart(source, declaration, (pToken) => {
            const token = pToken.toXToken();

            expect(token.name).toEqual('rootElement');
            expect(token.externalId).toEqual(new ExternalIdX('sys.dtd'));
            expect(token.pToken!.declType).toEqual(declaration.declType);
            done();
         });
      });

   });

});
