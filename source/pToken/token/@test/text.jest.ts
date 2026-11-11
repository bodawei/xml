/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { EntityId, Range } from 'basic';
import { toSToken, SToken } from 'basic';
import { TextPToken, parseText, isTextPToken } from 'pToken';
import { MockSTokenSource } from 'pToken-test';

describe('TextPToken (unit)', () => {
   describe('construction', () => {
      it('constructs with another TextPToken', () => {
         const input = new TextPToken({
            text: toSToken('foo'),
         });

         const result = new TextPToken(input);

         expect(result).toEqual(input);
         expect(result).not.toBe(input);
      });

      it('constructs with an SToken', () => {
         const input = toSToken('test');

         const result = new TextPToken(input);

         expect(result).toEqual(
            new TextPToken({
               text: input,
            }),
         );
      });

      it('can override with the other parameter', () => {
         const input = toSToken('test');

         const result = new TextPToken(input, { text: toSToken('two') });

         expect(result).toEqual(
            new TextPToken({
               text: toSToken('two'),
            }),
         );
      });
   });

   describe('parseText()', () => {
      let result: TextPToken | undefined;

      function captureResult(token: TextPToken | undefined) {
         result = token;
      }

      it('does a basic parsing', () => {
         const mockSource = new MockSTokenSource([['foo', 'all', ['x']]]);

         parseText(mockSource, ['x'], captureResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqual(
            new TextPToken({
               text: new SToken('foo', 'foo', [
                  new Range(new EntityId(undefined), 0, 0, 0, 3, 0, 3),
               ]),
            }),
         );
      });

      it('returns no token if it is at EOF', () => {
         const mockSource = new MockSTokenSource([undefined]);

         parseText(mockSource, ['x'], captureResult);
         mockSource.respondInAsyncTime();

         expect(result).toEqual(undefined);
      });
   });

   describe('isTextPToken', () => {
      it('rejects an undefined value', () => {
         expect(isTextPToken(undefined)).toEqual(false);
      });

      it('rejects a string', () => {
         expect(isTextPToken('bad')).toEqual(false);
      });

      it('rejects a non-ptoken', () => {
         expect(isTextPToken({ bar: true })).toEqual(false);
      });

      it('accepts an TextPToken', () => {
         const result = new TextPToken(toSToken('bar'));

         expect(isTextPToken(result)).toEqual(true);
      });
   });
});
