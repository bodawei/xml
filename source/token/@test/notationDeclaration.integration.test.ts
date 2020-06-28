/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData } from 'basic';
import { ErrorCollector, WellFormedError, XmlWarning } from 'error';
import { defaultExtractors } from 'extractor';
import { SToken, STokenSource } from 'sToken';

import { DeclarationStart } from '../bridge/declaration';
import { EXTERNAL_ID } from '../common/externalId';
import unassigned, { UnassignedType } from '../common/unassigned';
import { ParameterEntityEndPToken } from '../marker/parameterEntityEnd';
import { ParameterEntityStartPToken } from '../marker/parameterEntityStart';
import { NotationDeclarationPToken, parseNotationDeclaration, NotationDeclarationXToken } from '../notationDeclaration';
import { ParameterEntityReferencePToken } from '../parameterEntityReference';

import helper from './helper';
import { TextPToken } from '../text';

describe('notationDeclaration (integration)', () => {
   let declarationStart: DeclarationStart;

   beforeEach(() => {
      declarationStart = {
         open: SToken.fromString('<!'),
         openSpace: undefined,
         declType: SToken.fromString('NOTATION'),
         declTypeSpace: SToken.fromString(' '),
      };
   });

   describe('parse()', () => {

      it('produces an externalID when called', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('foo SYSTEM "sys.dtd">');
         source.endText();

         parseNotationDeclaration(source, declarationStart, (parsing) => {
            expect(parsing.externalId!.type).toEqual(EXTERNAL_ID);
            done();
         });
      });

      it('parses a PERef (check unsasigned calls)', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('%foo;>');
         source.endText();

         parseNotationDeclaration(source, { open: SToken.fromString('<!') }, (result) => {
            const expected = new NotationDeclarationPToken({
               open: SToken.fromString('<!'),
               unassigned: [{
                  type: UnassignedType.REFERENCE,
                  token: new ParameterEntityReferencePToken({
                     open: SToken.fromString('%'),
                     openSpace: undefined,
                     name: SToken.fromString('foo'),
                     nameSpace: undefined,
                     close: SToken.fromString(';'),
                  }),
               }],
               nextPropName: 'name',
               close: SToken.fromString('>'),
            });
            (expected as any).peRefPlus = expected.unassigned;

            expect(result).toEqualRangeless(expected);
            done();
         });
      });

      it('copes with a PERef in the externalId (check unsasigned calls)', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('notationName %foo;>');
         source.endText();
         const unassignedValue = [{
            type: UnassignedType.REFERENCE,
            token: new ParameterEntityReferencePToken({
               open: SToken.fromString('%'),
               openSpace: undefined,
               name: SToken.fromString('foo'),
               nameSpace: undefined,
               close: SToken.fromString(';'),
            }),
         }];

         parseNotationDeclaration(source, { open: SToken.fromString('<!') }, (result) => {
            expect(result).toEqualRangeless(new NotationDeclarationPToken({
               type: 'NOTATION_DECLARATION_PTOKEN',
               open: SToken.fromString('<!'),
               name: SToken.fromString('notationName'),
               nameSpace: SToken.fromString(' '),
               unassigned: unassignedValue as any,
               peRefPlus: unassignedValue as any,
               nextPropName: 'externalType',
               externalId: {
                  type: 'EXTERNAL_ID',
                  peRefPlus: unassignedValue as any,
                  unassigned: unassignedValue as any,
                  nextPropName: 'externalType',
               },
               close: SToken.fromString('>'),
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

         parseNotationDeclaration(source, { open: SToken.fromString('<!') }, (pToken) => {
            // "expand" what should be there.
            (pToken as any).unassigned = [{
               type: UnassignedType.ENTITY_START,
               token: new ParameterEntityStartPToken(new ParameterEntityReferencePToken({ open: SToken.fromString('%'), })),
            },
            unassigned.wordFromSToken(SToken.fromString('notationName')),
            unassigned.spaceFromSToken(SToken.fromString(' ')),
            unassigned.wordFromSToken(SToken.fromString('PUBLIC')), {
               type: UnassignedType.LITERAL,
               token: {
                  openQuote: SToken.fromString('"'),
                  value: [SToken.fromString('foo')],
                  closeQuote: SToken.fromString('"'),
               }
            }, {
               type: UnassignedType.ENTITY_END,
               token: new ParameterEntityEndPToken(new ParameterEntityReferencePToken({ open: SToken.fromString('%'), })),
            }
            ];
            (pToken as any).peRefPlus = (pToken as any).unassigned;

            pToken.assignUnassigned();

            expect(pToken).toEqualRangeless(new NotationDeclarationPToken({
               type: 'NOTATION_DECLARATION_PTOKEN',
               open: SToken.fromString('<!'),
               declTypeSpace: new SToken(' ', ' ', [helper.makeInsertedRange()]),
               name: SToken.fromString('notationName'),
               nameSpace: SToken.fromString(' '),
               unassigned: (pToken as any).unassigned as any,
               peRefPlus: (pToken as any).unassigned as any,
               extra: [],
               externalId: {
                  type: EXTERNAL_ID,
                  peRefPlus: [],
                  externalType: SToken.fromString('PUBLIC'),
                  public: {
                     openQuote: SToken.fromString('"'),
                     value: [SToken.fromString('foo')], // ICK
                     closeQuote: SToken.fromString('"'),
                  },
                  publicSpace: new SToken(' ', ' ', [helper.makeInsertedRange()]),
                  
               } as any,
               close: SToken.fromString('>'),
            }));
            done();
         });
      });

   });

   describe('checkWellFormed()', () => {

      it('asks the externalId module to look for well formed problems', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('foo system "sys.dtd">');
         source.endText();

         parseNotationDeclaration(source, declarationStart, (parsing) => {
            const ec = new ErrorCollector(SToken.fromString('dummy'), WellFormedError);

            parsing.checkWellFormed(ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.EXTERNALID_INVALID_CASE);
            done();
         });
      });

      it('calls misc.checkName() to report on invalid names', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('$foo system "sys.dtd">');
         source.endText();
         parseNotationDeclaration(source, declarationStart, (result) => {
            const ec = new ErrorCollector(result.open, WellFormedError);

            result.checkWellFormed(ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.NOTATIONDECL_NAME_INVALID);
            done();
         });
      });

      it('calls misc.checkWellFormedNameRecommendation() to report on bad names', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('xmlOne system "sys.dtd">');
         source.endText();

         parseNotationDeclaration(source, declarationStart, (parsing) => {
            const ec = new ErrorCollector(SToken.fromString('dummy'), WellFormedError);

            parsing.checkWellFormed(ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(XmlWarning.ID.NOTATIONDECL_NAME_XML_RESERVED);
            done();
         });
      });

      it('calls unassigned.checkExtra() to report on extra values', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('name SYSTEM %bar; "other">');
         source.endText();

         parseNotationDeclaration(source, declarationStart, (pToken) => {
            // "expand" what should be there.
            pToken.unassigned.shift(); // get rid of the peref
            (pToken as any).unassigned = [{
               type: UnassignedType.ENTITY_START,
               token: new ParameterEntityStartPToken(new ParameterEntityReferencePToken({ open: SToken.fromString('%'), })),
            }, {
               type: UnassignedType.LITERAL,
               token: {
                  openQuote: SToken.fromString('"'),
                  value: [new TextPToken({ text: SToken.fromString('sys.dtd') })],
                  closeQuote: SToken.fromString('"'),
               },
            }, {
               type: UnassignedType.ENTITY_END,
               token: new ParameterEntityEndPToken(new ParameterEntityReferencePToken({ open: SToken.fromString('%'), })),
            },
            ].concat(pToken.unassigned as any);
            pToken.assignUnassigned();
            const ec = new ErrorCollector(SToken.fromString('dummy'), WellFormedError);

            pToken.checkWellFormed(ec, new EntityMetaData());

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

         parseNotationDeclaration(source, declarationStart, (parsing) => {
            const token = parsing.toXToken();

            token.pToken = undefined;
            expect(token).toEqual(new NotationDeclarationXToken('foo', new EntityLocation('sys.dtd'))); // typeHack
            done();
         });
      });

      it('includes the STokens for the externalId and declaration', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('foo SYSTEM "sys.dtd">');
         source.endText();

         parseNotationDeclaration(source, declarationStart, (parsing) => {
            const token = parsing.toXToken();

            expect(token.pToken!.open).toEqual(declarationStart.open);
            done();
         });
      });

   });

});
