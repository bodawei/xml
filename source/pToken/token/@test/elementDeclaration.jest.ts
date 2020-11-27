/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { STokenSource, toSToken } from 'sToken';
import { MockSTokenSource } from 'sToken-test';

import { UnexpandedMarkupDetails } from '../../types';
import * as parseUnexpanded from '../../common/parseUnexpanded';

import { DeclarationStart, NameListPToken } from 'token';
import nameList from '../../../token/contentspec/nameList';

import {
   ElementDeclarationPToken,
   parseElementDeclaration,
   resumeParseElementDeclaration,
} from '../elementDeclaration';

jest.mock('../../../token/contentspec/nameList');

describe('elementDeclaration (unit)', () => {
   let elementDeclaration: ElementDeclarationPToken;
   let dummyNL: NameListPToken;
   let nameListParseMock: jest.MockedFunction<typeof nameList.parse>;

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
      dummyNL = dummyNL;

      nameListParseMock = nameList.parse as jest.MockedFunction<typeof nameList.parse>;
      nameListParseMock.mockImplementation(
         (source: STokenSource, cb: (nameList: NameListPToken | undefined) => void) => {
            cb(dummyNL);
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
            children: dummyNL,
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
               children: dummyNL,
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
               children: dummyNL,
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
               children: dummyNL,
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

         expect(result).toEqualRangeless(
            new ElementDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('elementName'),
               nameSpace: toSToken(' '),
               contentSpec: toSToken('ANY'),
               contentSpecSpace: toSToken(' '),
               children: undefined,
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

         parseElementDeclaration(mockSource, declarationStart, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new ElementDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('elementName'),
               nameSpace: toSToken(' '),
               contentSpec: undefined,
               contentSpecSpace: undefined,
               children: undefined,
               unexpanded: undefined,
               close: undefined,
            }),
         );
      });

      it('hands off parsing of the children to nameList', () => {
         const mockSource = new MockSTokenSource([
            ['elementName', 'word', ['>', '(']],
            [' ', 'space'],
            ['(', 'peekChar'],
            ['>', 'match', '>'],
         ]);

         parseElementDeclaration(mockSource, declarationStart, getResult);
         mockSource.respondInAsyncTime();

         expect(nameListParseMock.mock.calls[0][0]).toEqual(mockSource);
         expect(nameListParseMock.mock.calls[0][1]).toBeInstanceOf(Function);
      });

      it('delivers children and end of list', () => {
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
               contentSpec: undefined,
               contentSpecSpace: undefined,
               children: dummyNL,
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
               contentSpec: undefined,
               contentSpecSpace: undefined,
               children: undefined,
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

         expect(result).toEqualRangeless(
            new ElementDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('elementName'),
               nameSpace: toSToken(' '),
               contentSpec: undefined,
               contentSpecSpace: undefined,
               children: undefined,
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

         expect(result).toEqualRangeless(
            new ElementDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('elementName'),
               nameSpace: toSToken(' '),
               contentSpec: undefined,
               contentSpecSpace: undefined,
               children: dummyNL,
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

      it('returns the original token if there are no unexpanded values', () => {
         const elementDecl = new ElementDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('elementName'),
            nameSpace: toSToken(' '),
            contentSpec: toSToken('ANY'),
            contentSpecSpace: toSToken(' '),
            children: undefined,
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
               contentSpec: toSToken('ANY'),
               contentSpecSpace: toSToken(' '),
               children: undefined,
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
         const mockSource = new MockSTokenSource([['(', 'peekChar']]);

         resumeParseElementDeclaration(mockSource, elementDecl, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new ElementDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('elementName'),
               nameSpace: toSToken(' '),
               children: dummyNL,
               unexpanded: {
                  propName: 'contentSpec',
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
               contentSpec: toSToken('ANY'),
               contentSpecSpace: toSToken(' '),
               children: undefined,
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
