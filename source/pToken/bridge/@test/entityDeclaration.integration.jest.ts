/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { TextPToken } from 'pToken';
import { STokenSource, toSToken } from 'basic';

import { parseEntityDeclaration, resumeParseEntityDeclaration } from '../entityDeclaration';

import { DeclarationStart } from 'token';
import { GeneralEntityDeclarationPToken } from '../../token/generalEntityDeclaration';
import { ParameterEntityDeclarationPToken } from '../../token/parameterEntityDeclaration';
import { ParameterEntityReferencePToken } from '../../token/parameterEntityReference';

describe('parseEntityDeclaration (unit)', () => {
   let declarationStart: DeclarationStart;
   let source: STokenSource;

   beforeEach(() => {
      declarationStart = {
         open: toSToken('<!'),
         declType: toSToken('ENTITY'),
         declTypeSpace: toSToken('\t'),
      };
      source = new STokenSource();
   });

   it('parses an enty declaration with a PEReference after the value', (done) => {
      source.addText('aName "frog" %foo;>');
      source.endText();

      parseEntityDeclaration(source, declarationStart, (pToken) => {
         expect(pToken).toEqualRangeless(
            new GeneralEntityDeclarationPToken({
               open: toSToken('<!'),
               declType: toSToken('ENTITY'),
               declTypeSpace: toSToken('\t'),
               name: toSToken('aName'),
               nameSpace: toSToken(' '),
               openQuote: toSToken('"'),
               value: [new TextPToken({ text: toSToken('frog') })],
               closeQuote: toSToken('"'),
               valueSpace: toSToken(' '),
               close: toSToken('>'),
               unexpanded: {
                  tokens: [
                     new ParameterEntityReferencePToken({
                        open: toSToken('%'),
                        close: toSToken(';'),
                        name: toSToken('foo'),
                     }),
                  ],
                  propName: 'trailing',
               },
            }),
         );
         done();
      });
   });

   it('parses an enty declaration with a PEReference in the value', (done) => {
      source.addText('aName "frog%foo;">');
      source.endText();

      parseEntityDeclaration(source, declarationStart, (pToken) => {
         expect(pToken).toEqualRangeless(
            new GeneralEntityDeclarationPToken({
               open: toSToken('<!'),
               declType: toSToken('ENTITY'),
               declTypeSpace: toSToken('\t'),
               name: toSToken('aName'),
               nameSpace: toSToken(' '),
               openQuote: toSToken('"'),
               value: [
                  new TextPToken({ text: toSToken('frog') }),
                  new ParameterEntityReferencePToken({
                     open: toSToken('%'),
                     close: toSToken(';'),
                     name: toSToken('foo'),
                  }),
               ],
               closeQuote: toSToken('"'),
               close: toSToken('>'),
            }),
         );
         done();
      });
   });

   it('parses an entity reference after the name', (done) => {
      source.addText('aName %foo;>');
      source.endText();

      parseEntityDeclaration(source, declarationStart, (pToken) => {
         expect(pToken).toEqualRangeless(
            new GeneralEntityDeclarationPToken({
               open: toSToken('<!'),
               declType: toSToken('ENTITY'),
               declTypeSpace: toSToken('\t'),
               name: toSToken('aName'),
               nameSpace: toSToken(' '),
               unexpanded: {
                  propName: 'externalIdOrValue',
                  tokens: [
                     new ParameterEntityReferencePToken({
                        open: toSToken('%'),
                        close: toSToken(';'),
                        name: toSToken('foo'),
                     }),
                  ],
               },
               close: toSToken('>'),
            }),
         );
         done();
      });
   });

   it('parses an enty reference in the body of the declaration even when maformed', (done) => {
      source.addText('% foo ;>');
      source.endText();

      parseEntityDeclaration(source, declarationStart, (pToken) => {
         expect(pToken).toEqualRangeless(
            new GeneralEntityDeclarationPToken({
               open: toSToken('<!'),
               declType: toSToken('ENTITY'),
               declTypeSpace: toSToken('\t'),
               unexpanded: {
                  propName: 'parameter',
                  tokens: [
                     new ParameterEntityReferencePToken({
                        open: toSToken('%'),
                        openSpace: toSToken(' '),
                        name: toSToken('foo'),
                        nameSpace: toSToken(' '),
                        close: toSToken(';'),
                     }),
                  ],
               },
               close: toSToken('>'),
            }),
         );
         done();
      });
   });

   it('parses no inline entity reference when there is no ";"', (done) => {
      source.addText('%foo "value">');
      source.endText();

      parseEntityDeclaration(source, declarationStart, (pToken) => {
         expect(pToken).toEqualRangeless(
            new ParameterEntityDeclarationPToken({
               open: toSToken('<!'),
               declType: toSToken('ENTITY'),
               declTypeSpace: toSToken('\t'),
               parameter: toSToken('%'),
               name: toSToken('foo'),
               nameSpace: toSToken(' '),
               openQuote: toSToken('"'),
               value: [new TextPToken({ text: toSToken('value') })],
               closeQuote: toSToken('"'),
               close: toSToken('>'),
            }),
         );
         done();
      });
   });

   it('parses an enty reference in an externalID', (done) => {
      source.addText('aName SYSTEM %foo;>');
      source.endText();

      parseEntityDeclaration(source, declarationStart, (pToken) => {
         expect(pToken).toEqualRangeless(
            new GeneralEntityDeclarationPToken({
               open: toSToken('<!'),
               declType: toSToken('ENTITY'),
               declTypeSpace: toSToken('\t'),
               name: toSToken('aName'),
               nameSpace: toSToken(' '),
               externalId: {
                  externalType: toSToken('SYSTEM'),
                  externalTypeSpace: toSToken(' '),
               },
               unexpanded: {
                  propName: 'system',
                  tokens: [
                     new ParameterEntityReferencePToken({
                        open: toSToken('%'),
                        name: toSToken('foo'),
                        close: toSToken(';'),
                     }),
                  ],
               },
               close: toSToken('>'),
            }),
         );
         done();
      });
   });

   it('parses an enty reference after an externalID', (done) => {
      source.addText('% aName SYSTEM "system" %foo;>');
      source.endText();

      parseEntityDeclaration(source, declarationStart, (pToken) => {
         expect(pToken).toEqualRangeless(
            new ParameterEntityDeclarationPToken({
               open: toSToken('<!'),
               declType: toSToken('ENTITY'),
               declTypeSpace: toSToken('\t'),
               parameter: toSToken('%'),
               parameterSpace: toSToken(' '),
               name: toSToken('aName'),
               nameSpace: toSToken(' '),
               externalId: {
                  externalType: toSToken('SYSTEM'),
                  externalTypeSpace: toSToken(' '),
                  system: {
                     openQuote: toSToken('"'),
                     value: [new TextPToken(toSToken('system'))],
                     closeQuote: toSToken('"'),
                  },
               },
               externalIdSpace: toSToken(' '),
               unexpanded: {
                  propName: 'trailing',
                  tokens: [
                     new ParameterEntityReferencePToken({
                        open: toSToken('%'),
                        name: toSToken('foo'),
                        close: toSToken(';'),
                     }),
                  ],
               },
               close: toSToken('>'),
            }),
         );
         done();
      });
   });

   it('parses an enty reference after an NDATA entry', (done) => {
      source.addText('aName SYSTEM "foo" NDATA fred %foo;>');
      source.endText();

      parseEntityDeclaration(source, declarationStart, (pToken) => {
         expect(pToken).toEqualRangeless(
            new GeneralEntityDeclarationPToken({
               open: toSToken('<!'),
               declType: toSToken('ENTITY'),
               declTypeSpace: toSToken('\t'),
               name: toSToken('aName'),
               nameSpace: toSToken(' '),
               externalId: {
                  externalType: toSToken('SYSTEM'),
                  externalTypeSpace: toSToken(' '),
                  system: {
                     openQuote: toSToken('"'),
                     value: [new TextPToken(toSToken('foo'))],
                     closeQuote: toSToken('"'),
                  },
               },
               externalIdSpace: toSToken(' '),
               nData: toSToken('NDATA'),
               nDataSpace: toSToken(' '),
               nDataName: toSToken('fred'),
               nDataNameSpace: toSToken(' '),
               unexpanded: {
                  propName: 'trailing',
                  tokens: [
                     new ParameterEntityReferencePToken({
                        open: toSToken('%'),
                        name: toSToken('foo'),
                        close: toSToken(';'),
                     }),
                  ],
               },
               close: toSToken('>'),
            }),
         );
         done();
      });
   });

   it('resumeParses a general entity declaration', (done) => {
      source.addText('aName "some value" %foo;>');
      source.endText();

      parseEntityDeclaration(source, declarationStart, (pToken) => {
         const tokensExpanded = new STokenSource();

         tokensExpanded.addText('\t');
         tokensExpanded.endText();

         resumeParseEntityDeclaration(tokensExpanded, pToken, (finishedToken) => {
            expect(finishedToken).toEqualRangeless(
               new GeneralEntityDeclarationPToken({
                  open: toSToken('<!'),
                  declType: toSToken('ENTITY'),
                  declTypeSpace: toSToken('\t'),
                  name: toSToken('aName'),
                  nameSpace: toSToken(' '),
                  openQuote: toSToken('"'),
                  value: [new TextPToken({ text: toSToken('some value') })],
                  closeQuote: toSToken('"'),
                  valueSpace: toSToken(' \t'),
                  unexpanded: {
                     propName: 'trailing',
                     tokens: [
                        new ParameterEntityReferencePToken({
                           open: toSToken('%'),
                           name: toSToken('foo'),
                           close: toSToken(';'),
                        }),
                     ],
                  },
                  close: toSToken('>'),
               }),
            );
         });
         done();
      });
   });
});
