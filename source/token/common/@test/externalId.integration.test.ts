/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, Range } from 'basic';
import { ErrorCollector, WellFormedError } from 'error';
import { defaultExtractors } from '../../../extractor';
import { SToken, STokenSource } from 'sToken';
import { makeSTokenMaker } from 'sToken-test';

import helper from '../../@test/helper';
import { ParameterEntityEndPToken } from '../../marker/parameterEntityEnd';
import unassigned, { UnassignedType } from '../unassigned';

import externalId from '../externalId';
import { ParameterEntityStartPToken } from 'source/token/marker/parameterEntityStart';
import { ParameterEntityReferencePToken } from 'source/token/parameterEntityReference';
import { TextPToken } from 'source/token/text';

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

         externalId.parse(source, [], (result) => {
            const makeSToken = makeSTokenMaker();
            expect(result).toEqual({
               type: 'EXTERNAL_ID',
               peRefPlus: [],
               idType: makeSToken('PUBLIC'),
               postIdTypeSpace: makeSToken(' '),
               public: {
                  openQuote: makeSToken('"'),
                  value: [ new TextPToken({ text: makeSToken('pub.xml') }) ],
                  closeQuote: makeSToken('"'),
               },
               postPublicSpace: makeSToken('\t'),
               system: {
                  openQuote: makeSToken('"'),
                  value: [ new TextPToken({ text: makeSToken('sys.xml') }) ],
                  closeQuote: makeSToken('"'),
               },
            });
            done();
         });
      });

      it('parses a PERef (check unsasigned calls)', (done) => {
         source.addText('PUBLIC "pub.xml"%foo;>');

         externalId.parse(source, [], (result) => {
            const makeSToken = makeSTokenMaker();
            const expected = {
               type: 'EXTERNAL_ID',
               peRefPlus: [],
               idType: makeSToken('PUBLIC'),
               postIdTypeSpace: makeSToken(' '),
               public: {
                  openQuote: makeSToken('"'),
                  value: [ new TextPToken({ text: makeSToken('pub.xml') }) ],
                  closeQuote: makeSToken('"'),
               },
               postPublicSpace: undefined,
               unassigned: [ {
                  type: UnassignedType.REFERENCE,
                  token: new ParameterEntityReferencePToken({
                     open:  makeSToken('%'),
                     openSpace: undefined,
                     name:  makeSToken('foo'),
                     nameSpace: undefined,
                     close:  makeSToken(';'),
                  })
               } ],
               nextPropName: 'system',
            };
            (expected as any).peRefPlus = expected.unassigned;

            expect(result).toEqual(expected as any);
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

         externalId.parse(source, [], (extIdPToken: any) => {
            // expand/replace the publicVal reference
            expect(extIdPToken.unassigned[0].type).toEqual('reference');
            extIdPToken.unassigned.shift();
            extIdPToken.unassigned.unshift({
               type: UnassignedType.ENTITY_END,
               token: new ParameterEntityEndPToken(new ParameterEntityReferencePToken({ open: SToken.fromString('%'), })),
            });
            extIdPToken.unassigned.unshift({
               type: UnassignedType.LITERAL,
               token: {
                  openQuote: SToken.fromString('"'),
                  value: [ new TextPToken({ text: SToken.fromString('pub.xml') }) ],
                  closeQuote: SToken.fromString('"'),
               }
            });
            extIdPToken.unassigned.unshift({
               type: UnassignedType.ENTITY_START,
               token: new ParameterEntityStartPToken(new ParameterEntityReferencePToken({ open: SToken.fromString('%'), })),
            });

            externalId.assignUnassigned(extIdPToken);

            // Set up all the special ranges we need for the merging
            const makeSToken = makeSTokenMaker();
            const makeSToken2 = makeSTokenMaker(undefined, 18, 0, 18);
            const idType = makeSToken('PUBLIC');
            const postIdTypeSpace = makeSToken('\t');
            const postPublicSpace = makeSToken2('\t');
            postIdTypeSpace.str += ' ';
            postIdTypeSpace.originalStr += ' ';
            postIdTypeSpace.ranges.push(helper.makeInsertedRange());
            postPublicSpace.str = ' ' + postPublicSpace.str;
            postPublicSpace.originalStr = ' ' + postPublicSpace.originalStr;
            postPublicSpace.ranges.unshift(helper.makeInsertedRange());

            expect(extIdPToken).toEqual({
               type: 'EXTERNAL_ID',
               idType,
               postIdTypeSpace,
               public: {
                  openQuote: SToken.fromString('"'),
                  value: [ new TextPToken({ text: SToken.fromString('pub.xml') }) ],
                  closeQuote: SToken.fromString('"'),
               },
               postPublicSpace,
               system: {
                  openQuote: makeSToken2('"'),
                  value: [ new TextPToken({ text: makeSToken2('sys.xml') }) ],
                  closeQuote: makeSToken2('"'),
               },
               peRefPlus: [],
            });
            done();
         });
      });

      it('adds a space to the previous prop name (check unsasigned calls)', (done) => {
         const container = {
            prevProp: new SToken('\t', '\t', [
               new Range(new EntityLocation(), 10, 0, 10, 11, 0, 11)
            ]),
         };
         const expectedString = new SToken('\t ', '\t ', [
            new Range(new EntityLocation(), 10, 0, 10, 11, 0, 11),
            helper.makeInsertedRange(),
         ]);
         source.addText('%foo;>');
         source.endText();

         externalId.parse(source, [], (extIdPToken: any) => {
            // expand/replace the publicVal reference
            expect(extIdPToken.unassigned[0].type).toEqual('reference');
            extIdPToken.unassigned.shift();
            extIdPToken.unassigned.unshift({
               type: UnassignedType.ENTITY_END,
               token: new ParameterEntityEndPToken(new ParameterEntityReferencePToken({ open: SToken.fromString('%'), })),
            });
            extIdPToken.unassigned.unshift({
               type: UnassignedType.WORD,
               token: {
                  text: SToken.fromString('public'),
               },
            });
            extIdPToken.unassigned.unshift({
               type: UnassignedType.ENTITY_START,
               token: new ParameterEntityStartPToken(new ParameterEntityReferencePToken({ open: SToken.fromString('%'), })),
            });

            externalId.assignUnassigned(extIdPToken, container, 'prevProp');

            expect(container.prevProp).toEqual(expectedString);
            expect(extIdPToken.idType.str).toEqual('public');
            done();
         });
      });

      it('adds a space to an otherwise missing previous prop name (check unsasigned calls)', (done) => {
         const container: any = {};
         const expectedString = new SToken(' ', ' ', [ helper.makeInsertedRange() ]);
         source.addText('%foo;>');
         source.endText();

         externalId.parse(source, [], (extIdPToken: any) => {
            // expand/replace the publicVal reference
            expect(extIdPToken.unassigned[0].type).toEqual('reference');
            extIdPToken.unassigned.shift();
            extIdPToken.unassigned.unshift({
               type: UnassignedType.ENTITY_END,
               token: new ParameterEntityEndPToken(new ParameterEntityReferencePToken({ open: SToken.fromString('%'), })),
            });
            extIdPToken.unassigned.unshift({
               type: UnassignedType.WORD,
               token: {
                  text: SToken.fromString('public'),
               },
            });
            extIdPToken.unassigned.unshift({
               type: UnassignedType.ENTITY_START,
               token: new ParameterEntityStartPToken(new ParameterEntityReferencePToken({ open: SToken.fromString('%'), })),
            });

            externalId.assignUnassigned(extIdPToken, container, 'prevProp');

            expect(container.prevProp).toEqual(expectedString);
            expect(extIdPToken.__bogusWorkaround).toBeUndefined();
            expect(extIdPToken.idType.str).toEqual('public');
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
         externalId.parse(source, [], (result) => {
            const ec = new ErrorCollector(SToken.fromString('x'), WellFormedError);

            externalId.checkWellFormed(result, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.LITERAL_NO_CLOSE_QUOTE);
            done();
         });
      });

      it('calls unassigned.checkExtra() to report on extra values', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('%wtf; "other">');
         source.endText();

         externalId.parse(source, [], (pToken: any) => {
            // "expand" what should be there.
            pToken.unassigned.shift(); // get rid of the peref
            pToken.unassigned = [{
                  type: UnassignedType.ENTITY_START,
                  token: new ParameterEntityStartPToken(new ParameterEntityReferencePToken({ open: SToken.fromString('%'), })),
               },
               unassigned.wordFromSToken(new SToken('SYSTEM', 'SYSTEM', new Range(new EntityLocation()))),
               unassigned.spaceFromSToken(new SToken(' ', ' ', new Range(new EntityLocation()))), {
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
            ].concat(pToken.unassigned);
            externalId.assignUnassigned(pToken, {}, 'prevSpace');
            const ec = new ErrorCollector(SToken.fromString('x'), WellFormedError);

            externalId.checkWellFormed(pToken, ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.EXTERNALID_EXTRA_TEXT);
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
         externalId.parse(source, [], (pToken) => {
            const results = externalId.getSTokens(pToken);

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
