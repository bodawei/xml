/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { SToken } from '../../sToken/index';

import STokenArrayBuilder from '../STokenArrayBuilder';

describe('STokenArrayBuilder (unit)', () => {

   describe('add()', () => {

      it('adds a single SToken', () => {
         const builder = new STokenArrayBuilder();
         
         builder.add(SToken.fromString(' '));

         expect(builder.sTokenArray).toEqual([
            SToken.fromString(' ')
         ]);
      });

      it('ignores undefined', () => {
         const builder = new STokenArrayBuilder();
         
         builder.add(undefined);

         expect(builder.sTokenArray).toEqual([]);
      });

      it('adds a series of STokens', () => {
         const builder = new STokenArrayBuilder();
         
         builder.add(SToken.fromString('1'), undefined, SToken.fromString('2'));

         expect(builder.sTokenArray).toEqual([
            SToken.fromString('1'),
            SToken.fromString('2'),
         ]);
      });

      it('adds an array of STokens', () => {
         const builder = new STokenArrayBuilder();
         
         builder.add(SToken.fromString('1'), [
            SToken.fromString('2'),
            SToken.fromString('3'),
         ]);

         expect(builder.sTokenArray).toEqual([
            SToken.fromString('1'),
            SToken.fromString('2'),
            SToken.fromString('3'),
         ]);
      });

      it('ignores undefined in the array of STokens', () => {
         const builder = new STokenArrayBuilder();
         
         builder.add(SToken.fromString('1'), [
            SToken.fromString('2'),
            undefined,
            SToken.fromString('3'),
         ]);

         expect(builder.sTokenArray).toEqual([
            SToken.fromString('1'),
            SToken.fromString('2'),
            SToken.fromString('3'),
         ]);
      });

      it('returns the SToken array', () => {
         const builder = new STokenArrayBuilder();
         
         const result = builder.add(SToken.fromString('1'));

         expect(result).toEqual([
            SToken.fromString('1'),
         ]);
      });

   });
   
});
