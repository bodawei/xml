/* Copyright ® 2016-2026 by 柏大衛. All rights reserved. */

import { STokenSource } from 'basic';
import { TextPToken } from 'pToken';
import { describe, expect, it } from 'vitest';

import { PTokenLiteralParser } from '../pTokenLiteralParser';
import { CharRefPToken } from '../token/charRef';
import { GeneralEntityReferencePToken } from '../token/generalEntityReference';
import { ParameterEntityReferencePToken } from '../token/parameterEntityReference';
import { TextDeclarationPToken } from '../token/textDeclaration';
import { ParseToken } from '../types';

describe('PTokenLiteralParser (unit)', () => {
   function gatherParseResults(
      parser: PTokenLiteralParser,
      expect: (results: Array<ParseToken>) => void,
   ): void {
      parser.parse((result) => {
         if (!result) {
            expect([]);
            return;
         }

         gatherParseResults(parser, (subResult) => {
            if (Array.isArray(result)) {
               expect([...result, ...subResult]);
            } else {
               expect([result, ...subResult]);
            }
         });
      });
   }

   it('delivers "<?xml version="1.1"?>blah" as a text declaration PToken followed by text', () =>
      new Promise<void>((done) => {
         const source = new STokenSource();
         const pTokenLiteralParser = new PTokenLiteralParser(source);

         source.addText('<?xml version="1.1"?>blah');
         source.endText();

         gatherParseResults(pTokenLiteralParser, (result) => {
            expect(result).toEqual([expect.any(TextDeclarationPToken), expect.any(TextPToken)]);
            done();
         });
      }));

   it('delivers "<?blah?>blah" as a text text', () =>
      new Promise<void>((done) => {
         const source = new STokenSource();
         const pTokenLiteralParser = new PTokenLiteralParser(source);

         source.addText('<?blah version="1.1"?>blah');
         source.endText();

         gatherParseResults(pTokenLiteralParser, (result) => {
            expect(result).toEqual([expect.any(TextPToken)]);
            done();
         });
      }));

   it('delivers "&foo;" as two text chunks when default options are passed', () =>
      new Promise<void>((done) => {
         const source = new STokenSource();
         const pTokenLiteralParser = new PTokenLiteralParser(source);

         source.addText('&foo;');
         source.endText();

         gatherParseResults(pTokenLiteralParser, (result) => {
            expect(result).toEqual([expect.any(TextPToken), expect.any(TextPToken)]);
            done();
         });
      }));

   it('delivers "&foo;" as a general entity reference if geRef is set to true', () =>
      new Promise<void>((done) => {
         const source = new STokenSource();
         const pTokenLiteralParser = new PTokenLiteralParser(source, { geRef: true });

         source.addText('&foo;');
         source.endText();

         gatherParseResults(pTokenLiteralParser, (result) => {
            expect(result).toEqual([expect.any(GeneralEntityReferencePToken)]);
            done();
         });
      }));

   it('delivers "&#123;" as a char reference', () =>
      new Promise<void>((done) => {
         const source = new STokenSource();
         const pTokenLiteralParser = new PTokenLiteralParser(source, { geRef: false });

         source.addText('&#123;');
         source.endText();

         gatherParseResults(pTokenLiteralParser, (result) => {
            expect(result).toEqual([expect.any(CharRefPToken)]);
            done();
         });
      }));

   it('delivers "%foo;" as a text chunk when default options passed', () =>
      new Promise<void>((done) => {
         const source = new STokenSource();
         const pTokenLiteralParser = new PTokenLiteralParser(source);

         source.addText('%foo;');
         source.endText();

         gatherParseResults(pTokenLiteralParser, (result) => {
            expect(result).toEqual([expect.any(TextPToken)]);
            done();
         });
      }));

   it('delivers "%foo;" as a parameter entity reference when peRef is true', () =>
      new Promise<void>((done) => {
         const source = new STokenSource();
         const pTokenLiteralParser = new PTokenLiteralParser(source, { peRef: true });

         source.addText('%foo;');
         source.endText();

         gatherParseResults(pTokenLiteralParser, (result) => {
            expect(result).toEqual([expect.any(ParameterEntityReferencePToken)]);
            done();
         });
      }));

   it('delivers all the different parts when they are there', () =>
      new Promise<void>((done) => {
         const source = new STokenSource();
         const pTokenLiteralParser = new PTokenLiteralParser(source, { geRef: true, peRef: true });

         source.addText('<?xml?>blah&goo;&#xDEADBEEF;%foo;more text');
         source.endText();

         gatherParseResults(pTokenLiteralParser, (result) => {
            expect(result).toEqual([
               expect.any(TextDeclarationPToken),
               expect.any(TextPToken),
               expect.any(GeneralEntityReferencePToken),
               expect.any(CharRefPToken),
               expect.any(ParameterEntityReferencePToken),
               expect.any(TextPToken),
            ]);
            done();
         });
      }));
});
