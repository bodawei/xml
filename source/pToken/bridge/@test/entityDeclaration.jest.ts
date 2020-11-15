/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */
import { toSToken, SToken, STokenSource } from 'sToken';
import { MockSTokenSource } from 'sToken-test';

import * as unexpanded from '../../common/parseUnexpanded';
import { UnexpandedMarkupDetails } from '../../common/parseUnexpanded';
import * as externalId from '../../common/externalId';
import { ParsedExternalId } from '../../common/externalId';
import { ParameterEntityReferencePToken } from '../../../token/parameterEntityReference';
import { GeneralEntityDeclarationPToken } from '../../token/generalEntityDeclaration';
import { ParameterEntityDeclarationPToken } from '../../token/parameterEntityDeclaration';

import { parseEntityDeclaration } from '../entityDeclaration';

import { DeclarationStart, TextPToken } from 'token';
import literal, { LiteralPToken } from '../../../token/common/literal';

jest.mock('../../common/externalId');
jest.mock('../../common/parseUnexpanded');
jest.mock('../../../token/common/literal');

type TermArray = Array<string>;
interface LitParams {
   pToken: Record<string, unknown>;
}

describe('entityDeclaration (unit)', () => {
   let declarationStart: DeclarationStart;
   let parseUnexpanded: jest.MockedFunction<typeof unexpanded.parseUnexpanded>;
   let parseUnexpandedAfterPeRef: jest.MockedFunction<typeof unexpanded.parseUnexpandedAfterPeRef>;
   let parseExternalId: jest.MockedFunction<typeof externalId.parseExternalId>;
   let literalParse: jest.MockedFunction<typeof literal.parse>;

   beforeEach(() => {
      declarationStart = {
         open: toSToken('<!'),
      };

      parseUnexpanded = unexpanded.parseUnexpanded as jest.MockedFunction<
         typeof unexpanded.parseUnexpanded
      >;
      parseUnexpandedAfterPeRef = unexpanded.parseUnexpandedAfterPeRef as jest.MockedFunction<
         typeof unexpanded.parseUnexpandedAfterPeRef
      >;
      parseExternalId = externalId.parseExternalId as jest.MockedFunction<
         typeof externalId.parseExternalId
      >;
      literalParse = literal.parse as jest.MockedFunction<typeof literal.parse>;

      parseUnexpanded.mockImplementation((source, prop, cb) => {
         cb(undefined);
      });

      parseExternalId.mockImplementation(
         (
            sTokenSource: STokenSource,
            terminators: TermArray,
            cb: (result?: ParsedExternalId) => void,
         ) => {
            cb();
         },
      );
      literalParse.mockImplementation(
         (
            _1: STokenSource,
            stuff: LitParams | undefined,
            callback: (result?: LiteralPToken) => void,
         ) => {
            callback(undefined);
         },
      );
   });

   describe('parseEntityDeclaration()', () => {
      let result: GeneralEntityDeclarationPToken | ParameterEntityDeclarationPToken | undefined;

      function getResult(value: GeneralEntityDeclarationPToken | ParameterEntityDeclarationPToken) {
         result = value;
      }

      it('does a parse of a general entity declaration with a literal value', () => {
         literalParse.mockImplementation(
            (
               _1: STokenSource,
               stuff: LitParams | undefined,
               callback: (value?: LiteralPToken) => void,
            ) => {
               callback({ ...(stuff || {}).pToken, openQuote: toSToken('"'), value: [] });
            },
         );
         const mockSource = new MockSTokenSource([
            [undefined, 'match', '%'],
            [undefined, 'space'],
            ['anEntity', 'word', ['>', '"', "'", ';']],
            [' ', 'space'],
            // externalId and literal would have been here
            [' ', 'space'],
            ['>', 'match', '>'],
         ]);

         parseEntityDeclaration(mockSource, declarationStart, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new GeneralEntityDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('anEntity'),
               nameSpace: toSToken(' '),
               openQuote: toSToken('"'),
               valueSpace: toSToken(' '),
               close: toSToken('>'),
            }),
         );
      });

      it('returns nothing if at EOF. That is: <!ENTITY', () => {
         const mockSource = new MockSTokenSource([
            [undefined, 'match', '%'],
            [undefined, 'space'],
            [undefined, 'word', ['>', '"', "'", ';']],
            [undefined, 'space'],
            [undefined, 'match'],
         ]);

         parseEntityDeclaration(mockSource, declarationStart, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new GeneralEntityDeclarationPToken({ open: SToken.fromString('<!') }),
         );
      });

      it('returns parameter entity info if this is a parameter entity: <!ENTITY % entityName ...', () => {
         const mockSource = new MockSTokenSource([
            ['%', 'match', '%'],
            [' ', 'space'],
            ['anEntity', 'word', ['>', '"', "'", ';']],
            [' ', 'space'],
            [undefined, 'peekChar'],
            // literal would have been here
            ['>', 'match', '>'],
         ]);

         parseEntityDeclaration(mockSource, declarationStart, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new ParameterEntityDeclarationPToken({
               open: toSToken('<!'),
               parameter: toSToken('%'),
               parameterSpace: toSToken(' '),
               name: toSToken('anEntity'),
               nameSpace: toSToken(' '),
               close: toSToken('>'),
            }),
         );
      });

      it('returns parameter entity without the space after % if none present: <!ENTITY %entityName...', () => {
         const mockSource = new MockSTokenSource([
            ['%', 'match', '%'],
            [undefined, 'space'],
            ['anEntity', 'word', ['>', '"', "'", ';']],
            [' ', 'space'],
            [undefined, 'peekChar'],
            // literal would have been here
            ['>', 'match', '>'],
         ]);

         parseEntityDeclaration(mockSource, declarationStart, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new ParameterEntityDeclarationPToken({
               open: toSToken('<!'),
               parameter: toSToken('%'),
               name: toSToken('anEntity'),
               nameSpace: toSToken(' '),
               close: toSToken('>'),
            }),
         );
      });

      it('returns nothing if there is no name, space, or start of value: <!ENTITY %', () => {
         const mockSource = new MockSTokenSource([
            ['%', 'match', '%'],
            [undefined, 'space'],
            [undefined, 'word', ['>', '"', "'", ';']],
            [undefined, 'space'],
            [undefined, 'peekChar'],
            // externalId or literal would have been here
            [undefined, 'match', '>'],
         ]);

         parseEntityDeclaration(mockSource, declarationStart, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new ParameterEntityDeclarationPToken({
               open: toSToken('<!'),
               parameter: toSToken('%'),
            }),
         );
      });

      it('returns no space between entity name and value: <!ENTITY entityName"foo" >', () => {
         const mockSource = new MockSTokenSource([
            [undefined, 'match', '%'],
            [undefined, 'space'],
            ['entityName', 'word', ['>', '"', "'", ';']],
            [undefined, 'space'],
            // externalId or literal would have been here
            ['>', 'match', '>'],
         ]);

         parseEntityDeclaration(mockSource, declarationStart, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new GeneralEntityDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('entityName'),
               close: toSToken('>'),
            }),
         );
      });

      it('adds trailing space after quoted value if present: <!ENTITY entityName "foo" >', () => {
         literalParse.mockImplementation(
            (
               _1: STokenSource,
               stuff: LitParams | undefined,
               callback: (value?: LiteralPToken) => void,
            ) => {
               callback({ ...(stuff || {}).pToken, openQuote: toSToken('"'), value: [] });
            },
         );
         const mockSource = new MockSTokenSource([
            [undefined, 'match', '%'],
            [undefined, 'space'],
            ['entityName', 'word', ['>', '"', "'", ';']],
            [' ', 'space'],
            // externalId or literal would have been here
            [' ', 'space'],
            ['>', 'match', '>'],
         ]);

         parseEntityDeclaration(mockSource, declarationStart, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new GeneralEntityDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('entityName'),
               nameSpace: toSToken(' '),
               openQuote: toSToken('"'),
               valueSpace: toSToken(' '),
               close: toSToken('>'),
            }),
         );
      });

      it('returns a space after the externalID: <!ENTITY entityName SYSTEM "foo" >', () => {
         parseExternalId.mockImplementation(
            (mockSource: STokenSource, term: TermArray, cb: (result: ParsedExternalId) => void) => {
               cb({ externalId: {} });
            },
         );
         const mockSource = new MockSTokenSource([
            [undefined, 'match', '%'],
            [undefined, 'space'],
            ['entityName', 'word', ['>', '"', "'", ';']],
            [' ', 'space'],
            // externalId or literal would have been here
            [' ', 'space'],
            [undefined, 'peekWord', ['>']],
            ['>', 'match', '>'],
         ]);

         parseEntityDeclaration(mockSource, declarationStart, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new GeneralEntityDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('entityName'),
               nameSpace: toSToken(' '),
               externalId: {},
               externalIdSpace: toSToken(' '),
               close: toSToken('>'),
            }),
         );
      });

      it('returns a space after the externalID: <!ENTITY % entityName SYSTEM "foo" >', () => {
         parseExternalId.mockImplementation(
            (mockSource: STokenSource, term: TermArray, cb: (result: ParsedExternalId) => void) => {
               cb({ externalId: {} });
            },
         );
         const mockSource = new MockSTokenSource([
            ['%', 'match', '%'],
            ['\n', 'space'],
            ['entityName', 'word', ['>', '"', "'", ';']],
            [' ', 'space'],
            [undefined, 'peekChar'],
            // externalId or literal would have been here
            [' ', 'space'],
            ['>', 'match', '>'],
         ]);

         parseEntityDeclaration(mockSource, declarationStart, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new ParameterEntityDeclarationPToken({
               open: toSToken('<!'),
               parameter: toSToken('%'),
               parameterSpace: toSToken('\n'),
               name: toSToken('entityName'),
               nameSpace: toSToken(' '),
               externalId: {},
               externalIdSpace: toSToken(' '),
               close: toSToken('>'),
            }),
         );
      });

      it('returns an NDATA clause if found: <!ENTITY entityName SYSTEM "foo" NDATA testNData >', () => {
         parseExternalId.mockImplementation(
            (mockSource: STokenSource, term: TermArray, cb: (result: ParsedExternalId) => void) => {
               cb({ externalId: {} });
            },
         );
         const mockSource = new MockSTokenSource([
            [undefined, 'match', '%'],
            [undefined, 'space'],
            ['entityName', 'word', ['>', '"', "'", ';']],
            [' ', 'space'],
            // externalId would have been here
            [' ', 'space'],
            ['NDATA', 'peekWord', ['>']],
            ['NDATA', 'word', ['>']],
            ['\t', 'space'],
            ['testNData', 'word', ['>']],
            ['\n', 'space'],
            ['>', 'match', '>'],
         ]);

         parseEntityDeclaration(mockSource, declarationStart, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new GeneralEntityDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('entityName'),
               nameSpace: toSToken(' '),
               externalId: {},
               externalIdSpace: toSToken(' '),
               nData: toSToken('NDATA'),
               nDataSpace: toSToken('\t'),
               nDataName: toSToken('testNData'),
               nDataNameSpace: toSToken('\n'),
               close: toSToken('>'),
            }),
         );
      });

      it('recognizes a non-all caps NDATA: <!ENTITY entityName SYSTEM "foo" ndaTa testNData >', () => {
         parseExternalId.mockImplementation(
            (mockSource: STokenSource, term: TermArray, cb: (result: ParsedExternalId) => void) => {
               cb({ externalId: {} });
            },
         );
         const mockSource = new MockSTokenSource([
            [undefined, 'match', '%'],
            [undefined, 'space'],
            ['entityName', 'word', ['>', '"', "'", ';']],
            [' ', 'space'],
            // externalId would have been here
            [' ', 'space'],
            ['ndaTa', 'peekWord', ['>']],
            ['ndaTa', 'word', ['>']],
            ['\t', 'space'],
            ['testNData', 'word', ['>']],
            ['\n', 'space'],
            ['>', 'match', '>'],
         ]);

         parseEntityDeclaration(mockSource, declarationStart, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new GeneralEntityDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('entityName'),
               nameSpace: toSToken(' '),
               externalId: {},
               externalIdSpace: toSToken(' '),
               nData: toSToken('ndaTa'),
               nDataSpace: toSToken('\t'),
               nDataName: toSToken('testNData'),
               nDataNameSpace: toSToken('\n'),
               close: toSToken('>'),
            }),
         );
      });

      it('does not mind no space after the ndata value: <!ENTITY entityName SYSTEM "foo" ndaTa testNData>', () => {
         parseExternalId.mockImplementation(
            (mockSource: STokenSource, term: TermArray, cb: (result: ParsedExternalId) => void) => {
               cb({ externalId: {} });
            },
         );
         const mockSource = new MockSTokenSource([
            [undefined, 'match', '%'],
            [undefined, 'space'],
            ['entityName', 'word', ['>', '"', "'", ';']],
            [' ', 'space'],
            // externalId would have been here
            [' ', 'space'],
            ['ndaTa', 'peekWord', ['>']],
            ['ndaTa', 'word', ['>']],
            ['\t', 'space'],
            ['testNData', 'word', ['>']],
            [undefined, 'space'],
            ['>', 'match', '>'],
         ]);

         parseEntityDeclaration(mockSource, declarationStart, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new GeneralEntityDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('entityName'),
               nameSpace: toSToken(' '),
               externalId: {},
               externalIdSpace: toSToken(' '),
               nData: toSToken('ndaTa'),
               nDataSpace: toSToken('\t'),
               nDataName: toSToken('testNData'),
               close: toSToken('>'),
            }),
         );
      });

      it('returns if stops after NDATA: <!ENTITY entityName SYSTEM "foo" NDATA', () => {
         parseExternalId.mockImplementation(
            (mockSource: STokenSource, term: TermArray, cb: (result: ParsedExternalId) => void) => {
               cb({ externalId: {} });
            },
         );
         const mockSource = new MockSTokenSource([
            [undefined, 'match', '%'],
            [undefined, 'space'],
            ['entityName', 'word', ['>', '"', "'", ';']],
            [' ', 'space'],
            // externalId would have been here
            [' ', 'space'],
            ['ndaTa', 'peekWord', ['>']],
            ['ndaTa', 'word', ['>']],
            [undefined, 'space'],
            [undefined, 'word', ['>']],
            [undefined, 'space'],
            [undefined, 'match', '>'],
         ]);

         parseEntityDeclaration(mockSource, declarationStart, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new GeneralEntityDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('entityName'),
               nameSpace: toSToken(' '),
               externalId: {},
               externalIdSpace: toSToken(' '),
               nData: toSToken('ndaTa'),
            }),
         );
      });

      describe('parameter entity reference', () => {
         it('returns an unassigned value when finding a PE Ref at the starting position', () => {
            parseUnexpandedAfterPeRef.mockImplementation(
               (
                  _1: STokenSource,
                  propName: string,
                  handler: (result?: UnexpandedMarkupDetails) => void,
               ) => {
                  handler({ propName, tokens: [new TextPToken({ text: toSToken('x') })] });
               },
            );
            const mockSource = new MockSTokenSource([
               ['%', 'match', '%'],
               [' ', 'space'],
               ['entityName', 'word', ['>', '"', "'", ';']],
               [' ', 'space'],
               [';', 'peekChar'],
               [';', 'match', ';'],
               ['>', 'match', '>'],
            ]);

            parseEntityDeclaration(mockSource, declarationStart, getResult);
            mockSource.respondInAsyncTime();

            expect(result).toEqualRangeless({
               open: toSToken('<!'),
               unexpanded: {
                  propName: 'parameter',
                  tokens: [
                     new ParameterEntityReferencePToken({
                        open: toSToken('%'),
                        openSpace: toSToken(' '),
                        name: toSToken('entityName'),
                        nameSpace: toSToken(' '),
                        close: toSToken(';'),
                     }),
                     new TextPToken({ text: toSToken('x') }),
                  ],
               },
               close: toSToken('>'),
            });
         });

         it('returns an unassigned value when finding a PE Ref at the starting position when there is nothing after the peref', () => {
            parseUnexpandedAfterPeRef.mockImplementation(
               (
                  _1: STokenSource,
                  propName: string,
                  handler: (result?: UnexpandedMarkupDetails) => void,
               ) => {
                  handler(undefined);
               },
            );
            const mockSource = new MockSTokenSource([
               ['%', 'match', '%'],
               [' ', 'space'],
               ['entityName', 'word', ['>', '"', "'", ';']],
               [' ', 'space'],
               [';', 'peekChar'],
               [';', 'match', ';'],
               [undefined, 'match', '>'],
            ]);

            parseEntityDeclaration(mockSource, declarationStart, getResult);
            mockSource.respondInAsyncTime();

            expect(result).toEqualRangeless({
               open: toSToken('<!'),
               unexpanded: {
                  propName: 'parameter',
                  tokens: [
                     new ParameterEntityReferencePToken({
                        open: toSToken('%'),
                        openSpace: toSToken(' '),
                        name: toSToken('entityName'),
                        nameSpace: toSToken(' '),
                        close: toSToken(';'),
                     }),
                  ],
               },
            });
         });

         it('returns an unexpanded value when finding a PE Ref at the name position', () => {
            parseUnexpanded.mockImplementation(
               (
                  source: STokenSource,
                  propName: string,
                  cb: (result?: UnexpandedMarkupDetails) => void,
               ) => {
                  cb({ propName, tokens: [] });
               },
            );
            const mockSource = new MockSTokenSource([
               ['%', 'match', '%'],
               [' ', 'space'],
               // unexpanded happens here
               ['>', 'match', '>'],
            ]);

            parseEntityDeclaration(mockSource, declarationStart, getResult);
            mockSource.respondInAsyncTime();

            expect(result).toEqualRangeless({
               open: toSToken('<!'),
               parameter: toSToken('%'),
               parameterSpace: toSToken(' '),
               unexpanded: {
                  propName: 'name',
                  tokens: [],
               },
               close: toSToken('>'),
            });
         });

         it('returns an unexpanded value when finding a PE Ref at the value position', () => {
            const vals = [undefined, { tokens: [] }];
            parseUnexpanded.mockImplementation(
               (
                  source: STokenSource,
                  propName: string,
                  cb: (result?: UnexpandedMarkupDetails) => void,
               ) => {
                  const next = vals.shift();
                  cb(next ? { ...next, propName } : undefined);
               },
            );
            const mockSource = new MockSTokenSource([
               ['%', 'match', '%'],
               [' ', 'space'],
               ['entityName', 'word', ['>', '"', "'", ';']],
               [' ', 'space'],
               [undefined, 'peekChar'],
               // unexpanded happens here
               ['>', 'match', '>'],
            ]);

            parseEntityDeclaration(mockSource, declarationStart, getResult);
            mockSource.respondInAsyncTime();

            expect(result).toEqualRangeless({
               open: toSToken('<!'),
               parameter: toSToken('%'),
               parameterSpace: toSToken(' '),
               name: toSToken('entityName'),
               nameSpace: toSToken(' '),
               unexpanded: {
                  propName: 'externalIdOrLiteral',
                  tokens: [],
               },
               close: toSToken('>'),
            });
         });

         it('returns an unexpanded value when finding a PE Ref at the middle of the externalID', () => {
            const vals = [undefined, undefined, { tokens: [] }];
            parseUnexpanded.mockImplementation(
               (
                  source: STokenSource,
                  propName: string,
                  cb: (result?: UnexpandedMarkupDetails) => void,
               ) => {
                  const next = vals.shift();
                  cb(next ? { ...next, propName } : undefined);
               },
            );
            parseExternalId.mockImplementation(
               (
                  mockSource: STokenSource,
                  term: TermArray,
                  cb: (result: ParsedExternalId) => void,
               ) => {
                  cb({ externalId: {}, nextPropName: 'externalType' });
               },
            );
            const mockSource = new MockSTokenSource([
               ['%', 'match', '%'],
               [' ', 'space'],
               ['entityName', 'word', ['>', '"', "'", ';']],
               [' ', 'space'],
               [undefined, 'peekChar'],
               // unexpanded happens here
               ['>', 'match', '>'],
            ]);

            parseEntityDeclaration(mockSource, declarationStart, getResult);
            mockSource.respondInAsyncTime();

            expect(result).toEqualRangeless({
               open: toSToken('<!'),
               parameter: toSToken('%'),
               parameterSpace: toSToken(' '),
               name: toSToken('entityName'),
               nameSpace: toSToken(' '),
               unexpanded: {
                  propName: 'externalType',
                  tokens: [],
               },
               close: toSToken('>'),
            });
         });

         it('returns an unexpanded value when finding a PE Ref at the NDATA', () => {
            const vals = [undefined, undefined, { tokens: [] }];
            parseUnexpanded.mockImplementation(
               (
                  source: STokenSource,
                  propName: string,
                  cb: (result?: UnexpandedMarkupDetails) => void,
               ) => {
                  const next = vals.shift();
                  cb(next ? { ...next, propName } : undefined);
               },
            );
            parseExternalId.mockImplementation(
               (
                  mockSource: STokenSource,
                  term: TermArray,
                  cb: (result: ParsedExternalId) => void,
               ) => {
                  cb({ externalId: {}, nextPropName: undefined });
               },
            );
            const mockSource = new MockSTokenSource([
               [undefined, 'match', '%'],
               [undefined, 'space'],
               ['entityName', 'word', ['>', '"', "'", ';']],
               [' ', 'space'],
               ['\t', 'space'],
               // unexpanded happens here
               ['>', 'match', '>'],
            ]);

            parseEntityDeclaration(mockSource, declarationStart, getResult);
            mockSource.respondInAsyncTime();

            expect(result).toEqualRangeless({
               open: toSToken('<!'),
               name: toSToken('entityName'),
               nameSpace: toSToken(' '),
               externalIdSpace: toSToken('\t'),
               unexpanded: {
                  propName: 'nData',
                  tokens: [],
               },
               close: toSToken('>'),
            });
         });

         it('returns an unexpanded value when finding a PE Ref at the NDATA name', () => {
            const vals = [undefined, undefined, undefined, { tokens: [] }];
            parseUnexpanded.mockImplementation(
               (
                  source: STokenSource,
                  propName: string,
                  cb: (result?: UnexpandedMarkupDetails) => void,
               ) => {
                  const next = vals.shift();
                  cb(next ? { ...next, propName } : undefined);
               },
            );
            parseExternalId.mockImplementation(
               (
                  mockSource: STokenSource,
                  term: TermArray,
                  cb: (result: ParsedExternalId) => void,
               ) => {
                  cb({ externalId: {}, nextPropName: undefined });
               },
            );
            const mockSource = new MockSTokenSource([
               [undefined, 'match', '%'],
               [undefined, 'space'],
               ['entityName', 'word', ['>', '"', "'", ';']],
               [' ', 'space'],
               // externalid
               ['\t', 'space'],
               ['ndaTa', 'peekWord', ['>']],
               ['ndaTa', 'word', ['>']],
               [' ', 'space'],
               // unexpanded happens here
               ['>', 'match', '>'],
            ]);

            parseEntityDeclaration(mockSource, declarationStart, getResult);
            mockSource.respondInAsyncTime();

            expect(result).toEqualRangeless({
               open: toSToken('<!'),
               name: toSToken('entityName'),
               nameSpace: toSToken(' '),
               externalIdSpace: toSToken('\t'),
               nData: toSToken('ndaTa'),
               nDataSpace: toSToken(' '),
               unexpanded: {
                  propName: 'nDataName',
                  tokens: [],
               },
               close: toSToken('>'),
            });
         });
      });
   });
});
