/* Copyright ® 2015-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { Range, EntityId } from 'basic';
import { CharRefPToken, TextPToken } from 'pToken';
import { SToken, STokenSource } from 'sToken';
import { MockSTokenSource } from 'sToken-test';

import { PTokenLiteralParser } from '../pTokenLiteralParser';

import * as text from '../token/text';
import * as peRef from '../token/parameterEntityReference';
import * as charRef from '../token/charRef';

describe('PTokenLiteralParser (unit)', () => {
   describe('read()', () => {
      it('reports the end of stream if no next character is found', () => {
         const mockSource = new MockSTokenSource([[undefined, 'peekChar']]);
         const pTokenStream = new PTokenLiteralParser(mockSource);
         const handler = jest.fn();

         pTokenStream.parse(handler);
         mockSource.respondInAsyncTime();

         expect(handler).toHaveBeenCalledWith(undefined);
      });

      describe('whitebox api tests', () => {
         it('calls parseParameterEntityReference() if it is to be looking for entity references and finds a %', () => {
            const mockSource = new MockSTokenSource([['%', 'peekChar']]);
            const pTokenStream = new PTokenLiteralParser(mockSource, { peRef: true });
            const parseSpy = spyOn(peRef, 'parseParameterEntityReference');

            pTokenStream.parse(() => {});
            mockSource.respondInAsyncTime();

            expect(parseSpy.calls.argsFor(0)[0]).toEqual(mockSource);
            expect(parseSpy.calls.argsFor(0)[1]).toBeInstanceOf(Function);
         });

         it('calls text.parse with just & if not looking for perefs', () => {
            const aToken = new TextPToken({ text: SToken.fromString('x') });
            const mockSource = new MockSTokenSource([['x', 'peekChar']]);
            const pTokenStream = new PTokenLiteralParser(mockSource, {});
            const parseSpy = spyOn(text, 'parseText');
            const handler = jest.fn();

            pTokenStream.parse(handler);
            mockSource.respondInAsyncTime();

            expect(parseSpy.calls.argsFor(0)[0]).toEqual(mockSource);
            expect(parseSpy.calls.argsFor(0)[1]).toEqual(['&']);
            expect(typeof parseSpy.calls.argsFor(0)[2]).toEqual('function');

            // Cheat slightly and make sure function is good
            parseSpy.calls.argsFor(0)[2](aToken);

            expect(handler).toHaveBeenCalledWith(aToken);
         });

         it('calls text.parse with all terminators if can look for peref', () => {
            const aToken = new TextPToken({ text: SToken.fromString('x') });
            const mockSource = new MockSTokenSource([['x', 'peekChar']]);
            const pTokenStream = new PTokenLiteralParser(mockSource, { peRef: true });
            const parseSpy = spyOn(text, 'parseText');
            const handler = jest.fn();

            pTokenStream.parse(handler);
            mockSource.respondInAsyncTime();

            expect(parseSpy.calls.argsFor(0)[0]).toEqual(mockSource);
            expect(parseSpy.calls.argsFor(0)[1]).toEqual(['&', '%']);
            expect(typeof parseSpy.calls.argsFor(0)[2]).toEqual('function');

            // Cheat slightly and make sure function is good
            parseSpy.calls.argsFor(0)[2](aToken);

            expect(handler).toHaveBeenCalledWith(aToken);
         });

         it('pushes null in the extremely unlikely chance that somehow we peek a character and then can not read it', () => {
            const mockSource = new MockSTokenSource([['x', 'peekChar']]);
            const pTokenStream = new PTokenLiteralParser(mockSource, { peRef: true });
            spyOn(text, 'parseText').and.callFake(
               (source: STokenSource, term: Array<string>, cb: (x?: any) => any) => {
                  cb();
               },
            );
            const handler = jest.fn();

            pTokenStream.parse(handler);
            mockSource.respondInAsyncTime();

            expect(handler).toHaveBeenCalledWith();
         });

         it('calls charRef.parse if &# is found', () => {
            const aToken = new CharRefPToken({ open: SToken.fromString('x') });
            const mockSource = new MockSTokenSource([
               ['&', 'peekChar'],
               ['&#', 'match', '&#'],
            ]);
            const pTokenStream = new PTokenLiteralParser(mockSource, { peRef: true });
            const parseSpy = spyOn(charRef, 'parseCharRef');
            const handler = jest.fn();

            pTokenStream.parse(handler);
            mockSource.respondInAsyncTime();

            expect(parseSpy.calls.argsFor(0)[0]).toEqual(mockSource);
            expect(parseSpy.calls.argsFor(0)[1]).toMatchObject({ str: '&#' });
            expect(typeof parseSpy.calls.argsFor(0)[2]).toEqual('function');

            // Cheat slightly and make sure function is good
            parseSpy.calls.argsFor(0)[2](aToken);

            expect(handler).toHaveBeenCalledWith(aToken);
         });
      });

      it('returns a text token if a & is encountered', () => {
         const mockSource = new MockSTokenSource([
            ['&', 'peekChar'],
            [undefined, 'match', '&#'],
            ['&', 'char'],
         ]);
         const pTokenStream = new PTokenLiteralParser(mockSource, { peRef: true });
         const sToken = new SToken('&', '&', new Range(new EntityId(), 1, 0, 1, 2, 0, 2));
         const handler = jest.fn();

         pTokenStream.parse(handler);
         mockSource.respondInAsyncTime();

         expect(handler).toHaveBeenCalledWith(new TextPToken({ text: sToken }));
      });

      xit('returns a text token if we start off with a < but is not a text declaratoin', () => {
         const mockSource = new MockSTokenSource([
            ['<', 'peekChar'],
            [undefined, 'peekDecl'],
            // now we hit parseText
         ]);
         const pTokenStream = new PTokenLiteralParser(mockSource, { peRef: true });
         const handler = jest.fn();

         pTokenStream.parse(handler);
         mockSource.respondInAsyncTime();

         expect(handler).toHaveBeenCalledWith(mockSource);
      });

      xit('returns a text delaration token if we start off with a < that starts a text delcaration', () => {
         const mockSource = new MockSTokenSource([
            ['<', 'peekChar'],
            ['<?xml ?>', 'peekDecl'],
            ['<?', 'match', '<?'],
            // now we hit parseText
         ]);
         const pTokenStream = new PTokenLiteralParser(mockSource, { peRef: true });
         const handler = jest.fn();

         pTokenStream.parse(handler);
         mockSource.respondInAsyncTime();

         expect(handler).toEqual(mockSource);
      });
   });
});
