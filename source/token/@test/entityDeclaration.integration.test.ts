/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, Range } from 'basic';
import { ErrorCollector, WellFormedError, XmlWarning } from 'error';
import { defaultExtractors } from 'extractor';
import { SToken, STokenSource } from 'sToken';
import { makeSTokenMaker } from 'sToken-test';

import { parseEntityDeclaration } from '../entityDeclaration';
import { GeneralEntityDeclarationPToken, GENERAL_ENTITY_DECLARATION_PTOKEN } from '../generalEntityDeclaration';
import { ParameterEntityEndPToken } from '../marker/parameterEntityEnd';
import unassigned, { UnassignedType } from '../common/unassigned';

import helper from './helper';
import { DeclarationPToken } from '../bridge/baseDeclaration';
import { ParameterEntityStartPToken } from '../marker/parameterEntityStart';
import { PARAMETER_ENTITY_REFERENCE_PTOKEN, ParameterEntityReferencePToken } from '../parameterEntityReference';
import { TextPToken } from '../text';

describe('entityDeclaration (integration)', () => {
   let declarationPToken: DeclarationPToken;
   let emd: EntityMetaData;
   let source: STokenSource;

   beforeEach(() => {
      const makeSToken = makeSTokenMaker();
      declarationPToken = new DeclarationPToken('xxx', {
         open: makeSToken('<!'),
         declType: makeSToken('ENTITY'),
         declTypeSpace: makeSToken('\t'),
      });
      emd = new EntityMetaData();
      source = new STokenSource(defaultExtractors, emd);
   });

   describe('parse()', () => {

      it('parses an enty declaration with a PEReference in the value', (done) => {
         source.addText('aName "frog%foo;">');
         source.endText();

         parseEntityDeclaration(source, { open: SToken.fromString('<') } as DeclarationPToken, (pToken) => {
            expect(pToken.type).toEqual(GENERAL_ENTITY_DECLARATION_PTOKEN);
            expect((pToken as any).value[1].type).toEqual(PARAMETER_ENTITY_REFERENCE_PTOKEN);
            done();
         });
      });

      it('parses an entity declaration after the name', (done) => {
         source.addText('aName %foo;>');
         source.endText();

         parseEntityDeclaration(source, { open: SToken.fromString('<') } as DeclarationPToken, (pToken) => {
            expect(pToken.nameSpace!.str).toEqual(' ');
            expect((pToken as any).unassigned[0].type).toEqual('reference');
            expect(pToken.close!.str).toEqual('>');
            done();
         });
      });

      it('parses an enty declaration in the body of the declaration even when maformed', (done) => {
         source.addText('% foo ;>');
         source.endText();

         parseEntityDeclaration(source, { open: SToken.fromString('<') } as DeclarationPToken, (pToken) => {
            expect(pToken.parameter).toBeUndefined();
            expect((pToken as any).unassigned[0].type).toEqual('reference');
            expect(pToken.close!.str).toEqual('>');
            done();
         });
      });

      it('parses no enty declaration if there is not one', (done) => {
         source.addText('%foo "value">');
         source.endText();

         parseEntityDeclaration(source, { open: SToken.fromString('<') } as DeclarationPToken, (pToken) => {
            expect((pToken as any).parameter.str).toEqual('%');
            expect(pToken.unassigned).toBeUndefined();
            expect(pToken.close!.str).toEqual('>');
            done();
         });
      });

      it('parses an enty declaration in an externalID', (done) => {
         source.addText('aName SYSTEM %foo;>');
         source.endText();

         parseEntityDeclaration(source, { open: SToken.fromString('<') } as DeclarationPToken, (pToken) => {
            expect(pToken.externalId!.externalType!.str).toEqual('SYSTEM');
            expect((pToken as any).unassigned[0].type).toEqual('reference');
            expect(pToken.unassigned).toBe(pToken.externalId!.unassigned);
            expect(pToken.close!.str).toEqual('>');
            done();
         });
      });

   });

   describe('assignUnassigned()', () => {

      it('fills in the missing properties, including the preceeding declaration space', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('%foo;>');
         source.endText();

         parseEntityDeclaration(source, {} as DeclarationPToken, (pToken) => {
            // "expand" what should be there.
            const unassignedValue = [{
                  type: UnassignedType.ENTITY_START,
                  token: new ParameterEntityStartPToken(new ParameterEntityReferencePToken({ open: SToken.fromString('%'), })),
               }, unassigned.wordFromSToken(SToken.fromString('entityName')),
               unassigned.spaceFromSToken(SToken.fromString(' ')), {
                  type: UnassignedType.LITERAL,
                  token: {
                     openQuote: SToken.fromString('"'),
                     value: [ SToken.fromString('foo') ],
                     closeQuote: SToken.fromString('"'),
                  }
               }, {
                  type: UnassignedType.ENTITY_END,
                  token: new ParameterEntityEndPToken(new ParameterEntityReferencePToken({ open: SToken.fromString('%'), })),
               }
            ] as any;
            (pToken as any).unassigned = unassignedValue;
            (pToken as any).peRefPlus = unassignedValue;

            (pToken as any).assignUnassigned(); // typeHack

            const makeSToken = makeSTokenMaker();
            const makeSToken2 = makeSTokenMaker(undefined, 5, 0, 5);
            expect(pToken).toEqual(new GeneralEntityDeclarationPToken({
               declTypeSpace: new SToken(' ', ' ', [ helper.makeInsertedRange() ]),
               name: SToken.fromString('entityName'),
               nameSpace: SToken.fromString(' '),
               openQuote: SToken.fromString('"'),
               value: [ SToken.fromString('foo') ],
               closeQuote: SToken.fromString('"'),
               entityValueSpace: new SToken(' ', ' ', [ helper.makeInsertedRange() ]),
               close: makeSToken2('>'),
            }));
            done();
         });
      });

   });

   describe('checkWellFormed()', () => {

      // it('reports errors in the declaration part (declaration.checkWellFormed())', (done) => {
      //    declarationPToken.postOpenSpace = declarationPToken.postDeclTypeSpace;
      //    source.addText('entityName "entityValue">');
      //    parseEntityDeclaration(source, declarationPToken, (result) => {
      //       const ec = new ErrorCollector(declarationPToken.open, WellFormedError);

      //       result.checkWellFormed(ec, emd);

      //       expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.DECL_OPEN_XTRA_SPACE_AFTER);
      //       done();
      //    });
      // });

      it('reports errors in the literal value (literal.checkWellFormed())', (done) => {
         source.addText('entityName "entityValue');  // missing closing quote
         source.endText();
         parseEntityDeclaration(source, declarationPToken, (result) => {
            const ec = new ErrorCollector(declarationPToken.open, WellFormedError);

            result.checkWellFormed(ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.LITERAL_NO_CLOSE_QUOTE);
            done();
         });
      });

      it('reports an error when name used an invalid char(check misc.checkName())', (done) => {
         source.addText('$foo "frog">');
         parseEntityDeclaration(source, declarationPToken, (result) => {
            const ec = new ErrorCollector(declarationPToken.open, WellFormedError);

            result.checkWellFormed(ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ENTITYDECL_NAME_INVALID);
            done();
         });
      });

      it('reports an error when name starts with "xml" (check misc.checkWellFormedNameRecommendation())', (done) => {
         source.addText('xmlFoo "frog">');
         parseEntityDeclaration(source, declarationPToken, (result) => {
            const ec = new ErrorCollector(declarationPToken.open, WellFormedError);

            result.checkWellFormed(ec, emd);

            expect(ec.getErrors()[0].id).toEqual(XmlWarning.ID.ENTITYDECL_NAME_XML_RESERVED);
            done();
         });
      });

      it('reports an error when external ID has no value (externalId.checkWellFormed())', (done) => {
         source.addText('entityName SYSTEM >');
         parseEntityDeclaration(source, declarationPToken, (result) => {
            const ec = new ErrorCollector(declarationPToken.open, WellFormedError);

            result.checkWellFormed(ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.LITERAL_NO_OPEN_QUOTE);
            done();
         });
      });

      it('reports an error when NDATA value has a bad char (check misc.checkCharWellFormed())', (done) => {
         source.addText('entityName SYSTEM "sys.xml" NDATA bad\u0000>');
         parseEntityDeclaration(source, declarationPToken, (result) => {
            const ec = new ErrorCollector(declarationPToken.open, WellFormedError);

            result.checkWellFormed(ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
            done();
         });
      });

      it('calls unassigned.checkExtra() to report on extra values', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('entityName %bar; "other">');
         source.endText();

         parseEntityDeclaration(source, declarationPToken, (pToken) => {
            // "expand" what should be there.
            (pToken.unassigned as any).shift(); // get rid of the peref
            (pToken as any).unassigned = [{
                  type: UnassignedType.ENTITY_START,
                  token: new ParameterEntityStartPToken(new ParameterEntityReferencePToken({ open: SToken.fromString('%'), })),
               }, {
                  type: UnassignedType.LITERAL,
                  token: {
                     openQuote: new SToken('"', '"', new Range(new EntityLocation())),
                     value: [ new TextPToken({ text: new SToken('entityValue', 'entityValue', new Range(new EntityLocation())) }) ],
                     closeQuote: new SToken('"', '"', new Range(new EntityLocation())),
                  }
               }, {
                  type: UnassignedType.ENTITY_END,
                  token: new ParameterEntityEndPToken(new ParameterEntityReferencePToken({ open: SToken.fromString('%'), })),
               },
            ].concat(pToken.unassigned as any) as any;
            (pToken as any).assignUnassigned(); // typeHAck
            const ec = new ErrorCollector(SToken.fromString('x'), WellFormedError);

            pToken.checkWellFormed(ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ENTITYDECL_EXTRA_TEXT);
            done();
         });
      });

   });

   // describe('pTokenToXToken()', () => {

   //    it('adds the EntityValue (literal.makeTokenCompatible())', (done) => {
   //       source.addText('entityName "one" >');
   //       parseEntityDeclaration(source, declarationPToken, (pToken) => {
   //          const xToken: any = entityDeclaration.pTokenToXToken(pToken);

   //          expect((xToken.value[0] as any).text.str).toEqual('one');
   //          done();
   //       });
   //    });

   //    it('creates a token with the externalLoc set (externalId.makeEntityLocation())', (done) => {
   //       source.addText('entityName SYSTEM "sys.xml" >');
   //       parseEntityDeclaration(source, declarationPToken, (pToken) => {
   //          const xToken = entityDeclaration.pTokenToXToken(pToken);

   //          expect(xToken.externalLoc).toEqual(new EntityLocation('sys.xml'));
   //          done();
   //       });
   //    });

   //    it('adds the token to the SToken list (externalId.getStokens())', (done) => {
   //       source.addText('entityName SYSTEM "sys.xml" >');
   //       parseEntityDeclaration(source, declarationPToken, (pToken) => {
   //          const xToken = entityDeclaration.pTokenToXToken(pToken);

   //          expect((xToken as any).pToken!.externalId!.system.value[0].text.str).toEqual('sys.xml'); // typeHack
   //          done();
   //       });
   //    });

   //    it('adds the token to the SToken list (literal.getSTokens())', (done) => {
   //       source.addText('entityName "dukkha" >');
   //       parseEntityDeclaration(source, declarationPToken, (pToken) => {
   //          const xToken = entityDeclaration.pTokenToXToken(pToken);

   //          expect((xToken as any).pToken.value[0].text.str).toEqual('dukkha');
   //          done();
   //       });
   //    });

   // });

});
