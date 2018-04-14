/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, Range } from '../../basic';
import { ErrorCollector, WellFormedError, XmlWarning } from '../../error';
import { defaultExtractors } from '../../extractor';
import { SToken, STokenSource } from '../../sToken';
import { makeSTokenMaker } from '../../sToken/@test/helper';

import * as entityDeclaration from '../entityDeclaration.js';
import entityEnd from '../entityEnd.js';
import entityStart from '../entityStart.js';
import text from '../text';
import unassigned from '../unassigned';

import helper from './helper.js';

describe('entityDeclaration (integration)', () => {
   let declarationPToken;
   let emd;
   let source;

   beforeEach(() => {
      const makeSToken = makeSTokenMaker();
      declarationPToken = {
         open: makeSToken('<!'),
         declType: makeSToken('ENTITY'),
         postDeclTypeSpace: makeSToken('\t'),
      };
      emd = new EntityMetaData();
      source = new STokenSource(defaultExtractors, emd);
   });

   describe('parse()', () => {

      it('parses an enty declaration with a PEReference in the value', (done) => {
         source.addText('aName "frog%foo;">');
         source.endText();

         entityDeclaration.parse(source, { open: SToken.fromString('<') }, (pToken) => {
            expect(pToken.type).toEqual(entityDeclaration.PTYPE);
            expect(pToken.value[1].type).toEqual('PARAMETERENTITYREF');
            done();
         });
      });

      it('parses an entity declaration after the name', (done) => {
         source.addText('aName %foo;>');
         source.endText();

         entityDeclaration.parse(source, { open: SToken.fromString('<') }, (pToken) => {
            expect(pToken.postNameSpace.str).toEqual(' ');
            expect(pToken.unassigned[0].type).toEqual('PARAMETERENTITYREF');
            expect(pToken.close.str).toEqual('>');
            done();
         });
      });

      it('parses an enty declaration in the body of the declaration even when maformed', (done) => {
         source.addText('% foo ;>');
         source.endText();

         entityDeclaration.parse(source, { open: SToken.fromString('<') }, (pToken) => {
            expect(pToken.parameter).toBeUndefined();
            expect(pToken.unassigned[0].type).toEqual('PARAMETERENTITYREF');
            expect(pToken.close.str).toEqual('>');
            done();
         });
      });

      it('parses no enty declaration if there is not one', (done) => {
         source.addText('%foo "value">');
         source.endText();

         entityDeclaration.parse(source, { open: SToken.fromString('<') }, (pToken) => {
            expect(pToken.parameter.str).toEqual('%');
            expect(pToken.unassigned).toBeUndefined();
            expect(pToken.close.str).toEqual('>');
            done();
         });
      });

      it('parses an enty declaration in an externalID', (done) => {
         source.addText('aName SYSTEM %foo;>');
         source.endText();

         entityDeclaration.parse(source, { open: SToken.fromString('<') }, (pToken) => {
            expect(pToken.externalId.idType.str).toEqual('SYSTEM');
            expect(pToken.unassigned[0].type).toEqual('PARAMETERENTITYREF');
            expect(pToken.unassigned).toBe(pToken.externalId.unassigned);
            expect(pToken.close.str).toEqual('>');
            done();
         });
      });

   });

   describe('assignUnassigned()', () => {

      it('fills in the missing properties, including the preceeding declaration space', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('%foo;>');
         source.endText();

         entityDeclaration.parse(source, {}, (pToken) => {
            // "expand" what should be there.
            pToken.unassigned = [
               new entityStart.ParamPToken({}),
               unassigned.wordFromSToken(SToken.fromString('entityName')),
               unassigned.spaceFromSToken(SToken.fromString(' ')), {
                  type: 'literal',
                  openQuote: SToken.fromString('"'),
                  value: [ SToken.fromString('foo') ],
                  closeQuote: SToken.fromString('"'),
               },
               new entityEnd.ParamPToken({}),
            ];

            entityDeclaration.assignUnassigned(pToken);

            const makeSToken = makeSTokenMaker();
            const makeSToken2 = makeSTokenMaker(undefined, 5, 0, 5);
            expect(pToken).toEqual(new entityDeclaration.PToken({
               postDeclTypeSpace: new SToken(' ', ' ', [ helper.makeInsertedRange() ]),
               name: SToken.fromString('entityName'),
               postNameSpace: SToken.fromString(' '),
               openQuote: SToken.fromString('"'),
               value: [ SToken.fromString('foo') ],
               closeQuote: SToken.fromString('"'),
               postEntityValueSpace: new SToken(' ', ' ', [ helper.makeInsertedRange() ]),
               close: makeSToken2('>'),
            }));
            done();
         });
      });

   });

   describe('checkWellFormed()', () => {

      it('reports errors in the declaration part (declaration.checkWellFormed())', (done) => {
         declarationPToken.postOpenSpace = declarationPToken.postDeclTypeSpace;
         source.addText('entityName "entityValue">');
         entityDeclaration.parse(source, declarationPToken, (result) => {
            const ec = new ErrorCollector(declarationPToken.open, WellFormedError);

            entityDeclaration.checkWellFormed(result, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.DECL_OPEN_XTRA_SPACE_AFTER);
            done();
         });
      });

      it('reports errors in the literal value (literal.checkWellFormed())', (done) => {
         source.addText('entityName "entityValue');  // missing closing quote
         source.endText();
         entityDeclaration.parse(source, declarationPToken, (result) => {
            const ec = new ErrorCollector(declarationPToken.open, WellFormedError);

            entityDeclaration.checkWellFormed(result, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.LITERAL_NO_CLOSE_QUOTE);
            done();
         });
      });

      it('reports an error when name used an invalid char(check misc.checkName())', (done) => {
         source.addText('$foo "frog">');
         entityDeclaration.parse(source, declarationPToken, (result) => {
            const ec = new ErrorCollector(declarationPToken.open, WellFormedError);

            entityDeclaration.checkWellFormed(result, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ENTITYDECL_NAME_INVALID);
            done();
         });
      });

      it('reports an error when name starts with "xml" (check misc.checkWellFormedNameRecommendation())', (done) => {
         source.addText('xmlFoo "frog">');
         entityDeclaration.parse(source, declarationPToken, (result) => {
            const ec = new ErrorCollector(declarationPToken.open, WellFormedError);

            entityDeclaration.checkWellFormed(result, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(XmlWarning.ID.ENTITYDECL_NAME_XML_RESERVED);
            done();
         });
      });

      it('reports an error when external ID has no value (externalId.checkWellFormed())', (done) => {
         source.addText('entityName SYSTEM >');
         entityDeclaration.parse(source, declarationPToken, (result) => {
            const ec = new ErrorCollector(declarationPToken.open, WellFormedError);

            entityDeclaration.checkWellFormed(result, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.LITERAL_NO_OPEN_QUOTE);
            done();
         });
      });

      it('reports an error when NDATA value has a bad char (check misc.checkWellFormedText())', (done) => {
         source.addText('entityName SYSTEM "sys.xml" NDATA bad\u0000>');
         entityDeclaration.parse(source, declarationPToken, (result) => {
            const ec = new ErrorCollector(declarationPToken.open, WellFormedError);

            entityDeclaration.checkWellFormed(result, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
            done();
         });
      });

      it('calls unassigned.checkExtra() to report on extra values', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('entityName %bar; "other">');
         source.endText();

         entityDeclaration.parse(source, declarationPToken, (pToken) => {
            // "expand" what should be there.
            pToken.unassigned.shift(); // get rid of the peref
            pToken.unassigned = [
               new entityStart.ParamPToken({}), {
                  type: 'literal',
                  openQuote: new SToken('"', '"', new Range()),
                  value: [ new text.PToken({ text: new SToken('entityValue', 'entityValue', new Range()) }) ],
                  closeQuote: new SToken('"', '"', new Range()),
               },
               new entityEnd.ParamPToken({}),
            ].concat(pToken.unassigned);
            entityDeclaration.assignUnassigned(pToken);
            const ec = new ErrorCollector(undefined, WellFormedError);

            entityDeclaration.checkWellFormed(pToken, ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ENTITYDECL_EXTRA_TEXT);
            done();
         });
      });

   });

   describe('pTokenToXToken()', () => {

      it('adds the EntityValue (literal.makeTokenCompatible())', (done) => {
         source.addText('entityName "one" >');
         entityDeclaration.parse(source, declarationPToken, (pToken) => {
            const xToken = entityDeclaration.pTokenToXToken(pToken);

            expect(xToken.value[0].text.str).toEqual('one');
            done();
         });
      });

      it('creates a token with the externalLoc set (externalId.makeEntityLocation())', (done) => {
         source.addText('entityName SYSTEM "sys.xml" >');
         entityDeclaration.parse(source, declarationPToken, (pToken) => {
            const xToken = entityDeclaration.pTokenToXToken(pToken);

            expect(xToken.externalLoc).toEqual(new EntityLocation('sys.xml'));
            done();
         });
      });

      it('adds the token to the SToken list (externalId.getStokens())', (done) => {
         source.addText('entityName SYSTEM "sys.xml" >');
         entityDeclaration.parse(source, declarationPToken, (pToken) => {
            const xToken = entityDeclaration.pTokenToXToken(pToken);

            expect(xToken.pToken.externalId.system.value[0].text.str).toEqual('sys.xml');
            done();
         });
      });

      it('adds the token to the SToken list (literal.getSTokens())', (done) => {
         source.addText('entityName "dukkha" >');
         entityDeclaration.parse(source, declarationPToken, (pToken) => {
            const xToken = entityDeclaration.pTokenToXToken(pToken);

            expect(xToken.pToken.value[0].text.str).toEqual('dukkha');
            done();
         });
      });

   });

});
