/* Copyright ® 2017-2022 by 柏大衛. All rights reserved. */

import { describe, it, expect } from '@jest/globals';
import { Range } from 'basic';

import { EntityId } from '../../token/entityId';
import { SToken } from '../sToken';

describe('SToken', () => {
   describe('construction', () => {
      it('creates an SToken with the provided parameters', () => {
         const sToken = new SToken('one', 'two', new Range(new EntityId()));

         expect(sToken).toEqual({
            str: 'one',
            originalStr: 'two',
            ranges: [new Range(new EntityId())],
         });
      });

      it('creates an SToken with an empty range if none provided', () => {
         const sToken = new SToken('one', 'two', []);

         expect(sToken).toEqual({
            str: 'one',
            originalStr: 'two',
            ranges: [],
         });
      });

      it('creates an SToken with a the provided range array', () => {
         const sToken = new SToken('one', 'two', [
            new Range(new EntityId()),
            new Range(new EntityId()),
         ]);

         expect(sToken).toEqual({
            str: 'one',
            originalStr: 'two',
            ranges: [new Range(new EntityId()), new Range(new EntityId())],
         });
      });
   });
});
