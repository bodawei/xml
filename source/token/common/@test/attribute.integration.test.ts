/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from 'basic';
import { ErrorCollector, WellFormedError, XmlWarning } from 'error';
import { defaultExtractors } from 'extractor';
import { STokenSource, SToken } from 'sToken';
import { makeSTokenMaker } from 'sToken-test';

import attribute from '../attribute';
import { TextPToken, TextXToken } from '../../text';

describe('attribute (integration)', () => {
   let emd: EntityMetaData;
   let source: STokenSource;
   let attributesPToken: any;

   beforeEach(() => {
      const makeSToken = makeSTokenMaker();

      emd = new EntityMetaData();
      source = new STokenSource(defaultExtractors, emd);
      attributesPToken = [ {
         name: makeSToken('one'),
         postNameSpace: undefined,
         equal: makeSToken('='),
         postEqualSpace: undefined,
         openQuote: makeSToken('"'),
         value: [ new TextPToken({ text: makeSToken('1') }) ],
         closeQuote: makeSToken('"'),
         trailingSpace: makeSToken('  '),
      }, {
         name: makeSToken('two'),
         postNameSpace: makeSToken(' '),
         equal: makeSToken('='),
         postEqualSpace: makeSToken(' '),
         openQuote: makeSToken('"'),
         value: [ new TextPToken({ text: makeSToken('two') }) ],
         closeQuote: makeSToken('"'),
         trailingSpace: makeSToken(' '),
      } ];
   });

   describe('parse()', () => {

      it('parses a series of attributes', (done) => {
         source.addText('one="1"  two = "two" three=');
         source.endText();

         attribute.parse(source, { terminators: [] }, (result) => {
            const makeSToken = makeSTokenMaker();
            expect(result).toEqual([ {
               name: makeSToken('one'),
               postNameSpace: undefined,
               equal: makeSToken('='),
               postEqualSpace: undefined,
               openQuote: makeSToken('"'),
               value: [ new TextPToken({ text: makeSToken('1') }) ],
               closeQuote: makeSToken('"'),
               trailingSpace: makeSToken('  '),
            }, {
               name: makeSToken('two'),
               postNameSpace: makeSToken(' '),
               equal: makeSToken('='),
               postEqualSpace: makeSToken(' '),
               openQuote: makeSToken('"'),
               value: [ new TextPToken({ text: makeSToken('two') }) ],
               closeQuote: makeSToken('"'),
               trailingSpace: makeSToken(' '),
            }, {
               name: makeSToken('three'),
               postNameSpace: undefined,
               equal: makeSToken('='),
               postEqualSpace: undefined,
               value: [],
            } ]);
            done();
         });
      });

      it('stops parsing name when encountering a terminator', (done) => {
         source.addText('one="1"  two = "two" three=');
         source.endText();

         attribute.parse(source, { terminators: [ 'e' ] }, (result) => {
            const makeSToken = makeSTokenMaker();
            expect(result).toEqual([ {
               name: makeSToken('on'),
               postNameSpace: undefined,
               equal: undefined,
               postEqualSpace: undefined,
               value: [],
            } ]);
            done();
         });
      });

   });

   describe('checkWellFormed()', () => {
      let preSpace: SToken;
      let ec: ErrorCollector;

      beforeEach(() => {
         const makeSToken = makeSTokenMaker();
         preSpace = makeSToken(' ');
         ec = new ErrorCollector(SToken.fromString('x'), WellFormedError);
      });

      it('asks misc.checkName() to complain if the name is bad', (done) => {
         source.addText('na\u0000me="value">');
         source.endText();

         attribute.parse(source, { terminators: [ '>' ]}, (parsing: any) => {
            attribute.checkWellFormed(parsing, ec, emd, preSpace, 'x');

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ATTRIBUTE_INVALID_NAME);
            done();
         });
      });

      it('asks checkXmlLangWellFormed() to complain if the xml:lang value is bad', (done) => {
         source.addText('xml:lang="99">');
         source.endText();

         attribute.parse(source, { terminators: [ '>' ]}, (parsing: any) => {
            attribute.checkWellFormed(parsing, ec, emd, preSpace, WellFormedError.ID.NOUN_ATTRIBUTE);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ATTRIBUTE_LANG_BAD_CODE);
            done();
         });
      });

      it('asks misc.checkWellFormedNameRecommendation() to complain if the name is bad', (done) => {
         const metaData = new EntityMetaData(undefined, 1.0, 6, undefined);
         source.addText('xml:foo="value">');
         source.endText();

         attribute.parse(source, { terminators: [ '>' ]}, (parsing: any) => {
            attribute.checkWellFormed(parsing, ec, metaData, preSpace, WellFormedError.ID.NOUN_ATTRIBUTE);

            expect(ec.getErrors()[0].id).toEqual(XmlWarning.ID.ATTRIBUTE_NAME_XMLCOLON_RESERVED);
            done();
         });
      });

      it('asks queuedValue.checkWellFormed() to complain if the "=" is missing', (done) => {
         source.addText('name "value">');
         source.endText();

         attribute.parse(source, { terminators: [ '>' ]}, (parsing: any) => {
            attribute.checkWellFormed(parsing, ec, emd, preSpace, 'x');

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ATTRIBUTE_NO_EQUAL);
            done();
         });
      });

      it('asks misc.checkCharWellFormed() to complain if the value has an illegal value', (done) => {
         source.addText('name="v\u0000alue">');
         source.endText();

         attribute.parse(source, { terminators: [ '>' ]}, (parsing: any) => {
            attribute.checkWellFormed(parsing, ec, emd, preSpace, 'x');

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
            done();
         });
      });

   });

   describe('makeOneTokenCompatible()', () => {

      it('returns name value pairs', () => {
         const attrs = attribute.makeOneTokenCompatible(attributesPToken);

         expect(attrs).toEqual([ {
            name: 'one',
            value: [ new TextXToken('1') ],
         }, {
            name: 'two',
            value: [ new TextXToken('two') ],
         } ]);
      });
   });

   describe('getSTokens()', () => {

      it('adds STokens from the quoted value (calling literal.getSTokens()', (done) => {
         source.addText('name="value">');
         source.endText();

         attribute.parse(source, { terminators: [ '>' ]}, (parsing) => {
            const results = attribute.getSTokens(parsing);

            expect(results[3].str).toEqual('value');
            done();
         });
      });

   });

});
