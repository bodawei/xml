/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, ErrorCollector } from '../basic';
import { WellFormedError } from '../error';
import { defaultExtractors, LTokenSource } from '../lToken';
import { makeLTokenMaker } from '../lToken/test';

import * as notationDeclaration from './notationDeclaration.js';
import * as externalId from './common/externalId.js';

describe('notationdeDlaration (integration)', () => {
   let parsedDeclaration;
   let expectedLToken;

   beforeEach(() => {
      expectedLToken = makeLTokenMaker();
      parsedDeclaration = {
         open: expectedLToken('<!'),
         postOpenSpace: undefined,
         declType: expectedLToken('NOTATION'),
         postDeclTypeSpace: expectedLToken(' '),
      };
   });

   describe('parse()', () => {

      it('produces an externalID when called', (done) => {
         const source = new LTokenSource(defaultExtractors, new EntityMetaData());
         source.addText('foo SYSTEM "sys.dtd">');
         source.endText();

         notationDeclaration.parse(source, parsedDeclaration, (parsing) => {
            expect(parsing.externalId.type).toEqual(externalId.TYPE);
            done();
         });
      });

   });

   describe('checkWellFormed()', () => {

      it('asks the declaration module to look for problems in the declaration part', (done) => {
         parsedDeclaration.postOpenSpace = expectedLToken(' ');
         const source = new LTokenSource(defaultExtractors, new EntityMetaData());
         source.addText('foo SYSTEM "sys.dtd">');
         source.endText();

         notationDeclaration.parse(source, parsedDeclaration, (parsing) => {
            const ec = new ErrorCollector(undefined, WellFormedError);

            notationDeclaration.checkWellFormed(parsing, ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.BANGITEM_OPEN_XTRA_SPACE_AFTER);
            done();
         });
      });

      it('asks the externalId module to look for well formed problems', (done) => {
         const source = new LTokenSource(defaultExtractors, new EntityMetaData());
         source.addText('foo system "sys.dtd">');
         source.endText();

         notationDeclaration.parse(source, parsedDeclaration, (parsing) => {
            const ec = new ErrorCollector(undefined, WellFormedError);

            notationDeclaration.checkWellFormed(parsing, ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.EXTERNALID_INVALID_CASE);
            done();
         });
      });

      it('calls misc.checkWellFormedNameRecommendation() to report on bad names', (done) => {
         const source = new LTokenSource(defaultExtractors, new EntityMetaData());
         source.addText('f\u0000o system "sys.dtd">');
         source.endText();

         notationDeclaration.parse(source, parsedDeclaration, (parsing) => {
            const ec = new ErrorCollector(undefined, WellFormedError);

            notationDeclaration.checkWellFormed(parsing, ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.NOTATIONDECL_NAME_INVALID);
            done();
         });
      });

   });

   describe('makeToken()', () => {

      it('includes an entityLocation', (done) => {
         const source = new LTokenSource(defaultExtractors, new EntityMetaData());
         source.addText('foo SYSTEM "sys.dtd">');
         source.endText();

         notationDeclaration.parse(source, parsedDeclaration, (parsing) => {
            const token = notationDeclaration.makeToken(parsing);

            token.lTokens = [];
            expect(token).toEqual(new notationDeclaration.Token('foo', new EntityLocation('sys.dtd'), []));
            done();
         });
      });

      it('includes the lTokens for the externalId and declaration', (done) => {
         const source = new LTokenSource(defaultExtractors, new EntityMetaData());
         source.addText('foo SYSTEM "sys.dtd">');
         source.endText();

         notationDeclaration.parse(source, parsedDeclaration, (parsing) => {
            const token = notationDeclaration.makeToken(parsing);

            const lTokens = token.lTokens;
            expect(lTokens[0]).toEqual(parsedDeclaration.open);
            expect(lTokens[5].text).toEqual('SYSTEM');
            done();
         });
      });

   });

});
