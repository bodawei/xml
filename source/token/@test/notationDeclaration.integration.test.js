/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, Range } from '../../basic';
import { ErrorCollector, WellFormedError, XmlWarning } from '../../error';
import { defaultExtractors } from '../../extractor';
import { SToken, STokenSource } from '../../sToken';
import { makeSTokenMaker } from '../../sToken/@test/helper';

import entityEnd from '../entityEnd.js';
import entityReference from '../entityReference.js';
import entityStart from '../entityStart.js';
import externalId from '../common/externalId.js';
import * as notationDeclaration from '../notationDeclaration.js';
import text from '../text.js';
import unassigned from '../unassigned.js';

import helper from './helper.js';

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

      it('parses a PERef (check unsasigned calls)', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('%foo;>');
         source.endText();

         notationDeclaration.parse(source, {}, (result) => {
            const makeSToken = makeSTokenMaker();
            const makeSToken1 = makeSTokenMaker(undefined, 5, 0, 5);
            expect(result).toEqual(new notationDeclaration.PToken({
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

      it('copes with a PERef in the externalId (check unsasigned calls)', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('notationName %foo;>');
         source.endText();
         const makeSToken1 = makeSTokenMaker(undefined, 13, 0, 13, 13, 0, 13);
         const unassignedValue = [ new entityReference.ParamPToken({
            open:  makeSToken1('%'),
            postOpenSpace: undefined,
            name:  makeSToken1('foo'),
            postNameSpace: undefined,
            close:  makeSToken1(';'),
         }) ];

         notationDeclaration.parse(source, {}, (result) => {
            const makeSToken = makeSTokenMaker();
            expect(result).toEqual(new notationDeclaration.PToken({
               name: makeSToken('notationName'),
               postNameSpace: makeSToken(' '),
               unassigned: unassignedValue,
               externalId: {
                  type: 'EXTERNAL_ID',
                  unassigned: unassignedValue,
                  nextPropName: 'idType',
               },
               close: makeSToken1('>'),
            }));
            done();
         });
      });

   });

   describe('assignUnassigned()', () => {

      it('fills in the missing properties, including the preceeding declaration space', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('%foo;>');
         source.endText();

         notationDeclaration.parse(source, {}, (pToken) => {
            // "expand" what should be there.
            pToken.unassigned = [
               new entityStart.ParamPToken({}),
               unassigned.wordFromSToken(SToken.fromString('notationName')),
               unassigned.spaceFromSToken(SToken.fromString(' ')),
               unassigned.wordFromSToken(SToken.fromString('PUBLIC')), {
                  type: 'literal',
                  openQuote: SToken.fromString('"'),
                  value: [ SToken.fromString('foo') ],
                  closeQuote: SToken.fromString('"'),
               },
               new entityEnd.ParamPToken({}),
            ];

            notationDeclaration.assignUnassigned(pToken);

            const makeSToken = makeSTokenMaker();
            const makeSToken2 = makeSTokenMaker(undefined, 5, 0, 5);
            expect(pToken).toEqual(new notationDeclaration.PToken({
               postDeclTypeSpace: new SToken(' ', ' ', [ helper.makeInsertedRange() ]),
               name: SToken.fromString('notationName'),
               postNameSpace: SToken.fromString(' '),
               externalId: {
                  idType: SToken.fromString('PUBLIC'),
                  public: {
                     openQuote: SToken.fromString('"'),
                     value: [ SToken.fromString('foo') ],
                     closeQuote: SToken.fromString('"'),
                  },
                  postPublicSpace: new SToken(' ', ' ', [ helper.makeInsertedRange() ]),
               },
               close: makeSToken2('>'),
            }));
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

      it('calls unassigned.checkExtra() to report on extra values', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('name SYSTEM %bar; "other">');
         source.endText();

         notationDeclaration.parse(source, declarationPToken, (pToken) => {
            // "expand" what should be there.
            pToken.unassigned.shift(); // get rid of the peref
            pToken.unassigned = [
               new entityStart.ParamPToken({}), {
                  type: 'literal',
                  openQuote: new SToken('"', '"', new Range()),
                  value: [ new text.PToken({ text: new SToken('sys.dtd', 'sys.dtd', new Range()) }) ],
                  closeQuote: new SToken('"', '"', new Range()),
               },
               new entityEnd.ParamPToken({}),
            ].concat(pToken.unassigned);
            pToken.externalId.unassigned = pToken.unassigned;
            notationDeclaration.assignUnassigned(pToken);
            const ec = new ErrorCollector(undefined, WellFormedError);

            notationDeclaration.checkWellFormed(pToken, ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.NOTATIONDECL_EXTRA_TEXT);
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
