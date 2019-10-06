/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, Range } from 'basic';
import { ErrorCollector, WellFormedError, XmlWarning } from 'error';
import { defaultExtractors } from 'extractor';
import { SToken, STokenSource } from 'sToken';
import { makeSTokenMaker } from 'sToken-test';

import helper from '../@test/helper';
import attListDeclaration, { AttListPToken } from '../attListDeclaration';
import declaration from '../bridge/baseDeclaration';
import { WordListPToken, WordListType } from '../common/wordList';
import { ParameterEntityEndPToken } from '../marker/parameterEntityEnd';
import { ParameterEntityStartPToken } from '../marker/parameterEntityStart';
import unassigned, { UnassignedType } from '../common/unassigned';
import { ParameterEntityReferencePToken } from '../parameterEntityReference';
import { TextPToken } from '../text';

describe('attListDeclaration (integration)', () => {
   let declarationPToken: AttListPToken;
   let expectedSToken: (value: string) => SToken;

   beforeEach(() => {
      expectedSToken = makeSTokenMaker();
      declarationPToken = new attListDeclaration.PToken({
         open: expectedSToken('<!'),
         openSpace: undefined,
         declType: expectedSToken('ATTLIST'),
         declTypeSpace: expectedSToken(' '),
      });
   });

   describe('parse()', () => {

      it('parses an ATTLIST with a couple attributes', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('elName one CDATA two IDREFS #IMPLICIT>');
         source.endText();

         attListDeclaration.parse(source, { open: SToken.fromString('<!') }, (result) => {
            const makeSToken = makeSTokenMaker();
            const makeSToken1 = makeSTokenMaker(undefined, 32, 0, 32);
            expect(result).toEqual(new attListDeclaration.PToken({
               open: SToken.fromString('<!'),
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

      it('parses an ATTLIST with a couple attributes with default values', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('elName one CDATA "1"    two CDATA \'2\'three CDATA "3"    >');
         source.endText();

         attListDeclaration.parse(source, { open: SToken.fromString('<!') }, (result) => {
            const makeSToken = makeSTokenMaker();
            expect(result).toEqual(new attListDeclaration.PToken({
               open: SToken.fromString('<!'),
               elementName: makeSToken('elName'),
               postElementNameSpace: makeSToken(' '),
               attDefs: [{
                  name: makeSToken('one'),
                  postNameSpace: makeSToken(' '),
                  type: makeSToken('CDATA'),
                  postTypeSpace: makeSToken(' '),
                  openQuote: makeSToken('"'),
                  value: [
                     new TextPToken({ text: makeSToken('1') }),
                  ],
                  closeQuote: makeSToken('"'),
                  postValueSpace: makeSToken('    '),
               }, {
                  name: makeSToken('two'),
                  postNameSpace: makeSToken(' '),
                  type: makeSToken('CDATA'),
                  postTypeSpace: makeSToken(' '),
                  openQuote: makeSToken('\''),
                  value: [
                     new TextPToken({ text: makeSToken('2') }),
                  ],
                  closeQuote: makeSToken('\''),
               }, {
                  name: makeSToken('three'),
                  postNameSpace: makeSToken(' '),
                  type: makeSToken('CDATA'),
                  postTypeSpace: makeSToken(' '),
                  openQuote: makeSToken('"'),
                  value: [
                     new TextPToken({ text: makeSToken('3') }),
                  ],
                  closeQuote: makeSToken('"'),
                  postValueSpace: makeSToken('    '),
               }],
               close: makeSToken('>'),
            }));
            done();
         });
      });

      it('parses an ATTLIST with a NOTATION by calling parseWordList()', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('elName one NOTATION ( one | two) >');
         source.endText();

         attListDeclaration.parse(source, { open: SToken.fromString('<!') }, (result) => {
            const makeSToken = makeSTokenMaker();
            const makeSToken1 = makeSTokenMaker(undefined, 32, 0, 32);
            expect(result).toEqual(new attListDeclaration.PToken({
               open: SToken.fromString('<!'),
               elementName: makeSToken('elName'),
               postElementNameSpace: makeSToken(' '),
               attDefs: [{
                  name: makeSToken('one'),
                  postNameSpace: makeSToken(' '),
                  type: makeSToken('NOTATION'),
                  postTypeSpace: makeSToken(' '),
                  enumeration: new WordListPToken(WordListType.NOTATION, {
                     open: makeSToken('('),
                     openSpace: makeSToken(' '),
                     words: [ {
                        word: makeSToken('one'),
                        wordSpace: makeSToken(' '),
                        connector: makeSToken('|'),
                        connectorSpace: makeSToken(' '),
                     }, {
                        word: makeSToken('two'),
                        wordSpace: undefined,
                        connector: undefined,
                        connectorSpace: undefined,
                     }],
                     close: makeSToken(')'),
                     closeSpace: makeSToken(' '),
                  }),
                  value: [],
               }],
               close: makeSToken('>'),
            }));
            done();
         });
      });

      it('parses an ATTLIST with an ENUMERATION by calling wordList.parse()', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('elName one ( one ) >');
         source.endText();

         attListDeclaration.parse(source, { open: SToken.fromString('<!') }, (result) => {
            const makeSToken = makeSTokenMaker();
            const makeSToken1 = makeSTokenMaker(undefined, 32, 0, 32);
            expect(result).toEqual(new attListDeclaration.PToken({
               open: SToken.fromString('<!'),
               elementName: makeSToken('elName'),
               postElementNameSpace: makeSToken(' '),
               attDefs: [{
                  name: makeSToken('one'),
                  postNameSpace: makeSToken(' '),
                  enumeration: new WordListPToken(WordListType.ENUMERATION, {
                     open: makeSToken('('),
                     openSpace: makeSToken(' '),
                     words: [ {
                        word: makeSToken('one'),
                        wordSpace: makeSToken(' '),
                        connector: undefined,
                        connectorSpace: undefined,
                     }],
                     close: makeSToken(')'),
                     closeSpace: makeSToken(' '),
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

         attListDeclaration.parse(source, { open: SToken.fromString('<!') }, (result) => {
            const makeSToken = makeSTokenMaker();
            const makeSToken1 = makeSTokenMaker(undefined, 5, 0, 5);
            expect(result).toEqual(new attListDeclaration.PToken({
               open: SToken.fromString('<!'),
               unassigned: [ {
                  type: UnassignedType.REFERENCE,
                  token: new ParameterEntityReferencePToken({
                     open:  makeSToken('%'),
                     openSpace: undefined,
                     name:  makeSToken('foo'),
                     nameSpace: undefined,
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

         attListDeclaration.parse(source, { open: SToken.fromString('<!') }, (result) => {
            const makeSToken = makeSTokenMaker();
            const makeSToken1 = makeSTokenMaker(undefined, 32, 0, 32);
            expect(result).toEqual(new attListDeclaration.PToken({
               open: SToken.fromString('<!'),
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
                  token: new ParameterEntityReferencePToken({
                     open:  makeSToken('%'),
                     openSpace: undefined,
                     name:  makeSToken('foo'),
                     nameSpace: undefined,
                     close:  makeSToken(';'),
                  }),
               } ],
               nextPropName: 'name',
               close: makeSToken1('>'),
            }));
            done();
         });
      });

      it('parses a PERef in the attribute type location (check unassigned calls)', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('elName one CDATA #IMPLICIT two%foo;>');
         source.endText();

         attListDeclaration.parse(source, { open: SToken.fromString('<!') }, (result) => {
            const makeSToken = makeSTokenMaker();
            const makeSToken1 = makeSTokenMaker(undefined, 35, 0, 35);
            expect(result).toEqual(new attListDeclaration.PToken({
               open: SToken.fromString('<!'),
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
                  token: new ParameterEntityReferencePToken({
                     open:  makeSToken('%'),
                     openSpace: undefined,
                     name:  makeSToken('foo'),
                     nameSpace: undefined,
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

         attListDeclaration.parse(source, { open: SToken.fromString('<!') }, (result) => {
            const makeSToken = makeSTokenMaker();
            const makeSToken1 = makeSTokenMaker(undefined, 39, 0, 39);
            expect(result).toEqual(new attListDeclaration.PToken({
               open: SToken.fromString('<!'),
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
                  token: new ParameterEntityReferencePToken({
                     open:  makeSToken('%'),
                     openSpace: undefined,
                     name:  makeSToken('foo'),
                     nameSpace: undefined,
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

         attListDeclaration.parse(source, { open: SToken.fromString('<!') }, (pToken) => {
            if (!pToken) {
               throw new Error('Unexpected undefined PToken.');
            }

            // "expand" what should be there.
            pToken.unassigned = [{
                  type: UnassignedType.ENTITY_START,
                  token: new ParameterEntityStartPToken(new ParameterEntityReferencePToken({ open: SToken.fromString('%'), })),
               },
               unassigned.wordFromSToken(SToken.fromString('entityName')),
               unassigned.spaceFromSToken(SToken.fromString(' ')), {
                  type: UnassignedType.ENTITY_END,
                  token: new ParameterEntityEndPToken(new ParameterEntityReferencePToken({ open: SToken.fromString('%'), })),
               }
            ];

            attListDeclaration.assignUnassigned(pToken);

            const makeSToken = makeSTokenMaker();
            const makeSToken2 = makeSTokenMaker(undefined, 5, 0, 5);
            expect(pToken).toEqual(new attListDeclaration.PToken({
               open: SToken.fromString('<!'),
               declTypeSpace: new SToken(' ', ' ', [ helper.makeInsertedRange() ]),
               elementName: SToken.fromString('entityName'),
               postElementNameSpace: new SToken('  ', '  ', [ new Range(new EntityLocation()), helper.makeInsertedRange() ]),
               close: makeSToken2('>'),
            }));
            done();
         });
      });

      it('fills in the missing attributes', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('elName at1 CDATA %foo;>');
         source.endText();

         attListDeclaration.parse(source, { open: SToken.fromString('<!') }, (pToken) => {
            if (!pToken) {
               throw new Error('Unexpected undefined PToken.');
            }

            // "expand" what should be there.
            pToken.unassigned = [{
                  type: UnassignedType.ENTITY_START,
                  token: new ParameterEntityStartPToken(new ParameterEntityReferencePToken({ open: SToken.fromString('%'), })),
               }, unassigned.wordFromSToken(SToken.fromString('at2')),
               unassigned.spaceFromSToken(SToken.fromString(' ')),
               unassigned.wordFromSToken(SToken.fromString('ENTITIES')),
               unassigned.spaceFromSToken(SToken.fromString(' ')), {
                  type: UnassignedType.ENTITY_START,
                  token: new ParameterEntityEndPToken(new ParameterEntityReferencePToken({ open: SToken.fromString('%'), })),
               },
            ];

            attListDeclaration.assignUnassigned(pToken);

            const makeSToken = makeSTokenMaker();
            const makeSToken2 = makeSTokenMaker(undefined, 22, 0, 22);
            const expected = new attListDeclaration.PToken({
               open: SToken.fromString('<!'),
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
                  // value: [],
               }] as any,
               close: makeSToken2('>'),
            });
            (expected as any).attDefs[0].postTypeSpace.str += ' ';
            (expected as any).attDefs[0].postTypeSpace.originalStr += ' ';
            (expected as any).attDefs[0].postTypeSpace.ranges.push(helper.makeInsertedRange());
            (expected as any).attDefs[1].postTypeSpace.str += ' ';
            (expected as any).attDefs[1].postTypeSpace.originalStr += ' ';
            (expected as any).attDefs[1].postTypeSpace.ranges.push(helper.makeInsertedRange());
            expect(pToken).toEqual(new attListDeclaration.PToken(expected));
            done();
         });
      });

      it('identifies an enumeration if the type value is missing', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('elName at1 CDATA %foo;>');
         source.endText();

         attListDeclaration.parse(source, { open: SToken.fromString('<!') }, (pToken) => {
            if (!pToken) {
               throw new Error('Unexpected undefined PToken.');
            }

            // "expand" what should be there.
            pToken.unassigned = [{
                  type: UnassignedType.ENTITY_START,
                  token: new ParameterEntityStartPToken(new ParameterEntityReferencePToken({ open: SToken.fromString('%'), })),
               },
               unassigned.wordFromSToken(SToken.fromString('at2')),
               unassigned.spaceFromSToken(SToken.fromString(' ')),
               unassigned.wordFromSToken(SToken.fromString('(')),
               unassigned.wordFromSToken(SToken.fromString('one')),
               unassigned.wordFromSToken(SToken.fromString(')')),
               unassigned.wordFromSToken(SToken.fromString('#ENTITIES')),
               unassigned.spaceFromSToken(SToken.fromString(' ')), {
                  type: UnassignedType.ENTITY_START,
                  token: new ParameterEntityStartPToken(new ParameterEntityReferencePToken({ open: SToken.fromString('%'), })),
               }
            ];
            const makeSToken = makeSTokenMaker();
            const makeSToken2 = makeSTokenMaker(undefined, 22, 0, 22);
            const rawExpected = new attListDeclaration.PToken({
               open: SToken.fromString('<!'),
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
                  enumeration: new WordListPToken(WordListType.ENUMERATION, {
                     open: SToken.fromString('('),
                     words: [ {
                        word: SToken.fromString('one'),
                        wordSpace: undefined,
                        connector: undefined,
                        connectorSpace: undefined,
                     }],
                     close: SToken.fromString(')'),
                  }),
                  defaultType: SToken.fromString('#ENTITIES'),
                  postDefaultTypeSpace: SToken.fromString(' '),
                  // value: [],
               }] as any,
               close: makeSToken2('>'),
            });
            // work around some kind of ts issue
            const expected = new attListDeclaration.PToken(rawExpected);
            (expected as any).attDefs[0].postTypeSpace!.str += ' ';
            (expected as any).attDefs[0].postTypeSpace!.originalStr += ' ';
            (expected as any).attDefs[0].postTypeSpace!.ranges.push(helper.makeInsertedRange());
            (expected as any).attDefs[1].postDefaultTypeSpace!.str += ' ';
            (expected as any).attDefs[1].postDefaultTypeSpace!.originalStr += ' ';
            (expected as any).attDefs[1].postDefaultTypeSpace!.ranges.push(helper.makeInsertedRange());

            attListDeclaration.assignUnassigned(pToken);

            expect(pToken).toEqual(expected);
            done();
         });
      });

      it('will expand a list that is in progress', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('elName at1 (one|%foo;>');
         source.endText();

         attListDeclaration.parse(source, { open: SToken.fromString('<!') }, (pToken) => {
            if (!pToken) {
               throw new Error('Unexpected undefined PToken.');
            }

            // "expand" what should be there.
            pToken.unassigned = [{
                  type: UnassignedType.ENTITY_START,
                  token: new ParameterEntityStartPToken(new ParameterEntityReferencePToken({ open: SToken.fromString('%'), })),
               }, unassigned.wordFromSToken(SToken.fromString('two')),
               unassigned.wordFromSToken(SToken.fromString(')')),
               unassigned.wordFromSToken(SToken.fromString('#REQUIRED')), {
                  type: UnassignedType.ENTITY_START,
                  token: new ParameterEntityEndPToken(new ParameterEntityReferencePToken({ open: SToken.fromString('%'), })),
               },
            ];
            const makeSToken = makeSTokenMaker();
            const makeSToken2 = makeSTokenMaker(undefined, 21, 0, 21);
            const rawExpected = new attListDeclaration.PToken({
               open: SToken.fromString('<!'),
               elementName: makeSToken('elName'),
               postElementNameSpace: makeSToken(' '),
               attDefs: [{
                  name: makeSToken('at1'),
                  postNameSpace: makeSToken(' '),
                  enumeration: new WordListPToken(WordListType.ENUMERATION, {
                     open: makeSToken('('),
                     openSpace: undefined,
                     words: [ {
                        word: makeSToken('one'),
                        wordSpace: undefined,
                        connector: makeSToken('|'),
                        connectorSpace: undefined,
                     }, {
                        word: SToken.fromString('two'),
                        wordSpace: undefined,
                        connector: undefined,
                        connectorSpace: undefined,
                     }],
                     close: SToken.fromString(')'),
                     closeSpace: undefined,
                  }),
                  defaultType: SToken.fromString('#REQUIRED'),
                  value: [],
               }],
               close: makeSToken2('>'),
            });
            // work around some kind of ts issue
            const expected = new attListDeclaration.PToken(rawExpected);
            const spaceToken = SToken.fromString(' ');
            spaceToken.ranges = [ helper.makeInsertedRange() ];
            ((expected as any).attDefs[0].enumeration!.words[0] as any).connectorSpace = spaceToken;
            (expected as any).attDefs[0].postDefaultTypeSpace = spaceToken;

            attListDeclaration.assignUnassigned(pToken);

            expect(pToken).toEqual(expected);
            done();
         });
      });
   });

   describe('checkWellFormed()', () => {
      let ec: ErrorCollector;

      beforeEach(() => {
         ec = new ErrorCollector(SToken.fromString('x'), WellFormedError);
      });

      // it('asks the declaration module to look for problems in the declaration part', (done) => {
      //    declarationPToken.openSpace = expectedSToken(' ');
      //    const source = new STokenSource(defaultExtractors, new EntityMetaData());
      //    source.addText('foo>');
      //    source.endText();

      //    attListDeclaration.parse(source, declarationPToken, (parsing) => {
      //       attListDeclaration.checkWellFormed(parsing, ec, new EntityMetaData());

      //       expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.DECL_OPEN_XTRA_SPACE_AFTER);
      //       done();
      //    });
      // });

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

      it('calls wordList.checkWellFormed() on an enumerated list', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('elName attr ( $badName ) >');
         source.endText();
         attListDeclaration.parse(source, declarationPToken, (result) => {
            attListDeclaration.checkWellFormed(result, ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.WORDLIST_INVALID_NMTOKEN);
            done();
         });
      });

      it('calls wordList.checkWellFormed() on a NOTATION list', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('elName attr2 NOTATION ( goodName | $badName ) >');
         source.endText();
         attListDeclaration.parse(source, declarationPToken, (result) => {
            attListDeclaration.checkWellFormed(result, ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.WORDLIST_INVALID_NAME);
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

            token.pToken = new attListDeclaration.PToken({ open: SToken.fromString('<!'), });
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
               enumeration: [ 'one', 'two' ],
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
               enumeration: [ 'one', 'two' ],
               defaultType: '#REQUIRED',
               value: []
            }]));

            done();
         });
      });

   });

});
