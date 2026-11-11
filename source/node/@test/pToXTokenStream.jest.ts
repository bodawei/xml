/* Copyright ® 2021-2026 by 柏大衛. All rights reserved. */

import { makeTextPToken } from 'token-test';
import { describe, expect, it, vi, type MockedFunction } from 'vitest';
import { convertPTokenToXToken, TextXToken } from 'xToken';

import { PToXTokenStream } from '../pToXTokenStream';

vi.mock('xToken');

describe('PToXTokenStream (unit)', () => {
   let pToXTokenStream: PToXTokenStream;
   let convertPTokenToXTokenMock: MockedFunction<typeof convertPTokenToXToken>;

   beforeEach(() => {
      convertPTokenToXTokenMock = convertPTokenToXToken as MockedFunction<
         typeof convertPTokenToXToken
      >;

      pToXTokenStream = new PToXTokenStream({});
   });

   it('calls convertPTokenToXToken with the provided token', () => {
      const pToken = makeTextPToken('foo');

      pToXTokenStream.write(pToken);

      expect(convertPTokenToXTokenMock).toHaveBeenCalledWith(pToken);
   });

   it('calls the push() when with the result of the conversion', () => {
      const pToken = makeTextPToken('foo');
      vi.spyOn(pToXTokenStream, 'push');
      const xToken = new TextXToken('gooo');
      convertPTokenToXTokenMock.mockReturnValue(xToken);

      pToXTokenStream.write(pToken);

      expect(pToXTokenStream.push).toHaveBeenCalledWith(xToken);
   });

   it('calls the done callback when done processing', () => {
      const pToken = makeTextPToken('foo');
      const doneMock = vi.fn();

      pToXTokenStream._transform(pToken, 'foo', doneMock);

      expect(doneMock).toHaveBeenCalledTimes(1);
   });
});
