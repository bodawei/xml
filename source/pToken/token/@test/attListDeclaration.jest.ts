/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { UnexpandedMarkupDetails, TextPToken } from 'pToken';
import { STokenSource, toSToken } from 'sToken';
import { MockSTokenSource } from 'sToken-test';

import {
   AttListDeclarationPToken,
   parseAttListDeclaration,
   resumeParseAttListDeclaration,
} from '../attListDeclaration';
import { parseUnexpanded } from '../../common/parseUnexpanded';

import literal from '../../../token/common/literal';
import { parseWordList } from '../../../token/common/wordList';
import { WordListPToken, WordListType } from '../../../token/common/wordList';

jest.mock('../../../token/common/literal');
jest.mock('../../../token/common/wordList');
jest.mock('../../common/parseUnexpanded');

interface LiteralOptions {
   pToken: {
      value: Array<any>;
   };
}

describe('AttListDeclaration (unit)', () => {
   let aldPToken: AttListDeclarationPToken;
   let actual: AttListDeclarationPToken | undefined;
   let parseCb: (result: AttListDeclarationPToken) => void;
   let parseUnexpandedMock: jest.MockedFunction<typeof parseUnexpanded>;

   beforeEach(() => {
      parseUnexpandedMock = parseUnexpanded as jest.MockedFunction<typeof parseUnexpanded>;
      parseUnexpandedMock.mockImplementation((source, name, cb: (value: undefined) => void) => {
         cb(undefined);
      });

      (WordListPToken as jest.Mock).mockReturnValue({ type: 'WordListPToken' });

      parseCb = (result: AttListDeclarationPToken) => {
         actual = result;
      };

      aldPToken = new AttListDeclarationPToken({
         open: toSToken('<!'),
         declType: toSToken('ATTLIST'),
         elementName: toSToken('elementName'),
         elementNameSpace: toSToken(' '),
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('CDATA'),
               typeSpace: toSToken(' '),
               enumeration: undefined,
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               openQuote: undefined,
               value: [],
               closeQuote: undefined,
               valueSpace: undefined,
            },
         ],
         close: toSToken('>'),
      });
   });

   describe('construction', () => {
      it('sets attDefs to an empty array when other has an attDefs property set to undefiend', () => {
         const attDefPToken = new AttListDeclarationPToken(aldPToken, { attDefs: undefined });

         expect(attDefPToken.attDefs).toEqual([]);
      });
   });

   describe('parseAttListDeclaration()', () => {
      let callback: jest.MockedFunction<(result: AttListDeclarationPToken) => void>;

      beforeEach(() => {
         callback = jest.fn();

         (literal.parse as jest.Mock).mockImplementation((_1: any, _2: any, done: () => void) =>
            done(),
         );
      });

      it('does a parse of a basic attribute list declaration', () => {
         const mockSource = new MockSTokenSource([
            ['elementName', 'word', ['>', '%']],
            [' ', 'space'],
            [undefined, 'word', ['>', '%']],
            ['>', 'match', '>'],
         ]);

         parseAttListDeclaration(
            mockSource,
            { open: toSToken('<!'), declType: toSToken('ATTLIST') },
            parseCb,
         );
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         // eslint-disable-next-line @typescript-eslint/no-unsafe-call
         expect(actual).toEqualRangeless(
            new AttListDeclarationPToken(aldPToken, {
               attDefs: [],
            }),
         );
      });

      it('returns nothing if at EOF. That is: <!ATTLIST', () => {
         const mockSource = new MockSTokenSource([
            [undefined, 'word', ['>', '%']],
            [undefined, 'space'],
            [undefined, 'word'],
            [undefined, 'match', '>'],
         ]);

         parseAttListDeclaration(mockSource, { open: toSToken('<!') }, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith(
            new AttListDeclarationPToken({
               open: toSToken('<!'),
               elementName: undefined,
               elementNameSpace: undefined,
               close: undefined,
            }),
         );
      });

      it('parses an attribute list with a single attribute', () => {
         const mockSource = new MockSTokenSource([
            ['elementName', 'word', ['>', '%']],
            [' ', 'space'],
            ['att1', 'word', ['>', '%']],
            [' ', 'space'],
            ['CDATA', 'word', ['>', '%', '(', '#', '"', "'"]],
            [' ', 'space'],
            ['#', 'peekChar'],
            ['#REQUIRED', 'word', ['>', '%', '"', "'"]],
            [' ', 'space'],
            [undefined, 'word', ['>', '%']],
            ['>', 'match', '>'],
         ]);

         parseAttListDeclaration(
            mockSource,
            { open: toSToken('<!'), declType: toSToken('ATTLIST') },
            callback,
         );
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         // eslint-disable-next-line @typescript-eslint/no-unsafe-call
         expect(callback).toEqualRangeless(aldPToken);
      });

      it('skips parsing a default type if there is no # character', () => {
         const mockSource = new MockSTokenSource([
            ['elementName', 'word', ['>', '%']],
            [' ', 'space'],
            ['att1', 'word', ['>', '%']],
            [' ', 'space'],
            ['CDATA', 'word', ['>', '%', '(', '#', '"', "'"]],
            [' ', 'space'],
            ['a', 'peekChar'],
            [undefined, 'space'], // value space
            ['att2', 'word', ['>', '%']],
            [' ', 'space'],
            ['ID', 'word', ['>', '%', '(', '#', '"', "'"]],
            [' ', 'space'],
            ['>', 'peekChar'],
            [undefined, 'space'], // value space
            [undefined, 'word', ['>', '%']],
            ['>', 'match', '>'],
         ]);

         parseAttListDeclaration(
            mockSource,
            { open: toSToken('<!'), declType: toSToken('ATTLIST') },
            parseCb,
         );
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         // eslint-disable-next-line @typescript-eslint/no-unsafe-call
         expect(actual).toEqualRangeless(
            new AttListDeclarationPToken(aldPToken, {
               attDefs: [
                  {
                     name: toSToken('att1'),
                     nameSpace: toSToken(' '),
                     type: toSToken('CDATA'),
                     typeSpace: toSToken(' '),
                     value: [],
                  },
                  {
                     name: toSToken('att2'),
                     nameSpace: toSToken(' '),
                     type: toSToken('ID'),
                     typeSpace: toSToken(' '),
                     value: [],
                  },
               ],
            }),
         );
      });

      it('parses an attribute list with a multiple named attributes', () => {
         const mockSource = new MockSTokenSource([
            ['elementName', 'word', ['>', '%']],
            [' ', 'space'],
            ['att1', 'word', ['>', '%']],
            [' ', 'space'],
            ['CDATA', 'word', ['>', '%', '(', '#', '"', "'"]],
            [' ', 'space'],
            ['#', 'peekChar'],
            ['#REQUIRED', 'word', ['>', '%', '"', "'"]],
            ['\t', 'space'],
            ['att2', 'word', ['>', '%']],
            [' ', 'space'],
            ['ID', 'word', ['>', '%', '(', '#', '"', "'"]],
            [' ', 'space'],
            ['a', 'peekChar'],
            [undefined, 'space'],
            ['att3', 'word', ['>', '%']],
            [' ', 'space'],
            ['IDREF', 'word', ['>', '%', '(', '#', '"', "'"]],
            [' ', 'space'],
            ['#', 'peekChar'],
            ['#IMPLICIT', 'word', ['>', '%', '"', "'"]],
            [' ', 'space'],
            [undefined, 'word', ['>', '%']],
            ['>', 'match', '>'],
         ]);

         parseAttListDeclaration(
            mockSource,
            { open: toSToken('<!'), declType: toSToken('ATTLIST') },
            parseCb,
         );
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         // eslint-disable-next-line @typescript-eslint/no-unsafe-call
         expect(actual).toEqualRangeless(
            new AttListDeclarationPToken(aldPToken, {
               attDefs: [
                  {
                     name: toSToken('att1'),
                     nameSpace: toSToken(' '),
                     type: toSToken('CDATA'),
                     typeSpace: toSToken(' '),
                     defaultType: toSToken('#REQUIRED'),
                     defaultTypeSpace: toSToken('\t'),
                     value: [],
                  },
                  {
                     name: toSToken('att2'),
                     nameSpace: toSToken(' '),
                     type: toSToken('ID'),
                     typeSpace: toSToken(' '),
                     value: [],
                  },
                  {
                     name: toSToken('att3'),
                     nameSpace: toSToken(' '),
                     type: toSToken('IDREF'),
                     typeSpace: toSToken(' '),
                     defaultType: toSToken('#IMPLICIT'),
                     defaultTypeSpace: toSToken(' '),
                     value: [],
                  },
               ],
            }),
         );
      });

      it('parses an attribute list with a literal even with #REQUIRED', () => {
         (literal.parse as jest.Mock).mockImplementation(
            (_1: any, options: LiteralOptions, done: () => void) => {
               options.pToken.value = [new TextPToken({ text: toSToken('dummyValue') })];
               done?.();
            },
         );
         const mockSource = new MockSTokenSource([
            ['elementName', 'word', ['>', '%']],
            [' ', 'space'],
            ['att1', 'word', ['>', '%']],
            [' ', 'space'],
            ['CDATA', 'word', ['>', '%', '(', '#', '"', "'"]],
            [' ', 'space'],
            ['#', 'peekChar'],
            ['#REQUIRED', 'word', ['>', '%', '"', "'"]],
            [' ', 'space'],
            [undefined, 'word', ['>', '%']],
            ['>', 'match', '>'],
         ]);

         parseAttListDeclaration(
            mockSource,
            { open: toSToken('<!'), declType: toSToken('ATTLIST') },
            parseCb,
         );
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         // eslint-disable-next-line @typescript-eslint/no-unsafe-call
         expect(actual).toEqualRangeless(aldPToken);
      });

      it('parses an attribute list with a literal with no defaultType at all', () => {
         (literal.parse as jest.Mock).mockImplementation(
            (_1: any, options: LiteralOptions, done: () => void) => {
               options.pToken.value = [new TextPToken({ text: toSToken('dummyValue') })];
               done?.();
            },
         );
         const mockSource = new MockSTokenSource([
            ['elementName', 'word', ['>', '%']],
            [' ', 'space'],
            ['att1', 'word', ['>', '%']],
            [' ', 'space'],
            ['CDATA', 'word', ['>', '%', '(', '#', '"', "'"]],
            [' ', 'space'],
            ['"', 'peekChar'],
            [undefined, 'space'],
            [undefined, 'word', ['>', '%']],
            ['>', 'match', '>'],
         ]);

         parseAttListDeclaration(
            mockSource,
            { open: toSToken('<!'), declType: toSToken('ATTLIST') },
            parseCb,
         );
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         // eslint-disable-next-line @typescript-eslint/no-unsafe-call
         expect(actual).toEqualRangeless(
            new AttListDeclarationPToken(aldPToken, {
               attDefs: [
                  {
                     name: toSToken('att1'),
                     nameSpace: toSToken(' '),
                     type: toSToken('CDATA'),
                     typeSpace: toSToken(' '),
                     value: [new TextPToken({ text: toSToken('dummyValue') })],
                  },
               ],
            }),
         );
      });

      it('parses multiple attributes definitions with default values with space between them', () => {
         const DUMMY_VALUE = [new TextPToken({ text: toSToken('dummyValue') })];
         (literal.parse as jest.Mock).mockImplementation(
            (_1: any, options: LiteralOptions, done: () => void) => {
               options.pToken.value = DUMMY_VALUE;
               done?.();
            },
         );
         const mockSource = new MockSTokenSource([
            ['elementName', 'word', ['>', '%']],
            [' ', 'space'],
            ['att1', 'word', ['>', '%']],
            [' ', 'space'],
            ['CDATA', 'word', ['>', '%', '(', '#', '"', "'"]],
            [' ', 'space'],
            ['"', 'peekChar'],
            ['   ', 'space'],
            ['att2', 'word', ['>', '%']],
            [' ', 'space'],
            ['CDATA', 'word', ['>', '%', '(', '#', '"', "'"]],
            [' ', 'space'],
            ['"', 'peekChar'],
            [undefined, 'space'],
            [undefined, 'word', ['>', '%']],
            ['>', 'match', '>'],
         ]);

         parseAttListDeclaration(
            mockSource,
            { open: toSToken('<!'), declType: toSToken('ATTLIST') },
            parseCb,
         );
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         // eslint-disable-next-line @typescript-eslint/no-unsafe-call
         expect(actual).toEqualRangeless(
            new AttListDeclarationPToken(aldPToken, {
               attDefs: [
                  {
                     name: toSToken('att1'),
                     nameSpace: toSToken(' '),
                     type: toSToken('CDATA'),
                     typeSpace: toSToken(' '),
                     value: DUMMY_VALUE,
                     valueSpace: toSToken('   '),
                  },
                  {
                     name: toSToken('att2'),
                     nameSpace: toSToken(' '),
                     type: toSToken('CDATA'),
                     typeSpace: toSToken(' '),
                     value: DUMMY_VALUE,
                  },
               ],
            }),
         );
      });

      it('parses multiple attributes definitions with #FIXED values', () => {
         const DUMMY_VALUE = [new TextPToken({ text: toSToken('dummyValue') })];
         (literal.parse as jest.Mock).mockImplementation(
            (_1: any, options: LiteralOptions, done: () => void) => {
               options.pToken.value = DUMMY_VALUE;
               done?.();
            },
         );
         const mockSource = new MockSTokenSource([
            ['elementName', 'word', ['>', '%']],
            [' ', 'space'],
            ['att1', 'word', ['>', '%']],
            [' ', 'space'],
            ['CDATA', 'word', ['>', '%', '(', '#', '"', "'"]],
            [' ', 'space'],
            ['#', 'peekChar'],
            ['#fixed', 'word'],
            [' ', 'space'],
            ['   ', 'space'],
            ['att2', 'word', ['>', '%']],
            [' ', 'space'],
            ['CDATA', 'word', ['>', '%', '(', '#', '"', "'"]],
            [' ', 'space'],
            ['"', 'peekChar'],
            [undefined, 'space'],
            [undefined, 'word', ['>', '%']],
            ['>', 'match', '>'],
         ]);

         parseAttListDeclaration(
            mockSource,
            { open: toSToken('<!'), declType: toSToken('ATTLIST') },
            parseCb,
         );
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         // eslint-disable-next-line @typescript-eslint/no-unsafe-call
         expect(actual).toEqualRangeless(
            new AttListDeclarationPToken(aldPToken, {
               attDefs: [
                  {
                     name: toSToken('att1'),
                     nameSpace: toSToken(' '),
                     type: toSToken('CDATA'),
                     typeSpace: toSToken(' '),
                     defaultType: toSToken('#fixed'),
                     defaultTypeSpace: toSToken(' '),
                     value: DUMMY_VALUE,
                     valueSpace: toSToken('   '),
                  },
                  {
                     name: toSToken('att2'),
                     nameSpace: toSToken(' '),
                     type: toSToken('CDATA'),
                     typeSpace: toSToken(' '),
                     value: DUMMY_VALUE,
                  },
               ],
            }),
         );
      });

      it('parses a wordList for a NOTATION type', () => {
         const mockSource = new MockSTokenSource([
            ['elementName', 'word', ['>', '%']],
            [' ', 'space'],
            ['att1', 'word', ['>', '%']],
            [' ', 'space'],
            ['NOTATION', 'word', ['>', '%', '(', '#', '"', "'"]],
            [' ', 'space'],
            // wordList parsing
            ['"', 'peekChar'],
            [undefined, 'space'],
            [undefined, 'word', ['>', '%']],
            ['>', 'match', '>'],
         ]);
         (parseWordList as jest.Mock).mockImplementation(
            (_1: any, _2: any, done: (pToken?: any) => void) => {
               done(new WordListPToken(WordListType.NOTATION, { open: toSToken('(') }));
            },
         );

         parseAttListDeclaration(
            mockSource,
            { open: toSToken('<!'), declType: toSToken('ATTLIST') },
            parseCb,
         );
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         // eslint-disable-next-line @typescript-eslint/no-unsafe-call
         expect(actual).toEqualRangeless(
            new AttListDeclarationPToken(aldPToken, {
               attDefs: [
                  {
                     name: toSToken('att1'),
                     nameSpace: toSToken(' '),
                     type: toSToken('NOTATION'),
                     typeSpace: toSToken(' '),
                     enumeration: new WordListPToken(WordListType.NOTATION, {
                        open: toSToken('('),
                     }),
                     value: [],
                  },
               ],
            }),
         );
      });

      it('calls parseWordList() with the expected arguments when parsing a NOTATION', () => {
         const mockSource = new MockSTokenSource([
            ['elementName', 'word', ['>', '%']],
            [' ', 'space'],
            ['att1', 'word', ['>', '%']],
            [' ', 'space'],
            ['NOTATION', 'word', ['>', '%', '(', '#', '"', "'"]],
            [' ', 'space'],
            // wordList parsing
            ['"', 'peekChar'],
            [undefined, 'space'],
            [undefined, 'word', ['>', '%']],
            [undefined, 'match', '>'],
         ]);
         (parseWordList as jest.Mock).mockImplementation(
            (_1: any, _2: any, done: (pToken?: any) => void) => {
               done?.();
            },
         );

         parseAttListDeclaration(
            mockSource,
            { open: toSToken('<!'), declType: toSToken('ATTLIST') },
            callback,
         );
         mockSource.respondInAsyncTime();

         expect(parseWordList).toHaveBeenCalledWith(
            mockSource,
            WordListType.NOTATION,
            expect.any(Function),
         );
      });

      it('parses the word NOTATION but with no subsequent enumeration', () => {
         const mockSource = new MockSTokenSource([
            ['elementName', 'word', ['>', '%']],
            [' ', 'space'],
            ['att1', 'word', ['>', '%']],
            [' ', 'space'],
            ['NOTATION', 'word', ['>', '%', '(', '#', '"', "'"]],
            [' ', 'space'],
            // wordList parsing
            ['"', 'peekChar'],
            [undefined, 'space'],
            [undefined, 'word', ['>', '%']],
            [undefined, 'match', '>'],
         ]);
         (parseWordList as jest.Mock).mockImplementation(
            (_1: any, _2: any, done: (pToken?: any) => void) => {
               done?.();
            },
         );

         parseAttListDeclaration(
            mockSource,
            { open: toSToken('<!'), declType: toSToken('ATTLIST') },
            parseCb,
         );
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         // eslint-disable-next-line @typescript-eslint/no-unsafe-call
         expect(actual).toEqualRangeless(
            new AttListDeclarationPToken(aldPToken, {
               attDefs: [
                  {
                     name: toSToken('att1'),
                     nameSpace: toSToken(' '),
                     type: toSToken('NOTATION'),
                     typeSpace: toSToken(' '),
                     value: [],
                  },
               ],
               close: undefined,
            }),
         );
      });

      it('parses a wordList for an ENUMERATION type', () => {
         const mockSource = new MockSTokenSource([
            ['elementName', 'word', ['>', '%']],
            [' ', 'space'],
            ['att1', 'word', ['>', '%']],
            [' ', 'space'],
            [undefined, 'word', ['>', '%', '(', '#', '"', "'"]],
            ['(', 'peekChar'],
            // wordList parsing
            ['"', 'peekChar'],
            [undefined, 'space'],
            [undefined, 'word', ['>', '%']],
            [undefined, 'match', '>'],
         ]);
         (parseWordList as jest.Mock).mockImplementation(
            (_1: any, _2: any, done: (pToken?: any) => void) => {
               done(new WordListPToken(WordListType.ENUMERATION, { open: toSToken('(') }));
            },
         );

         parseAttListDeclaration(
            mockSource,
            { open: toSToken('<!'), declType: toSToken('ATTLIST') },
            parseCb,
         );
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         // eslint-disable-next-line @typescript-eslint/no-unsafe-call
         expect(actual).toEqualRangeless(
            new AttListDeclarationPToken(aldPToken, {
               attDefs: [
                  {
                     name: toSToken('att1'),
                     nameSpace: toSToken(' '),
                     enumeration: new WordListPToken(WordListType.ENUMERATION, {
                        open: toSToken('('),
                     }),
                     value: [],
                  },
               ],
               close: undefined,
            }),
         );
      });

      it('calls wordList.parse() with the expected arguments when parsing an ENUMERATION', () => {
         const mockSource = new MockSTokenSource([
            ['elementName', 'word', ['>', '%']],
            [' ', 'space'],
            ['att1', 'word', ['>', '%']],
            [' ', 'space'],
            [undefined, 'word', ['>', '%', '(', '#', '"', "'"]],
            ['(', 'peekChar'],
            ['"', 'peekChar'],
            [undefined, 'space'],
            [undefined, 'word', ['>', '%']],
            [undefined, 'match', '>'],
         ]);
         (parseWordList as jest.Mock).mockImplementation(
            (_1: any, _2: any, done: (pToken?: any) => void) => {
               done?.();
            },
         );

         parseAttListDeclaration(
            mockSource,
            { open: toSToken('<!'), declType: toSToken('ATTLIST') },
            callback,
         );
         mockSource.respondInAsyncTime();

         expect(parseWordList).toHaveBeenCalledWith(
            mockSource,
            WordListType.ENUMERATION,
            expect.any(Function),
         );
      });

      it('parses a malformed type if there is no type', () => {
         const mockSource = new MockSTokenSource([
            ['elementName', 'word', ['>', '%']],
            [' ', 'space'],
            ['att1', 'word', ['>', '%']],
            [' ', 'space'],
            [undefined, 'word', ['>', '%', '(', '#', '"', "'"]],
            ['"', 'peekChar'],
            ['"', 'peekChar'],
            [undefined, 'space'],
            [undefined, 'word', ['>', '%']],
            [undefined, 'match', '>'],
         ]);

         parseAttListDeclaration(
            mockSource,
            { open: toSToken('<!'), declType: toSToken('ATTLIST') },
            parseCb,
         );
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         // eslint-disable-next-line @typescript-eslint/no-unsafe-call
         expect(actual).toEqualRangeless(
            new AttListDeclarationPToken(aldPToken, {
               attDefs: [
                  {
                     name: toSToken('att1'),
                     nameSpace: toSToken(' '),
                     value: [],
                  },
               ],
               close: undefined,
            }),
         );
      });

      describe('parameter entity reference', () => {
         it('returns ann unexpanded value when finding a PE Ref at the start', () => {
            parseUnexpandedMock.mockImplementation(
               (_1: any, propName: string, done: (un: UnexpandedMarkupDetails) => void) => {
                  done({ propName, tokens: [] });
               },
            );
            const mockSource = new MockSTokenSource(['>']);

            parseAttListDeclaration(mockSource, { open: toSToken('<!') }, parseCb);
            mockSource.respondInAsyncTime();

            // @ts-expect-error 2329/matchers
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            expect(actual).toEqualRangeless(
               new AttListDeclarationPToken({
                  open: toSToken('<!'),
                  unexpanded: {
                     propName: 'elementName',
                     tokens: [],
                  },
                  close: toSToken('>'),
               }),
            );
         });

         it('returns an unexpanded value when finding a PE Ref instead of an attr name', () => {
            const calls = [undefined, true];
            parseUnexpandedMock.mockImplementation(
               (
                  source: STokenSource,
                  propName: string,
                  done: (un: UnexpandedMarkupDetails | undefined) => void,
               ) => {
                  done(calls.shift() ? { propName, tokens: [] } : undefined);
               },
            );
            const mockSource = new MockSTokenSource([
               ['elName', 'word', ['>', '%']],
               [' ', 'space'],
               ['>', 'match', '>'],
            ]);

            parseAttListDeclaration(mockSource, { open: toSToken('<!') }, parseCb);
            mockSource.respondInAsyncTime();

            // @ts-expect-error 2329/matchers
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            expect(actual).toEqualRangeless(
               new AttListDeclarationPToken({
                  open: toSToken('<!'),
                  elementName: toSToken('elName'),
                  elementNameSpace: toSToken(' '),
                  unexpanded: {
                     propName: 'name',
                     tokens: [],
                  },
                  close: toSToken('>'),
               }),
            );
         });

         it('returns an unexpanded value when finding a PE Ref instead of an attr type', () => {
            const calls = [false, false, true];
            parseUnexpandedMock.mockImplementation(
               (
                  source: STokenSource,
                  propName: string,
                  done: (un: UnexpandedMarkupDetails | undefined) => void,
               ) => {
                  done(calls.shift() ? { propName, tokens: [] } : undefined);
               },
            );
            const mockSource = new MockSTokenSource([
               ['elName', 'word', ['>', '%']],
               [' ', 'space'],
               ['attName', 'word', ['>', '%']],
               [' ', 'space'],
               ['>', 'match', '>'],
            ]);

            parseAttListDeclaration(mockSource, { open: toSToken('<!') }, parseCb);
            mockSource.respondInAsyncTime();

            // @ts-expect-error 2329/matchers
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            expect(actual).toEqualRangeless(
               new AttListDeclarationPToken({
                  open: toSToken('<!'),
                  elementName: toSToken('elName'),
                  elementNameSpace: toSToken(' '),
                  attDefs: [
                     {
                        name: toSToken('attName'),
                        nameSpace: toSToken(' '),
                        value: [],
                     },
                  ],
                  unexpanded: {
                     propName: 'type',
                     tokens: [],
                  },
                  close: toSToken('>'),
               }),
            );
         });

         it('returns an unexpanded value when finding a PE Ref instead of a NOTATION value', () => {
            const calls = [false, false, false, true];
            parseUnexpandedMock.mockImplementation((source, propName, done) => {
               done(calls.shift() ? { propName, tokens: [] } : undefined);
            });
            const mockSource = new MockSTokenSource([
               ['elName', 'word', ['>', '%']],
               [' ', 'space'],
               ['attName', 'word', ['>', '%']],
               [' ', 'space'],
               ['NOTATION', 'word', ['>', '%', '(', '#', '"', "'"]],
               ['\t', 'space'],
               ['>', 'match', '>'],
            ]);

            parseAttListDeclaration(mockSource, { open: toSToken('<!') }, parseCb);
            mockSource.respondInAsyncTime();

            // @ts-expect-error 2329/matchers
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            expect(actual).toEqualRangeless(
               new AttListDeclarationPToken({
                  open: toSToken('<!'),
                  elementName: toSToken('elName'),
                  elementNameSpace: toSToken(' '),
                  attDefs: [
                     {
                        name: toSToken('attName'),
                        nameSpace: toSToken(' '),
                        type: toSToken('NOTATION'),
                        typeSpace: toSToken('\t'),
                        value: [],
                     },
                  ],
                  unexpanded: {
                     propName: 'notation',
                     tokens: [],
                  },
                  close: toSToken('>'),
               }),
            );
         });

         it('returns an unexpanded value when finding a PE Ref instead of an default type', () => {
            const calls = [false, false, false, true];
            parseUnexpandedMock.mockImplementation(
               (
                  source: STokenSource,
                  propName: string,
                  done: (un: UnexpandedMarkupDetails | undefined) => void,
               ) => {
                  done(calls.shift() ? { propName, tokens: [] } : undefined);
               },
            );
            const mockSource = new MockSTokenSource([
               ['elName', 'word', ['>', '%']],
               [' ', 'space'],
               ['attName', 'word', ['>', '%']],
               [' ', 'space'],
               ['CDATA', 'word', ['>', '%', '(', '#', '"', "'"]],
               [' ', 'space'],
               ['>', 'match', '>'],
            ]);

            parseAttListDeclaration(mockSource, { open: toSToken('<!') }, parseCb);
            mockSource.respondInAsyncTime();

            // @ts-expect-error 2329/matchers
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            expect(actual).toEqualRangeless(
               new AttListDeclarationPToken({
                  open: toSToken('<!'),
                  elementName: toSToken('elName'),
                  elementNameSpace: toSToken(' '),
                  attDefs: [
                     {
                        name: toSToken('attName'),
                        nameSpace: toSToken(' '),
                        type: toSToken('CDATA'),
                        typeSpace: toSToken(' '),
                        value: [],
                     },
                  ],
                  unexpanded: {
                     propName: 'defaultType',
                     tokens: [],
                  },
                  close: toSToken('>'),
               }),
            );
         });

         it('returns an unexpanded value when finding a PE Ref instead of an attValue', () => {
            const calls = [false, false, false, false, true];
            parseUnexpandedMock.mockImplementation(
               (
                  source: STokenSource,
                  propName: string,
                  done: (un: UnexpandedMarkupDetails | undefined) => void,
               ) => {
                  done(calls.shift() ? { propName, tokens: [] } : undefined);
               },
            );
            const mockSource = new MockSTokenSource([
               ['elName', 'word', ['>', '%']],
               [' ', 'space'],
               ['attName', 'word', ['>', '%']],
               [' ', 'space'],
               ['CDATA', 'word', ['>', '%', '(', '#', '"', "'"]],
               [' ', 'space'],
               ['#', 'peekChar'],
               ['#FIXED', 'word', ['>', '%', '"', "'"]],
               [' ', 'space'],
               ['>', 'match', '>'],
            ]);

            parseAttListDeclaration(mockSource, { open: toSToken('<!') }, parseCb);
            mockSource.respondInAsyncTime();

            // @ts-expect-error 2329/matchers
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            expect(actual).toEqualRangeless(
               new AttListDeclarationPToken({
                  open: toSToken('<!'),
                  elementName: toSToken('elName'),
                  elementNameSpace: toSToken(' '),
                  attDefs: [
                     {
                        name: toSToken('attName'),
                        nameSpace: toSToken(' '),
                        type: toSToken('CDATA'),
                        typeSpace: toSToken(' '),
                        defaultType: toSToken('#FIXED'),
                        defaultTypeSpace: toSToken(' '),
                        value: [],
                     },
                  ],
                  unexpanded: {
                     propName: 'value',
                     tokens: [],
                  },
                  close: toSToken('>'),
               }),
            );
         });
      });
   });

   describe('resumeParseAttListDeclaration()', () => {
      type TestType = [string | undefined, string, string];

      const inputs: Array<TestType> = [
         [undefined, ' ', ''],
         ['\t', ' \t', 'with leading space'],
      ];

      beforeEach(() => {
         (literal.parse as jest.Mock).mockImplementation((_1: any, _2: any, done: () => void) =>
            done(),
         );
      });

      it('returns original token unchanged if there is no unexpanded', (done) => {
         const mockSource = new MockSTokenSource([]);
         const pToken = new AttListDeclarationPToken({
            open: toSToken('<!'),
            declTypeSpace: toSToken(' '),
            attDefs: [],
         });

         resumeParseAttListDeclaration(mockSource, pToken, (result) => {
            expect(result).toBe(pToken);
            done?.();
         });
         mockSource.respondInAsyncTime();
      });

      inputs.forEach(([sourceStr, doneStr, msg]: TestType) => {
         it(`adds an elementName an attribue ${msg}`, (done) => {
            const mockSource = new MockSTokenSource([
               [sourceStr, 'space'],
               ['elName', 'word', ['>', '%']],
               [' ', 'space'],
               ['first', 'word', ['>', '%']],
               ['\n', 'space'],
               ['CDATA', 'word', ['>', '%', '(', '#', '"', "'"]],
               ['\t', 'space'],
               ['#', 'peekChar'],
               ['#REQUIRED', 'word', ['>', '%', '"', "'"]],
               [' ', 'space'],
               // jump directly to the name
               [undefined, 'word'],
               [undefined, 'all'],
            ]);
            const pToken = new AttListDeclarationPToken({
               open: toSToken('<!'),
               declTypeSpace: toSToken(' '),
               attDefs: [],
               unexpanded: {
                  propName: 'elementName',
                  tokens: [],
               },
            });

            resumeParseAttListDeclaration(mockSource, pToken, (result) => {
               // @ts-expect-error 2329/matchers
               // eslint-disable-next-line @typescript-eslint/no-unsafe-call
               expect(result).toEqualRangeless(
                  new AttListDeclarationPToken(pToken, {
                     declTypeSpace: toSToken(doneStr),
                     elementName: toSToken('elName'),
                     elementNameSpace: toSToken(' '),
                     attDefs: [
                        {
                           name: toSToken('first'),
                           nameSpace: toSToken('\n'),
                           type: toSToken('CDATA'),
                           typeSpace: toSToken('\t'),
                           defaultType: toSToken('#REQUIRED'),
                           defaultTypeSpace: toSToken(' '),
                           value: [],
                        },
                     ],
                  }),
               );
               done?.();
            });
            mockSource.respondInAsyncTime();
         });
      });

      it('captures extra after processing from elementName on', (done) => {
         const mockSource = new MockSTokenSource([
            [undefined, 'space'],
            ['elName', 'word', ['>', '%']],
            [' ', 'space'],
            ['first', 'word', ['>', '%']],
            ['\n', 'space'],
            ['CDATA', 'word', ['>', '%', '(', '#', '"', "'"]],
            ['\t', 'space'],
            ['#', 'peekChar'],
            ['#REQUIRED', 'word', ['>', '%', '"', "'"]],
            [' ', 'space'],
            // jump directly to the name
            [undefined, 'word'],
            ['goodies', 'all'],
         ]);
         const pToken = new AttListDeclarationPToken({
            open: toSToken('<!'),
            declTypeSpace: toSToken(' '),
            attDefs: [],
            unexpanded: {
               propName: 'elementName',
               tokens: [],
            },
         });

         resumeParseAttListDeclaration(mockSource, pToken, (result) => {
            // @ts-expect-error 2329/matchers
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            expect(result).toEqualRangeless(
               new AttListDeclarationPToken(pToken, {
                  declTypeSpace: toSToken(' '),
                  elementName: toSToken('elName'),
                  elementNameSpace: toSToken(' '),
                  attDefs: [
                     {
                        name: toSToken('first'),
                        nameSpace: toSToken('\n'),
                        type: toSToken('CDATA'),
                        typeSpace: toSToken('\t'),
                        defaultType: toSToken('#REQUIRED'),
                        defaultTypeSpace: toSToken(' '),
                        value: [],
                     },
                  ],
                  extra: toSToken('goodies'),
               }),
            );
            done?.();
         });
         mockSource.respondInAsyncTime();
      });

      inputs.forEach(([sourceStr, destStr, msg]: TestType) => {
         it(`adds a name and following values ${msg}`, (done) => {
            const mockSource = new MockSTokenSource([
               [sourceStr, 'space'],
               ['first', 'word', ['>', '%']],
               ['\n', 'space'],
               ['CDATA', 'word', ['>', '%', '(', '#', '"', "'"]],
               ['\t', 'space'],
               ['#', 'peekChar'],
               ['#REQUIRED', 'word', ['>', '%', '"', "'"]],
               [' ', 'space'],
               // jump directly to the name
               [undefined, 'word'],
               [undefined, 'all'],
            ]);
            const pToken = new AttListDeclarationPToken({
               open: toSToken('<!'),
               elementNameSpace: toSToken(' '),
               attDefs: [],
               unexpanded: {
                  propName: 'name',
                  tokens: [],
               },
            });

            resumeParseAttListDeclaration(mockSource, pToken, (result) => {
               // @ts-expect-error 2329/matchers
               // eslint-disable-next-line @typescript-eslint/no-unsafe-call
               expect(result).toEqualRangeless(
                  new AttListDeclarationPToken(pToken, {
                     elementNameSpace: toSToken(destStr),
                     attDefs: [
                        {
                           name: toSToken('first'),
                           nameSpace: toSToken('\n'),
                           type: toSToken('CDATA'),
                           typeSpace: toSToken('\t'),
                           defaultType: toSToken('#REQUIRED'),
                           defaultTypeSpace: toSToken(' '),
                           value: [],
                        },
                     ],
                  }),
               );
               done?.();
            });
            mockSource.respondInAsyncTime();
         });
      });

      it('adds extra after processing for a name', (done) => {
         const mockSource = new MockSTokenSource([
            [undefined, 'space'],
            ['first', 'word', ['>', '%']],
            ['\n', 'space'],
            ['CDATA', 'word', ['>', '%', '(', '#', '"', "'"]],
            ['\t', 'space'],
            ['#', 'peekChar'],
            ['#REQUIRED', 'word', ['>', '%', '"', "'"]],
            [' ', 'space'],
            // jump directly to the name
            [undefined, 'word'],
            ['stuff', 'all'],
         ]);
         const pToken = new AttListDeclarationPToken({
            open: toSToken('<!'),
            elementNameSpace: toSToken(' '),
            attDefs: [],
            unexpanded: {
               propName: 'name',
               tokens: [],
            },
         });

         resumeParseAttListDeclaration(mockSource, pToken, (result) => {
            // @ts-expect-error 2329/matchers
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            expect(result).toEqualRangeless(
               new AttListDeclarationPToken(pToken, {
                  elementNameSpace: toSToken(' '),
                  attDefs: [
                     {
                        name: toSToken('first'),
                        nameSpace: toSToken('\n'),
                        type: toSToken('CDATA'),
                        typeSpace: toSToken('\t'),
                        defaultType: toSToken('#REQUIRED'),
                        defaultTypeSpace: toSToken(' '),
                        value: [],
                     },
                  ],
                  extra: toSToken('stuff'),
               }),
            );
            done?.();
         });
         mockSource.respondInAsyncTime();
      });

      inputs.forEach(([sourceStr, destStr, msg]: TestType) => {
         it(`adds a name when there is already an attribute ${msg}`, (done) => {
            const mockSource = new MockSTokenSource([
               [sourceStr, 'space'],
               ['first', 'word', ['>', '%']],
               ['\n', 'space'],
               ['CDATA', 'word', ['>', '%', '(', '#', '"', "'"]],
               ['\t', 'space'],
               ['#', 'peekChar'],
               ['#REQUIRED', 'word', ['>', '%', '"', "'"]],
               [' ', 'space'],
               // jump directly to the name
               [undefined, 'word'],
               [undefined, 'all'],
            ]);
            const pToken = new AttListDeclarationPToken({
               open: toSToken('<!'),
               attDefs: [
                  {
                     name: toSToken('zeroth'),
                     value: [],
                     valueSpace: toSToken(' '),
                  },
               ],
               unexpanded: {
                  propName: 'name',
                  tokens: [],
               },
            });

            resumeParseAttListDeclaration(mockSource, pToken, (result) => {
               // @ts-expect-error 2329/matchers
               // eslint-disable-next-line @typescript-eslint/no-unsafe-call
               expect(result).toEqualRangeless(
                  new AttListDeclarationPToken(pToken, {
                     attDefs: [
                        {
                           name: toSToken('zeroth'),
                           value: [],
                           valueSpace: toSToken(destStr),
                        },
                        {
                           name: toSToken('first'),
                           nameSpace: toSToken('\n'),
                           type: toSToken('CDATA'),
                           typeSpace: toSToken('\t'),
                           defaultType: toSToken('#REQUIRED'),
                           defaultTypeSpace: toSToken(' '),
                           value: [],
                        },
                     ],
                  }),
               );
               done?.();
            });
            mockSource.respondInAsyncTime();
         });
      });

      inputs.forEach(([sourceStr, destStr, msg]: TestType) => {
         it(`adds from a name to multiple following attributes ${msg}`, (done) => {
            const mockSource = new MockSTokenSource([
               [sourceStr, 'space'],
               ['first', 'word', ['>', '%']],
               ['\n', 'space'],
               ['CDATA', 'word', ['>', '%', '(', '#', '"', "'"]],
               ['\t', 'space'],
               ['#', 'peekChar'],
               ['#REQUIRED', 'word', ['>', '%', '"', "'"]],
               [' ', 'space'],
               // jump directly to the name
               ['second', 'word', ['>', '%']],
               ['\t', 'space'],
               ['CDATA', 'word', ['>', '%', '(', '#', '"', "'"]],
               ['\t', 'space'],
               [undefined, 'peekChar'],
               [undefined, 'space'],
               [undefined, 'word'],
               [undefined, 'all'],
            ]);
            const pToken = new AttListDeclarationPToken({
               open: toSToken('<!'),
               attDefs: [
                  {
                     name: toSToken('zeroth'),
                     value: [],
                     valueSpace: toSToken(' '),
                  },
               ],
               unexpanded: {
                  propName: 'name',
                  tokens: [],
               },
            });

            resumeParseAttListDeclaration(mockSource, pToken, (result) => {
               // @ts-expect-error 2329/matchers
               // eslint-disable-next-line @typescript-eslint/no-unsafe-call
               expect(result).toEqualRangeless(
                  new AttListDeclarationPToken(pToken, {
                     attDefs: [
                        {
                           name: toSToken('zeroth'),
                           value: [],
                           valueSpace: toSToken(destStr),
                        },
                        {
                           name: toSToken('first'),
                           nameSpace: toSToken('\n'),
                           type: toSToken('CDATA'),
                           typeSpace: toSToken('\t'),
                           defaultType: toSToken('#REQUIRED'),
                           defaultTypeSpace: toSToken(' '),
                           value: [],
                        },
                        {
                           name: toSToken('second'),
                           nameSpace: toSToken('\t'),
                           type: toSToken('CDATA'),
                           typeSpace: toSToken('\t'),
                           defaultType: undefined,
                           defaultTypeSpace: undefined,
                           value: [],
                        },
                     ],
                  }),
               );
               done?.();
            });
            mockSource.respondInAsyncTime();
         });
      });

      inputs.forEach(([sourceStr, destStr, msg]: TestType) => {
         it(`adds a NOTATION type, calls parseWordList and following values ${msg}`, (done) => {
            const mockSource = new MockSTokenSource([
               [sourceStr, 'space'],
               ['NOTATION', 'word', ['>', '%', '(', '#', '"', "'"]],
               ['\t', 'space'],
               ['#', 'peekChar'],
               ['#REQUIRED', 'word', ['>', '%', '"', "'"]],
               [' ', 'space'],
               // jump directly to the name
               [undefined, 'word'],
               [undefined, 'all'],
            ]);
            const pToken = new AttListDeclarationPToken({
               open: toSToken('<!'),
               attDefs: [
                  {
                     name: toSToken('foo'),
                     nameSpace: toSToken(' '),
                     value: [],
                  },
               ],
               unexpanded: {
                  propName: 'type',
                  tokens: [],
               },
            });

            resumeParseAttListDeclaration(mockSource, pToken, (result) => {
               expect(parseWordList).toHaveBeenCalledWith(
                  mockSource,
                  WordListType.NOTATION,
                  expect.any(Function),
               );
               // @ts-expect-error 2329/matchers
               // eslint-disable-next-line @typescript-eslint/no-unsafe-call
               expect(result).toEqualRangeless(
                  new AttListDeclarationPToken(pToken, {
                     attDefs: [
                        {
                           name: toSToken('foo'),
                           nameSpace: toSToken(destStr),
                           type: toSToken('NOTATION'),
                           typeSpace: toSToken('\t'),
                           defaultType: toSToken('#REQUIRED'),
                           defaultTypeSpace: toSToken(' '),
                           value: [],
                        },
                     ],
                  }),
               );
               done?.();
            });
            mockSource.respondInAsyncTime();
         });
      });

      inputs.forEach(([sourceStr, destStr, msg]: TestType) => {
         it(`adds a NOTATION list ${msg}`, (done) => {
            const mockSource = new MockSTokenSource([
               [sourceStr, 'space'],
               ['#', 'peekChar'],
               ['#REQUIRED', 'word', ['>', '%', '"', "'"]],
               [' ', 'space'],
               // jump directly to the name
               [undefined, 'word'],
               [undefined, 'all'],
            ]);
            const pToken = new AttListDeclarationPToken({
               open: toSToken('<!'),
               attDefs: [
                  {
                     name: toSToken('foo'),
                     nameSpace: toSToken(' '),
                     type: toSToken('NOTATION'),
                     typeSpace: toSToken(' '),
                     value: [],
                  },
               ],
               unexpanded: {
                  propName: 'notation',
                  tokens: [],
               },
            });

            resumeParseAttListDeclaration(mockSource, pToken, (result) => {
               expect(parseWordList).toHaveBeenCalledWith(
                  mockSource,
                  WordListType.NOTATION,
                  expect.any(Function),
               );
               // @ts-expect-error 2329/matchers
               // eslint-disable-next-line @typescript-eslint/no-unsafe-call
               expect(result).toEqualRangeless(
                  new AttListDeclarationPToken(pToken, {
                     attDefs: [
                        {
                           name: toSToken('foo'),
                           nameSpace: toSToken(' '),
                           type: toSToken('NOTATION'),
                           typeSpace: toSToken(destStr),
                           defaultType: toSToken('#REQUIRED'),
                           defaultTypeSpace: toSToken(' '),
                           value: [],
                        },
                     ],
                  }),
               );
               done?.();
            });
            mockSource.respondInAsyncTime();
         });
      });

      inputs.forEach(([sourceStr, destStr, msg]: TestType) => {
         it(`adds an ENUMERATION type, calls parseWordList and following values ${msg}`, (done) => {
            const mockSource = new MockSTokenSource([
               [sourceStr, 'space'],
               [undefined, 'word', ['>', '%', '(', '#', '"', "'"]],
               ['(', 'peekChar'],
               ['#', 'peekChar'],
               ['#REQUIRED', 'word', ['>', '%', '"', "'"]],
               [' ', 'space'],
               // jump directly to the name
               [undefined, 'word'],
               [undefined, 'all'],
            ]);
            const pToken = new AttListDeclarationPToken({
               open: toSToken('<!'),
               attDefs: [
                  {
                     name: toSToken('foo'),
                     nameSpace: toSToken(' '),
                     value: [],
                  },
               ],
               unexpanded: {
                  propName: 'type',
                  tokens: [],
               },
            });

            resumeParseAttListDeclaration(mockSource, pToken, (result) => {
               expect(parseWordList).toHaveBeenCalledWith(
                  mockSource,
                  WordListType.ENUMERATION,
                  expect.any(Function),
               );
               // @ts-expect-error 2329/matchers
               // eslint-disable-next-line @typescript-eslint/no-unsafe-call
               expect(result).toEqualRangeless(
                  new AttListDeclarationPToken(pToken, {
                     attDefs: [
                        {
                           name: toSToken('foo'),
                           nameSpace: toSToken(destStr),
                           type: undefined,
                           typeSpace: undefined,
                           defaultType: toSToken('#REQUIRED'),
                           defaultTypeSpace: toSToken(' '),
                           value: [],
                        },
                     ],
                  }),
               );
               done?.();
            });
            mockSource.respondInAsyncTime();
         });
      });

      inputs.forEach(([sourceStr, destStr, msg]: TestType) => {
         it(`adds a CDATA type and following values ${msg}`, (done) => {
            const mockSource = new MockSTokenSource([
               [sourceStr, 'space'],
               ['CDATA', 'word', ['>', '%', '(', '#', '"', "'"]],
               ['\t', 'space'],
               ['#', 'peekChar'],
               ['#REQUIRED', 'word', ['>', '%', '"', "'"]],
               [' ', 'space'],
               // jump directly to the name
               [undefined, 'word'],
               [undefined, 'all'],
            ]);
            const pToken = new AttListDeclarationPToken({
               open: toSToken('<!'),
               attDefs: [
                  {
                     name: toSToken('foo'),
                     nameSpace: toSToken(' '),
                     value: [],
                  },
               ],
               unexpanded: {
                  propName: 'type',
                  tokens: [],
               },
            });

            resumeParseAttListDeclaration(mockSource, pToken, (result) => {
               // @ts-expect-error 2329/matchers
               // eslint-disable-next-line @typescript-eslint/no-unsafe-call
               expect(result).toEqualRangeless(
                  new AttListDeclarationPToken(pToken, {
                     attDefs: [
                        {
                           name: toSToken('foo'),
                           nameSpace: toSToken(destStr),
                           type: toSToken('CDATA'),
                           typeSpace: toSToken('\t'),
                           defaultType: toSToken('#REQUIRED'),
                           defaultTypeSpace: toSToken(' '),
                           value: [],
                        },
                     ],
                  }),
               );
               done?.();
            });
            mockSource.respondInAsyncTime();
         });
      });

      inputs.forEach(([sourceStr, destStr, msg]: TestType) => {
         it(`adds a value with no defaultType ${msg}`, (done) => {
            const mockSource = new MockSTokenSource([
               [sourceStr, 'space'],
               [undefined, 'peekChar'],
               // parse the value
               ['\n', 'space'],
               [undefined, 'word'],
               [undefined, 'all'],
            ]);
            const pToken = new AttListDeclarationPToken({
               open: toSToken('<!'),
               attDefs: [
                  {
                     name: toSToken('foo'),
                     typeSpace: toSToken(' '),
                     value: [],
                  },
               ],
               unexpanded: {
                  propName: 'defaultType',
                  tokens: [],
               },
            });

            resumeParseAttListDeclaration(mockSource, pToken, (result) => {
               // @ts-expect-error 2329/matchers
               // eslint-disable-next-line @typescript-eslint/no-unsafe-call
               expect(result).toEqualRangeless(
                  new AttListDeclarationPToken(pToken, {
                     attDefs: [
                        {
                           name: toSToken('foo'),
                           typeSpace: toSToken(destStr),
                           value: [],
                           valueSpace: toSToken('\n'),
                        },
                     ],
                  }),
               );
               done?.();
            });
            mockSource.respondInAsyncTime();
         });
      });

      inputs.forEach(([sourceStr, destStr, msg]: TestType) => {
         it(`adds a defaultType of #required ${msg}`, (done) => {
            const mockSource = new MockSTokenSource([
               [sourceStr, 'space'],
               ['#', 'peekChar'],
               ['#REQUIRED', 'word', ['>', '%', '"', "'"]],
               [' ', 'space'],
               // jump directly to the name
               [undefined, 'word'],
               [undefined, 'all'],
            ]);
            const pToken = new AttListDeclarationPToken({
               open: toSToken('<!'),
               attDefs: [
                  {
                     name: toSToken('foo'),
                     typeSpace: toSToken(' '),
                     value: [],
                  },
               ],
               unexpanded: {
                  propName: 'defaultType',
                  tokens: [],
               },
            });

            resumeParseAttListDeclaration(mockSource, pToken, (result) => {
               // @ts-expect-error 2329/matchers
               // eslint-disable-next-line @typescript-eslint/no-unsafe-call
               expect(result).toEqualRangeless(
                  new AttListDeclarationPToken(pToken, {
                     attDefs: [
                        {
                           name: toSToken('foo'),
                           typeSpace: toSToken(destStr),
                           defaultType: toSToken('#REQUIRED'),
                           defaultTypeSpace: toSToken(' '),
                           value: [],
                        },
                     ],
                  }),
               );
               done?.();
            });
            mockSource.respondInAsyncTime();
         });
      });

      inputs.forEach(([sourceStr, destStr, msg]: TestType) => {
         it(`adds a defaultType of #fixed with a value ${msg}`, (done) => {
            const mockSource = new MockSTokenSource([
               [sourceStr, 'space'],
               ['#', 'peekChar'],
               ['#FIXED', 'word', ['>', '%', '"', "'"]],
               [' ', 'space'],
               // parse the value
               ['\t', 'space'],
               [undefined, 'word'],
               [undefined, 'all'],
            ]);
            const pToken = new AttListDeclarationPToken({
               open: toSToken('<!'),
               attDefs: [
                  {
                     name: toSToken('foo'),
                     typeSpace: toSToken(' '),
                     value: [],
                  },
               ],
               unexpanded: {
                  propName: 'defaultType',
                  tokens: [],
               },
            });

            resumeParseAttListDeclaration(mockSource, pToken, (result) => {
               // @ts-expect-error 2329/matchers
               // eslint-disable-next-line @typescript-eslint/no-unsafe-call
               expect(result).toEqualRangeless(
                  new AttListDeclarationPToken(pToken, {
                     attDefs: [
                        {
                           name: toSToken('foo'),
                           typeSpace: toSToken(destStr),
                           defaultType: toSToken('#FIXED'),
                           defaultTypeSpace: toSToken(' '),
                           value: [],
                           valueSpace: toSToken('\t'),
                        },
                     ],
                  }),
               );
               done?.();
            });
            mockSource.respondInAsyncTime();
         });
      });

      it('adds extra after processing in the middle of attributes', (done) => {
         const mockSource = new MockSTokenSource([
            [undefined, 'space'],
            ['#', 'peekChar'],
            ['#FIXED', 'word', ['>', '%', '"', "'"]],
            [' ', 'space'],
            // parse the value
            ['\t', 'space'],
            [undefined, 'word'],
            ['xtra', 'all'],
         ]);
         const pToken = new AttListDeclarationPToken({
            open: toSToken('<!'),
            attDefs: [
               {
                  name: toSToken('foo'),
                  typeSpace: toSToken(' '),
                  value: [],
               },
            ],
            unexpanded: {
               propName: 'defaultType',
               tokens: [],
            },
         });

         resumeParseAttListDeclaration(mockSource, pToken, (result) => {
            // @ts-expect-error 2329/matchers
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            expect(result).toEqualRangeless(
               new AttListDeclarationPToken(pToken, {
                  attDefs: [
                     {
                        name: toSToken('foo'),
                        typeSpace: toSToken(' '),
                        defaultType: toSToken('#FIXED'),
                        defaultTypeSpace: toSToken(' '),
                        value: [],
                        valueSpace: toSToken('\t'),
                     },
                  ],
                  extra: toSToken('xtra'),
               }),
            );
            done?.();
         });
         mockSource.respondInAsyncTime();
      });

      inputs.forEach(([sourceStr, destStr, msg]: TestType) => {
         it(`adds a value ${msg}`, (done) => {
            const mockSource = new MockSTokenSource([
               [sourceStr, 'space'],
               [' ', 'space'],
               [undefined, 'word'],
               [undefined, 'all'],
            ]);
            const pToken = new AttListDeclarationPToken({
               open: toSToken('<!'),
               attDefs: [
                  {
                     name: toSToken('foo'),
                     defaultTypeSpace: toSToken(' '),
                     value: [],
                  },
               ],
               unexpanded: {
                  propName: 'value',
                  tokens: [],
               },
            });

            resumeParseAttListDeclaration(mockSource, pToken, (result) => {
               // @ts-expect-error 2329/matchers
               // eslint-disable-next-line @typescript-eslint/no-unsafe-call
               expect(result).toEqualRangeless(
                  new AttListDeclarationPToken(pToken, {
                     attDefs: [
                        {
                           name: toSToken('foo'),
                           defaultTypeSpace: toSToken(destStr),
                           value: [],
                           valueSpace: toSToken(' '),
                        },
                     ],
                  }),
               );
               done?.();
            });
            mockSource.respondInAsyncTime();
         });
      });

      inputs.forEach(([sourceStr, destStr, msg]: TestType) => {
         it(`adds a value while preserving any earlier entries ${msg}`, (done) => {
            const mockSource = new MockSTokenSource([
               [sourceStr, 'space'],
               [' ', 'space'],
               [undefined, 'word'],
               [undefined, 'all'],
            ]);
            const pToken = new AttListDeclarationPToken({
               open: toSToken('<!'),
               attDefs: [
                  {
                     name: toSToken('first'),
                     value: [],
                  },
                  {
                     name: toSToken('foo'),
                     defaultTypeSpace: toSToken(' '),
                     value: [],
                  },
               ],
               unexpanded: {
                  propName: 'value',
                  tokens: [],
               },
            });

            resumeParseAttListDeclaration(mockSource, pToken, (result) => {
               // @ts-expect-error 2329/matchers
               // eslint-disable-next-line @typescript-eslint/no-unsafe-call
               expect(result).toEqualRangeless(
                  new AttListDeclarationPToken(pToken, {
                     attDefs: [
                        {
                           name: toSToken('first'),
                           value: [],
                        },
                        {
                           name: toSToken('foo'),
                           defaultTypeSpace: toSToken(destStr),
                           value: [],
                           valueSpace: toSToken(' '),
                        },
                     ],
                  }),
               );
               done?.();
            });
            mockSource.respondInAsyncTime();
         });
      });
   });
});
