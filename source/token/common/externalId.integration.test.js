/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, Range } from '../../basic';
import { ErrorCollector, WellFormedError } from '../../error';
import { defaultExtractors } from '../../extractor';
import { SToken, STokenSource } from '../../sToken';
import { makeSTokenMaker } from '../../sToken/@test/helper';

import helper from '../@test/helper.js';
import entityEnd from '../entityEnd.js';
import entityReference from '../entityReference';
import entityStart from '../entityStart.js';
import text from '../text';
import unassigned, { UnassignedType } from '../unassigned';

import externalId from './externalId.js';

describe('externalId (integration)', () => {

   describe('parse()', () => {
      let emd;
      let source;

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
               idType: makeSToken('PUBLIC'),
               postIdTypeSpace: makeSToken(' '),
               public: {
                  openQuote: makeSToken('"'),
                  value: [ new text.PToken({ text: makeSToken('pub.xml') }) ],
                  closeQuote: makeSToken('"'),
               },
               postPublicSpace: makeSToken('\t'),
               system: {
                  openQuote: makeSToken('"'),
                  value: [ new text.PToken({ text: makeSToken('sys.xml') }) ],
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
            expect(result).toEqual({
               type: 'EXTERNAL_ID',
               idType: makeSToken('PUBLIC'),
               postIdTypeSpace: makeSToken(' '),
               public: {
                  openQuote: makeSToken('"'),
                  value: [ new text.PToken({ text: makeSToken('pub.xml') }) ],
                  closeQuote: makeSToken('"'),
               },
               postPublicSpace: undefined,
               unassigned: [ {
                  type: UnassignedType.REFERENCE,
                  token: new entityReference.ParamPToken({
                     type: 'foo',
                     open:  makeSToken('%'),
                     postOpenSpace: undefined,
                     name:  makeSToken('foo'),
                     postNameSpace: undefined,
                     close:  makeSToken(';'),
                  })
               } ],
               nextPropName: 'system',
            });
            done();
         });
      });

   });

   describe('assignUnassigned()', () => {
      let emd;
      let source;

      beforeEach(() => {
         emd = new EntityMetaData();
         source = new STokenSource(defaultExtractors, emd);
      });

      it('assigns the public and system value (check unassigned.assignToProps())', (done) => {
         source.addText('PUBLIC\t%publicVal;\t"sys.xml">');
         source.endText();

         externalId.parse(source, [], (extIdPToken) => {
            // expand/replace the publicVal reference
            expect(extIdPToken.unassigned[0].type).toEqual('reference');
            extIdPToken.unassigned.shift();
            extIdPToken.unassigned.unshift({
               type: UnassignedType.ENTITY_END,
               token: new entityEnd.ParamPToken({}),
            });
            extIdPToken.unassigned.unshift({
               type: UnassignedType.LITERAL,
               token: {
                  openQuote: SToken.fromString('"'),
                  value: [ new text.PToken({ text: SToken.fromString('pub.xml') }) ],
                  closeQuote: SToken.fromString('"'),
               }
            });
            extIdPToken.unassigned.unshift({
               type: UnassignedType.ENTITY_START,
               token: new entityStart.ParamPToken({}),
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
                  value: [ new text.PToken({ text: SToken.fromString('pub.xml') }) ],
                  closeQuote: SToken.fromString('"'),
               },
               postPublicSpace,
               system: {
                  openQuote: makeSToken2('"'),
                  value: [ new text.PToken({ text: makeSToken2('sys.xml') }) ],
                  closeQuote: makeSToken2('"'),
               },
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

         externalId.parse(source, [], (extIdPToken) => {
            // expand/replace the publicVal reference
            expect(extIdPToken.unassigned[0].type).toEqual('reference');
            extIdPToken.unassigned.shift();
            extIdPToken.unassigned.unshift({
               type: UnassignedType.ENTITY_END,
               token: new entityEnd.ParamPToken({}),
            });
            extIdPToken.unassigned.unshift({
               type: UnassignedType.WORD,
               token: {
                  text: SToken.fromString('public'),
               },
            });
            extIdPToken.unassigned.unshift({
               type: UnassignedType.ENTITY_START,
               token: new entityStart.ParamPToken({}),
            });

            externalId.assignUnassigned(extIdPToken, container, 'prevProp');

            expect(container.prevProp).toEqual(expectedString);
            expect(extIdPToken.idType.str).toEqual('public');
            done();
         });
      });

      it('adds a space to an otherwise missing previous prop name (check unsasigned calls)', (done) => {
         const container = {};
         const expectedString = new SToken(' ', ' ', [ helper.makeInsertedRange() ]);
         source.addText('%foo;>');
         source.endText();

         externalId.parse(source, [], (extIdPToken) => {
            // expand/replace the publicVal reference
            expect(extIdPToken.unassigned[0].type).toEqual('reference');
            extIdPToken.unassigned.shift();
            extIdPToken.unassigned.unshift({
               type: UnassignedType.ENTITY_END,
               token: new entityEnd.ParamPToken({}),
            });
            extIdPToken.unassigned.unshift({
               type: UnassignedType.WORD,
               token: {
                  text: SToken.fromString('public'),
               },
            });
            extIdPToken.unassigned.unshift({
               type: UnassignedType.ENTITY_START,
               token: new entityStart.ParamPToken({}),
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
      let emd;
      let source;

      beforeEach(() => {
         emd = new EntityMetaData();
         source = new STokenSource(defaultExtractors, emd);
      });

      it('reports an error when the SYSTEM is missing a quote (check literal.checkWellFormedText())', (done) => {
         source.addText('SYSTEM "bad');
         source.endText();
         externalId.parse(source, [], (result) => {
            const ec = new ErrorCollector({}, WellFormedError);

            externalId.checkWellFormed(result, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.LITERAL_NO_CLOSE_QUOTE);
            done();
         });
      });

      it('calls unassigned.checkExtra() to report on extra values', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('%wtf; "other">');
         source.endText();

         externalId.parse(source, [], (pToken) => {
            // "expand" what should be there.
            pToken.unassigned.shift(); // get rid of the peref
            pToken.unassigned = [{
                  type: UnassignedType.ENTITY_START,
                  token: new entityStart.ParamPToken({}),
               },
               unassigned.wordFromSToken(new SToken('SYSTEM', 'SYSTEM', new Range())), 
               unassigned.spaceFromSToken(new SToken(' ', ' ', new Range())), {
                  type: UnassignedType.LITERAL,
                  token: {
                     openQuote: new SToken('"', '"', new Range()),
                     value: [ new text.PToken({ text: new SToken('entityValue', 'entityValue', new Range()) }) ],
                     closeQuote: new SToken('"', '"', new Range()),
                  }
               }, {
                  type: UnassignedType.ENTITY_END,
                  token: new entityEnd.ParamPToken({}),
               },
            ].concat(pToken.unassigned);
            externalId.assignUnassigned(pToken, {}, 'prevSpace');
            const ec = new ErrorCollector(undefined, WellFormedError);

            externalId.checkWellFormed(pToken, ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.EXTERNALID_EXTRA_TEXT);
            done();
         });
      });

   });

   describe('getSTokens()', () => {
      let emd;
      let source;

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
