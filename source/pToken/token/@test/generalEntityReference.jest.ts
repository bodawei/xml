/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { MockSTokenSource } from 'pToken-test';
import { toSToken } from 'basic';

import {
   GeneralEntityReferencePToken,
   parseGeneralEntityReference,
} from '../generalEntityReference';

describe('generalEntityReference (unit)', () => {
   let gePToken: GeneralEntityReferencePToken;

   beforeEach(() => {
      gePToken = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         openSpace: toSToken(' '),
         name: toSToken('entityName'),
         nameSpace: toSToken(' '),
         close: toSToken(';'),
      });
   });

   describe('cnostruction', () => {
      it('will override all properties on the source', () => {
         const source = new GeneralEntityReferencePToken({
            open: toSToken('&'),
            openSpace: toSToken(' '),
            name: toSToken('x'),
            nameSpace: toSToken(' '),
            close: toSToken(';'),
         });

         const result = new GeneralEntityReferencePToken(source, {
            open: undefined,
            openSpace: undefined,
            name: undefined,
            nameSpace: undefined,
            close: undefined,
         });

         expect(result).toEqualRangeless({
            open: toSToken('&'),
            openSpace: undefined,
            name: undefined,
            nameSpace: undefined,
            close: undefined,
         });
      });
   });

   describe('parseGeneralEntityReference()', () => {
      let result: GeneralEntityReferencePToken | undefined;

      function getResult(output: GeneralEntityReferencePToken | undefined): void {
         result = output;
      }

      it('does a full parse', () => {
         const mockSource = new MockSTokenSource([
            [' ', 'space'],
            ['entityName', 'word', [';']],
            [' ', 'space'],
            [';', 'match', ';'],
         ]);

         parseGeneralEntityReference(mockSource, toSToken('&'), getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless(gePToken);
      });

      it('copes with eof mid-stream', () => {
         const mockSource = new MockSTokenSource([undefined, undefined, undefined, undefined]);

         parseGeneralEntityReference(mockSource, toSToken('&'), getResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqualRangeless({
            open: toSToken('&'),
            openSpace: undefined,
            name: undefined,
            nameSpace: undefined,
            close: undefined,
         });
      });
   });
});
