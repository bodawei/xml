/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion, ErrorCollector } from 'basic';
import { MockErrorCollector } from 'basic-test';
import { toSToken } from 'sToken';

import { nameCheck } from '../nameCheck';

jest.mock('basic', () => {
   const realBasic: Record<string, unknown> = jest.requireActual('basic');
   return {
      ...realBasic,
      isName: (name: string, version: number, revision: number) => {
         return name === 'good' && version === 1 && revision === 3;
      },
   };
});

describe('nameCheck()', () => {
   let ec: ErrorCollector;
   let version: ConformanceVersion;

   beforeEach(() => {
      ec = new MockErrorCollector();
      version = new ConformanceVersion();
   });

   it('reports no errors if no token is provided', () => {
      nameCheck(undefined, ec, version, 'foo');

      expect(ec.errors).toEqual([]);
   });

   it('reports the provided error with one parameter ', () => {
      nameCheck(toSToken('$$$'), ec, version, 'foo');

      expect(ec.errors).toEqual([
         {
            id: 'foo',
            lastPosition: undefined,
            params: ['$$$'],
            position: toSToken('$$$'),
         },
      ]);
   });

   it('reports the error when the version does not match', () => {
      nameCheck(toSToken('good'), ec, version, 'foo');

      expect(ec.errors).toEqual([
         {
            id: 'foo',
            lastPosition: undefined,
            params: ['good'],
            position: toSToken('good'),
         },
      ]);
   });

   it('reports no error when the string is good for this version', () => {
      nameCheck(toSToken('good'), ec, new ConformanceVersion(1, 3), 'foo');

      expect(ec.errors).toEqual([]);
   });
});
