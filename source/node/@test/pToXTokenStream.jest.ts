/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { makeTextPToken } from 'token-test';
import { convertPTokenToXToken, TextXToken } from 'xToken';

import { PToXTokenStream } from '../pToXTokenStream';

jest.mock('xToken');

describe('PToXTokenStream (unit)', () => {
   let pToXTokenStream: PToXTokenStream;
   let convertPTokenToXTokenMock: jest.MockedFunction<typeof convertPTokenToXToken>;

   beforeEach(() => {
      convertPTokenToXTokenMock = convertPTokenToXToken as jest.MockedFunction<
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
      jest.spyOn(pToXTokenStream, 'push');
      convertPTokenToXTokenMock.mockReturnValue(new TextXToken('gooo'));

      pToXTokenStream.write(pToken);

      expect(pToXTokenStream.push).toHaveBeenCalledWith(new TextXToken('gooo'));
   });

   it('calls the done callback when done processing', () => {
      const pToken = makeTextPToken('foo');
      const doneMock = jest.fn();

      pToXTokenStream._transform(pToken, 'foo', doneMock);

      expect(doneMock).toHaveBeenCalledTimes(1);
   });
});
