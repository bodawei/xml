/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { ConformanceVersion, ErrorCollector, XmlWarning } from 'basic';
import { WellFormedError,  } from 'error';
import { defaultExtractors } from 'extractor';
import { TextPToken } from 'pToken';
import { STokenSource } from 'sToken';
import { makeSTokenMaker } from 'sToken-test';
import { TextXToken } from 'xToken';

import { ElementStartPToken, ElementStartXToken, parseElementStart } from '../elementStart';
import { GeneralEntityReferencePToken } from '../generalEntityReference';

describe('elementStart (integration)', () => {
   let elementStartPToken: ElementStartPToken;
   let confVer: ConformanceVersion;
   let source: STokenSource;

   beforeEach(() => {
      confVer = new ConformanceVersion();
      source = new STokenSource(defaultExtractors);
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

   describe('checkWellFormed()', () => {

      it('reports an error when name starts with "xml" (check misc.check...Recommendation)', (done) => {
         source.addText('xmlElementName>');
         source.endText();

         parseElementStart(source, elementStartPToken.open, (pToken) => {
            const ec = new ErrorCollector(pToken!.open, WellFormedError);

            pToken!.checkWellFormed(ec, confVer);

            expect(ec.getErrors()[0].id).toEqual(XmlWarning.ID.ELEMENT_NAME_XML_RESERVED);
            done();
         });
      });

      it('reports an error when name starts with "$" (check misc.checkName)', (done) => {
         source.addText('$elementName>');
         source.endText();

         parseElementStart(source, elementStartPToken.open, (pToken) => {
            const ec = new ErrorCollector(pToken!.open, WellFormedError);

            pToken!.checkWellFormed(ec, confVer);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ELEMENT_NAME_INVALID);
            done();
         });
      });

      it('reports an error when an attribute is malformed (check attribute.checkWellFormed())', (done) => {
         source.addText('foo blah "value">');

         parseElementStart(source, elementStartPToken.open, (pToken) => {
            const ec = new ErrorCollector(pToken!.open, WellFormedError);

            pToken!.checkWellFormed(ec, confVer);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ATTRIBUTE_NO_EQUAL);
            done();
         });
      });

   });

   describe('pTokenToXToken()', () => {

      it('generates a full token with attributes', (done) => {
         source.addText(' aName attr1="value1" attr2="value two">');
         source.endText();

         parseElementStart(source, elementStartPToken.open, (pToken) => {
            const token = pToken!.toXToken();
            token.pToken = undefined;
            delete (token.attributes[0].value[0] as any).pToken;
            delete (token.attributes[1].value[0] as any).pToken;

            expect(token).toEqual(new ElementStartXToken('aName', [ {
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
