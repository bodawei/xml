/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { STokenSource } from 'basic';
import {
   CHARREF_PTOKEN,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
   TEXTDECL_PTOKEN,
   TEXT_PTOKEN,
} from 'pToken';

import { PTokenLiteralStream } from '../pTokenLiteralStream';

type Token = { type: string };
type TokenArray = Array<Token>;

describe('PTokenLiteralStream (integration)', () => {
   function expectInputToProduceTypes(
      input: string | void,
      options: Object,
      types: Array<string>,
      done?: () => void,
   ) {
      const results: TokenArray = [];
      const sTokenStream = new STokenSource();
      const pTokenStream = new PTokenLiteralStream(sTokenStream, options);

      pTokenStream.on('data', (data: Token) => results.push(data));
      pTokenStream.on('end', () => {
         const resultTypes = results.map((result) => result.type);

         expect(resultTypes).toEqual(types);
         done?.();
      });

      if (input) {
         sTokenStream.addText(input);
         sTokenStream.endText();
      }
   }

   it('produces a single text token if not told to look for perefs', (done) => {
      expectInputToProduceTypes('one %two; three <four>', {}, [TEXT_PTOKEN], done);
   });

   it('produces a mixture of text and charRefs if asked to', (done) => {
      expectInputToProduceTypes(
         'one %two; &three &#x40; <four>',
         {},
         [TEXT_PTOKEN, TEXT_PTOKEN, TEXT_PTOKEN, CHARREF_PTOKEN, TEXT_PTOKEN],
         done,
      );
   });

   it('produces a mixture of text, charrefs and parameter entity references if asked to', (done) => {
      expectInputToProduceTypes(
         'one %two; three &#65; <four>',
         { peRef: true },
         [TEXT_PTOKEN, PARAMETER_ENTITY_REFERENCE_PTOKEN, TEXT_PTOKEN, CHARREF_PTOKEN, TEXT_PTOKEN],
         done,
      );
   });

   it('extracts a TextDeclaration if it starts with one', (done) => {
      expectInputToProduceTypes(
         '<?xml version="1.0" encoding="usascii"?>one %two; three &#65; <four>',
         { peRef: true },
         [
            TEXTDECL_PTOKEN,
            TEXT_PTOKEN,
            PARAMETER_ENTITY_REFERENCE_PTOKEN,
            TEXT_PTOKEN,
            CHARREF_PTOKEN,
            TEXT_PTOKEN,
         ],
         done,
      );
   });

   it('treats something that almost, but not quite, looks like a TextDeclaration as text', (done) => {
      expectInputToProduceTypes(
         '<?xml version="1.0" encoding="usascii">one %two; three &#65; <four>',
         { peRef: true },
         [TEXT_PTOKEN, PARAMETER_ENTITY_REFERENCE_PTOKEN, TEXT_PTOKEN, CHARREF_PTOKEN, TEXT_PTOKEN],
         done,
      );
   });
});
