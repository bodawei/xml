/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { TextPToken } from 'pToken';
import { toSToken } from 'basic';
import { MockSTokenSource } from 'pToken-test';

import * as unexpanded from '../../common/parseUnexpanded';
import { UnexpandedMarkupDetails } from '../../common/parseUnexpanded';
import * as externalId from '../../common/externalId';
import { ParsedExternalId } from '../../common/externalId';
import { GeneralEntityDeclarationPToken } from '../../token/generalEntityDeclaration';
import { ParameterEntityDeclarationPToken } from '../../token/parameterEntityDeclaration';
import { ParameterEntityReferencePToken } from '../../token/parameterEntityReference';

import { parseEntityDeclaration, resumeParseEntityDeclaration } from '../entityDeclaration';

import { DeclarationStart } from 'token';
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

      parseExternalId.mockImplementation((sTokenSource, terminators, cb) => {
         cb();
      });
      literalParse.mockImplementation((_1, stuff, callback) => {
         callback(undefined);
      });
   });

   describe('parseEntityDeclaration()', () => {
      let result: GeneralEntityDeclarationPToken | ParameterEntityDeclarationPToken | undefined;

      function getResult(value: GeneralEntityDeclarationPToken | ParameterEntityDeclarationPToken) {
         result = value;
      }

      it('does a parse of a general entity declaration with a literal value', () => {
         literalParse.mockImplementation((_1, stuff, callback) => {
            callback({ ...(stuff || {}).pToken, openQuote: toSToken('"'), value: [] });
         });
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
            new GeneralEntityDeclarationPToken({ open: toSToken('<!') }),
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
         literalParse.mockImplementation((_1, stuff, callback) => {
            callback({ ...(stuff || {}).pToken, openQuote: toSToken('"'), value: [] });
         });
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
            (mockSource, term, cb: (result: ParsedExternalId) => void) => {
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
            (mockSource, term, cb: (result: ParsedExternalId) => void) => {
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
            (mockSource, term, cb: (result: ParsedExternalId) => void) => {
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
            (mockSource, term, cb: (result: ParsedExternalId) => void) => {
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
            (mockSource, term, cb: (result: ParsedExternalId) => void) => {
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
            (mockSource, term, cb: (result: ParsedExternalId) => void) => {
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
         it('returns an unexpanded value when finding a PE Ref at the starting position', () => {
            parseUnexpandedAfterPeRef.mockImplementation(
               (_1, propName, handler: (result?: UnexpandedMarkupDetails) => void) => {
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

         it('returns an unexpanded value when finding a PE Ref at the starting position when there is nothing after the peref', () => {
            parseUnexpandedAfterPeRef.mockImplementation(
               (_1, propName, handler: (result?: UnexpandedMarkupDetails) => void) => {
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
            parseUnexpanded.mockImplementation((source, propName, cb) => {
               cb({ propName, tokens: [] });
            });
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
            parseUnexpanded.mockImplementation((source, propName, cb) => {
               const next = vals.shift();
               cb(next ? { ...next, propName } : undefined);
            });
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
                  propName: 'externalIdOrValue',
                  tokens: [],
               },
               close: toSToken('>'),
            });
         });

         it('returns an unexpanded value when finding a PE Ref AFTER the value position', () => {
            const vals = [undefined, undefined, { tokens: [] }];
            parseUnexpanded.mockImplementation((source, propName, cb) => {
               const next = vals.shift();
               cb(next ? { ...next, propName } : undefined);
            });
            const mockSource = new MockSTokenSource([
               ['%', 'match', '%'],
               [' ', 'space'],
               ['entityName', 'word', ['>', '"', "'", ';']],
               [' ', 'space'],
               ['"', 'peekChar'],
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
                  propName: 'trailing',
                  tokens: [],
               },
               close: toSToken('>'),
            });
         });

         it('returns an unexpanded value when finding a PE Ref at the middle of the externalID', () => {
            const vals = [undefined, undefined, { tokens: [] }];
            parseUnexpanded.mockImplementation((source, propName, cb) => {
               const next = vals.shift();
               cb(next ? { ...next, propName } : undefined);
            });
            parseExternalId.mockImplementation((mockSource, term, cb) => {
               cb({ externalId: {}, nextPropName: 'externalType' });
            });
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

         it('returns an unexpanded value when finding a PE Ref AFTER the external ide in a parameter entity reference', () => {
            const vals = [undefined, undefined, { tokens: [] }];
            parseUnexpanded.mockImplementation((source, propName, cb) => {
               const next = vals.shift();
               cb(next ? { ...next, propName } : undefined);
            });
            parseExternalId.mockImplementation((mockSource, term, cb) => {
               cb({ externalId: {}, nextPropName: undefined });
            });
            const mockSource = new MockSTokenSource([
               ['%', 'match', '%'],
               [' ', 'space'],
               ['entityName', 'word', ['>', '"', "'", ';']],
               [' ', 'space'],
               ['S', 'peekChar'], // system
               ['\t', 'space'],
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
               externalIdSpace: toSToken('\t'),
               unexpanded: {
                  propName: 'trailing',
                  tokens: [],
               },
               close: toSToken('>'),
            });
         });

         it('returns an unexpanded value when finding a PE Ref at the NDATA', () => {
            const vals = [undefined, undefined, { tokens: [] }];
            parseUnexpanded.mockImplementation((source, propName, cb) => {
               const next = vals.shift();
               cb(next ? { ...next, propName } : undefined);
            });
            parseExternalId.mockImplementation((mockSource, term, cb) => {
               cb({ externalId: {}, nextPropName: undefined });
            });
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
            parseUnexpanded.mockImplementation((source, propName, cb) => {
               const next = vals.shift();
               cb(next ? { ...next, propName } : undefined);
            });
            parseExternalId.mockImplementation((mockSource, term, cb) => {
               cb({ externalId: {}, nextPropName: undefined });
            });
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

         it('returns an unexpanded value when finding a PE Ref after the NDATA name', () => {
            const vals = [undefined, undefined, undefined, undefined, { tokens: [] }];
            parseUnexpanded.mockImplementation((source, propName, cb) => {
               const next = vals.shift();
               cb(next ? { ...next, propName } : undefined);
            });
            parseExternalId.mockImplementation((mockSource, term, cb) => {
               cb({ externalId: {}, nextPropName: undefined });
            });
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
               ['theName', 'word', ['>']],
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
               nDataName: toSToken('theName'),
               nDataNameSpace: toSToken(' '),
               unexpanded: {
                  propName: 'trailing',
                  tokens: [],
               },
               close: toSToken('>'),
            });
         });
      });
   });

   describe('resumeParseEntityDeclaration()', () => {
      let result: GeneralEntityDeclarationPToken | ParameterEntityDeclarationPToken | undefined;

      function getResult(value: GeneralEntityDeclarationPToken | ParameterEntityDeclarationPToken) {
         result = value;
      }

      it('returns the original token if there is no unexpanded value', () => {
         const geRef = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('anEntity'),
            nameSpace: toSToken(' '),
            close: toSToken('>'),
         });
         const mockSource = new MockSTokenSource([]);

         resumeParseEntityDeclaration(mockSource, geRef, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toBe(geRef);
      });

      it('returns a separate but equal token when given a bogus prop name', () => {
         const geRef = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('anEntity'),
            nameSpace: toSToken(' '),
            close: toSToken('>'),
            unexpanded: {
               propName: 'bogus',
               tokens: [],
            },
         });
         const mockSource = new MockSTokenSource([
            [undefined, 'space'],
            [undefined, 'all'],
         ]);

         resumeParseEntityDeclaration(mockSource, geRef, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqual(geRef);
         expect(result).not.toBe(geRef);
      });

      it('adds a trailing space if this has an ndata name', () => {
         const geRef = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('anEntity'),
            nameSpace: toSToken(' '),
            nData: toSToken('NDATA'),
            nDataSpace: toSToken('\n'),
            nDataName: toSToken('NData!'),
            nDataNameSpace: toSToken('\t'),
            close: toSToken('>'),
            unexpanded: {
               propName: 'trailing',
               tokens: [],
            },
         });
         const mockSource = new MockSTokenSource([
            ['\n', 'space'],
            [undefined, 'all'],
         ]);

         resumeParseEntityDeclaration(mockSource, geRef, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new GeneralEntityDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('anEntity'),
               nameSpace: toSToken(' '),
               close: toSToken('>'),
               nData: toSToken('NDATA'),
               nDataSpace: toSToken('\n'),
               nDataName: toSToken('NData!'),
               nDataNameSpace: toSToken('\t\n'),
               unexpanded: {
                  propName: 'trailing',
                  tokens: [],
               },
            }),
         );
      });

      it('adds an nDataName when the prop is nDataName', () => {
         const geRef = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('anEntity'),
            nameSpace: toSToken(' '),
            close: toSToken('>'),
            unexpanded: {
               propName: 'nDataName',
               tokens: [],
            },
         });
         const mockSource = new MockSTokenSource([
            ['\n', 'space'],
            ['NData!', 'word', ['>']],
            ['\t', 'space'],
            [undefined, 'all'],
         ]);

         resumeParseEntityDeclaration(mockSource, geRef, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new GeneralEntityDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('anEntity'),
               nameSpace: toSToken(' '),
               close: toSToken('>'),
               nDataSpace: toSToken('\n'),
               nDataName: toSToken('NData!'),
               nDataNameSpace: toSToken('\t'),
               unexpanded: {
                  propName: 'nDataName',
                  tokens: [],
               },
            }),
         );
      });

      it('adds extra when there is text after all the rest', () => {
         const geRef = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('anEntity'),
            nameSpace: toSToken(' '),
            close: toSToken('>'),
            unexpanded: {
               propName: 'nDataName',
               tokens: [],
            },
         });
         const mockSource = new MockSTokenSource([
            ['\n', 'space'],
            ['NData!', 'word', ['>']],
            ['\t', 'space'],
            ['zowie', 'all'],
         ]);

         resumeParseEntityDeclaration(mockSource, geRef, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new GeneralEntityDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('anEntity'),
               nameSpace: toSToken(' '),
               close: toSToken('>'),
               nDataSpace: toSToken('\n'),
               nDataName: toSToken('NData!'),
               nDataNameSpace: toSToken('\t'),
               extra: toSToken('zowie'),
               unexpanded: {
                  propName: 'nDataName',
                  tokens: [],
               },
            }),
         );
      });

      it('adds an nData when the prop is nData', () => {
         const geRef = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('anEntity'),
            nameSpace: toSToken(' '),
            close: toSToken('>'),
            unexpanded: {
               propName: 'nData',
               tokens: [],
            },
         });
         const mockSource = new MockSTokenSource([
            ['\n', 'space'],
            ['ndata', 'peekWord'],
            ['ndata', 'word'],
            ['\r', 'space'],
            ['NData!', 'word', ['>']],
            [undefined, 'space'],
            [undefined, 'all'],
         ]);

         resumeParseEntityDeclaration(mockSource, geRef, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new GeneralEntityDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('anEntity'),
               nameSpace: toSToken(' '),
               close: toSToken('>'),
               externalIdSpace: toSToken('\n'),
               nData: toSToken('ndata'),
               nDataSpace: toSToken('\r'),
               nDataName: toSToken('NData!'),
               nDataNameSpace: undefined,
               unexpanded: {
                  propName: 'nData',
                  tokens: [],
               },
            }),
         );
      });

      it('does not add an nData when the prop is nData but the next value is not some form of "ndata"', () => {
         const geRef = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('anEntity'),
            nameSpace: toSToken(' '),
            close: toSToken('>'),
            unexpanded: {
               propName: 'nData',
               tokens: [],
            },
         });
         const mockSource = new MockSTokenSource([
            ['\n', 'space'],
            ['nope', 'peekWord'],
            [undefined, 'all'],
         ]);

         resumeParseEntityDeclaration(mockSource, geRef, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new GeneralEntityDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('anEntity'),
               nameSpace: toSToken(' '),
               close: toSToken('>'),
               externalIdSpace: toSToken('\n'),
               unexpanded: {
                  propName: 'nData',
                  tokens: [],
               },
            }),
         );
      });

      it('adds an externalId if nextPRop is externalIdOrValue and we can find an external ID', () => {
         const geRef = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('anEntity'),
            nameSpace: toSToken(' '),
            close: toSToken('>'),
            unexpanded: {
               propName: 'nData',
               tokens: [],
            },
         });
         const mockSource = new MockSTokenSource([
            ['\n', 'space'],
            ['nope', 'peekWord'],
            [undefined, 'all'],
         ]);

         resumeParseEntityDeclaration(mockSource, geRef, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new GeneralEntityDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('anEntity'),
               nameSpace: toSToken(' '),
               close: toSToken('>'),
               externalIdSpace: toSToken('\n'),
               unexpanded: {
                  propName: 'nData',
                  tokens: [],
               },
            }),
         );
      });

      it('adds an externalId if nextProp is externalIdOrValue and we can find an external ID', () => {
         const geRef = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('anEntity'),
            nameSpace: toSToken(' '),
            close: toSToken('>'),
            unexpanded: {
               propName: 'externalIdOrValue',
               tokens: [],
            },
         });
         const mockSource = new MockSTokenSource([
            ['\n', 'space'],
            ['\t', 'space'],
            ['ndata', 'peekWord'],
            ['ndata', 'word'],
            ['\r', 'space'],
            ['NData!', 'word', ['>']],
            [undefined, 'space'],
            [undefined, 'all'],
         ]);
         parseExternalId.mockImplementation((sTokenSource, terminators, cb) => {
            cb({
               externalId: {},
            });
         });

         resumeParseEntityDeclaration(mockSource, geRef, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new GeneralEntityDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('anEntity'),
               nameSpace: toSToken(' \n'),
               close: toSToken('>'),
               externalId: {},
               externalIdSpace: toSToken('\t'),
               nData: toSToken('ndata'),
               nDataSpace: toSToken('\r'),
               nDataName: toSToken('NData!'),
               nDataNameSpace: undefined,
               unexpanded: {
                  propName: 'externalIdOrValue',
                  tokens: [],
               },
            }),
         );
      });

      it('adds blank space after the external ID if this is parameter entity and the propname is trailing', () => {
         const peRef = new ParameterEntityDeclarationPToken({
            open: toSToken('<!'),
            parameter: toSToken('%'),
            name: toSToken('anEntity'),
            nameSpace: toSToken(' '),
            externalId: {},
            externalIdSpace: toSToken(' '),
            close: toSToken('>'),
            unexpanded: {
               propName: 'trailing',
               tokens: [],
            },
         });
         const mockSource = new MockSTokenSource([
            ['\n', 'space'],
            [undefined, 'all'],
         ]);

         resumeParseEntityDeclaration(mockSource, peRef, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new ParameterEntityDeclarationPToken({
               open: toSToken('<!'),
               parameter: toSToken('%'),
               name: toSToken('anEntity'),
               nameSpace: toSToken(' '),
               close: toSToken('>'),
               externalId: {},
               externalIdSpace: toSToken(' \n'),
               unexpanded: {
                  propName: 'trailing',
                  tokens: [],
               },
            }),
         );
      });

      it('does not try to add an ndata if this is a parameter entity', () => {
         const peRef = new ParameterEntityDeclarationPToken({
            open: toSToken('<!'),
            parameter: toSToken('%'),
            name: toSToken('anEntity'),
            nameSpace: toSToken(' '),
            close: toSToken('>'),
            unexpanded: {
               propName: 'externalIdOrValue',
               tokens: [],
            },
         });
         const mockSource = new MockSTokenSource([
            ['\n', 'space'],
            ['\t', 'space'],
            [undefined, 'all'],
         ]);
         parseExternalId.mockImplementation((sTokenSource, terminators, cb) => {
            cb({
               externalId: {},
            });
         });

         resumeParseEntityDeclaration(mockSource, peRef, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new ParameterEntityDeclarationPToken({
               open: toSToken('<!'),
               parameter: toSToken('%'),
               name: toSToken('anEntity'),
               nameSpace: toSToken(' \n'),
               close: toSToken('>'),
               externalId: {},
               externalIdSpace: toSToken('\t'),
               unexpanded: {
                  propName: 'externalIdOrValue',
                  tokens: [],
               },
            }),
         );
      });

      it('adds a trailing space after the value if value is defined and the propName is trailing', () => {
         const geRef = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('anEntity'),
            nameSpace: toSToken(' '),
            openQuote: toSToken('"'),
            value: [],
            closeQuote: toSToken('"'),
            valueSpace: toSToken('\t'),
            close: toSToken('>'),
            unexpanded: {
               propName: 'trailing',
               tokens: [],
            },
         });
         const mockSource = new MockSTokenSource([
            ['\n', 'space'],
            [undefined, 'all'],
         ]);

         resumeParseEntityDeclaration(mockSource, geRef, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new GeneralEntityDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('anEntity'),
               nameSpace: toSToken(' '),
               openQuote: toSToken('"'),
               value: [],
               closeQuote: toSToken('"'),
               valueSpace: toSToken('\t\n'),
               close: toSToken('>'),
               unexpanded: {
                  propName: 'trailing',
                  tokens: [],
               },
            }),
         );
      });

      it('adds a value if the propName is value', () => {
         const peRef = new ParameterEntityDeclarationPToken({
            open: toSToken('<!'),
            parameter: toSToken('%'),
            name: toSToken('anEntity'),
            nameSpace: toSToken(' '),
            close: toSToken('>'),
            unexpanded: {
               propName: 'value',
               tokens: [],
            },
         });
         const mockSource = new MockSTokenSource([
            ['\n', 'space'],
            ['\t', 'space'],
            [undefined, 'all'],
         ]);
         literalParse.mockImplementation(
            (_1, stuff, callback: (result?: LiteralPToken) => void) => {
               callback({
                  ...stuff?.pToken,
                  openQuote: toSToken('"'),
                  value: [],
                  closeQuote: toSToken('"'),
               });
            },
         );

         resumeParseEntityDeclaration(mockSource, peRef, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new ParameterEntityDeclarationPToken({
               open: toSToken('<!'),
               parameter: toSToken('%'),
               name: toSToken('anEntity'),
               nameSpace: toSToken(' \n'),
               close: toSToken('>'),
               openQuote: toSToken('"'),
               value: [],
               closeQuote: toSToken('"'),
               valueSpace: toSToken('\t'),
               unexpanded: {
                  propName: 'value',
                  tokens: [],
               },
            }),
         );
      });

      it('adds a value if the propName is entityIdOrLiteral and there is no entity id', () => {
         const peRef = new ParameterEntityDeclarationPToken({
            open: toSToken('<!'),
            parameter: toSToken('%'),
            name: toSToken('anEntity'),
            nameSpace: toSToken(' '),
            close: toSToken('>'),
            unexpanded: {
               propName: 'externalIdOrValue',
               tokens: [],
            },
         });
         const mockSource = new MockSTokenSource([
            ['\n', 'space'],
            ['\t', 'space'],
            [undefined, 'all'],
         ]);
         literalParse.mockImplementation(
            (_1, stuff, callback: (result?: LiteralPToken) => void) => {
               callback({
                  ...stuff?.pToken,
                  openQuote: toSToken('"'),
                  value: [],
                  closeQuote: toSToken('"'),
               });
            },
         );

         resumeParseEntityDeclaration(mockSource, peRef, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new ParameterEntityDeclarationPToken({
               open: toSToken('<!'),
               parameter: toSToken('%'),
               name: toSToken('anEntity'),
               nameSpace: toSToken(' \n'),
               close: toSToken('>'),
               openQuote: toSToken('"'),
               value: [],
               closeQuote: toSToken('"'),
               valueSpace: toSToken('\t'),
               unexpanded: {
                  propName: 'externalIdOrValue',
                  tokens: [],
               },
            }),
         );
      });

      it('adds a name if the value is name and sets up leading space after parameter', () => {
         const peRef = new ParameterEntityDeclarationPToken({
            open: toSToken('<!'),
            parameter: toSToken('%'),
            close: toSToken('>'),
            unexpanded: {
               propName: 'name',
               tokens: [],
            },
         });
         const mockSource = new MockSTokenSource([
            ['\n', 'space'],
            ['theName', 'word'],
            ['\t', 'space'],
            [undefined, 'all'],
         ]);

         resumeParseEntityDeclaration(mockSource, peRef, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new ParameterEntityDeclarationPToken({
               open: toSToken('<!'),
               parameter: toSToken('%'),
               parameterSpace: toSToken('\n'),
               name: toSToken('theName'),
               nameSpace: toSToken('\t'),
               close: toSToken('>'),
               unexpanded: {
                  propName: 'name',
                  tokens: [],
               },
            }),
         );
      });

      it('adds a name if the value is name and sets up leading space after declaration if this is not a parameter entity', () => {
         const peRef = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            close: toSToken('>'),
            unexpanded: {
               propName: 'name',
               tokens: [],
            },
         });
         const mockSource = new MockSTokenSource([
            ['\n', 'space'],
            ['theName', 'word'],
            ['\t', 'space'],
            [undefined, 'all'],
         ]);

         resumeParseEntityDeclaration(mockSource, peRef, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new GeneralEntityDeclarationPToken({
               open: toSToken('<!'),
               declTypeSpace: toSToken('\n'),
               name: toSToken('theName'),
               nameSpace: toSToken('\t'),
               close: toSToken('>'),
               unexpanded: {
                  propName: 'name',
                  tokens: [],
               },
            }),
         );
      });

      it('adds a parameter when propName is parameter, in the process changing the token type', () => {
         const peRef = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            close: toSToken('>'),
            unexpanded: {
               propName: 'parameter',
               tokens: [],
            },
         });
         const mockSource = new MockSTokenSource([
            ['\n', 'space'],
            ['%', 'match'],
            ['\r\n', 'space'],
            ['theName', 'word'],
            ['\t', 'space'],
            [undefined, 'all'],
         ]);

         resumeParseEntityDeclaration(mockSource, peRef, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new ParameterEntityDeclarationPToken({
               open: toSToken('<!'),
               declTypeSpace: toSToken('\n'),
               parameter: toSToken('%'),
               parameterSpace: toSToken('\r\n'),
               name: toSToken('theName'),
               nameSpace: toSToken('\t'),
               close: toSToken('>'),
               unexpanded: {
                  propName: 'parameter',
                  tokens: [],
               },
            }),
         );
      });

      it('can produce an entire parameter entity token from "nothing"', () => {
         const peRef = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            close: toSToken('>'),
            unexpanded: {
               propName: 'parameter',
               tokens: [],
            },
         });
         const mockSource = new MockSTokenSource([
            ['\n', 'space'],
            ['%', 'match'],
            ['\r\n', 'space'],
            ['theName', 'word'],
            ['\t', 'space'],
            ['\t\t', 'space'],
            ['stuff', 'all'],
         ]);
         literalParse.mockImplementation(
            (_1, stuff, callback: (result?: LiteralPToken) => void) => {
               callback({
                  ...stuff?.pToken,
                  openQuote: toSToken('"'),
                  value: [],
                  closeQuote: toSToken('"'),
               });
            },
         );

         resumeParseEntityDeclaration(mockSource, peRef, getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(
            new ParameterEntityDeclarationPToken({
               open: toSToken('<!'),
               declTypeSpace: toSToken('\n'),
               parameter: toSToken('%'),
               parameterSpace: toSToken('\r\n'),
               name: toSToken('theName'),
               nameSpace: toSToken('\t'),
               openQuote: toSToken('"'),
               value: [],
               closeQuote: toSToken('"'),
               valueSpace: toSToken('\t\t'),
               extra: toSToken('stuff'),
               close: toSToken('>'),
               unexpanded: {
                  propName: 'parameter',
                  tokens: [],
               },
            }),
         );
      });
   });
});
