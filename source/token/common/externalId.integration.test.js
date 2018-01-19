/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, Range } from '../../basic';
import { ErrorCollector, WellFormedError } from '../../error';
import { defaultExtractors } from '../../extractor';
import { SToken, STokenSource } from '../../sToken';
import { makeSTokenMaker } from '../../sToken/@test/helper';

import entityEnd from '../entityEnd.js';
import entityReference from '../entityReference.js';
import entityStart from '../entityStart.js';
import text from '../text.js';
import externalId from './externalId.js';

const BLANK_ORIGIN = 'https://www.w3.org/TR/xml/#as-PE';
const RANGE = new Range(new EntityLocation(BLANK_ORIGIN), 0, 0, 0, 1, 0, 1);

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
               unassigned: [ new entityReference.ParamPToken({
                  type: 'foo',
                  open:  makeSToken('%'),
                  postOpenSpace: undefined,
                  name:  makeSToken('foo'),
                  postNameSpace: undefined,
                  close:  makeSToken(';'),
               }) ],
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

      it('parses the public and system value (check unassigned.assignToProps())', (done) => {
         source.addText('PUBLIC\t%publicVal;\t"sys.xml">');
         source.endText();

         externalId.parse(source, [], (extIdPToken) => {
            // expand/replace the publicVal reference
            expect(extIdPToken.unassigned[0].type).toEqual(entityReference.PARAM_PTYPE);
            extIdPToken.unassigned.shift();
            extIdPToken.unassigned.unshift({
               type: entityEnd.PARAM_PTYPE
            });
            extIdPToken.unassigned.unshift({
               type: 'literal',
               openQuote: SToken.fromString('"'),
               value: [ new text.PToken({ text: SToken.fromString('pub.xml') }) ],
               closeQuote: SToken.fromString('"'),
            });
            extIdPToken.unassigned.unshift({
               type: entityStart.PARAM_PTYPE
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
            postIdTypeSpace.ranges.push(RANGE.clone());
            postPublicSpace.str = ' ' + postPublicSpace.str;
            postPublicSpace.originalStr = ' ' + postPublicSpace.originalStr;
            postPublicSpace.ranges.unshift(RANGE.clone());

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
            RANGE,
         ]);
         source.addText('%foo;>');
         source.endText();

         externalId.parse(source, [], (extIdPToken) => {
            // expand/replace the publicVal reference
            expect(extIdPToken.unassigned[0].type).toEqual(entityReference.PARAM_PTYPE);
            extIdPToken.unassigned.shift();
            extIdPToken.unassigned.unshift({
               type: entityEnd.PARAM_PTYPE
            });
            extIdPToken.unassigned.unshift({
               type: 'text',
               subType: 'word',
               text: SToken.fromString('public'),
            });
            extIdPToken.unassigned.unshift({
               type: entityStart.PARAM_PTYPE
            });

            externalId.assignUnassigned(extIdPToken, container, 'prevProp');

            expect(container.prevProp).toEqual(expectedString);
            expect(extIdPToken.idType.str).toEqual('public');
            done();
         });
      });

      it('adds a space to an otherwise missing previous prop name (check unsasigned calls)', (done) => {
         const container = {};
         const expectedString = new SToken(' ', ' ', [ RANGE ]);
         source.addText('%foo;>');
         source.endText();

         externalId.parse(source, [], (extIdPToken) => {
            // expand/replace the publicVal reference
            expect(extIdPToken.unassigned[0].type).toEqual(entityReference.PARAM_PTYPE);
            extIdPToken.unassigned.shift();
            extIdPToken.unassigned.unshift({
               type: entityEnd.PARAM_PTYPE
            });
            extIdPToken.unassigned.unshift({
               type: 'text',
               subType: 'word',
               text: SToken.fromString('public'),
            });
            extIdPToken.unassigned.unshift({
               type: entityStart.PARAM_PTYPE
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
