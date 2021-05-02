/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { ConformanceVersion } from 'basic';
import {GeneralEntityReferencePToken, TextPToken } from 'pToken';
import { STokenSource } from 'sToken';
import { makeSTokenMaker } from 'sToken-test';
import { TextXToken } from 'xToken';

import { ElementStartPToken, parseElementStart } from '../elementStart';

describe('elementStart (integration)', () => {
   let elementStartPToken: ElementStartPToken;
   let confVer: ConformanceVersion;
   let source: STokenSource;

   beforeEach(() => {
      confVer = new ConformanceVersion();
      source = new STokenSource();
      const makeSToken = makeSTokenMaker();
      elementStartPToken = new ElementStartPToken({
         open: makeSToken('<'),
         openSpace: undefined,
         name: makeSToken('elemName'),
         nameSpace: makeSToken(' '),
         attributes: [],
         close: makeSToken('>'),
      });
   });

   describe('parse()', () => {

      it('parses a set of attributes', (done) => {
         const makeSToken = makeSTokenMaker();
         source.addText(' aName attr1 =\t\t"value1" attr2="value two">');
         source.endText();

         parseElementStart(source, elementStartPToken.open, (pToken) => {
            expect(pToken).toEqual(new ElementStartPToken({
               open: elementStartPToken.open,
               openSpace: makeSToken(' '),
               name: makeSToken('aName'),
               nameSpace: makeSToken(' '),
               attributes: [ {
                  name: makeSToken('attr1'),
                  postNameSpace: makeSToken(' '),
                  equal: makeSToken('='),
                  postEqualSpace: makeSToken('\t\t'),
                  openQuote: makeSToken('"'),
                  value: [ new TextPToken({ text: makeSToken('value1') }) ],
                  closeQuote: makeSToken('"'),
                  trailingSpace: makeSToken(' '),
               }, {
                  name: makeSToken('attr2'),
                  postNameSpace: undefined,
                  equal: makeSToken('='),
                  postEqualSpace: undefined,
                  openQuote: makeSToken('"'),
                  value: [ new TextPToken({ text: makeSToken('value two') }) ],
                  closeQuote: makeSToken('"'),
                  trailingSpace: undefined,
               } ],
               close: makeSToken('>'),
            }));
            done();
         });
      });

      it('parses an attribute with a general entity reference in it', (done) => {
         const makeSToken = makeSTokenMaker();
         source.addText('aName attr1="value1&other;">');
         source.endText();

         parseElementStart(source, elementStartPToken.open, (pToken) => {
            expect(pToken).toEqual(new ElementStartPToken({
               open: elementStartPToken.open,
               openSpace: undefined,
               name: makeSToken('aName'),
               nameSpace: makeSToken(' '),
               attributes: [ {
                  name: makeSToken('attr1'),
                  postNameSpace: undefined,
                  equal: makeSToken('='),
                  postEqualSpace: undefined,
                  openQuote: makeSToken('"'),
                  value: [
                     new TextPToken({ text: makeSToken('value1') }),
                     new GeneralEntityReferencePToken({
                        open: makeSToken('&'),
                        openSpace: undefined,
                        name: makeSToken('other'),
                        nameSpace: undefined,
                        close: makeSToken(';'),
                     }),
                  ],
                  closeQuote: makeSToken('"'),
                  trailingSpace: undefined,
               } ],
               close: makeSToken('>'),
            }));
            done();
         });
      });

   });

});
