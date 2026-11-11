/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { CONFORMANCE_VERSION, ENTITY_ID } from 'basic';
import { STokenSource } from 'basic';
import {
   GENERAL_ENTITY_DECLARATION_PTOKEN,
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   PROCESSING_INSTRUCTION_PTOKEN,
   NOTATION_DECLARATION_PTOKEN,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
} from 'pToken';
import { ELEMENT_DECLARATION_PTOKEN } from 'pToken';
import {
   CDATA_PTOKEN,
   CHARDATA_PTOKEN,
   DOCTYPE_END_PTOKEN,
   DOCTYPE_START_PTOKEN,
   ELEMENT_END_PTOKEN,
   ELEMENT_START_PTOKEN,
   ELEMENT_EMPTY_PTOKEN,
   SPACE_PTOKEN,
} from 'token';

import { PTokenStream } from '../pTokenStream';

type Token = { type: string };
type TokenArray = Array<Token>;

describe('pTokenStream (integration)', () => {
   let pTokenStream: PTokenStream;
   let sTokenSource: STokenSource;

   beforeEach(() => {
      sTokenSource = new STokenSource();
      pTokenStream = new PTokenStream(sTokenSource);
   });

   function gatherTokens(
      stream: PTokenStream,
      input: string | void,
      done: (tokens: TokenArray) => void,
   ) {
      const results: TokenArray = [];

      stream.on('data', (data: Token) => {
         results.push(data);
      });
      stream.on('end', () => {
         done(results);
      });

      if (input) {
         sTokenSource.addText(input);
         sTokenSource.endText();
      }
   }

   function expectInputToProduceTypes(
      input: string | void,
      types: Array<string> | string,
      done?: () => void,
   ) {
      gatherTokens(pTokenStream, input, (results) => {
         let expecteds: Array<string>;
         if (!Array.isArray(types)) {
            expecteds = [types];
         } else {
            expecteds = types;
         }

         expecteds.forEach((expected) => {
            const actuals = results.filter((actual) => actual.type === expected);

            expect(actuals[0]).toMatchObject({
               type: expected,
            });
         });
         done?.();
      });
   }

   describe('construction', () => {
      it('uses the provided STokenSource', (done) => {
         const source = new STokenSource();
         pTokenStream = new PTokenStream(source);

         source.addText('blah<elementName>');
         source.endText();

         expectInputToProduceTypes(undefined, CHARDATA_PTOKEN, done);
      });
   });

   it('parses an ATTLIST', (done) => {
      expectInputToProduceTypes(
         '<!ATTLIST myEntity atOne CDATA #REQUIRED>',
         'ATTLIST_DECLARATION_PTOKEN',
         done,
      );
   });

   it('parses character data up to a <', (done) => {
      expectInputToProduceTypes('blah<elementName>', CHARDATA_PTOKEN, done);
   });

   it('parses a comment', (done) => {
      expectInputToProduceTypes('<!-- my comment-->', 'COMMENT_PTOKEN', done);
   });

   it('parses a character reference', (done) => {
      expectInputToProduceTypes('&#1234;', 'CHARREF_PTOKEN', done);
   });

   it('parse start and end without an internal subset', (done) => {
      expectInputToProduceTypes(
         '<!DOCTYPE goodName SYSTEM "sys.xml">',
         [DOCTYPE_START_PTOKEN, DOCTYPE_END_PTOKEN],
         done,
      );
   });

   it('parses an element start', (done) => {
      expectInputToProduceTypes('<elementName\t>', ELEMENT_START_PTOKEN, done);
   });

   it('parses an empty element', (done) => {
      expectInputToProduceTypes('<elementName/>', ELEMENT_EMPTY_PTOKEN, done);
   });

   it('parses an element end', (done) => {
      expectInputToProduceTypes('</elementName\t>', ELEMENT_END_PTOKEN, done);
   });

   it('parses an ENTITY', (done) => {
      expectInputToProduceTypes(
         '<!ENTITY myEntity PUBLIC "pub.xml" "sys.xml">',
         GENERAL_ENTITY_DECLARATION_PTOKEN,
         done,
      );
   });

   it('parses an ELEMENT', (done) => {
      expectInputToProduceTypes('<!ELEMENT myEntity EMPTY>', ELEMENT_DECLARATION_PTOKEN, done);
   });

   it('parse entity reference', (done) => {
      expectInputToProduceTypes('&foo;', GENERAL_ENTITY_REFERENCE_PTOKEN, done);
   });

   it('parse parameter entity reference', (done) => {
      expectInputToProduceTypes('<!DOCTYPE foo [%foo;]>', PARAMETER_ENTITY_REFERENCE_PTOKEN, done);
   });

   it('parse NOTATION declaration', (done) => {
      expectInputToProduceTypes('<!NOTATION foo>', NOTATION_DECLARATION_PTOKEN, done);
   });

   it('parses a processing instruction', (done) => {
      expectInputToProduceTypes('<?froz adfasdf ?>', PROCESSING_INSTRUCTION_PTOKEN, done);
   });

   it('parses a space at document start', (done) => {
      expectInputToProduceTypes('\t\n ', 'SPACE_PTOKEN', done);
   });

   it('parses no spaces in element content', (done) => {
      gatherTokens(pTokenStream, '  <one>   </one>   ', (results) => {
         const types = results.map((r) => r.type);
         expect(types).toEqual([
            CONFORMANCE_VERSION,
            ENTITY_ID,
            SPACE_PTOKEN,
            ELEMENT_START_PTOKEN,
            CHARDATA_PTOKEN,
            ELEMENT_END_PTOKEN,
            SPACE_PTOKEN,
         ]);
         done?.();
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
