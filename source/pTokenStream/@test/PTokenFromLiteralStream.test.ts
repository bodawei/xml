/* Copyright ® 2016-2018 by David John Burrowes. All rights reserved. */
/* eslint-env jasmine */

import { Range, EntityLocation } from 'basic';
import { SToken } from 'sToken';
import { MockSTokenSource } from 'sToken-test';

import * as tokenStuff from 'token';
import { TextPToken } from 'token';
import PTokenFromLiteralStream from '../PTokenFromLiteralStream';

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
            const parseSpy = spyOn(tokenStuff, 'parseParameterEntityReference');

            pTokenStream.read();
            mockSource.respondInAsyncTime();

            expect(parseSpy.calls.argsFor(0)[0]).toEqual(mockSource);
            expect(parseSpy.calls.argsFor(0)[1]).toBeInstanceOf(Function);
         });

         it('calls text.parse with just & if not looking for perefs', () => {
            const mockSource = new MockSTokenSource([
               [ 'x', 'peekChar' ],
            ]);
            const pTokenStream = new PTokenFromLiteralStream(mockSource, { });
            const parseSpy = spyOn(tokenStuff, 'parseText');

            pTokenStream.read();
            mockSource.respondInAsyncTime();

            expect(parseSpy.calls.argsFor(0)[0]).toEqual(mockSource);
            expect(parseSpy.calls.argsFor(0)[1]).toEqual([ '&' ]);
            expect(parseSpy.calls.argsFor(0)[2]).toBeInstanceOf(Function);

            // Cheat slightly and make sure function is good
            const pushSpy = spyOn(pTokenStream, 'push');
            parseSpy.calls.argsFor(0)[2]('x');

            expect(pushSpy).toHaveBeenCalledWith('x');
         });

         it('calls text.parse with all terminators if can look for peref', () => {
            const mockSource = new MockSTokenSource([
               [ 'x', 'peekChar' ],
            ]);
            const pTokenStream = new PTokenFromLiteralStream(mockSource, { peRef: true });
            const parseSpy = spyOn(tokenStuff, 'parseText');

            pTokenStream.read();
            mockSource.respondInAsyncTime();

            expect(parseSpy.calls.argsFor(0)[0]).toEqual(mockSource);
            expect(parseSpy.calls.argsFor(0)[1]).toEqual([ '&', '%' ]);
            expect(parseSpy.calls.argsFor(0)[2]).toBeInstanceOf(Function);

            // Cheat slightly and make sure function is good
            const pushSpy = spyOn(pTokenStream, 'push');
            parseSpy.calls.argsFor(0)[2]('x');

            expect(pushSpy).toHaveBeenCalledWith('x');
         });

         it('calls charRef.parse if &# is found', () => {
            const mockSource = new MockSTokenSource([
               [ '&', 'peekChar' ],
               [ '&#', 'match', '&#' ],
            ]);
            const pTokenStream = new PTokenFromLiteralStream(mockSource, { peRef: true });
            const parseSpy = spyOn(tokenStuff, 'parseCharRef');

            pTokenStream.read();
            mockSource.respondInAsyncTime();

            expect(parseSpy.calls.argsFor(0)[0]).toEqual(mockSource);
            expect(parseSpy.calls.argsFor(0)[1].str).toEqual('&#');
            expect(parseSpy.calls.argsFor(0)[2]).toBeInstanceOf(Function);

            // Cheat slightly and make sure function is good
            const pushSpy = spyOn(pTokenStream, 'push');
            parseSpy.calls.argsFor(0)[2]('x');

            expect(pushSpy).toHaveBeenCalledWith('x');
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
         const sToken = new SToken('&', '&', new Range(new EntityLocation(), 1, 0, 1, 2, 0, 2));

         pTokenStream.read();
         mockSource.respondInAsyncTime();

         expect(pushSpy.calls.argsFor(0)[0]).toEqual(new TextPToken({ text: sToken }));
      });

   });

});
