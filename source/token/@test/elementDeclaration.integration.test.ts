/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, Range } from '../../basic/index';
import { ErrorCollector, WellFormedError, XmlWarning } from '../../error/index';
import { defaultExtractors } from '../../extractor/index';
import { SToken, STokenSource } from '../../sToken/index';
import { makeSTokenMaker } from '../../sToken/@test/helper';

import entityEnd from '../entityEnd.js';
import entityReference from '../entityReference.js';
import entityStart from '../entityStart.js';
import externalId from '../common/externalId.js';
import elementDeclaration from '../elementDeclaration.js';
import text from '../text.js';
import unassigned from '../unassigned.js';

import helper from './helper.js';

describe('elementDeclaration (integration)', () => {
   let declarationPToken;
   let expectedSToken;

   beforeEach(() => {
      expectedSToken = makeSTokenMaker();
      declarationPToken = {
         open: expectedSToken('<!'),
         postOpenSpace: undefined,
         declType: expectedSToken('ELEMENT'),
         postDeclTypeSpace: expectedSToken(' '),
      };
   });

   describe('parse()', () => {

      it('parses a PERef (check unsasigned calls)', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('%foo;>');
         source.endText();

         elementDeclaration.parse(source, {}, (result) => {
            const makeSToken = makeSTokenMaker();
            const makeSToken1 = makeSTokenMaker(undefined, 5, 0, 5);
            expect(result).toEqual(new elementDeclaration.PToken({
               unassigned: [ new entityReference.ParamPToken({
                  open:  makeSToken('%'),
                  postOpenSpace: undefined,
                  name:  makeSToken('foo'),
                  postNameSpace: undefined,
                  close:  makeSToken(';'),
               }) ],
               nextPropName: 'name',
               close: makeSToken1('>'),
            }));
            done();
         });
      });

   });

   describe('assignUnassigned()', () => {
   });

   describe('checkWellFormed()', () => {

      it('asks the declaration module to look for problems in the declaration part', (done) => {
         declarationPToken.postOpenSpace = expectedSToken(' ');
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('foo SYSTEM "sys.dtd">');
         source.endText();

         elementDeclaration.parse(source, declarationPToken, (parsing) => {
            const ec = new ErrorCollector(undefined, WellFormedError);

            elementDeclaration.checkWellFormed(parsing, ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.DECL_OPEN_XTRA_SPACE_AFTER);
            done();
         });
      });

      it('calls misc.checkName() to report on invalid names', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('$foo ANY>');
         source.endText();
         elementDeclaration.parse(source, declarationPToken, (result) => {
            const ec = new ErrorCollector(result.open, WellFormedError);

            elementDeclaration.checkWellFormed(result, ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ELEMENTDECL_NAME_INVALID);
            done();
         });
      });

      it('calls misc.checkWellFormedNameRecommendation() to report on bad names', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('xmlOne ANY>');
         source.endText();

         elementDeclaration.parse(source, declarationPToken, (parsing) => {
            const ec = new ErrorCollector(undefined, WellFormedError);

            elementDeclaration.checkWellFormed(parsing, ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(XmlWarning.ID.ELEMENTDECL_NAME_XML_RESERVED);
            done();
         });
      });

      // it('calls unassigned.checkExtra() to report on extra values', (done) => {
      //    const source = new STokenSource(defaultExtractors, new EntityMetaData());
      //    source.addText('%bar; "other">');
      //    source.endText();

      //    elementDeclaration.parse(source, declarationPToken, (pToken) => {
      //       // "expand" what should be there.
      //       pToken.unassigned.shift(); // get rid of the peref
      //       pToken.unassigned = [
      //          new entityStart.ParamPToken({}), {
      //             type: 'literal',
      //             openQuote: new SToken('"', '"', new Range()),
      //             value: [ new text.PToken({ text: new SToken('sys.dtd', 'sys.dtd', new Range()) }) ],
      //             closeQuote: new SToken('"', '"', new Range()),
      //          },
      //          new entityEnd.ParamPToken({}),
      //       ].concat(pToken.unassigned);
      //       pToken.externalId.unassigned = pToken.unassigned;
      //       notationDeclaration.assignUnassigned(pToken);
      //       const ec = new ErrorCollector(undefined, WellFormedError);

      //       notationDeclaration.checkWellFormed(pToken, ec, new EntityMetaData());

      //       expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.NOTATIONDECL_EXTRA_TEXT);
      //       done();
      //    });
      // });

   });

   describe('pTokenToXToken()', () => {

      // it('includes an entityLocation', (done) => {
      //    const source = new STokenSource(defaultExtractors, new EntityMetaData());
      //    source.addText('foo SYSTEM "sys.dtd">');
      //    source.endText();

      //    elementDeclaration.parse(source, declarationPToken, (parsing) => {
      //       const token = notationDeclaration.pTokenToXToken(parsing);

      //       token.pToken = [];
      //       expect(token).toEqual(new notationDeclaration.XToken('foo', new EntityLocation('sys.dtd'), []));
      //       done();
      //    });
      // });

      // it('includes the STokens for the externalId and declaration', (done) => {
      //    const source = new STokenSource(defaultExtractors, new EntityMetaData());
      //    source.addText('foo SYSTEM "sys.dtd">');
      //    source.endText();

      //    notationDeclaration.parse(source, declarationPToken, (parsing) => {
      //       const token = notationDeclaration.pTokenToXToken(parsing);

      //       expect(token.pToken.open).toEqual(declarationPToken.open);
      //       done();
      //    });
      // });

   });

});
