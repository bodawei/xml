/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData } from 'basic';
import { ErrorCollector, WellFormedError } from 'error';
import { defaultExtractors } from 'extractor';
import { STokenSource, SToken } from 'sToken';
import { makeSTokenMaker } from 'sToken-test';

import { DocTypeStartPToken, parseDocTypeStart } from '../docTypeStart';
import { DeclarationPToken } from '../bridge/baseDeclaration';
import { TextPToken } from '../text';
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
            system: {
               openQuote: makeSToken('"'),
               value: [ new TextPToken({ text: makeSToken('sys.dtd') }) ],
               closeQuote: makeSToken('"'),
            },
            peRefPlus: [],
         },
         externalIdSpace: makeSToken(' '),
         openSubset: makeSToken('['),
      });
   });

   describe('parse()', () => {

      it('parses the doctype start', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('rootElement SYSTEM "sys.dtd" [');
         source.endText();

         parseDocTypeStart(source, { open: SToken.fromString('<!'), } as any, (parsing) => {
            expect(parsing).toContainPTokenProps(docTypeStartPToken);
            done();
         });
      });

   });

   describe('checkWellFormed()', () => {
      let declaration: DeclarationPToken;

      beforeEach(() => {
         const makeSToken = makeSTokenMaker();
         declaration = new DeclarationPToken('FOO', {
            open: makeSToken('<!'),
            declType: makeSToken('DOCTYPE'),
         });
      });

      it('asks the declaration module to report if there is no type', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('rootElement system "sys.dtd" [');
         source.endText();
         delete declaration.declType;

         parseDocTypeStart(source, declaration, (parsing) => {
            const ec = new ErrorCollector(SToken.fromString('x'), WellFormedError);

            parsing.checkWellFormed(ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.DECL_NO_DECLTYPE);
            done();
         });
      });

      it('asks the externalId module to look for well formed problems', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('rootElement system "sys.dtd" [');
         source.endText();

         parseDocTypeStart(source, declaration, (parsing) => {
            const ec = new ErrorCollector(SToken.fromString('x'), WellFormedError);

            parsing.checkWellFormed(ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.EXTERNALID_INVALID_CASE);
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
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('rootElement SYSTEM "sys.dtd" [');
         source.endText();

         parseDocTypeStart(source, declaration, (pToken) => {
            const token = pToken.toXToken();

            expect(token.name).toEqual('rootElement');
            expect(token.externalLoc).toEqual(new EntityLocation('sys.dtd'));
            expect(token.pToken!.declType).toEqual(declaration.declType);
            done();
         });
      });

   });

});
