/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from 'basic';
import { ErrorCollector, WellFormedError, XmlWarning } from 'error';
import { defaultExtractors } from 'extractor';
import { SToken, STokenSource } from 'sToken';

import { DeclarationStart } from '../bridge/declaration';
import { EXTERNAL_ID } from '../common/externalId';
import { UnassignedType, UnassignedArray } from '../common/unassigned';
import { NotationDeclarationPToken, parseNotationDeclaration, NotationDeclarationXToken } from '../notationDeclaration';
import { ParameterEntityReferencePToken } from '../parameterEntityReference';

import { ExternalIdXToken } from 'xToken';

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
         const unassignedValue: UnassignedArray = [{
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
               unassigned: unassignedValue,
               peRefPlus: unassignedValue,
               nextPropName: 'externalType',
               externalId: {
                  type: 'EXTERNAL_ID',
                  externalType: undefined,
                  externalTypeSpace: undefined,
                  public: undefined,
                  publicSpace: undefined,
                  system: undefined,
               },
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
            pToken.extra = pToken.unassigned;
            const ec = new ErrorCollector(SToken.fromString('dummy'), WellFormedError);

            pToken.checkWellFormed(ec, new EntityMetaData());

            expect(ec.getErrors()[2].id).toEqual(WellFormedError.ID.NOTATIONDECL_EXTRA_TEXT);
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
            expect(token).toEqual(new NotationDeclarationXToken('foo', new ExternalIdXToken('sys.dtd')));
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
