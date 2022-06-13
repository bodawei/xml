/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { Range, EntityId } from 'basic';
import { TextPToken } from 'pToken';
import { SToken } from 'basic';
import { MockSTokenSource } from 'pToken-test';

import { PTokenLiteralParser } from '../pTokenLiteralParser';

import { parseInstruction } from '../bridge/instruction';
import { parseGeneralEntityReference } from '../token/generalEntityReference';
import { parseParameterEntityReference } from '../token/parameterEntityReference';
import { parseCharRef } from '../token/charRef';
import { parseText } from '../token/text';

jest.mock('../bridge/instruction');
jest.mock('../token/generalEntityReference');
jest.mock('../token/parameterEntityReference');
jest.mock('../token/charRef');
jest.mock('../token/text');

describe('PTokenLiteralParser (unit)', () => {
   it('reports the end of stream if no next character is found', () => {
      const mockSource = new MockSTokenSource([[undefined, 'peekChar']]);
      const pTokenLiteralParser = new PTokenLiteralParser(mockSource);
      const handler = jest.fn();

      pTokenLiteralParser.parse(handler);
      mockSource.respondInAsyncTime();

      expect(handler).toHaveBeenCalledWith(undefined);
   });

   it('calls text token parser if we start off with a < but is not a text declaratoin', () => {
      const mockSource = new MockSTokenSource([
         ['<', 'peekChar'],
         [undefined, 'peekDecl'],
         // now we hit parseText
      ]);
      const pTokenLiteralParser = new PTokenLiteralParser(mockSource, { peRef: true });
      const handler = jest.fn();

      pTokenLiteralParser.parse(handler);
      mockSource.respondInAsyncTime();

      expect(parseText).toHaveBeenCalledWith(mockSource, ['&', '%'], handler);
   });

   it('calls a processing instruction parser if we start off with a < that starts a text delcaration', () => {
      const mockSource = new MockSTokenSource([
         ['<', 'peekChar'],
         ['<?xml ?>', 'peekDecl'],
         ['<?', 'match', '<?'],
         // now we hit parseText
      ]);
      const pTokenLiteralParser = new PTokenLiteralParser(mockSource, { peRef: true });
      const handler = jest.fn();

      pTokenLiteralParser.parse(handler);
      mockSource.respondInAsyncTime();

      expect(parseInstruction).toHaveBeenCalledWith(mockSource, expect.any(SToken), false, handler);
   });

   it('abandones processing if the impossible situation that we think we have a PO but then find we do not', () => {
      const mockSource = new MockSTokenSource([
         ['<', 'peekChar'],
         ['<?xml ?>', 'peekDecl'],
         [undefined, 'match', '<?'],
         // now we hit parseText
      ]);
      const pTokenLiteralParser = new PTokenLiteralParser(mockSource, { peRef: true });
      const handler = jest.fn();

      pTokenLiteralParser.parse(handler);
      mockSource.respondInAsyncTime();

      expect(handler).toHaveBeenCalledWith(undefined);
   });

   it('does not call a processing instruction parser twice', () => {
      const mockSource = new MockSTokenSource([
         ['<', 'peekChar'],
         ['<?xml ?>', 'peekDecl'],
         ['<?', 'match', '<?'],
         ['x', 'peekChar'],
         // now we hit parseText
      ]);
      const pTokenLiteralParser = new PTokenLiteralParser(mockSource, { peRef: true });
      const handler = jest.fn();

      pTokenLiteralParser.parse(handler);
      mockSource.respondInAsyncTime();
      pTokenLiteralParser.parse(handler);
      mockSource.respondInAsyncTime();

      expect(parseInstruction).toHaveBeenCalledTimes(1);
   });

   it('calls parseParameterEntityReference() if it is to be looking for entity references and finds a %', () => {
      const mockSource = new MockSTokenSource([['%', 'peekChar']]);
      const pTokenLiteralParser = new PTokenLiteralParser(mockSource, { peRef: true });
      const handler = jest.fn();

      pTokenLiteralParser.parse(handler);
      mockSource.respondInAsyncTime();

      expect(parseParameterEntityReference).toHaveBeenCalledWith(mockSource, handler);
   });

   it('calls parseText() with just & if not looking for perefs', () => {
      const mockSource = new MockSTokenSource([['x', 'peekChar']]);
      const pTokenLiteralParser = new PTokenLiteralParser(mockSource, {});
      const handler = jest.fn();

      pTokenLiteralParser.parse(handler);
      mockSource.respondInAsyncTime();

      expect(parseText).toHaveBeenCalledWith(mockSource, ['&'], handler);
   });

   it('calls parseText() with all terminators if can look for peref', () => {
      const mockSource = new MockSTokenSource([['x', 'peekChar']]);
      const pTokenLiteralParser = new PTokenLiteralParser(mockSource, { peRef: true });
      const handler = jest.fn();

      pTokenLiteralParser.parse(handler);
      mockSource.respondInAsyncTime();

      expect(parseText).toHaveBeenCalledWith(mockSource, ['&', '%'], handler);
   });

   it('reports undefined if we thought we had a char, but then failed to read it', () => {
      const mockSource = new MockSTokenSource([
         ['&', 'peekChar'],
         [undefined, 'match', '&#'],
         [undefined, 'char'],
      ]);
      const pTokenLiteralParser = new PTokenLiteralParser(mockSource);
      const handler = jest.fn();

      pTokenLiteralParser.parse(handler);
      mockSource.respondInAsyncTime();

      expect(handler).toHaveBeenCalledWith(undefined);
   });

   it('calls parseCharRef() if &# is found', () => {
      const mockSource = new MockSTokenSource([
         ['&', 'peekChar'],
         ['&#', 'match', '&#'],
      ]);
      const pTokenLiteralParser = new PTokenLiteralParser(mockSource, { peRef: true });
      const handler = jest.fn();

      pTokenLiteralParser.parse(handler);
      mockSource.respondInAsyncTime();

      expect(parseCharRef).toHaveBeenCalledWith(mockSource, expect.any(SToken), handler);
   });

   it('calls parseGeneralEntityReference() if &# is not found after finding a &', () => {
      const mockSource = new MockSTokenSource([
         ['&', 'peekChar'],
         [undefined, 'match', '&#'],
         ['&', 'char'],
      ]);
      const pTokenLiteralParser = new PTokenLiteralParser(mockSource, { geRef: true });
      const handler = jest.fn();

      pTokenLiteralParser.parse(handler);
      mockSource.respondInAsyncTime();

      expect(parseGeneralEntityReference).toHaveBeenCalledWith(
         mockSource,
         expect.any(SToken),
         handler,
      );
   });

   it('returns a text token if a & is encountered', () => {
      const mockSource = new MockSTokenSource([
         ['&', 'peekChar'],
         [undefined, 'match', '&#'],
         ['&', 'char'],
      ]);
      const pTokenLiteralParser = new PTokenLiteralParser(mockSource, { peRef: true });
      const sToken = new SToken('&', '&', new Range(new EntityId(), 1, 0, 1, 2, 0, 2));
      const handler = jest.fn();

      pTokenLiteralParser.parse(handler);
      mockSource.respondInAsyncTime();

      expect(handler).toHaveBeenCalledWith(new TextPToken({ text: sToken }));
   });
});
