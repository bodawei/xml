/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from 'basic';
import { ErrorCollector, WellFormedError, XmlWarning } from 'error';
import { defaultExtractors } from 'extractor';
import { STokenSource } from 'sToken';
import { makeSTokenMaker } from 'sToken-test';

import * as elementStart from '../elementStart';
import { GeneralEntityReferencePToken } from '../generalEntityReference';
import { TextPToken, TextXToken } from '../text';

describe('elementStart (integration)', () => {
   let elementStartPToken: elementStart.ElementStartPToken;
   let emd: EntityMetaData;
   let source: STokenSource;

   beforeEach(() => {
      emd = new EntityMetaData();
      source = new STokenSource(defaultExtractors, emd);
      const makeSToken = makeSTokenMaker();
      elementStartPToken = new elementStart.ElementStartPToken({
         open: makeSToken('<'),
         postOpenSpace: undefined,
         name: makeSToken('elemName'),
         postNameSpace: makeSToken(' '),
         attributes: [],
         close: makeSToken('>'),
      });
   });

   describe('parse()', () => {

      it('parses a set of attributes', (done) => {
         const makeSToken = makeSTokenMaker();
         source.addText(' aName attr1 =\t\t"value1" attr2="value two">');
         source.endText();

         elementStart.parse(source, elementStartPToken.open, (pToken) => {
            expect(pToken).toEqual(new elementStart.PToken({
               type: 'ELEMENT_START',
               open: elementStartPToken.open,
               postOpenSpace: makeSToken(' '),
               name: makeSToken('aName'),
               postNameSpace: makeSToken(' '),
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

         elementStart.parse(source, elementStartPToken.open, (pToken) => {
            expect(pToken).toEqual(new elementStart.PToken({
               type: 'ELEMENT_START',
               open: elementStartPToken.open,
               postOpenSpace: undefined,
               name: makeSToken('aName'),
               postNameSpace: makeSToken(' '),
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

   describe('checkWellFormed()', () => {

      it('reports an error when name starts with "xml" (check misc.check...Recommendation)', (done) => {
         source.addText('xmlElementName>');
         source.endText();

         elementStart.parse(source, elementStartPToken.open, (pToken) => {
            const ec = new ErrorCollector(pToken!.open, WellFormedError);

            elementStart.checkWellFormed(pToken!, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(XmlWarning.ID.ELEMENT_NAME_XML_RESERVED);
            done();
         });
      });

      it('reports an error when name starts with "$" (check misc.checkName)', (done) => {
         source.addText('$elementName>');
         source.endText();

         elementStart.parse(source, elementStartPToken.open, (pToken) => {
            const ec = new ErrorCollector(pToken!.open, WellFormedError);

            elementStart.checkWellFormed(pToken!, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ELEMENT_NAME_INVALID);
            done();
         });
      });

      it('reports an error when an attribute is malformed (check attribute.checkWellFormed())', (done) => {
         source.addText('foo blah "value">');

         elementStart.parse(source, elementStartPToken.open, (pToken) => {
            const ec = new ErrorCollector(pToken!.open, WellFormedError);

            elementStart.checkWellFormed(pToken!, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ATTRIBUTE_NO_EQUAL);
            done();
         });
      });

   });

   describe('pTokenToXToken()', () => {

      it('generates a full token with attributes', (done) => {
         source.addText(' aName attr1="value1" attr2="value two">');
         source.endText();

         elementStart.parse(source, elementStartPToken.open, (pToken) => {
            const token = elementStart.pTokenToXToken(pToken!);
            token.pToken = undefined;
            (token.attributes[0].value[0] as any).pToken = undefined;
            (token.attributes[1].value[0] as any).pToken = undefined;

            expect(token).toEqual(new elementStart.XToken('aName', [ {
               name: 'attr1',
               value: [ new TextXToken('value1') ],
            }, {
               name: 'attr2',
               value: [ new TextXToken('value two') ],
            } ]));
            done();
         });
      });

   });

});
