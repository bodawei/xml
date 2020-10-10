/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { STokenSource, toSToken } from 'sToken';
import { MockSTokenSource } from 'sToken-test';

import * as tokenStuff from 'token';
import { ParameterEntityReferencePToken, TextPToken } from 'token';

import { parseUnexpanded } from '../parseUnexpanded';

describe('parseUnexpanded (unit)', () => {
   let peRef: ParameterEntityReferencePToken;
   let textPToken: TextPToken;

   beforeEach(() => {
      peRef = new ParameterEntityReferencePToken({ open: toSToken('%') });
      textPToken = new TextPToken({ text: toSToken('x') });
   });

   it('returns nothing if the first character found is not a %', (done) => {
      const mockSource: MockSTokenSource = new MockSTokenSource([['x', 'peekChar']]);

      parseUnexpanded(mockSource, 'foo', (result) => {
         expect(result).toBeUndefined();
         done();
      });

      mockSource.respondInAsyncTime();
   });

   it('returns nothing if the first % is not part of a parameter entity', (done) => {
      spyOn(tokenStuff, 'parseParameterEntityReference').and.callFake(
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
   });

   it('returns a preref intermediate text, and then nothing if the text is not followed by a %', (done) => {
      const peRefResults = [peRef];
      const textResults = [textPToken, undefined];
      spyOn(tokenStuff, 'parseParameterEntityReference').and.callFake(
         (src: STokenSource, cb: (x: ParameterEntityReferencePToken | undefined) => void) => {
            cb(peRefResults.shift());
         },
      );
      spyOn(tokenStuff, 'parseText').and.callFake(
         (src: STokenSource, terms: Array<string>, cb: (x: TextPToken | undefined) => void) => {
            cb(textResults.shift());
         },
      );
      const mockSource: MockSTokenSource = new MockSTokenSource([
         ['%', 'peekChar'],
         ['"', 'peekChar'],
         ['"', 'match', ['"']],
         ['hi', 'all'],
         ['"', 'match', ['"']],
         ['>', 'peekChar'],
      ]);

      parseUnexpanded(mockSource, 'foo', (result) => {
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
   });

   it('returns a series of peref+text segments until no peref is found', (done) => {
      const peRefResults = [peRef, peRef];
      const textResults = [textPToken, undefined, textPToken];
      spyOn(tokenStuff, 'parseParameterEntityReference').and.callFake(
         (src: STokenSource, cb: (x: ParameterEntityReferencePToken | undefined) => void) => {
            cb(peRefResults.shift());
         },
      );
      spyOn(tokenStuff, 'parseText').and.callFake(
         (src: STokenSource, terms: Array<string>, cb: (x: TextPToken | undefined) => void) => {
            cb(textResults.shift());
         },
      );
      const mockSource: MockSTokenSource = new MockSTokenSource([
         ['%', 'peekChar'],
         ['"', 'peekChar'],
         ['"', 'match', ['"']],
         ['hi', 'all'],
         ['"', 'match', ['"']],
         ['%', 'peekChar'],
         // outer loop
         ['"', 'peekChar'],
         ['"', 'match', ['"']],
         ['hi', 'all'],
         ['"', 'match', ['"']],
         ['>', 'peekChar'],
      ]);

      parseUnexpanded(mockSource, 'foo', (result) => {
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
   });

   it('returns a peref followed by a series text segments', (done) => {
      const peRefResults = [peRef];
      const textResults = [textPToken, textPToken];
      spyOn(tokenStuff, 'parseParameterEntityReference').and.callFake(
         (src: STokenSource, cb: (x: ParameterEntityReferencePToken | undefined) => void) => {
            cb(peRefResults.shift());
         },
      );
      spyOn(tokenStuff, 'parseText').and.callFake(
         (src: STokenSource, terms: Array<string>, cb: (x: TextPToken | undefined) => void) => {
            cb(textResults.shift());
         },
      );
      const mockSource: MockSTokenSource = new MockSTokenSource([
         ['%', 'peekChar'],
         ['"', 'peekChar'],
         ['"', 'match', ['"']],
         ['hi', 'all'],
         ['"', 'match', ['"']],
         ['x', 'peekChar'],
         ['"', 'peekChar'],
         ['"', 'match', ['"']],
         ['hi', 'all'],
         ['"', 'match', ['"']],
         ['>', 'peekChar'],
      ]);

      parseUnexpanded(mockSource, 'foo', (result) => {
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
   });

   it('returns a series of perefs when no intermediate text', (done) => {
      const peRefResults = [peRef, peRef];
      spyOn(tokenStuff, 'parseParameterEntityReference').and.callFake(
         (src: STokenSource, cb: (x: ParameterEntityReferencePToken | undefined) => void) => {
            cb(peRefResults.shift());
         },
      );
      spyOn(tokenStuff, 'parseText').and.callFake(
         (src: STokenSource, terms: Array<string>, cb: (x: TextPToken | undefined) => void) => {
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
   });

   it('returns a series of perefs followed by text but stops when the next char is >', (done) => {
      const peRefResults = [peRef];
      const textResults = [textPToken];
      spyOn(tokenStuff, 'parseParameterEntityReference').and.callFake(
         (src: STokenSource, cb: (x: ParameterEntityReferencePToken | undefined) => void) => {
            cb(peRefResults.shift());
         },
      );
      spyOn(tokenStuff, 'parseText').and.callFake(
         (src: STokenSource, terms: Array<string>, cb: (x: TextPToken | undefined) => void) => {
            cb(textResults.shift());
         },
      );
      const mockSource: MockSTokenSource = new MockSTokenSource([
         ['%', 'peekChar'],
         ['>', 'peekChar'],
         ['>', 'peekChar'],
      ]);

      parseUnexpanded(mockSource, 'foo', (result) => {
         expect(result).toEqualRangeless({
            propName: 'foo',
            tokens: [new ParameterEntityReferencePToken({ open: toSToken('%') }), textPToken],
         });
         done();
      });

      mockSource.respondInAsyncTime();
   });

   it('returns a peref followed by a quote and then another quote', (done) => {
      const peRefResults = [peRef];
      const textResults: Array<TextPToken> = [];
      spyOn(tokenStuff, 'parseParameterEntityReference').and.callFake(
         (src: STokenSource, cb: (x: ParameterEntityReferencePToken | undefined) => void) => {
            cb(peRefResults.shift());
         },
      );
      spyOn(tokenStuff, 'parseText').and.callFake(
         (src: STokenSource, terms: Array<string>, cb: (x: TextPToken | undefined) => void) => {
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
   });
});
