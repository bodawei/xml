/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { defaultExtractors } from 'extractor';
import { STokenSource, toSToken } from 'sToken';

import { parseEntityDeclaration, resumeParseEntityDeclaration } from '../entityDeclaration';

import { DeclarationStart, ParameterEntityReferencePToken, TextPToken } from 'token';
import { GeneralEntityDeclarationPToken } from '../../token/generalEntityDeclaration';
import { ParameterEntityDeclarationPToken } from '../../token/parameterEntityDeclaration';

describe('parseEntityDeclaration (unit)', () => {
   let declarationStart: DeclarationStart;
   let source: STokenSource;

   beforeEach(() => {
      declarationStart = {
         open: toSToken('<!'),
         declType: toSToken('ENTITY'),
         declTypeSpace: toSToken('\t'),
      };
      source = new STokenSource(defaultExtractors);
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

   it('parses an entity declaration after the name', (done) => {
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

   it('parses an enty declaration in the body of the declaration even when maformed', (done) => {
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

   it('parses an enty declaration in an externalID', (done) => {
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

   it('resumeParses a general entity declaration', (done) => {
      source.addText('% foo ;>');
      source.endText();

      parseEntityDeclaration(source, declarationStart, (pToken) => {
         const tokensExpanded = new STokenSource(defaultExtractors);

         tokensExpanded.addText('aName PUBLIC "http://somewhere" "-whatever" NDATA frog bogus');
         tokensExpanded.endText();

         resumeParseEntityDeclaration(tokensExpanded, pToken, (finishedToken) => {
            expect(finishedToken).toEqualRangeless(
               new GeneralEntityDeclarationPToken({
                  open: toSToken('<!'),
                  declType: toSToken('ENTITY'),
                  declTypeSpace: toSToken('\t'),
                  name: toSToken('aName'),
                  nameSpace: toSToken(' '),
                  externalId: {
                     externalType: toSToken('PUBLIC'),
                     externalTypeSpace: toSToken(' '),
                     public: {
                        openQuote: toSToken('"'),
                        value: [new TextPToken({ text: toSToken('http://somewhere') })],
                        closeQuote: toSToken('"'),
                     },
                     publicSpace: toSToken(' '),
                     system: {
                        openQuote: toSToken('"'),
                        value: [new TextPToken({ text: toSToken('-whatever') })],
                        closeQuote: toSToken('"'),
                     },
                  },
                  externalIdSpace: toSToken(' '),
                  nData: toSToken('NDATA'),
                  nDataSpace: toSToken(' '),
                  nDataName: toSToken('frog'),
                  nDataNameSpace: toSToken(' '),
                  extra: toSToken('bogus'),
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
         });
         done();
      });
   });
});
