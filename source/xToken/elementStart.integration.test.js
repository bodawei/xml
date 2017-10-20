/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { ErrorCollector, WellFormedError, XmlWarning } from '../error';
import { LTokenSource, defaultExtractors } from '../lToken';
import { makeLTokenMaker } from '../lToken/test';

import * as elementStart from './elementStart.js';
import * as text from './text.js';

describe('elementStart (integration)', () => {
   let parsedElementStart;
   let emd;
   let source;

   beforeEach(() => {
      emd = new EntityMetaData();
      source = new LTokenSource(defaultExtractors, emd);
      const makeSequentialToken = makeLTokenMaker();
      parsedElementStart = {
         type: 'ELEMENT_START',
         open: makeSequentialToken('<'),
         postOpenSpace: undefined,
         name: makeSequentialToken('elemName'),
         postNameSpace: makeSequentialToken(' '),
         attributes: [],
         close: makeSequentialToken('>'),
      };
   });

   describe('parse()', () => {

      it('parses a set of attributes', (done) => {
         const expectedLToken = makeLTokenMaker();
         source.addText(' aName attr1 =\t\t"value1" attr2="value two">');
         source.endText();

         elementStart.parse(source, parsedElementStart.open, (parsed) => {
            expect(parsed).toEqual({
               type: 'ELEMENT_START',
               open: parsedElementStart.open,
               postOpenSpace: expectedLToken(' '),
               name: expectedLToken('aName'),
               postNameSpace: expectedLToken(' '),
               attributes: [ {
                  name: expectedLToken('attr1'),
                  postNameSpace: expectedLToken(' '),
                  equal: expectedLToken('='),
                  postEqualSpace: expectedLToken('\t\t'),
                  attrOpenQuote: expectedLToken('"'),
                  attrValue: [ expectedLToken('value1') ],
                  attrCloseQuote: expectedLToken('"'),
                  trailingSpace: expectedLToken(' '),
               }, {
                  name: expectedLToken('attr2'),
                  postNameSpace: undefined,
                  equal: expectedLToken('='),
                  postEqualSpace: undefined,
                  attrOpenQuote: expectedLToken('"'),
                  attrValue: [ expectedLToken('value two') ],
                  attrCloseQuote: expectedLToken('"'),
                  trailingSpace: undefined,
               } ],
               close: expectedLToken('>'),
            });
            done();
         });
      });

   });

   describe('checkWellFormed()', () => {

      it('reports an error when name starts with "xml" (check misc.check...Recommendation)', (done) => {
         source.addText('xmlElementName>');
         source.endText();

         elementStart.parse(source, parsedElementStart.open, (parsed) => {
            const ec = new ErrorCollector(parsed.open, WellFormedError);

            elementStart.checkWellFormed(parsed, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(XmlWarning.ID.ELEMENT_NAME_XML_RESERVED);
            done();
         });
      });

      it('reports an error when name starts with "$" (check misc.checkName)', (done) => {
         source.addText('$elementName>');
         source.endText();

         elementStart.parse(source, parsedElementStart.open, (parsed) => {
            const ec = new ErrorCollector(parsed.open, WellFormedError);

            elementStart.checkWellFormed(parsed, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ELEMENT_NAME_INVALID);
            done();
         });
      });

      it('reports an error when an attribute is malformed (check attribute.checkWellFormed())', (done) => {
         source.addText('foo blah "value">');

         elementStart.parse(source, parsedElementStart.open, (parsed) => {
            const ec = new ErrorCollector(parsed.open, WellFormedError);

            elementStart.checkWellFormed(parsed, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ATTRIBUTE_NO_EQUAL);
            done();
         });
      });

   });

   describe('makeToken()', () => {

      it('generates a full token with attributes', (done) => {
         source.addText(' aName attr1="value1" attr2="value two">');
         source.endText();

         elementStart.parse(source, parsedElementStart.open, (parsed) => {
            const token = elementStart.makeToken(parsed);
            token.lTokens = [];
            token.attributes[0].value[0].lTokens = [];
            token.attributes[1].value[0].lTokens = [];

            expect(token).toEqual(new elementStart.Token('aName', [ {
               name: 'attr1',
               value: [ new text.Token('value1', []) ],
            }, {
               name: 'attr2',
               value: [ new text.Token('value two', []) ],
            } ], []));
            done();
         });
      });

   });

});
