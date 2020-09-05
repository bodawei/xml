/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { MockSTokenSource } from 'sToken-test';
import { toSToken } from 'sToken';

import {
   ParameterEntityReferencePToken,
   parseParameterEntityReference,
} from '../parameterEntityReference';

describe('ParameterEntityReferencePToken (unit)', () => {
   let pePToken: ParameterEntityReferencePToken;

   beforeEach(() => {
      pePToken = new ParameterEntityReferencePToken({
         open: toSToken('%'),
         openSpace: toSToken(' '),
         name: toSToken('entityName'),
         nameSpace: toSToken(' '),
         close: toSToken(';'),
      });
   });

   describe('ParameterEntityReferencePToken()', () => {
      it('can fully override the first value passed to the constructor', () => {
         const result = new ParameterEntityReferencePToken(pePToken, {
            open: toSToken('A'),
            openSpace: toSToken('B'),
            name: toSToken('C'),
            nameSpace: toSToken('D'),
            close: toSToken('E'),
         });

         expect(result).toEqual(
            new ParameterEntityReferencePToken({
               open: toSToken('A'),
               openSpace: toSToken('B'),
               name: toSToken('C'),
               nameSpace: toSToken('D'),
               close: toSToken('E'),
            }),
         );
      });
   });

   describe('paramParse()', () => {
      let callback: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does a full parse', () => {
         const mockSource = new MockSTokenSource([
            ['%', 'match', '%'],
            [' ', 'space'],
            ['entityName', 'word', [';']],
            [' ', 'space'],
            [';', 'match', ';'],
         ]);

         parseParameterEntityReference(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless(pePToken);
      });

      it('copes with no reference at all', () => {
         const mockSource = new MockSTokenSource([undefined]);

         parseParameterEntityReference(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith(undefined);
      });

      it('copes with eof mid-stream', () => {
         const mockSource = new MockSTokenSource([
            ['%', 'match', '%'],
            undefined,
            undefined,
            undefined,
            undefined,
         ]);

         parseParameterEntityReference(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless({
            open: toSToken('%'),
            openSpace: undefined,
            name: undefined,
            nameSpace: undefined,
            close: undefined,
         });
      });
   });
});
