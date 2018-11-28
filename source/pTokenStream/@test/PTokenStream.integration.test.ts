/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from 'basic';
import { defaultExtractors } from '../../extractor';
import { STokenSource } from '../../sToken';

import PTokenStream from '../PTokenStream';

import {
   PROCESSING_INSTRUCTION_PTOKEN,
   CDATA_PTOKEN,
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
} from '../../token';

type Token = { type: string };
type TokenArray = Array<Token>;

describe('PTokenStream (integration)', () => {
   let pTokenStream: PTokenStream;

   beforeEach(() => {
      pTokenStream = new PTokenStream(new EntityMetaData);
   });

   function gatherTokens(stream: PTokenStream, input: string | void, done: (tokens: TokenArray) => void) {
      const results: TokenArray = [];

      stream.on('data', (data: Token) => {
         results.push(data);
      });
      stream.on('end', () => {
         done(results);
      });

      if (input) {
         stream.addText(input);
         stream.endText();
      }
   }

   function expectInputToProduceTypes(input: string | void, types: Array<string> | string, done: () => void) {
      gatherTokens(pTokenStream, input, (results) => {
         let expecteds: Array<string>;
         if (!Array.isArray(types)) {
            expecteds = [ types ];
         } else {
            expecteds = types;
         }

         expecteds.forEach((expected) => {
            const actuals = results.filter((actual) => actual.type === expected);

            expect(actuals[0]).toContainPTokenProps({
               type: expected,
            });
         });
         done();
      });
   }

   describe('construction', () => {

      it('uses the provided STokenSource', (done) => {
         const emd = new EntityMetaData();
         const source = new STokenSource(defaultExtractors, emd);
         pTokenStream = new PTokenStream(source);

         source.addText('blah<elementName>');
         source.endText();

         expectInputToProduceTypes(undefined, 'CHARDATA', done);
      });

   });

   it('parses an ATTLIST', (done) => {
      expectInputToProduceTypes('<!ATTLIST myEntity atOne CDATA #REQUIRED>', 'ATTLISTDECL_PTOKEN_TYPE', done);
   });

   it('parses character data up to a <', (done) => {
      expectInputToProduceTypes('blah<elementName>', 'CHARDATA', done);
   });

   it('parses a comment', (done) => {
      expectInputToProduceTypes('<!-- my comment-->', 'COMMENT_PTOKEN', done);
   });

   it('parses a character reference', (done) => {
      expectInputToProduceTypes('&#1234;', 'CHARREF_PTOKEN', done);
   });

   it('parse start and end without an internal subset', (done) => {
      expectInputToProduceTypes('<!DOCTYPE goodName SYSTEM "sys.xml">',
         [ 'DOCTYPE_START', 'DOCTYPE_END' ], done);
   });

   it('parses an element start', (done) => {
      expectInputToProduceTypes('<elementName\t>', 'ELEMENT_START', done);
   });

   it('parses an empty element', (done) => {
      expectInputToProduceTypes('<elementName/>', 'ELEMENT_EMPTY', done);
   });

   it('parses an element end', (done) => {
      expectInputToProduceTypes('</elementName\t>', 'ELEMENT_END', done);
   });

   it('parses an ENTITY', (done) => {
      expectInputToProduceTypes('<!ENTITY myEntity PUBLIC "pub.xml" "sys.xml">', 'ENTITYDECL', done);
   });

   it('parses an ELEMENT', (done) => {
      expectInputToProduceTypes('<!ELEMENT myEntity EMPTY>', 'ELEMENTDECL', done);
   });

   it('parse entity reference', (done) => {
      expectInputToProduceTypes('&foo;', GENERAL_ENTITY_REFERENCE_PTOKEN, done);
   });

   it('parse parameter entity reference', (done) => {
      expectInputToProduceTypes('%foo;', PARAMETER_ENTITY_REFERENCE_PTOKEN, done);
   });

   it('parse NOTATION declaration', (done) => {
      expectInputToProduceTypes('<!NOTATION foo>', 'NOTATIONDECL', done);
   });

   it('parses a processing instruction', (done) => {
      expectInputToProduceTypes('<?froz adfasdf ?>', PROCESSING_INSTRUCTION_PTOKEN, done);
   });

   it('parses a space at document start', (done) => {
      expectInputToProduceTypes('\t\n ', 'SPACE', done);
   });

   it('parses no spaces in element content', (done) => {
      gatherTokens(pTokenStream, '  <one>   </one>   ', (results) => {
         expect(results.length).toEqual(6);
         expect(results[1].type).toEqual('SPACE');
         expect(results[2].type).toEqual('ELEMENT_START');
         expect(results[3].type).toEqual('CHARDATA');
         expect(results[4].type).toEqual('ELEMENT_END');
         expect(results[5].type).toEqual('SPACE');
         done();  
      });
   });

   it('parses an unknown declaration', (done) => {
      expectInputToProduceTypes('<!BOGUS', 'UNKNOWNDECL', done);
   });

   // it('parses an unknown envelope', (done) => {
   //    expectInputToProduceTypes('<![BOGUS[', 'UNKNOWNENVELOPE', done);
   // });

   it('parses an CDATA elment', (done) => {
      expectInputToProduceTypes('<![CDATA[asdf]]>', CDATA_PTOKEN, done);
   });

   it('parses a simple XML Declaration', (done) => {
      expectInputToProduceTypes('<?xml version="1.0"?>', 'XMLDECL_PTOKEN', done);
   });

});
