/* Copyright ® 2020-2026 by 柏大衛. All rights reserved. */

import { STokenSource, toSToken } from 'basic';
import { MockSTokenSource } from 'pToken-test';
import { describe, expect, it } from 'vitest';

import * as textStuff from '../../../pToken/token/text';
import * as peRefStuff from '../../token/parameterEntityReference';
import { ParameterEntityReferencePToken } from '../../token/parameterEntityReference';
import { TextPToken } from '../../token/text';
import { parseUnexpanded, parseUnexpandedAfterPeRef } from '../parseUnexpanded';

describe('parseUnexpanded (unit)', () => {
   let peRef: ParameterEntityReferencePToken;
   let textPToken: TextPToken;

   beforeEach(() => {
      peRef = new ParameterEntityReferencePToken({ open: toSToken('%') });
      textPToken = new TextPToken({ text: toSToken('x') });
   });

   it('returns nothing if the first character found is not a %', () =>
      new Promise<void>((done) => {
         const mockSource: MockSTokenSource = new MockSTokenSource([['x', 'peekChar']]);

         parseUnexpanded(mockSource, 'foo', (result) => {
            expect(result).toBeUndefined();
            done();
         });

         mockSource.respondInAsyncTime();
      }));

   it('returns nothing if the first % is not part of a parameter entity', () =>
      new Promise<void>((done) => {
         vi.spyOn(peRefStuff, 'parseParameterEntityReference').mockImplementation(
            (src: STokenSource, cb: (x: ParameterEntityReferencePToken | undefined) => void) => {
               cb(undefined);
            },
         );
         const mockSource: MockSTokenSource = new MockSTokenSource([['%', 'peekChar']]);

         parseUnexpanded(mockSource, 'foo', (result) => {
            expect(result).toEqual({
               propName: 'foo',
               tokens: [],
            });
            done();
         });

         mockSource.respondInAsyncTime();
      }));

   it('returns a preref intermediate text, and then nothing if the text is not followed by a %', () =>
      new Promise<void>((done) => {
         const peRefResults = [peRef];
         const textResults = [textPToken, undefined];
         vi.spyOn(peRefStuff, 'parseParameterEntityReference').mockImplementation(
            (src: STokenSource, cb: (x: ParameterEntityReferencePToken | undefined) => void) => {
               cb(peRefResults.shift());
            },
         );
         vi.spyOn(textStuff, 'parseText').mockImplementation(
            (
               src: STokenSource,
               terms: ReadonlyArray<string>,
               cb: (x: TextPToken | undefined) => void,
            ) => {
               cb(textResults.shift());
            },
         );
         const mockSource: MockSTokenSource = new MockSTokenSource([
            ['%', 'peekChar'],
            ['"', 'peekChar'],
            ['"', 'match', '"'],
            ['hi', 'all'],
            ['"', 'match', '"'],
            ['>', 'peekChar'],
         ]);

         parseUnexpanded(mockSource, 'foo', (result) => {
            // @ts-expect-error 2329/matchers
            expect(result).toEqualRangeless({
               propName: 'foo',
               tokens: [
                  new ParameterEntityReferencePToken({ open: toSToken('%') }),
                  textPToken,
                  new TextPToken({ text: toSToken('"') }),
                  new TextPToken({ text: toSToken('hi') }),
                  new TextPToken({ text: toSToken('"') }),
               ],
            });
            done();
         });

         mockSource.respondInAsyncTime();
      }));

   it('returns a series of peref+text segments until no peref is found', () =>
      new Promise<void>((done) => {
         const peRefResults = [peRef, peRef];
         const textResults = [textPToken, undefined, textPToken];
         vi.spyOn(peRefStuff, 'parseParameterEntityReference').mockImplementation(
            (src: STokenSource, cb: (x: ParameterEntityReferencePToken | undefined) => void) => {
               cb(peRefResults.shift());
            },
         );
         vi.spyOn(textStuff, 'parseText').mockImplementation(
            (
               src: STokenSource,
               terms: ReadonlyArray<string>,
               cb: (x: TextPToken | undefined) => void,
            ) => {
               cb(textResults.shift());
            },
         );
         const mockSource: MockSTokenSource = new MockSTokenSource([
            ['%', 'peekChar'],
            ['"', 'peekChar'],
            ['"', 'match', '"'],
            ['hi', 'all'],
            ['"', 'match', '"'],
            ['%', 'peekChar'],
            // outer loop
            ['"', 'peekChar'],
            ['"', 'match', '"'],
            ['hi', 'all'],
            ['"', 'match', '"'],
            ['>', 'peekChar'],
         ]);

         parseUnexpanded(mockSource, 'foo', (result) => {
            // @ts-expect-error 2329/matchers
            expect(result).toEqualRangeless({
               propName: 'foo',
               tokens: [
                  new ParameterEntityReferencePToken({ open: toSToken('%') }),
                  textPToken,
                  new TextPToken({ text: toSToken('"') }),
                  new TextPToken({ text: toSToken('hi') }),
                  new TextPToken({ text: toSToken('"') }),
                  new ParameterEntityReferencePToken({ open: toSToken('%') }),
                  textPToken,
                  new TextPToken({ text: toSToken('"') }),
                  new TextPToken({ text: toSToken('hi') }),
                  new TextPToken({ text: toSToken('"') }),
               ],
            });
            done();
         });

         mockSource.respondInAsyncTime();
      }));

   it('returns a peref followed by a series text segments', () =>
      new Promise<void>((done) => {
         const peRefResults = [peRef];
         const textResults = [textPToken, textPToken];
         vi.spyOn(peRefStuff, 'parseParameterEntityReference').mockImplementation(
            (src: STokenSource, cb: (x: ParameterEntityReferencePToken | undefined) => void) => {
               cb(peRefResults.shift());
            },
         );
         vi.spyOn(textStuff, 'parseText').mockImplementation(
            (
               src: STokenSource,
               terms: ReadonlyArray<string>,
               cb: (x: TextPToken | undefined) => void,
            ) => {
               cb(textResults.shift());
            },
         );
         const mockSource: MockSTokenSource = new MockSTokenSource([
            ['%', 'peekChar'],
            ['"', 'peekChar'],
            ['"', 'match', '"'],
            ['hi', 'all'],
            ['"', 'match', '"'],
            ['x', 'peekChar'],
            ['"', 'peekChar'],
            ['"', 'match', '"'],
            ['hi', 'all'],
            ['"', 'match', '"'],
            ['>', 'peekChar'],
         ]);

         parseUnexpanded(mockSource, 'foo', (result) => {
            // @ts-expect-error 2329/matchers
            expect(result).toEqualRangeless({
               propName: 'foo',
               tokens: [
                  new ParameterEntityReferencePToken({ open: toSToken('%') }),
                  textPToken,
                  new TextPToken({ text: toSToken('"') }),
                  new TextPToken({ text: toSToken('hi') }),
                  new TextPToken({ text: toSToken('"') }),
                  textPToken,
                  new TextPToken({ text: toSToken('"') }),
                  new TextPToken({ text: toSToken('hi') }),
                  new TextPToken({ text: toSToken('"') }),
               ],
            });
            done();
         });

         mockSource.respondInAsyncTime();
      }));

   it('returns a series of perefs when no intermediate text', () =>
      new Promise<void>((done) => {
         const peRefResults = [peRef, peRef];
         vi.spyOn(peRefStuff, 'parseParameterEntityReference').mockImplementation(
            (src: STokenSource, cb: (x: ParameterEntityReferencePToken | undefined) => void) => {
               cb(peRefResults.shift());
            },
         );
         vi.spyOn(textStuff, 'parseText').mockImplementation(
            (
               src: STokenSource,
               terms: ReadonlyArray<string>,
               cb: (x: TextPToken | undefined) => void,
            ) => {
               cb(undefined);
            },
         );
         const mockSource: MockSTokenSource = new MockSTokenSource([
            ['%', 'peekChar'],
            [undefined, 'peekChar'],
            [undefined, 'peekChar'],
            [undefined, 'peekChar'],
         ]);

         parseUnexpanded(mockSource, 'foo', (result) => {
            // @ts-expect-error 2329/matchers
            expect(result).toEqualRangeless({
               propName: 'foo',
               tokens: [
                  new ParameterEntityReferencePToken({ open: toSToken('%') }),
                  new ParameterEntityReferencePToken({ open: toSToken('%') }),
               ],
            });
            done();
         });

         mockSource.respondInAsyncTime();
      }));

   it('returns a series of perefs followed by text but stops when the next char is >', () =>
      new Promise<void>((done) => {
         const peRefResults = [peRef];
         const textResults = [textPToken];
         vi.spyOn(peRefStuff, 'parseParameterEntityReference').mockImplementation(
            (src: STokenSource, cb: (x: ParameterEntityReferencePToken | undefined) => void) => {
               cb(peRefResults.shift());
            },
         );
         vi.spyOn(textStuff, 'parseText').mockImplementation(
            (
               src: STokenSource,
               terms: ReadonlyArray<string>,
               cb: (x: TextPToken | undefined) => void,
            ) => {
               cb(textResults.shift());
            },
         );
         const mockSource: MockSTokenSource = new MockSTokenSource([
            ['%', 'peekChar'],
            ['>', 'peekChar'],
            ['>', 'peekChar'],
         ]);

         parseUnexpanded(mockSource, 'foo', (result) => {
            // @ts-expect-error 2329/matchers
            expect(result).toEqualRangeless({
               propName: 'foo',
               tokens: [new ParameterEntityReferencePToken({ open: toSToken('%') }), textPToken],
            });
            done();
         });

         mockSource.respondInAsyncTime();
      }));

   it('returns a series of perefs followed by text but stops when the next char is ]', () =>
      new Promise<void>((done) => {
         const peRefResults = [peRef];
         const textResults = [textPToken];
         vi.spyOn(peRefStuff, 'parseParameterEntityReference').mockImplementation(
            (src: STokenSource, cb: (x: ParameterEntityReferencePToken | undefined) => void) => {
               cb(peRefResults.shift());
            },
         );
         vi.spyOn(textStuff, 'parseText').mockImplementation(
            (
               src: STokenSource,
               terms: ReadonlyArray<string>,
               cb: (x: TextPToken | undefined) => void,
            ) => {
               cb(textResults.shift());
            },
         );
         const mockSource: MockSTokenSource = new MockSTokenSource([
            ['%', 'peekChar'],
            [']', 'peekChar'],
            ['>', 'peekChar'],
         ]);

         parseUnexpanded(mockSource, 'foo', (result) => {
            // @ts-expect-error 2329/matchers
            expect(result).toEqualRangeless({
               propName: 'foo',
               tokens: [new ParameterEntityReferencePToken({ open: toSToken('%') }), textPToken],
            });
            done();
         });

         mockSource.respondInAsyncTime();
      }));

   it('returns a peref followed by a quote and then another quote', () =>
      new Promise<void>((done) => {
         const peRefResults = [peRef];
         const textResults: Array<TextPToken> = [];
         vi.spyOn(peRefStuff, 'parseParameterEntityReference').mockImplementation(
            (src: STokenSource, cb: (x: ParameterEntityReferencePToken | undefined) => void) => {
               cb(peRefResults.shift());
            },
         );
         vi.spyOn(textStuff, 'parseText').mockImplementation(
            (
               src: STokenSource,
               terms: ReadonlyArray<string>,
               cb: (x: TextPToken | undefined) => void,
            ) => {
               cb(textResults.shift());
            },
         );
         const mockSource: MockSTokenSource = new MockSTokenSource([
            ['%', 'peekChar'],
            ["'", 'peekChar'],
            ["'", 'match', ["'"]],
            [undefined, 'all', ["'"]],
            ["'", 'match', ["'"]],
            ['>', 'peekChar'],
         ]);

         parseUnexpanded(mockSource, 'foo', (result) => {
            // @ts-expect-error 2329/matchers
            expect(result).toEqualRangeless({
               propName: 'foo',
               tokens: [
                  new ParameterEntityReferencePToken({ open: toSToken('%') }),
                  new TextPToken({ text: toSToken("'") }),
                  new TextPToken({ text: toSToken("'") }),
               ],
            });
            done();
         });

         mockSource.respondInAsyncTime();
      }));

   describe('parseUnexpandedAfterPeRef', () => {
      it('returns any text and no peref if there is none', () =>
         new Promise<void>((done) => {
            const textResults: Array<TextPToken> = [textPToken];
            vi.spyOn(textStuff, 'parseText').mockImplementation(
               (
                  src: STokenSource,
                  terms: ReadonlyArray<string>,
                  cb: (x: TextPToken | undefined) => void,
               ) => {
                  cb(textResults.shift());
               },
            );
            const mockSource: MockSTokenSource = new MockSTokenSource([
               [undefined, 'peekChar'],
               [undefined, 'peekChar'],
               [undefined, 'peekChar'],
            ]);

            parseUnexpandedAfterPeRef(mockSource, 'foo', (result) => {
               // @ts-expect-error 2329/matchers
               expect(result).toEqualRangeless({
                  propName: 'foo',
                  tokens: [textPToken],
               });
               done();
            });

            mockSource.respondInAsyncTime();
         }));

      it('returns nothing if neither text nor peref found', () =>
         new Promise<void>((done) => {
            const textResults: Array<TextPToken> = [];
            vi.spyOn(textStuff, 'parseText').mockImplementation(
               (
                  src: STokenSource,
                  terms: ReadonlyArray<string>,
                  cb: (x: TextPToken | undefined) => void,
               ) => {
                  cb(textResults.shift());
               },
            );
            const mockSource: MockSTokenSource = new MockSTokenSource([
               [undefined, 'peekChar'],
               [undefined, 'peekChar'],
               [undefined, 'peekChar'],
            ]);

            parseUnexpandedAfterPeRef(mockSource, 'foo', (result) => {
               expect(result).toBeUndefined();
               done();
            });

            mockSource.respondInAsyncTime();
         }));

      it('returns nothing if neither text nor peref found', () =>
         new Promise<void>((done) => {
            const peRefResults = [peRef];
            const textResults: Array<TextPToken> = [];
            vi.spyOn(peRefStuff, 'parseParameterEntityReference').mockImplementation(
               (src: STokenSource, cb: (x: ParameterEntityReferencePToken | undefined) => void) => {
                  cb(peRefResults.shift());
               },
            );
            vi.spyOn(textStuff, 'parseText').mockImplementation(
               (
                  src: STokenSource,
                  terms: ReadonlyArray<string>,
                  cb: (x: TextPToken | undefined) => void,
               ) => {
                  cb(textResults.shift());
               },
            );
            const mockSource: MockSTokenSource = new MockSTokenSource([
               [undefined, 'peekChar'],
               ['%', 'peekChar'],
               [undefined, 'peekChar'],
            ]);

            parseUnexpandedAfterPeRef(mockSource, 'foo', (result) => {
               // @ts-expect-error 2329/matchers
               expect(result).toEqualRangeless({
                  propName: 'foo',
                  tokens: [peRef],
               });
               done();
            });

            mockSource.respondInAsyncTime();
         }));

      it('allows for a failure after peek and before retrieval', () =>
         new Promise<void>((done) => {
            const textResults: Array<TextPToken> = [textPToken];
            vi.spyOn(peRefStuff, 'parseParameterEntityReference').mockImplementation(
               (src: STokenSource, cb: (x: ParameterEntityReferencePToken | undefined) => void) => {
                  cb(undefined);
               },
            );
            vi.spyOn(textStuff, 'parseText').mockImplementation(
               (
                  src: STokenSource,
                  terms: ReadonlyArray<string>,
                  cb: (x: TextPToken | undefined) => void,
               ) => {
                  cb(textResults.shift());
               },
            );
            const mockSource: MockSTokenSource = new MockSTokenSource([
               ["'", 'peekChar'],
               [undefined, 'match', ["'"]],
               [undefined, 'all', ["'"]],
               [undefined, 'match', ["'"]],
               [undefined, 'peekChar'],
               [undefined, 'peekChar'],
            ]);

            parseUnexpandedAfterPeRef(mockSource, 'foo', (result) => {
               // @ts-expect-error 2329/matchers
               expect(result).toEqualRangeless({
                  propName: 'foo',
                  tokens: [textPToken],
               });
               done();
            });

            mockSource.respondInAsyncTime();
         }));
   });
});
