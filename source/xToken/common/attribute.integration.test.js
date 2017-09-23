/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../../basic';
import { LTokenSource, defaultExtractors } from '../../lToken';
import { makeLTokenMaker } from '../../lToken/test';

import * as attribute from './attribute.js';

describe('attribute (integration)', () => {

   describe('parse()', () => {
      let emd;
      let source;

      beforeEach(() => {
         emd = new EntityMetaData();
         source = new LTokenSource(defaultExtractors, emd);
      });

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
               paramOpenQuote: makeLToken('"'),
               paramValue: makeLToken('1'),
               paramCloseQuote: makeLToken('"'),
               trailingSpace: makeLToken('  '),
            }, {
               name: makeLToken('two'),
               postNameSpace: makeLToken(' '),
               equal: makeLToken('='),
               postEqualSpace: makeLToken(' '),
               paramOpenQuote: makeLToken('"'),
               paramValue: makeLToken('two'),
               paramCloseQuote: makeLToken('"'),
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

});
