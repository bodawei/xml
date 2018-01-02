/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData } from '../basic';
import { ErrorCollector, WellFormedError, XmlWarning } from '../error';
import { defaultExtractors } from '../extractor';
import { STokenSource } from '../sToken';
import { makeSTokenMaker } from '../sToken/@test/helper';

import * as notationDeclaration from './notationDeclaration.js';
import externalId from './common/externalId.js';

describe('notationdeDlaration (integration)', () => {
   let declarationPToken;
   let expectedSToken;

   beforeEach(() => {
      expectedSToken = makeSTokenMaker();
      declarationPToken = {
         open: expectedSToken('<!'),
         postOpenSpace: undefined,
         declType: expectedSToken('NOTATION'),
         postDeclTypeSpace: expectedSToken(' '),
      };
   });

   describe('parse()', () => {

      it('produces an externalID when called', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('foo SYSTEM "sys.dtd">');
         source.endText();

         notationDeclaration.parse(source, declarationPToken, (parsing) => {
            expect(parsing.externalId.type).toEqual(externalId.PTYPE);
            done();
         });
      });

   });

   describe('checkWellFormed()', () => {

      it('asks the declaration module to look for problems in the declaration part', (done) => {
         declarationPToken.postOpenSpace = expectedSToken(' ');
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('foo SYSTEM "sys.dtd">');
         source.endText();

         notationDeclaration.parse(source, declarationPToken, (parsing) => {
            const ec = new ErrorCollector(undefined, WellFormedError);

            notationDeclaration.checkWellFormed(parsing, ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.DECL_OPEN_XTRA_SPACE_AFTER);
            done();
         });
      });

      it('asks the externalId module to look for well formed problems', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('foo system "sys.dtd">');
         source.endText();

         notationDeclaration.parse(source, declarationPToken, (parsing) => {
            const ec = new ErrorCollector(undefined, WellFormedError);

            notationDeclaration.checkWellFormed(parsing, ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.EXTERNALID_INVALID_CASE);
            done();
         });
      });

      it('calls misc.checkName() to report on invalid names', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('$foo system "sys.dtd">');
         source.endText();
         notationDeclaration.parse(source, declarationPToken, (result) => {
            const ec = new ErrorCollector(result.open, WellFormedError);

            notationDeclaration.checkWellFormed(result, ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.NOTATIONDECL_NAME_INVALID);
            done();
         });
      });

      it('calls misc.checkWellFormedNameRecommendation() to report on bad names', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('xmlOne system "sys.dtd">');
         source.endText();

         notationDeclaration.parse(source, declarationPToken, (parsing) => {
            const ec = new ErrorCollector(undefined, WellFormedError);

            notationDeclaration.checkWellFormed(parsing, ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(XmlWarning.ID.NOTATIONDECL_NAME_XML_RESERVED);
            done();
         });
      });

   });

   describe('pTokenToXToken()', () => {

      it('includes an entityLocation', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('foo SYSTEM "sys.dtd">');
         source.endText();

         notationDeclaration.parse(source, declarationPToken, (parsing) => {
            const token = notationDeclaration.pTokenToXToken(parsing);

            token.pToken = [];
            expect(token).toEqual(new notationDeclaration.XToken('foo', new EntityLocation('sys.dtd'), []));
            done();
         });
      });

      it('includes the STokens for the externalId and declaration', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('foo SYSTEM "sys.dtd">');
         source.endText();

         notationDeclaration.parse(source, declarationPToken, (parsing) => {
            const token = notationDeclaration.pTokenToXToken(parsing);

            expect(token.pToken.open).toEqual(declarationPToken.open);
            done();
         });
      });

   });

});
