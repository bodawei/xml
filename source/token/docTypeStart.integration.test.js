/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData } from '../basic';
import { ErrorCollector, WellFormedError } from '../error';
import { defaultExtractors } from '../extractor';
import { STokenSource } from '../sToken';
import { makeSTokenMaker } from '../sToken/test';

import * as docTypeStart from './docTypeStart.js';
import * as text from './text.js';

describe('docTypeStart (integration)', () => {
   let docTypeStartPToken;

   beforeEach(() => {
      const makeSToken = makeSTokenMaker();
      docTypeStartPToken = {
         type: 'DOCTYPE_START',
         name: makeSToken('rootElement'),
         postNameSpace: makeSToken(' '),
         externalId: {
            type: 'EXTERNAL_ID',
            idType: makeSToken('SYSTEM'),
            postIdTypeSpace: makeSToken(' '),
            system: {
               openQuote: makeSToken('"'),
               value: [ new text.PToken({ text: makeSToken('sys.dtd') }) ],
               closeQuote: makeSToken('"'),
            },
         },
         postExternalIdSpace: makeSToken(' '),
         startInternalSubset: makeSToken('['),
      };
   });

   describe('parse()', () => {

      it('parses the doctype start', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('rootElement SYSTEM "sys.dtd" [');
         source.endText();

         docTypeStart.parse(source, {}, (parsing) => {
            expect(parsing).toContainPTokenProps(docTypeStartPToken);
            done();
         });
      });

   });

   describe('checkWellFormed()', () => {
      let declaration;

      beforeEach(() => {
         const makeSToken = makeSTokenMaker();
         declaration = {
            open: makeSToken('<!'),
            declType: makeSToken('DOCTYPE'),
         };
      });

      it('asks the declaration module to report if there is no type', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('rootElement system "sys.dtd" [');
         source.endText();
         delete declaration.declType;

         docTypeStart.parse(source, declaration, (parsing) => {
            const ec = new ErrorCollector(undefined, WellFormedError);

            docTypeStart.checkWellFormed(parsing, ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.DECL_NO_DECLTYPE);
            done();
         });
      });

      it('asks the externalId module to look for well formed problems', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('rootElement system "sys.dtd" [');
         source.endText();

         docTypeStart.parse(source, declaration, (parsing) => {
            const ec = new ErrorCollector(undefined, WellFormedError);

            docTypeStart.checkWellFormed(parsing, ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.EXTERNALID_INVALID_CASE);
            done();
         });
      });

   });

   describe('pTokenToXToken()', () => {
      let declaration;

      beforeEach(() => {
         const makeSToken = makeSTokenMaker();
         declaration = {
            open: makeSToken('<!'),
            declType: makeSToken('DOCTYPE'),
         };
      });

      it('populates the token with data from the PToken', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('rootElement SYSTEM "sys.dtd" [');
         source.endText();

         docTypeStart.parse(source, declaration, (pToken) => {
            const token = docTypeStart.pTokenToXToken(pToken);

            expect(token.name).toEqual('rootElement');
            expect(token.externalLoc).toEqual(new EntityLocation('sys.dtd'));
            expect(token.pToken.declType).toEqual(declaration.declType);
            done();
         });
      });

   });

});
