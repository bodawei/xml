/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { TextPToken, } from 'pToken';
import { STokenSource, SToken } from 'sToken';
import { makeSTokenMaker } from 'sToken-test';
import {  TextXToken } from 'xToken';

import attribute from '../attribute';

describe('attribute (integration)', () => {
   let source: STokenSource;
   let attributesPToken: any;

   beforeEach(() => {
      const makeSToken = makeSTokenMaker();

      source = new STokenSource();
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
