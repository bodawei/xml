/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { MockSTokenSource } from 'pToken-test';
import { toSToken } from 'basic';

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
      let callback: (param: ParameterEntityReferencePToken | undefined) => void;
      let result: ParameterEntityReferencePToken | undefined;

      beforeEach(() => {
         callback = (finalValue) => {
            result = finalValue;
         };
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

         expect(result).toEqualRangeless(pePToken);
      });

      it('copes with no reference at all', () => {
         const mockSource = new MockSTokenSource([undefined]);

         parseParameterEntityReference(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(result).toEqual(undefined);
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

         expect(result).toEqualRangeless({
            open: toSToken('%'),
            openSpace: undefined,
            name: undefined,
            nameSpace: undefined,
            close: undefined,
         });
      });
   });
});
