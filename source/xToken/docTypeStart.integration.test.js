/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData } from '../basic';
import { ErrorCollector, WellFormedError } from '../error';
import { defaultExtractors, LTokenSource } from '../lToken';
import { makeLTokenMaker } from '../lToken/test';

import * as docTypeStart from './docTypeStart.js';

describe('docTypeStart (integration)', () => {
   let parsedDocTypeStart;

   beforeEach(() => {
      const expectedLToken = makeLTokenMaker();
      parsedDocTypeStart = {
         type: 'DOCTYPE_START',
         name: expectedLToken('rootElement'),
         postNameSpace: expectedLToken(' '),
         externalId: {
            type: 'EXTERNAL_ID',
            idType: expectedLToken('SYSTEM'),
            postIdTypeSpace: expectedLToken(' '),
            systemOpenQuote: expectedLToken('"'),
            systemValue: [ expectedLToken('sys.dtd') ],
            systemCloseQuote: expectedLToken('"'),
         },
         postExternalIdSpace: expectedLToken(' '),
         startInternalSubset: expectedLToken('['),
      };
   });

   describe('parse()', () => {

      it('parses the doctype start', (done) => {
         const source = new LTokenSource(defaultExtractors, new EntityMetaData());
         source.addText('rootElement SYSTEM "sys.dtd" [');
         source.endText();

         docTypeStart.parse(source, {}, (parsing) => {
            expect(parsing).toContainParsedProps(parsedDocTypeStart);
            done();
         });
      });

   });

   describe('checkWellFormed()', () => {
      let declaration;

      beforeEach(() => {
         const expectedLToken = makeLTokenMaker();
         declaration = {
            open: expectedLToken('<!'),
            declType: expectedLToken('DOCTYPE'),
         };
      });

      it('asks the declaration module to report if there is no type', (done) => {
         const source = new LTokenSource(defaultExtractors, new EntityMetaData());
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
         const source = new LTokenSource(defaultExtractors, new EntityMetaData());
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

   describe('makeToken()', () => {
      let declaration;

      beforeEach(() => {
         const expectedLToken = makeLTokenMaker();
         declaration = {
            open: expectedLToken('<!'),
            declType: expectedLToken('DOCTYPE'),
         };
      });

      it('populates the token with data from the parsed', (done) => {
         const source = new LTokenSource(defaultExtractors, new EntityMetaData());
         source.addText('rootElement SYSTEM "sys.dtd" [');
         source.endText();

         docTypeStart.parse(source, declaration, (parsed) => {
            const token = docTypeStart.makeToken(parsed);

            expect(token.name).toEqual('rootElement');
            expect(token.externalLoc).toEqual(new EntityLocation('sys.dtd'));
            expect(token.lTokens[1]).toEqual(declaration.declType);
            expect(token.lTokens[4]).toEqual(parsed.externalId.idType);
            done();
         });
      });

   });

});
