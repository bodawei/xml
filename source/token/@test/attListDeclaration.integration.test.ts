/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, Range } from '../../basic';
import { ErrorCollector, WellFormedError, XmlWarning } from '../../error';
import { defaultExtractors } from '../../extractor';
import { SToken, STokenSource } from '../../sToken';
import { makeSTokenMaker } from '../../sToken/@test/helper';

import helper from '../@test/helper.js';
import attListDeclaration from '../attListDeclaration';
import entityEnd from '../entityEnd';
import entityReference from '../entityReference.js';
import entityStart from '../entityStart';
import unassigned from '../unassigned.js';

describe('attListDeclaration (integration)', () => {
   let declarationPToken;
   let expectedSToken;

   beforeEach(() => {
      expectedSToken = makeSTokenMaker();
      declarationPToken = {
         open: expectedSToken('<!'),
         postOpenSpace: undefined,
         declType: expectedSToken('ATTLIST'),
         postDeclTypeSpace: expectedSToken(' '),
      };
   });

   describe('parse()', () => {

      it('parses a PERef in the intial position (check unsasigned calls)', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('%foo;>');
         source.endText();

         attListDeclaration.parse(source, {}, (result) => {
            const makeSToken = makeSTokenMaker();
            const makeSToken1 = makeSTokenMaker(undefined, 5, 0, 5);
            expect(result).toEqual(new attListDeclaration.PToken({
               unassigned: [ new entityReference.ParamPToken({
                  open:  makeSToken('%'),
                  postOpenSpace: undefined,
                  name:  makeSToken('foo'),
                  postNameSpace: undefined,
                  close:  makeSToken(';'),
               }) ],
               nextPropName: 'elementName',
               close: makeSToken1('>'),
            }));
            done();
         });
      });

      it('parses a PERef in the attribute definition (check unsasigned calls)', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('elName one %foo;>');
         source.endText();

         attListDeclaration.parse(source, {}, (result) => {
            const makeSToken = makeSTokenMaker();
            const makeSToken1 = makeSTokenMaker(undefined, 16, 0, 16);
            expect(result).toEqual(new attListDeclaration.PToken({
               elementName: makeSToken('elName'),
               postElementNameSpace: makeSToken(' '),
               attDefs: [{
                  name: makeSToken('one'),
                  postNameSpace: makeSToken(' '),
               }],
               unassigned: [ new entityReference.ParamPToken({
                  open:  makeSToken('%'),
                  postOpenSpace: undefined,
                  name:  makeSToken('foo'),
                  postNameSpace: undefined,
                  close:  makeSToken(';'),
               }) ],
               nextPropName: 'attDef',
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

         attListDeclaration.parse(source, {}, (pToken) => {
            // "expand" what should be there.
            pToken.unassigned = [
               new entityStart.ParamPToken({}),
               unassigned.wordFromSToken(SToken.fromString('entityName')),
               unassigned.spaceFromSToken(SToken.fromString(' ')),
               new entityEnd.ParamPToken({}),
            ];

            attListDeclaration.assignUnassigned(pToken);

            const makeSToken = makeSTokenMaker();
            const makeSToken2 = makeSTokenMaker(undefined, 5, 0, 5);
            expect(pToken).toEqual(new attListDeclaration.PToken({
               postDeclTypeSpace: new SToken(' ', ' ', [ helper.makeInsertedRange() ]),
               elementName: SToken.fromString('entityName'),
               postElementNameSpace: new SToken('  ', '  ', [ helper.makeInsertedRange() ]),
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
         source.addText('foo>');
         source.endText();

         attListDeclaration.parse(source, declarationPToken, (parsing) => {
            const ec = new ErrorCollector(undefined, WellFormedError);

            attListDeclaration.checkWellFormed(parsing, ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.DECL_OPEN_XTRA_SPACE_AFTER);
            done();
         });
      });

      it('calls misc.checkName() to report on invalid names', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('$foo>');
         source.endText();
         attListDeclaration.parse(source, declarationPToken, (result) => {
            const ec = new ErrorCollector(undefined, WellFormedError);

            attListDeclaration.checkWellFormed(result, ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ATTLISTDECL_ELEMENT_NAME_INVALID);
            done();
         });
      });

      it('calls misc.checkName() to report on invalid attribute names', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('elName $foo>');
         source.endText();
         attListDeclaration.parse(source, declarationPToken, (result) => {
            const ec = new ErrorCollector(undefined, WellFormedError);

            attListDeclaration.checkWellFormed(result, ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ATTLISTDECL_ATTR_NAME_INVALID);
            done();
         });
      });

      it('calls misc.checkWellFormedNameRecommendation() to report on invalid attribute names', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('elName xml-foo>');
         source.endText();
         attListDeclaration.parse(source, declarationPToken, (result) => {
            const ec = new ErrorCollector(undefined, WellFormedError);

            attListDeclaration.checkWellFormed(result, ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(XmlWarning.ID.ATTRLISTDECL_ATTR_NAME_XML_RESERVED);
            done();
         });
      });

   });

   describe('pTokenToXToken()', () => {

      it('includes an entityLocation', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('foo>');
         source.endText();

         attListDeclaration.parse(source, declarationPToken, (parsing) => {
            const token = attListDeclaration.pTokenToXToken(parsing);

            token.pToken = new attListDeclaration.PToken();
            expect(token).toEqual(new attListDeclaration.XToken('foo', [], token.pToken));
            done();
         });
      });

   });

});
