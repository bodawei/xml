/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { Range, EntityId } from 'basic';
import { TextPToken } from 'pToken';
import { SToken, STokenSource } from 'sToken';
import { MockSTokenSource } from 'sToken-test';

import { CharRefPToken,  } from 'token';
import PTokenFromLiteralStream from '../PTokenFromLiteralStream';

import * as text from '../../pToken/token/text';
import * as instruction from '../../pToken/bridge/instruction';
import * as peRef from '../../pToken/token/parameterEntityReference';
import * as charRef from '../../token/charRef';

describe('PTokenFromLiteralStream (unit)', () => {

   describe('read()', () => {

      it('reports the end of stream if no next character is found', () => {
         const mockSource = new MockSTokenSource([
            [ undefined, 'peekChar' ],
         ]);
         const pTokenStream = new PTokenFromLiteralStream(mockSource);
         spyOn(pTokenStream, 'push');

         pTokenStream.read();
         mockSource.respondInAsyncTime();

         expect(pTokenStream.push).toHaveBeenCalledWith(null);
      });

      describe ('whitebox api tests', () => {
         it('calls parseParameterEntityReference() if it is to be looking for entity references and finds a %', () => {
            const mockSource = new MockSTokenSource([
               [ '%', 'peekChar' ],
            ]);
            const pTokenStream = new PTokenFromLiteralStream(mockSource, { peRef: true });
            const parseSpy = spyOn(peRef, 'parseParameterEntityReference');

            pTokenStream.read();
            mockSource.respondInAsyncTime();

            expect(parseSpy.calls.argsFor(0)[0]).toEqual(mockSource);
            expect(parseSpy.calls.argsFor(0)[1]).toBeInstanceOf(Function);
         });

         it('calls text.parse with just & if not looking for perefs', () => {
            const aToken = new TextPToken({ text: SToken.fromString('x') });
            const mockSource = new MockSTokenSource([
               [ 'x', 'peekChar' ],
            ]);
            const pTokenStream = new PTokenFromLiteralStream(mockSource, { });
            const parseSpy = spyOn(text, 'parseText');

            pTokenStream.read();
            mockSource.respondInAsyncTime();

            expect(parseSpy.calls.argsFor(0)[0]).toEqual(mockSource);
            expect(parseSpy.calls.argsFor(0)[1]).toEqual([ '&' ]);
            expect(parseSpy.calls.argsFor(0)[2]).toBeInstanceOf(Function);

            // Cheat slightly and make sure function is good
            const pushSpy = spyOn(pTokenStream, 'push');
            parseSpy.calls.argsFor(0)[2](aToken);

            expect(pushSpy).toHaveBeenCalledWith(aToken);
         });

         it('calls text.parse with all terminators if can look for peref', () => {
            const aToken = new TextPToken({ text: SToken.fromString('x') });
            const mockSource = new MockSTokenSource([
               [ 'x', 'peekChar' ],
            ]);
            const pTokenStream = new PTokenFromLiteralStream(mockSource, { peRef: true });
            const parseSpy = spyOn(text, 'parseText');

            pTokenStream.read();
            mockSource.respondInAsyncTime();

            expect(parseSpy.calls.argsFor(0)[0]).toEqual(mockSource);
            expect(parseSpy.calls.argsFor(0)[1]).toEqual([ '&', '%' ]);
            expect(parseSpy.calls.argsFor(0)[2]).toBeInstanceOf(Function);

            // Cheat slightly and make sure function is good
            const pushSpy = spyOn(pTokenStream, 'push');
            parseSpy.calls.argsFor(0)[2](aToken);

            expect(pushSpy).toHaveBeenCalledWith(aToken);
         });

         it('pushes null in the extremely unlikely chance that somehow we peek a character and then can not read it', () => {
            const mockSource = new MockSTokenSource([
               [ 'x', 'peekChar' ],
            ]);
            const pTokenStream = new PTokenFromLiteralStream(mockSource, { peRef: true });
            const parseSpy = spyOn(text, 'parseText').and.callFake((source: STokenSource, term: Array<string>, cb: (x?: any) => any ) => {
               cb();
            });
            const pushSpy = spyOn(pTokenStream, 'push');

            pTokenStream.read();
            mockSource.respondInAsyncTime();

            expect(pushSpy).toHaveBeenCalledWith(null);
         });

         it('calls charRef.parse if &# is found', () => {
            const aToken = new CharRefPToken({ open: SToken.fromString('x') });
            const mockSource = new MockSTokenSource([
               [ '&', 'peekChar' ],
               [ '&#', 'match', '&#' ],
            ]);
            const pTokenStream = new PTokenFromLiteralStream(mockSource, { peRef: true });
            const parseSpy = spyOn(charRef, 'parseCharRef');

            pTokenStream.read();
            mockSource.respondInAsyncTime();

            expect(parseSpy.calls.argsFor(0)[0]).toEqual(mockSource);
            expect(parseSpy.calls.argsFor(0)[1].str).toEqual('&#');
            expect(parseSpy.calls.argsFor(0)[2]).toBeInstanceOf(Function);

            // Cheat slightly and make sure function is good
            const pushSpy = spyOn(pTokenStream, 'push');
            parseSpy.calls.argsFor(0)[2](aToken);

            expect(pushSpy).toHaveBeenCalledWith(aToken);
         });
      });

      it('returns a text token if a & is encountered', () => {
         const mockSource = new MockSTokenSource([
            [ '&', 'peekChar' ],
            [ undefined, 'match', '&#' ],
            [ '&', 'char' ],
         ]);
         const pTokenStream = new PTokenFromLiteralStream(mockSource, { peRef: true });
         const pushSpy = spyOn(pTokenStream, 'push');
         const sToken = new SToken('&', '&', new Range(new EntityId(), 1, 0, 1, 2, 0, 2));

         pTokenStream.read();
         mockSource.respondInAsyncTime();

         expect(pushSpy.calls.argsFor(0)[0]).toEqual(new TextPToken({ text: sToken }));
      });

      it('returns a text token if we start off with a < but is not a text declaratoin', () => {
         const mockSource = new MockSTokenSource([
            [ '<', 'peekChar' ],
            [ undefined, 'peekDecl'],
            // now we hit parseText
         ]);
         const pTokenStream = new PTokenFromLiteralStream(mockSource, { peRef: true });
         const parseSpy = spyOn(text, 'parseText');

         pTokenStream.read();
         mockSource.respondInAsyncTime();

         expect(parseSpy.calls.argsFor(0)[0]).toEqual(mockSource);
      });

      it('returns a text delaration token if we start off with a < that starts a text delcaration', () => {
         const mockSource = new MockSTokenSource([
            [ '<', 'peekChar' ],
            [ '<?xml ?>', 'peekDecl'],
            [ '<?', 'match', '<?' ],
            // now we hit parseText
         ]);
         const parseSpy = spyOn(instruction, 'parseInstruction');
         const pTokenStream = new PTokenFromLiteralStream(mockSource, { peRef: true });

         pTokenStream.read();
         mockSource.respondInAsyncTime();

         expect(parseSpy.calls.argsFor(0)[0]).toEqual(mockSource);
      });

   });

});
