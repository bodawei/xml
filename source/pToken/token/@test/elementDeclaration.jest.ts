/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { STokenSource, toSToken } from 'sToken';
import { MockSTokenSource } from 'sToken-test';

import { UnexpandedMarkupDetails } from '../../types';
import { ContentSpecP } from '../../common/contentSpec';
import * as contentSpec from '../../common/contentSpec';
import * as parseUnexpanded from '../../common/parseUnexpanded';

import { DeclarationStart } from 'token';

import {
   ElementDeclarationPToken,
   parseElementDeclaration,
   resumeParseElementDeclaration,
} from '../elementDeclaration';

describe('elementDeclaration (unit)', () => {
   let elementDeclaration: ElementDeclarationPToken;
   let dummyCS: ContentSpecP;
   let parseContentSpecMock: jest.MockedFunction<typeof contentSpec.parseContentSpec>;

   beforeEach(() => {
      elementDeclaration = new ElementDeclarationPToken({
         open: toSToken('<!'),
         openSpace: undefined,
         declType: toSToken('ELEMENT'),
         declTypeSpace: toSToken(' '),
         name: toSToken('elementName'),
         nameSpace: toSToken(' '),
         close: toSToken('>'),
      });
      dummyCS = new ContentSpecP({});

      parseContentSpecMock = jest.spyOn(contentSpec, 'parseContentSpec') as jest.MockedFunction<
         typeof contentSpec.parseContentSpec
      >;
      parseContentSpecMock.mockImplementation(
         (source: STokenSource, cb: (spec: ContentSpecP | undefined) => void) => {
            cb(dummyCS);
         },
      );
   });

   describe('construction', () => {
      it('can overide properties with the second parameter', () => {
         const newPToken = new ElementDeclarationPToken(elementDeclaration, {
            open: toSToken('1'),
            openSpace: toSToken('2'),
            declType: undefined,
            declTypeSpace: undefined,
            name: toSToken('3'),
            nameSpace: undefined,
            contentKeyword: toSToken('4'),
            contentKeywordSpace: toSToken('5'),
            contentSpec: dummyCS,
            extra: toSToken('6'),
            unexpanded: {
               tokens: [],
               propName: 'contentSpec',
            },
            close: toSToken('>'),
         });

         expect(newPToken).toEqual(
            new ElementDeclarationPToken({
               open: toSToken('1'),
               openSpace: toSToken('2'),
               declType: undefined,
               declTypeSpace: undefined,
               name: toSToken('3'),
               nameSpace: undefined,
               contentKeyword: toSToken('4'),
               contentKeywordSpace: toSToken('5'),
               contentSpec: dummyCS,
               extra: toSToken('6'),
               unexpanded: {
                  tokens: [],
                  propName: 'contentSpec',
               },
               close: toSToken('>'),
            }),
         );
      });

      it('accepts a declaration start and overwrites that', () => {
         const newPToken = new ElementDeclarationPToken(
            {
               open: toSToken('decl1'),
               openSpace: toSToken('decl2'),
               declType: undefined,
               declTypeSpace: undefined,
            },
            {
               name: toSToken('3'),
               nameSpace: undefined,
               contentKeyword: toSToken('4'),
               contentKeywordSpace: toSToken('5'),
               contentSpec: dummyCS,
               extra: toSToken('6'),
               unexpanded: {
                  tokens: [],
                  propName: 'contentKeyword',
               },
               close: toSToken('>'),
            },
         );

         expect(newPToken).toEqual(
            new ElementDeclarationPToken({
               open: toSToken('decl1'),
               openSpace: toSToken('decl2'),
               declType: undefined,
               declTypeSpace: undefined,
               name: toSToken('3'),
               nameSpace: undefined,
               contentKeyword: toSToken('4'),
               contentKeywordSpace: toSToken('5'),
               contentSpec: dummyCS,
               extra: toSToken('6'),
               unexpanded: {
                  tokens: [],
                  propName: 'contentKeyword',
               },
               close: toSToken('>'),
            }),
         );
      });
   });

   describe('parseElementDeclaration()', () => {
      let declarationStart: DeclarationStart;
      let result: ElementDeclarationPToken | undefined;
      let parseUnexpandedSpy: jest.MockedFunction<typeof parseUnexpanded.parseUnexpanded>;

      beforeEach(() => {
         declarationStart = {
            open: toSToken('<!'),
         };
         result = undefined;
         parseUnexpandedSpy = jest.spyOn(parseUnexpanded, 'parseUnexpanded') as jest.MockedFunction<
            typeof parseUnexpanded.parseUnexpanded
         >;

         parseUnexpandedSpy.mockImplementation(
            (
               source: STokenSource,
               propName: string,
               cb: (result: UnexpandedMarkupDetails | undefined) => void,
            ) => {
               cb(undefined);
            },
         );
      });

      function getResult(item: ElementDeclarationPToken) {
         result = item;
      }

      it('does a parse of an element declaration with a non-list content spec', () => {
         const mockSource = new MockSTokenSource([
            ['elementName', 'word', ['>', '(']],
            [' ', 'space'],
            ['A', 'peekChar'],
            ['ANY', 'word', ['>']],
            [' ', 'space'],
            ['>', 'match', '>'],
         ]);

         parseElementDeclaration(mockSource, declarationStart, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new ElementDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('elementName'),
               nameSpace: toSToken(' '),
               contentKeyword: toSToken('ANY'),
               contentKeywordSpace: toSToken(' '),
               contentSpec: undefined,
               unexpanded: undefined,
               close: toSToken('>'),
            }),
         );
      });

      it('does a parse of an element declaration that ends early', () => {
         const mockSource = new MockSTokenSource([
            ['elementName', 'word', ['>', '(']],
            [' ', 'space'],
            [undefined, 'peekChar'],
            [undefined, 'match', '>'],
         ]);
         parseContentSpecMock.mockImplementation(
            (source: STokenSource, cb: (spec: ContentSpecP | undefined) => void) => {
               cb(undefined);
            },
         );

         parseElementDeclaration(mockSource, declarationStart, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new ElementDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('elementName'),
               nameSpace: toSToken(' '),
               contentKeyword: undefined,
               contentKeywordSpace: undefined,
               contentSpec: undefined,
               unexpanded: undefined,
               close: undefined,
            }),
         );
      });

      it('hands off parsing of the contentSpec to contentSpec()', () => {
         const mockSource = new MockSTokenSource([
            ['elementName', 'word', ['>', '(']],
            [' ', 'space'],
            ['(', 'peekChar'],
            ['>', 'match', '>'],
         ]);

         parseElementDeclaration(mockSource, declarationStart, getResult);
         mockSource.respondInAsyncTime();

         expect(parseContentSpecMock.mock.calls[0][0]).toEqual(mockSource);
         expect(parseContentSpecMock.mock.calls[0][1]).toBeInstanceOf(Function);
      });

      it('delivers contentSpec and end of list', () => {
         const mockSource = new MockSTokenSource([
            ['elementName', 'word', ['>', '(']],
            [' ', 'space'],
            ['(', 'peekChar'],
            ['>', 'match', '>'],
         ]);

         parseElementDeclaration(mockSource, declarationStart, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new ElementDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('elementName'),
               nameSpace: toSToken(' '),
               contentKeyword: undefined,
               contentKeywordSpace: undefined,
               contentSpec: dummyCS,
               unexpanded: undefined,
               close: toSToken('>'),
            }),
         );
      });

      it('sets up to let unassigned handle checking for a PE Reference instead of the name', () => {
         parseUnexpandedSpy.mockImplementation(
            (
               source: STokenSource,
               propName: string,
               cb: (result: UnexpandedMarkupDetails | undefined) => void,
            ) => {
               cb({
                  propName,
                  tokens: [],
               });
            },
         );
         const mockSource = new MockSTokenSource([['>', 'match', '>']]);

         parseElementDeclaration(mockSource, declarationStart, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new ElementDeclarationPToken({
               open: toSToken('<!'),
               name: undefined,
               nameSpace: undefined,
               contentKeyword: undefined,
               contentKeywordSpace: undefined,
               contentSpec: undefined,
               unexpanded: {
                  propName: 'name',
                  tokens: [],
               },
               close: toSToken('>'),
            }),
         );
      });

      it('sets up to let unassigned handle checking for a PE Reference instead of the contentKeyword', () => {
         const calls = [
            undefined,
            {
               propName: 'contentKeyword',
               tokens: [],
            },
         ];
         parseUnexpandedSpy.mockImplementation(
            (
               source: STokenSource,
               propName: string,
               cb: (result: UnexpandedMarkupDetails | undefined) => void,
            ) => {
               cb(calls.shift());
            },
         );
         const mockSource = new MockSTokenSource([
            ['elementName', 'word', ['>', '(']],
            [' ', 'space'],
            ['>', 'match', '>'],
         ]);

         parseElementDeclaration(mockSource, declarationStart, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new ElementDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('elementName'),
               nameSpace: toSToken(' '),
               contentKeyword: undefined,
               contentKeywordSpace: undefined,
               contentSpec: undefined,
               unexpanded: {
                  propName: 'contentKeyword',
                  tokens: [],
               },
               close: toSToken('>'),
            }),
         );
      });

      it('sets up to let unassigned handle checking for a PE Reference after a content spec', () => {
         const calls = [
            undefined,
            undefined,
            {
               propName: 'midSpec',
               tokens: [],
            },
         ];
         parseUnexpandedSpy.mockImplementation(
            (
               source: STokenSource,
               propName: string,
               cb: (result: UnexpandedMarkupDetails | undefined) => void,
            ) => {
               cb(calls.shift());
            },
         );
         const mockSource = new MockSTokenSource([
            ['elementName', 'word', ['>', '(']],
            [' ', 'space'],
            ['(', 'peekChar'],
            ['>', 'match', '>'],
         ]);

         parseElementDeclaration(mockSource, declarationStart, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new ElementDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('elementName'),
               nameSpace: toSToken(' '),
               contentKeyword: undefined,
               contentKeywordSpace: undefined,
               contentSpec: dummyCS,
               unexpanded: {
                  propName: 'midSpec',
                  tokens: [],
               },
               close: toSToken('>'),
            }),
         );
      });
   });

   describe('resumeParseElementDeclaration()', () => {
      let result: ElementDeclarationPToken | undefined;
      let parseUnexpandedSpy: jest.MockedFunction<typeof parseUnexpanded.parseUnexpanded>;

      beforeEach(() => {
         result = undefined;
         parseUnexpandedSpy = jest.spyOn(parseUnexpanded, 'parseUnexpanded') as jest.MockedFunction<
            typeof parseUnexpanded.parseUnexpanded
         >;

         parseUnexpandedSpy.mockImplementation(
            (
               source: STokenSource,
               propName: string,
               cb: (result: UnexpandedMarkupDetails | undefined) => void,
            ) => {
               cb(undefined);
            },
         );
      });

      function getResult(item: ElementDeclarationPToken) {
         result = item;
      }

      it('returns the original token if there are no unexpanded values', () => {
         const elementDecl = new ElementDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('elementName'),
            nameSpace: toSToken(' '),
            contentKeyword: toSToken('ANY'),
            contentKeywordSpace: toSToken(' '),
            contentSpec: undefined,
            unexpanded: undefined,
            close: toSToken('>'),
         });
         const mockSource = new MockSTokenSource([]);

         resumeParseElementDeclaration(mockSource, elementDecl, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toBe(elementDecl);
      });

      it('returns an element declaration with a non-list content spec', () => {
         const elementDecl = new ElementDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('elementName'),
            nameSpace: toSToken(' '),
            unexpanded: {
               propName: 'contentKeyword',
               tokens: [],
            },
            close: toSToken('>'),
         });
         const mockSource = new MockSTokenSource([
            ['A', 'peekChar'],
            ['ANY', 'word', ['>']],
            [' ', 'space'],
         ]);

         resumeParseElementDeclaration(mockSource, elementDecl, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new ElementDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('elementName'),
               nameSpace: toSToken(' '),
               contentKeyword: toSToken('ANY'),
               contentKeywordSpace: toSToken(' '),
               contentSpec: undefined,
               unexpanded: {
                  propName: 'contentKeyword',
                  tokens: [],
               },
               close: toSToken('>'),
            }),
         );
      });

      it('returns an element declaration with a list content spec', () => {
         const elementDecl = new ElementDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('elementName'),
            nameSpace: toSToken(' '),
            unexpanded: {
               propName: 'contentKeyword',
               tokens: [],
            },
            close: toSToken('>'),
         });
         const mockSource = new MockSTokenSource([['(', 'peekChar']]);

         resumeParseElementDeclaration(mockSource, elementDecl, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new ElementDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('elementName'),
               nameSpace: toSToken(' '),
               contentSpec: dummyCS,
               unexpanded: {
                  propName: 'contentKeyword',
                  tokens: [],
               },
               close: toSToken('>'),
            }),
         );
      });

      it('returns an element declaration when unassigned starts at the name', () => {
         const elementDecl = new ElementDeclarationPToken({
            open: toSToken('<!'),
            unexpanded: {
               propName: 'name',
               tokens: [],
            },
            close: toSToken('>'),
         });
         const mockSource = new MockSTokenSource([
            ['foo', 'word'],
            [' ', 'space'],
            ['A', 'peekChar'],
            ['ANY', 'word', ['>']],
            [' ', 'space'],
         ]);

         resumeParseElementDeclaration(mockSource, elementDecl, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new ElementDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('foo'),
               nameSpace: toSToken(' '),
               contentKeyword: toSToken('ANY'),
               contentKeywordSpace: toSToken(' '),
               contentSpec: undefined,
               unexpanded: {
                  propName: 'name',
                  tokens: [],
               },
               close: toSToken('>'),
            }),
         );
      });
   });
});
