/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../../basic';
import { ErrorCollector, WellFormedError } from '../../error';
import { LTokenSource, defaultExtractors } from '../../lToken';
import { makeLTokenMaker } from '../../lToken/test';

import * as attribute from './attribute.js';

describe('attribute (integration)', () => {
   let emd;
   let source;
   let parsedAttributes;

   beforeEach(() => {
      const makeLToken = makeLTokenMaker();

      emd = new EntityMetaData();
      source = new LTokenSource(defaultExtractors, emd);
      parsedAttributes = [ {
         name: makeLToken('one'),
         postNameSpace: undefined,
         equal: makeLToken('='),
         postEqualSpace: undefined,
         attrOpenQuote: makeLToken('"'),
         attrValue: [ makeLToken('1') ],
         attrCloseQuote: makeLToken('"'),
         trailingSpace: makeLToken('  '),
      }, {
         name: makeLToken('two'),
         postNameSpace: makeLToken(' '),
         equal: makeLToken('='),
         postEqualSpace: makeLToken(' '),
         attrOpenQuote: makeLToken('"'),
         attrValue: [ makeLToken('two') ],
         attrCloseQuote: makeLToken('"'),
         trailingSpace: makeLToken(' '),
      } ];
   });

   describe('parse()', () => {

      it('parses a series of attributes', (done) => {
         source.addText('one="1"  two = "two" three=');
         source.endText();

         attribute.parse(source, { terminators: [] }, (result) => {
            const makeLToken = makeLTokenMaker();
            expect(result).toEqual([ {
               name: makeLToken('one'),
               postNameSpace: undefined,
               equal: makeLToken('='),
               postEqualSpace: undefined,
               attrOpenQuote: makeLToken('"'),
               attrValue: [ makeLToken('1') ],
               attrCloseQuote: makeLToken('"'),
               trailingSpace: makeLToken('  '),
            }, {
               name: makeLToken('two'),
               postNameSpace: makeLToken(' '),
               equal: makeLToken('='),
               postEqualSpace: makeLToken(' '),
               attrOpenQuote: makeLToken('"'),
               attrValue: [ makeLToken('two') ],
               attrCloseQuote: makeLToken('"'),
               trailingSpace: makeLToken(' '),
            }, {
               name: makeLToken('three'),
               postNameSpace: undefined,
               equal: makeLToken('='),
               postEqualSpace: undefined,
            } ]);
            done();
         });
      });

      it('stops parsing name when encountering a terminator', (done) => {
         source.addText('one="1"  two = "two" three=');
         source.endText();

         attribute.parse(source, { terminators: [ 'e' ] }, (result) => {
            const makeLToken = makeLTokenMaker();
            expect(result).toEqual([ {
               name: makeLToken('on'),
               postNameSpace: undefined,
               equal: undefined,
               postEqualSpace: undefined,
            } ]);
            done();
         });
      });

   });

   describe('checkWellFormed()', () => {
      let preSpace;
      let ec;

      beforeEach(() => {
         const makeLToken = makeLTokenMaker();
         preSpace = makeLToken(' ');
         ec = new ErrorCollector(undefined, WellFormedError);
      });

      it('asks misc.checkName() to complain if the name is bad', (done) => {
         source.addText('na\u0000me="value">');
         source.endText();

         attribute.parse(source, { terminators: [ '>' ]}, (parsing) => {
            attribute.checkWellFormed(parsing, ec, emd, preSpace);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ATTRIBUTE_INVALID_NAME);
            done();
         });
      });

      it('asks queuedValue.checkWellFormed() to complain if the "=" is missing', (done) => {
         source.addText('name "value">');
         source.endText();

         attribute.parse(source, { terminators: [ '>' ]}, (parsing) => {
            attribute.checkWellFormed(parsing, ec, emd, preSpace);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ATTRIBUTE_NO_EQUAL);
            done();
         });
      });

      it('asks misc.checkWellFormedText() to complain if the value has an illegal value', (done) => {
         source.addText('name="v\u0000alue">');
         source.endText();

         attribute.parse(source, { terminators: [ '>' ]}, (parsing) => {
            attribute.checkWellFormed(parsing, ec, emd, preSpace);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
            done();
         });
      });

   });

   describe('makeOneTokenCompatible()', () => {

      it('returns name value pairs', () => {
         const attrs = attribute.makeOneTokenCompatible(parsedAttributes);

         expect(attrs).toEqual([ {
            name: 'one',
            value: '1',
         }, {
            name: 'two',
            value: 'two',
         } ]);
      });
   });

   describe('appendLTokens()', () => {

      it('adds LTokens from the quoted value (calling quotedValue.appendLTokens()', (done) => {
         source.addText('name="value">');
         source.endText();

         attribute.parse(source, { terminators: [ '>' ]}, (parsing) => {
            const results = [];
            attribute.appendLTokens(results, parsing);

            expect(results[3].text).toEqual('value');
            done();
         });
      });

   });

});
