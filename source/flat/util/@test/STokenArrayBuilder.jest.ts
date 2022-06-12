/* Copyright ® 2018-2022 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { toSToken } from 'sToken';

import { STokenArrayBuilder } from '../STokenArrayBuilder';

describe('STokenArrayBuilder (unit)', () => {
   describe('add()', () => {
      it('adds a single SToken', () => {
         const builder = new STokenArrayBuilder();

         builder.add(toSToken(' '));

         expect(builder.sTokenArray).toEqual([toSToken(' ')]);
      });

      it('ignores undefined', () => {
         const builder = new STokenArrayBuilder();

         builder.add(undefined);

         expect(builder.sTokenArray).toEqual([]);
      });

      it('adds a series of STokens', () => {
         const builder = new STokenArrayBuilder();

         builder.add(toSToken('1'), undefined, toSToken('2'));

         expect(builder.sTokenArray).toEqual([toSToken('1'), toSToken('2')]);
      });

      it('adds an array of STokens', () => {
         const builder = new STokenArrayBuilder();

         builder.add(toSToken('1'), [toSToken('2'), toSToken('3')]);

         expect(builder.sTokenArray).toEqual([toSToken('1'), toSToken('2'), toSToken('3')]);
      });

      it('ignores undefined in the array of STokens', () => {
         const builder = new STokenArrayBuilder();

         builder.add(toSToken('1'), [toSToken('2'), undefined, toSToken('3')]);

         expect(builder.sTokenArray).toEqual([toSToken('1'), toSToken('2'), toSToken('3')]);
      });

      it('returns the SToken array', () => {
         const builder = new STokenArrayBuilder();

         const result = builder.add(toSToken('1'));

         expect(result).toEqual([toSToken('1')]);
      });
   });
});
