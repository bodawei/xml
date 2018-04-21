/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, Range } from '../../basic/index';
import { ErrorCollector, WellFormedError, XmlWarning } from '../../error/index';
import { defaultExtractors } from '../../extractor/index';
import { SToken, STokenSource } from '../../sToken/index';
import { makeSTokenMaker } from '../../sToken/@test/helper';

import helper from '../@test/helper.js';
import attListDeclaration, { AttListPToken } from '../attListDeclaration';
import declaration from '../bridge/declaration';
import entityEnd from '../entityEnd';
import entityReference from '../entityReference.js';
import entityStart from '../entityStart';
import unassigned from '../unassigned';

describe('attListDeclaration (integration)', () => {
   let declarationPToken: AttListPToken;
   let expectedSToken: (value: string) => SToken;

   beforeEach(() => {
      expectedSToken = makeSTokenMaker();
      declarationPToken = new attListDeclaration.PToken({
         open: expectedSToken('<!'),
         postOpenSpace: undefined,
         declType: expectedSToken('ATTLIST'),
         postDeclTypeSpace: expectedSToken(' '),
      });
   });

   describe('parse()', () => {

      it('parses an ATTLIST with a couple attributes', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('elName one CDATA two IDREFS #IMPLICIT>');
         source.endText();

         attListDeclaration.parse(source, new declaration.PToken(), (result) => {
            const makeSToken = makeSTokenMaker();
            const makeSToken1 = makeSTokenMaker(undefined, 32, 0, 32);
            expect(result).toEqual(new attListDeclaration.PToken({
               elementName: makeSToken('elName'),
               postElementNameSpace: makeSToken(' '),
               attDefs: [{
                  name: makeSToken('one'),
                  postNameSpace: makeSToken(' '),
                  type: makeSToken('CDATA'),
                  postTypeSpace: makeSToken(' '),
               }, {
                  name: makeSToken('two'),
                  postNameSpace: makeSToken(' '),
                  type: makeSToken('IDREFS'),
                  postTypeSpace: makeSToken(' '),
                  defaultType: makeSToken('#IMPLICIT'),
                  postDefaultTypeSpace: undefined,
               }],
               close: makeSToken('>'),
            }));
            done();
         });
      });

      it('parses a PERef in the intial position (check unsasigned calls)', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('%foo;>');
         source.endText();

         attListDeclaration.parse(source, new declaration.PToken(), (result) => {
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

      it('parses a PERef in the attribute name definition (check unsasigned calls)', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('elName one CDATA #IMPLICIT %foo;>');
         source.endText();

         attListDeclaration.parse(source, new declaration.PToken(), (result) => {
            const makeSToken = makeSTokenMaker();
            const makeSToken1 = makeSTokenMaker(undefined, 32, 0, 32);
            expect(result).toEqual(new attListDeclaration.PToken({
               elementName: makeSToken('elName'),
               postElementNameSpace: makeSToken(' '),
               attDefs: [{
                  name: makeSToken('one'),
                  postNameSpace: makeSToken(' '),
                  type: makeSToken('CDATA'),
                  postTypeSpace: makeSToken(' '),
                  defaultType: makeSToken('#IMPLICIT'),
                  postDefaultTypeSpace: makeSToken(' '),
               }],
               unassigned: [ new entityReference.ParamPToken({
                  open:  makeSToken('%'),
                  postOpenSpace: undefined,
                  name:  makeSToken('foo'),
                  postNameSpace: undefined,
                  close:  makeSToken(';'),
               }) ],
               nextPropName: 'attValue',
               close: makeSToken1('>'),
            }));
            done();
         });
      });

      it('parses a PERef in the attribute type location (check unsasigned calls)', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('elName one CDATA #IMPLICIT two%foo;>');
         source.endText();

         attListDeclaration.parse(source, new declaration.PToken(), (result) => {
            const makeSToken = makeSTokenMaker();
            const makeSToken1 = makeSTokenMaker(undefined, 35, 0, 35);
            expect(result).toEqual(new attListDeclaration.PToken({
               elementName: makeSToken('elName'),
               postElementNameSpace: makeSToken(' '),
               attDefs: [{
                  name: makeSToken('one'),
                  postNameSpace: makeSToken(' '),
                  type: makeSToken('CDATA'),
                  postTypeSpace: makeSToken(' '),
                  defaultType: makeSToken('#IMPLICIT'),
                  postDefaultTypeSpace: makeSToken(' '),
               }, {
                  name: makeSToken('two'),
                  postNameSpace: undefined,
               }],
               unassigned: [ new entityReference.ParamPToken({
                  open:  makeSToken('%'),
                  postOpenSpace: undefined,
                  name:  makeSToken('foo'),
                  postNameSpace: undefined,
                  close:  makeSToken(';'),
               }) ],
               nextPropName: 'type',
               close: makeSToken1('>'),
            }));
            done();
         });
      });

      it('parses a PERef in the attribute default type location (check unsasigned calls)', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('elName one CDATA #IMPLICIT two ID %foo;>');
         source.endText();

         attListDeclaration.parse(source, new declaration.PToken(), (result) => {
            const makeSToken = makeSTokenMaker();
            const makeSToken1 = makeSTokenMaker(undefined, 39, 0, 39);
            expect(result).toEqual(new attListDeclaration.PToken({
               elementName: makeSToken('elName'),
               postElementNameSpace: makeSToken(' '),
               attDefs: [{
                  name: makeSToken('one'),
                  postNameSpace: makeSToken(' '),
                  type: makeSToken('CDATA'),
                  postTypeSpace: makeSToken(' '),
                  defaultType: makeSToken('#IMPLICIT'),
                  postDefaultTypeSpace: makeSToken(' '),
               }, {
                  name: makeSToken('two'),
                  postNameSpace: makeSToken(' '),
                  type: makeSToken('ID'),
                  postTypeSpace: makeSToken(' '),
               }],
               unassigned: [ new entityReference.ParamPToken({
                  open:  makeSToken('%'),
                  postOpenSpace: undefined,
                  name:  makeSToken('foo'),
                  postNameSpace: undefined,
                  close:  makeSToken(';'),
               }) ],
               nextPropName: 'defaultType',
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

         attListDeclaration.parse(source, new declaration.PToken(), (pToken) => {
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

      it('fills in the missing attributes', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('elName at1 CDATA %foo;>');
         source.endText();

         attListDeclaration.parse(source, new declaration.PToken(), (pToken) => {
            // "expand" what should be there.
            pToken.unassigned = [
               new entityStart.ParamPToken({}),
               unassigned.wordFromSToken(SToken.fromString('at2')),
               unassigned.spaceFromSToken(SToken.fromString(' ')),
               unassigned.wordFromSToken(SToken.fromString('ENTITIES')),
               unassigned.spaceFromSToken(SToken.fromString(' ')),
               new entityEnd.ParamPToken({}),
            ];

            attListDeclaration.assignUnassigned(pToken);

            const makeSToken = makeSTokenMaker();
            const makeSToken2 = makeSTokenMaker(undefined, 22, 0, 22);
            const expected = {
               elementName: makeSToken('elName'),
               postElementNameSpace: makeSToken(' '),
               attDefs: [{
                  name: makeSToken('at1'),
                  postNameSpace: makeSToken(' '),
                  type: makeSToken('CDATA'),
                  postTypeSpace: makeSToken(' '),
               }, {
                  name: SToken.fromString('at2'),
                  postNameSpace: SToken.fromString(' '),
                  type: SToken.fromString('ENTITIES'),
                  postTypeSpace: SToken.fromString(' '),
               }],
               close: makeSToken2('>'),
            };
            expected.attDefs[0].postTypeSpace.str += ' ';
            expected.attDefs[0].postTypeSpace.originalStr += ' ';
            expected.attDefs[0].postTypeSpace.ranges.push(helper.makeInsertedRange());
            expected.attDefs[1].postTypeSpace.str += ' ';
            expected.attDefs[1].postTypeSpace.originalStr += ' ';
            expected.attDefs[1].postTypeSpace.ranges.push(helper.makeInsertedRange());
            expect(pToken).toEqual(new attListDeclaration.PToken(expected));
            done();
         });
      });

      it('does not assign a # value to a missing type value', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('elName at1 CDATA %foo;>');
         source.endText();

         attListDeclaration.parse(source, new declaration.PToken(), (pToken) => {
            // "expand" what should be there.
            pToken.unassigned = [
               new entityStart.ParamPToken({}),
               unassigned.wordFromSToken(SToken.fromString('at2')),
               unassigned.spaceFromSToken(SToken.fromString(' ')),
               unassigned.wordFromSToken(SToken.fromString('#ENTITIES')),
               unassigned.spaceFromSToken(SToken.fromString(' ')),
               new entityEnd.ParamPToken({}),
            ];
            const makeSToken = makeSTokenMaker();
            const makeSToken2 = makeSTokenMaker(undefined, 22, 0, 22);
            const rawExpected = {
               elementName: makeSToken('elName'),
               postElementNameSpace: makeSToken(' '),
               attDefs: [{
                  name: makeSToken('at1'),
                  postNameSpace: makeSToken(' '),
                  type: makeSToken('CDATA'),
                  postTypeSpace: makeSToken(' '),
               }, {
                  name: SToken.fromString('at2'),
                  postNameSpace: SToken.fromString(' '),
                  defaultType: SToken.fromString('#ENTITIES'),
                  postDefaultTypeSpace: SToken.fromString(' '),
               }],
               close: makeSToken2('>'),
            };
            // work around some kind of ts issue
            const expected = new attListDeclaration.PToken(rawExpected);
            expected.attDefs[0].postTypeSpace.str += ' ';
            expected.attDefs[0].postTypeSpace.originalStr += ' ';
            expected.attDefs[0].postTypeSpace.ranges.push(helper.makeInsertedRange());
            expected.attDefs[1].postDefaultTypeSpace.str += ' ';
            expected.attDefs[1].postDefaultTypeSpace.originalStr += ' ';
            expected.attDefs[1].postDefaultTypeSpace.ranges.push(helper.makeInsertedRange());

            attListDeclaration.assignUnassigned(pToken);

            expect(pToken).toEqual(expected);
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
         source.addText('elName xml:foo>');
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
