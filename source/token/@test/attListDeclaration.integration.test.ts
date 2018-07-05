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
import nameList from '../common/nameList';
import entityEnd from '../entityEnd';
import entityReference from '../entityReference.js';
import entityStart from '../entityStart';
import unassigned, { UnassignedType } from '../unassigned';

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
                  value: [],
               }, {
                  name: makeSToken('two'),
                  postNameSpace: makeSToken(' '),
                  type: makeSToken('IDREFS'),
                  postTypeSpace: makeSToken(' '),
                  defaultType: makeSToken('#IMPLICIT'),
                  postDefaultTypeSpace: undefined,
                  value: [],
               }],
               close: makeSToken('>'),
            }));
            done();
         });
      });

      it('parses an ATTLIST with a NOTATION by calling nameList.parse()', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('elName one NOTATION ( one | two) >');
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
                  type: makeSToken('NOTATION'),
                  postTypeSpace: makeSToken(' '),
                  nameList: new nameList.PToken({
                     open: makeSToken('('),
                     postOpenSpace: makeSToken(' '),
                     names: [ {
                        particle: {
                           name: makeSToken('one'),
                           postNameSpace: makeSToken(' '),
                           repeat: undefined,
                           postRepeatSpace: undefined,
                        },
                        delimiter: makeSToken('|'),
                        postDelimiterSpace: makeSToken(' '),
                     }, {
                        particle: {
                           name: makeSToken('two'),
                           postNameSpace: undefined,
                           repeat: undefined,
                           postRepeatSpace: undefined,
                        },
                        delimiter: undefined,
                        postDelimiterSpace: undefined,
                     }],
                     close: makeSToken(')'),
                     postCloseSpace: makeSToken(' '),
                     repeat: undefined,
                     postRepeatSpace: undefined,
                  }),
                  value: [],
               }],
               close: makeSToken('>'),
            }));
            done();
         });
      });

      it('parses an ATTLIST with an ENUMERATION by calling nameList.parse()', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('elName one ( one ) >');
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
                  nameList: new nameList.PToken({
                     open: makeSToken('('),
                     postOpenSpace: makeSToken(' '),
                     names: [ {
                        particle: {
                           name: makeSToken('one'),
                           postNameSpace: makeSToken(' '),
                           repeat: undefined,
                           postRepeatSpace: undefined,
                        },
                        delimiter: undefined,
                        postDelimiterSpace: undefined,
                     }],
                     close: makeSToken(')'),
                     postCloseSpace: makeSToken(' '),
                     repeat: undefined,
                     postRepeatSpace: undefined,
                  }),
                  value: [],
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
               unassigned: [ {
                  type: UnassignedType.REFERENCE,
                  token: new entityReference.ParamPToken({
                     open:  makeSToken('%'),
                     postOpenSpace: undefined,
                     name:  makeSToken('foo'),
                     postNameSpace: undefined,
                     close:  makeSToken(';'),
                  }),
               } ],
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
                  value: [],
               }],
               unassigned: [ {
                  type: UnassignedType.REFERENCE,
                  token: new entityReference.ParamPToken({
                     open:  makeSToken('%'),
                     postOpenSpace: undefined,
                     name:  makeSToken('foo'),
                     postNameSpace: undefined,
                     close:  makeSToken(';'),
                  }),
               } ],
               nextPropName: 'attValue',
               close: makeSToken1('>'),
            }));
            done();
         });
      });

      it('parses a PERef in the attribute type location (check unassigned calls)', (done) => {
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
                  value: [],
               }, {
                  name: makeSToken('two'),
                  postNameSpace: undefined,
                  value: [],
               }],
               unassigned: [ {
                  type: UnassignedType.REFERENCE,
                  token: new entityReference.ParamPToken({
                     open:  makeSToken('%'),
                     postOpenSpace: undefined,
                     name:  makeSToken('foo'),
                     postNameSpace: undefined,
                     close:  makeSToken(';'),
                  }),
               } ],
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
                  value: [],
               }, {
                  name: makeSToken('two'),
                  postNameSpace: makeSToken(' '),
                  type: makeSToken('ID'),
                  postTypeSpace: makeSToken(' '),
                  value: [],
               }],
               unassigned: [ {
                  type: UnassignedType.REFERENCE,
                  token: new entityReference.ParamPToken({
                     open:  makeSToken('%'),
                     postOpenSpace: undefined,
                     name:  makeSToken('foo'),
                     postNameSpace: undefined,
                     close:  makeSToken(';'),
                  }),
               } ],
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
            if (!pToken) {
               throw new Error('Unexpected undefined PToken.');
            }

            // "expand" what should be there.
            pToken.unassigned = [{
                  type: UnassignedType.ENTITY_START,
                  token: new entityStart.ParamPToken({}),
               },
               unassigned.wordFromSToken(SToken.fromString('entityName')),
               unassigned.spaceFromSToken(SToken.fromString(' ')), {
                  type: UnassignedType.ENTITY_START,
                  token: new entityEnd.ParamPToken({}),
               }
            ];

            attListDeclaration.assignUnassigned(pToken);

            const makeSToken = makeSTokenMaker();
            const makeSToken2 = makeSTokenMaker(undefined, 5, 0, 5);
            expect(pToken).toEqual(new attListDeclaration.PToken({
               postDeclTypeSpace: new SToken(' ', ' ', [ helper.makeInsertedRange() ]),
               elementName: SToken.fromString('entityName'),
               postElementNameSpace: new SToken('  ', '  ', [ new Range(undefined), helper.makeInsertedRange() ]),
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
            if (!pToken) {
               throw new Error('Unexpected undefined PToken.');
            }

            // "expand" what should be there.
            pToken.unassigned = [{
                  type: UnassignedType.ENTITY_START,
                  token: new entityStart.ParamPToken({}),
               }, unassigned.wordFromSToken(SToken.fromString('at2')),
               unassigned.spaceFromSToken(SToken.fromString(' ')),
               unassigned.wordFromSToken(SToken.fromString('ENTITIES')),
               unassigned.spaceFromSToken(SToken.fromString(' ')), {
                  type: UnassignedType.ENTITY_START,
                  token: new entityEnd.ParamPToken({}),
               },
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
                  value: [],
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

      it('identifies an enumeration if the type value is missing', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('elName at1 CDATA %foo;>');
         source.endText();

         attListDeclaration.parse(source, new declaration.PToken(), (pToken) => {
            if (!pToken) {
               throw new Error('Unexpected undefined PToken.');
            }

            // "expand" what should be there.
            pToken.unassigned = [{
                  type: UnassignedType.ENTITY_START,
                  token: new entityStart.ParamPToken({}),
               },
               unassigned.wordFromSToken(SToken.fromString('at2')),
               unassigned.spaceFromSToken(SToken.fromString(' ')),
               unassigned.wordFromSToken(SToken.fromString('(')),
               unassigned.wordFromSToken(SToken.fromString('one')),
               unassigned.wordFromSToken(SToken.fromString(')')),
               unassigned.wordFromSToken(SToken.fromString('#ENTITIES')),
               unassigned.spaceFromSToken(SToken.fromString(' ')), {
                  type: UnassignedType.ENTITY_START,
                  token: new entityStart.ParamPToken({}),
               }
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
                  value: [],
               }, {
                  name: SToken.fromString('at2'),
                  postNameSpace: SToken.fromString(' '),
                  nameList: new nameList.PToken({
                     open: SToken.fromString('('),
                     names: [{
                        particle: {
                           name: SToken.fromString('one'),
                        }
                     }],
                     close: SToken.fromString(')'),
                  }),
                  defaultType: SToken.fromString('#ENTITIES'),
                  postDefaultTypeSpace: SToken.fromString(' '),
               }],
               close: makeSToken2('>'),
            };
            // work around some kind of ts issue
            const expected = new attListDeclaration.PToken(rawExpected);
            expected.attDefs[0].postTypeSpace!.str += ' ';
            expected.attDefs[0].postTypeSpace!.originalStr += ' ';
            expected.attDefs[0].postTypeSpace!.ranges.push(helper.makeInsertedRange());
            expected.attDefs[1].postDefaultTypeSpace!.str += ' ';
            expected.attDefs[1].postDefaultTypeSpace!.originalStr += ' ';
            expected.attDefs[1].postDefaultTypeSpace!.ranges.push(helper.makeInsertedRange());

            attListDeclaration.assignUnassigned(pToken);

            expect(pToken).toEqual(expected);
            done();
         });
      });

      it('will expand a list that is in progress', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('elName at1 (one|%foo;>');
         source.endText();

         attListDeclaration.parse(source, new declaration.PToken(), (pToken) => {
            if (!pToken) {
               throw new Error('Unexpected undefined PToken.');
            }

            // "expand" what should be there.
            pToken.unassigned = [{
                  type: UnassignedType.ENTITY_START,
                  token: new entityStart.ParamPToken({}),
               }, unassigned.wordFromSToken(SToken.fromString('two')),
               unassigned.wordFromSToken(SToken.fromString(')')),
               unassigned.wordFromSToken(SToken.fromString('#REQUIRED')), {
                  type: UnassignedType.ENTITY_START,
                  token: new entityEnd.ParamPToken({}),
               },
            ];
            const makeSToken = makeSTokenMaker();
            const makeSToken2 = makeSTokenMaker(undefined, 21, 0, 21);
            const rawExpected = {
               elementName: makeSToken('elName'),
               postElementNameSpace: makeSToken(' '),
               attDefs: [{
                  name: makeSToken('at1'),
                  postNameSpace: makeSToken(' '),
                  nameList: new nameList.PToken({
                     open: makeSToken('('),
                     postOpenSpace: undefined,
                     names: [{
                        particle: {
                           name: makeSToken('one'),
                           postNameSpace: undefined,
                           repeat: undefined,
                           postRepeatSpace: undefined,
                        },
                        delimiter: makeSToken('|')
                     }, {
                        particle: {
                           name: SToken.fromString('two'),
                        },
                     }],
                     close: SToken.fromString(')'),
                     postCloseSpace: undefined,
                     repeat: undefined,
                     postRepeatSpace: undefined,
                  }),
                  defaultType: SToken.fromString('#REQUIRED'),
                  value: [],
               }],
               close: makeSToken2('>'),
            };
            // work around some kind of ts issue
            const expected = new attListDeclaration.PToken(rawExpected);
            const spaceToken = SToken.fromString(' ');
            spaceToken.ranges = [ helper.makeInsertedRange() ];
            expected.attDefs[0].nameList!.names[0].postDelimiterSpace = spaceToken;
            expected.attDefs[0].postDefaultTypeSpace = spaceToken;

            attListDeclaration.assignUnassigned(pToken);

            expect(pToken).toEqual(expected);
            done();
         });
      });
   });

   describe('checkWellFormed()', () => {
      let ec: ErrorCollector;

      beforeEach(() => {
         ec = new ErrorCollector(undefined, WellFormedError);
      });

      it('asks the declaration module to look for problems in the declaration part', (done) => {
         declarationPToken.postOpenSpace = expectedSToken(' ');
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('foo>');
         source.endText();

         attListDeclaration.parse(source, declarationPToken, (parsing) => {
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
            attListDeclaration.checkWellFormed(result, ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(XmlWarning.ID.ATTRLISTDECL_ATTR_NAME_XML_RESERVED);
            done();
         });
      });

      it('calls nameList.checkWellFormed() on an enumerated list', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('elName attr ( $badName ) >');
         source.endText();
         attListDeclaration.parse(source, declarationPToken, (result) => {
            attListDeclaration.checkWellFormed(result, ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.NAMELIST_NAME_INVALID);
            done();
         });
      });

      it('calls nameList.checkWellFormed() on a NOTATION list', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('elName attr2 NOTATION ( goodName | $badName ) >');
         source.endText();
         attListDeclaration.parse(source, declarationPToken, (result) => {
            attListDeclaration.checkWellFormed(result, ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.NAMELIST_NAME_INVALID);
            done();
         });
      });

   });

   describe('pTokenToXToken()', () => {

      it('includes an entityLocation', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('foo>');
         source.endText();

         attListDeclaration.parse(source, declarationPToken, (pToken) => {
            if (!pToken) {
               throw new Error('Unexpected undefined PToken.');
            }

            const token = attListDeclaration.pTokenToXToken(pToken);

            token.pToken = new attListDeclaration.PToken();
            expect(token).toEqual(new attListDeclaration.XToken('foo', [], token.pToken));
            done();
         });
      });

      it('includes an ENUMERATED type', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('elName attrName ( one | two ) #REQUIRED>');
         source.endText();

         attListDeclaration.parse(source, declarationPToken, (pToken) => {
            const token = attListDeclaration.pTokenToXToken(pToken);
            token.pToken = undefined;

            expect(token).toEqual(new attListDeclaration.XToken('elName', [{
               name: 'attrName',
               type: 'ENUMERATION',
               enumeration: {
                  names: [{
                     name: 'one',
                     repeat: 'ONE',
                  }, {  
                     name: 'two',
                     repeat: 'ONE',
                  }],
                  listType: 'CHOICE',
                  repeat: 'ONE',
               },
               defaultType: '#REQUIRED',
               value: []
            }]));

            done();
         });
      });

      it('includes an NOTATION type', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('elName attrName NOTATION ( one | two ) #REQUIRED>');
         source.endText();

         attListDeclaration.parse(source, declarationPToken, (pToken) => {
            const token = attListDeclaration.pTokenToXToken(pToken);
            token.pToken = undefined;

            expect(token).toEqual(new attListDeclaration.XToken('elName', [{
               name: 'attrName',
               type: 'NOTATION',
               enumeration: {
                  names: [{
                     name: 'one',
                     repeat: 'ONE',
                  }, {  
                     name: 'two',
                     repeat: 'ONE',
                  }],
                  listType: 'CHOICE',
                  repeat: 'ONE',
               },
               defaultType: '#REQUIRED',
               value: []
            }]));

            done();
         });
      });

   });

});
