/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from 'basic';
import { ErrorCollector, WellFormedError } from 'error';
import { defaultExtractors } from 'extractor';
import { SToken, STokenSource, toSToken } from 'sToken';
import { makeSTokenMaker } from 'sToken-test';
import { ParameterEntityReferencePToken, ParameterEntityStartPToken, TextPToken } from 'token';

import helper from '../../@test/helper';
import { ParameterEntityEndPToken } from '../../marker/parameterEntityEnd';
import unassigned, { UnassignedType } from '../unassigned';
import {
   ExternalId,
   parseExternalId,
   assignExternalIdUnssigned,
   checkExternalIdWellFormed,
   getSTokens,
} from '../externalId';

describe('externalId (integration)', () => {
   describe('parse()', () => {
      let emd: EntityMetaData;
      let source: STokenSource;

      beforeEach(() => {
         emd = new EntityMetaData();
         source = new STokenSource(defaultExtractors, emd);
      });

      it('parses the public and system value (check literal.parse())', (done) => {
         source.addText('PUBLIC "pub.xml"\t"sys.xml">');

         parseExternalId(source, [], false, (result) => {
            const makeSToken = makeSTokenMaker();
            expect(result.externalId).toEqual({
               type: 'EXTERNAL_ID',
               externalType: makeSToken('PUBLIC'),
               externalTypeSpace: makeSToken(' '),
               public: {
                  openQuote: makeSToken('"'),
                  value: [new TextPToken({ text: makeSToken('pub.xml') })],
                  closeQuote: makeSToken('"'),
               },
               publicSpace: makeSToken('\t'),
               system: {
                  openQuote: makeSToken('"'),
                  value: [new TextPToken({ text: makeSToken('sys.xml') })],
                  closeQuote: makeSToken('"'),
               },
            });
            done();
         });
      });

      it('parses a PERef (check unsasigned calls)', (done) => {
         source.addText('PUBLIC "pub.xml"%foo;>');

         parseExternalId(source, [], true, (result) => {
            const makeSToken = makeSTokenMaker();
            const expected: ExternalId = {
               type: 'EXTERNAL_ID',
               externalType: makeSToken('PUBLIC'),
               externalTypeSpace: makeSToken(' '),
               public: {
                  openQuote: makeSToken('"'),
                  value: [new TextPToken({ text: makeSToken('pub.xml') })],
                  closeQuote: makeSToken('"'),
               },
               publicSpace: undefined,
               system: undefined,
            };

            expect(result).toEqual({
               externalId: expected,
               peRefPlus: [
                  {
                     type: UnassignedType.REFERENCE,
                     token: new ParameterEntityReferencePToken({
                        open: makeSToken('%'),
                        openSpace: undefined,
                        name: makeSToken('foo'),
                        nameSpace: undefined,
                        close: makeSToken(';'),
                     }),
                  },
               ],
               nextPropName: 'system',
            });
            done();
         });
      });
   });

   describe('assignUnassigned()', () => {
      let emd: EntityMetaData;
      let source: STokenSource;

      beforeEach(() => {
         emd = new EntityMetaData();
         source = new STokenSource(defaultExtractors, emd);
      });
      it('assigns the public and system value (check unassigned.assignToProps())', (done) => {
         source.addText('PUBLIC\t%publicVal;\t"sys.xml">');
         source.endText();

         parseExternalId(source, [], true, (result) => {
            // expand/replace the publicVal reference
            result.peRefPlus.shift();
            result.peRefPlus.unshift({
               type: UnassignedType.ENTITY_END,
               token: new ParameterEntityEndPToken(
                  new ParameterEntityReferencePToken({ open: toSToken('%') }),
               ) as any,
            });
            result.peRefPlus.unshift({
               type: UnassignedType.LITERAL,
               token: {
                  openQuote: toSToken('"'),
                  value: [new TextPToken({ text: toSToken('pub.xml') })],
                  closeQuote: toSToken('"'),
               },
            });
            result.peRefPlus.unshift({
               type: UnassignedType.ENTITY_START,
               token: new ParameterEntityStartPToken(
                  new ParameterEntityReferencePToken({ open: toSToken('%') }),
               ) as any,
            });

            const assignResult = assignExternalIdUnssigned(
               result.externalId!,
               result.peRefPlus,
               result.nextPropName,
            );

            expect(assignResult).toEqualRangeless({
               externalId: {
                  type: 'EXTERNAL_ID',
                  externalType: toSToken('PUBLIC'),
                  externalTypeSpace: toSToken('\t '),
                  public: {
                     openQuote: toSToken('"'),
                     value: [new TextPToken({ text: toSToken('pub.xml') })],
                     closeQuote: toSToken('"'),
                  },
                  publicSpace: toSToken(' \t'),
                  system: {
                     openQuote: toSToken('"'),
                     value: [new TextPToken({ text: toSToken('sys.xml') })],
                     closeQuote: toSToken('"'),
                  },
               },
               unassigned: [],
            });
            done();
         });
      });

      it('adds a space to an otherwise missing previous prop name (check unsasigned calls)', (done) => {
         const expectedString = new SToken(' ', ' ', [helper.makeInsertedRange()]);
         source.addText('%foo;>');
         source.endText();

         parseExternalId(source, [], true, (result) => {
            // expand/replace the publicVal reference
            result.peRefPlus.shift();

            result.peRefPlus.unshift(unassigned.wordFromSToken(toSToken('public')), {
               type: UnassignedType.ENTITY_END,
               token: new ParameterEntityEndPToken(
                  new ParameterEntityReferencePToken({ open: toSToken('%') }),
               ) as any,
            });
            result.peRefPlus.unshift();
            result.peRefPlus.unshift({
               type: UnassignedType.ENTITY_START,
               token: new ParameterEntityStartPToken(
                  new ParameterEntityReferencePToken({ open: toSToken('%') }),
               ) as any,
            });

            const assignResult = assignExternalIdUnssigned(result.externalId!, result.peRefPlus);

            expect(assignResult.preSpace).toEqual(expectedString);
            done();
         });
      });
   });

   describe('checkWellFormed()', () => {
      let emd: EntityMetaData;
      let source: STokenSource;

      beforeEach(() => {
         emd = new EntityMetaData();
         source = new STokenSource(defaultExtractors, emd);
      });

      it('reports an error when the SYSTEM is missing a quote (check literal.checkCharWellFormed())', (done) => {
         source.addText('SYSTEM "bad');
         source.endText();
         parseExternalId(source, [], true, (result) => {
            const ec = new ErrorCollector(toSToken('x'), WellFormedError);

            checkExternalIdWellFormed(result.externalId, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.LITERAL_NO_CLOSE_QUOTE);
            done();
         });
      });
   });

   describe('getSTokens()', () => {
      let emd: EntityMetaData;
      let source: STokenSource;

      beforeEach(() => {
         emd = new EntityMetaData();
         source = new STokenSource(defaultExtractors, emd);
      });

      it('adds all tokens (check literal.getSTokens())', (done) => {
         source.addText('PUBLIC "pub.xml"\t"sys.xml">');
         parseExternalId(source, [], false, (result) => {
            const results = getSTokens(result.externalId);

            const makeSToken = makeSTokenMaker();
            expect(results).toEqual([
               makeSToken('PUBLIC'),
               makeSToken(' '),
               makeSToken('"'),
               makeSToken('pub.xml'),
               makeSToken('"'),
               makeSToken('\t'),
               makeSToken('"'),
               makeSToken('sys.xml'),
               makeSToken('"'),
            ]);
            done();
         });
      });
   });
});
