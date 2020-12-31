/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { STokenSource, toSToken } from 'sToken';
import { MockSTokenSource } from 'sToken-test';

import { UnexpandedMarkupDetails } from '../../types';
import { ContentModelP } from '../../common/contentModel';
import * as contentModel from '../../common/contentModel';
import * as parseUnexpanded from '../../common/parseUnexpanded';

import { DeclarationStart } from 'token';

import {
   ElementDeclarationPToken,
   parseElementDeclaration,
   resumeParseElementDeclaration,
} from '../elementDeclaration';

describe('elementDeclaration (unit)', () => {
   let elementDeclaration: ElementDeclarationPToken;
   let dummyCM: ContentModelP;
   let parseContentModelMock: jest.MockedFunction<typeof contentModel.parseContentModel>;
   let resumeParseContentModelMock: jest.MockedFunction<typeof contentModel.resumeParseContentModel>;

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
      dummyCM = new ContentModelP({});

      resumeParseContentModelMock = jest.spyOn(
         contentModel,
         'resumeParseContentModel',
      ) as jest.MockedFunction<typeof contentModel.resumeParseContentModel>;
      parseContentModelMock = jest.spyOn(contentModel, 'parseContentModel') as jest.MockedFunction<
         typeof contentModel.parseContentModel
      >;
      parseContentModelMock.mockImplementation(
         (source: STokenSource, cb: (spec: ContentModelP | undefined) => void) => {
            cb(dummyCM);
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
            contentSpec: toSToken('4'),
            contentSpecSpace: toSToken('5'),
            contentModel: dummyCM,
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
               contentSpec: toSToken('4'),
               contentSpecSpace: toSToken('5'),
               contentModel: dummyCM,
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
               contentSpec: toSToken('4'),
               contentSpecSpace: toSToken('5'),
               contentModel: dummyCM,
               extra: toSToken('6'),
               unexpanded: {
                  tokens: [],
                  propName: 'contentSpec',
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
               contentSpec: toSToken('4'),
               contentSpecSpace: toSToken('5'),
               contentModel: dummyCM,
               extra: toSToken('6'),
               unexpanded: {
                  tokens: [],
                  propName: 'contentSpec',
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

         // @ts-expect-error 2329/matchers
         // eslint-disable-next-line @typescript-eslint/no-unsafe-call
         expect(result).toEqualRangeless(
            new ElementDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('elementName'),
               nameSpace: toSToken(' '),
               contentSpec: toSToken('ANY'),
               contentSpecSpace: toSToken(' '),
               contentModel: undefined,
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
         parseContentModelMock.mockImplementation(
            (source: STokenSource, cb: (spec: ContentModelP | undefined) => void) => {
               cb(undefined);
            },
         );

         parseElementDeclaration(mockSource, declarationStart, getResult);
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         // eslint-disable-next-line @typescript-eslint/no-unsafe-call
         expect(result).toEqualRangeless(
            new ElementDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('elementName'),
               nameSpace: toSToken(' '),
               contentSpec: undefined,
               contentSpecSpace: undefined,
               contentModel: undefined,
               unexpanded: undefined,
               close: undefined,
            }),
         );
      });

      it('hands off parsing of the contentModel to contentModel()', () => {
         const mockSource = new MockSTokenSource([
            ['elementName', 'word', ['>', '(']],
            [' ', 'space'],
            ['(', 'peekChar'],
            ['>', 'match', '>'],
         ]);

         parseElementDeclaration(mockSource, declarationStart, getResult);
         mockSource.respondInAsyncTime();

         expect(parseContentModelMock.mock.calls[0][0]).toEqual(mockSource);
         expect(parseContentModelMock.mock.calls[0][1]).toBeInstanceOf(Function);
      });

      it('delivers contentModel and end of list', () => {
         const mockSource = new MockSTokenSource([
            ['elementName', 'word', ['>', '(']],
            [' ', 'space'],
            ['(', 'peekChar'],
            ['>', 'match', '>'],
         ]);

         parseElementDeclaration(mockSource, declarationStart, getResult);
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         // eslint-disable-next-line @typescript-eslint/no-unsafe-call
         expect(result).toEqualRangeless(
            new ElementDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('elementName'),
               nameSpace: toSToken(' '),
               contentSpec: undefined,
               contentSpecSpace: undefined,
               contentModel: dummyCM,
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

         // @ts-expect-error 2329/matchers
         // eslint-disable-next-line @typescript-eslint/no-unsafe-call
         expect(result).toEqualRangeless(
            new ElementDeclarationPToken({
               open: toSToken('<!'),
               name: undefined,
               nameSpace: undefined,
               contentSpec: undefined,
               contentSpecSpace: undefined,
               contentModel: undefined,
               unexpanded: {
                  propName: 'name',
                  tokens: [],
               },
               close: toSToken('>'),
            }),
         );
      });

      it('sets up to let unassigned handle checking for a PE Reference instead of the contentSpec', () => {
         const calls = [
            undefined,
            {
               propName: 'contentSpec',
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

         // @ts-expect-error 2329/matchers
         // eslint-disable-next-line @typescript-eslint/no-unsafe-call
         expect(result).toEqualRangeless(
            new ElementDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('elementName'),
               nameSpace: toSToken(' '),
               contentSpec: undefined,
               contentSpecSpace: undefined,
               contentModel: undefined,
               unexpanded: {
                  propName: 'contentSpec',
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

         // @ts-expect-error 2329/matchers
         // eslint-disable-next-line @typescript-eslint/no-unsafe-call
         expect(result).toEqualRangeless(
            new ElementDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('elementName'),
               nameSpace: toSToken(' '),
               contentSpec: undefined,
               contentSpecSpace: undefined,
               contentModel: dummyCM,
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
            contentSpec: toSToken('ANY'),
            contentSpecSpace: toSToken(' '),
            contentModel: undefined,
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
               propName: 'contentSpec',
               tokens: [],
            },
            close: toSToken('>'),
         });
         const mockSource = new MockSTokenSource([
            [undefined, 'space'],
            ['A', 'peekChar'],
            ['ANY', 'word', ['>']],
            [' ', 'space'],
         ]);

         resumeParseElementDeclaration(mockSource, elementDecl, getResult);
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         // eslint-disable-next-line @typescript-eslint/no-unsafe-call
         expect(result).toEqualRangeless(
            new ElementDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('elementName'),
               nameSpace: toSToken(' '),
               contentSpec: toSToken('ANY'),
               contentSpecSpace: toSToken(' '),
               contentModel: undefined,
               unexpanded: {
                  propName: 'contentSpec',
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
               propName: 'contentSpec',
               tokens: [],
            },
            close: toSToken('>'),
         });
         const mockSource = new MockSTokenSource([
            [undefined, 'space'],
            ['(', 'peekChar'],
         ]);

         resumeParseElementDeclaration(mockSource, elementDecl, getResult);
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         // eslint-disable-next-line @typescript-eslint/no-unsafe-call
         expect(result).toEqualRangeless(
            new ElementDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('elementName'),
               nameSpace: toSToken(' '),
               contentModel: dummyCM,
               unexpanded: {
                  propName: 'contentSpec',
                  tokens: [],
               },
               close: toSToken('>'),
            }),
         );
      });

      it('calls resumeParseContentModel when resuming in mid-spec', () => {
         const elementDecl = new ElementDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('elementName'),
            nameSpace: toSToken(' '),
            contentModel: { delimitedParticles: [] },
            unexpanded: {
               propName: 'midSpec',
               tokens: [],
            },
            close: toSToken('>'),
         });
         const mockSource = new MockSTokenSource([[undefined, 'space']]);
         resumeParseContentModelMock.mockImplementation((source, props, pre, cb) => {
            cb({ delimitedParticles: [], repeat: toSToken('|') });
         });

         resumeParseElementDeclaration(mockSource, elementDecl, getResult);
         mockSource.respondInAsyncTime();

         expect(resumeParseContentModelMock).toHaveBeenCalledWith(
            mockSource,
            { delimitedParticles: [] },
            undefined,
            expect.any(Function),
         );
      });

      it('returns an element declaration with a content model interrupted in the middle', () => {
         const elementDecl = new ElementDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('elementName'),
            nameSpace: toSToken(' '),
            unexpanded: {
               propName: 'midSpec',
               tokens: [],
            },
            close: toSToken('>'),
         });
         const mockSource = new MockSTokenSource([[undefined, 'space']]);
         resumeParseContentModelMock.mockImplementation((source, props, pre, cb) => {
            cb({ delimitedParticles: [], repeat: toSToken('|') });
         });

         resumeParseElementDeclaration(mockSource, elementDecl, getResult);
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         // eslint-disable-next-line @typescript-eslint/no-unsafe-call
         expect(result).toEqualRangeless(
            new ElementDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('elementName'),
               nameSpace: toSToken(' '),
               contentModel: { delimitedParticles: [], repeat: toSToken('|') },
               unexpanded: {
                  propName: 'midSpec',
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
            [undefined, 'space'],
            ['foo', 'word'],
            [' ', 'space'],
            ['A', 'peekChar'],
            ['ANY', 'word', ['>']],
            [' ', 'space'],
         ]);

         resumeParseElementDeclaration(mockSource, elementDecl, getResult);
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         // eslint-disable-next-line @typescript-eslint/no-unsafe-call
         expect(result).toEqualRangeless(
            new ElementDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('foo'),
               nameSpace: toSToken(' '),
               contentSpec: toSToken('ANY'),
               contentSpecSpace: toSToken(' '),
               contentModel: undefined,
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
