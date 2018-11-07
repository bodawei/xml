/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, Range } from 'basic';
import { ErrorCollector, WellFormedError, XmlWarning } from 'error';
import { defaultExtractors } from '../../extractor';
import { SToken, STokenSource } from 'sToken';
import { makeSTokenMaker } from '../../sToken/@test/helper';

import { ParameterEntityEndPToken } from '../marker/parameterEntityEnd';
import { ParameterEntityStartPToken } from '../marker/parameterEntityStart';
import entityReference, { ParameterEntityReferencePToken } from '../entityReference';
import externalId from '../common/externalId';
import notationDeclaration, { NotationDeclarationPToken } from '../notationDeclaration';
import text from '../text';
import unassigned, { UnassignedType } from '../common/unassigned';

import helper from './helper';

type DeclarationPToken = {
   open: SToken;
   postOpenSpace?: SToken;
   declType?: SToken;
   postDeclTypeSpace?: SToken;
};

describe('notationDeclaration (integration)', () => {
   let declarationPToken: DeclarationPToken;
   let expectedSToken: (param: string) => SToken;

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
            expect(parsing.externalId!.type).toEqual(externalId.PTYPE);
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
         const makeSToken1 = makeSTokenMaker(undefined, 13, 0, 13);
         const unassignedValue = [ {
            type: UnassignedType.REFERENCE,
            token: new entityReference.ParamPToken({
               open:  makeSToken1('%'),
               postOpenSpace: undefined,
               name:  makeSToken1('foo'),
               postNameSpace: undefined,
               close:  makeSToken1(';'),
            }),
          } ];

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
            pToken.unassigned = [{
                  type: UnassignedType.ENTITY_START,
                  token: new ParameterEntityStartPToken(new ParameterEntityReferencePToken()),
               }, 
               unassigned.wordFromSToken(SToken.fromString('notationName')),
               unassigned.spaceFromSToken(SToken.fromString(' ')),
               unassigned.wordFromSToken(SToken.fromString('PUBLIC')), {
                  type: UnassignedType.LITERAL,
                  token: {
                     openQuote: SToken.fromString('"'),
                     value: [ SToken.fromString('foo') ],
                     closeQuote: SToken.fromString('"'),
                  }
               }, {
                  type: UnassignedType.ENTITY_END,
                  token: new ParameterEntityEndPToken(new ParameterEntityReferencePToken({})),
               }
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
            const ec = new ErrorCollector(SToken.fromString('dummy'), WellFormedError);

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
            const ec = new ErrorCollector(SToken.fromString('dummy'), WellFormedError);

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
            const ec = new ErrorCollector(SToken.fromString('dummy'), WellFormedError);

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
            pToken.unassigned = [{
               type: UnassignedType.ENTITY_START,
               token: new ParameterEntityStartPToken(new ParameterEntityReferencePToken()),
            }, {
                  type: UnassignedType.LITERAL,
                  token: {
                     openQuote: SToken.fromString('"'),
                     value: [ new text.PToken({ text: SToken.fromString('sys.dtd') }) ],
                     closeQuote: SToken.fromString('"'),
                  },
               }, {
                  type: UnassignedType.ENTITY_END,
                  token: new ParameterEntityEndPToken(new ParameterEntityReferencePToken({})),
               },
            ].concat(pToken.unassigned);
            pToken.externalId!.unassigned = pToken.unassigned;
            notationDeclaration.assignUnassigned(pToken);
            const ec = new ErrorCollector(SToken.fromString('dummy'), WellFormedError);

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

            token.pToken = {} as NotationDeclarationPToken; // typeHack
            expect(token).toEqual(new notationDeclaration.XToken('foo', new EntityLocation('sys.dtd'), {} as NotationDeclarationPToken)); // typeHack
            done();
         });
      });

      it('includes the STokens for the externalId and declaration', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('foo SYSTEM "sys.dtd">');
         source.endText();

         notationDeclaration.parse(source, declarationPToken, (parsing) => {
            const token = notationDeclaration.pTokenToXToken(parsing);

            expect(token.pToken!.open).toEqual(declarationPToken.open);
            done();
         });
      });

   });

});
