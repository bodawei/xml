/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion, ErrorCollector } from 'basic';
import { MockErrorCollector } from 'basic-test';
import { toSToken } from 'sToken';

import { WellFormedError } from '../../error/WellFormedError';

import { nmTokenCheck } from '../nmTokenCheck';

jest.mock('basic', () => {
   const realBasic: Record<string, unknown> = jest.requireActual('basic');
   return {
      ...realBasic,
      isNmToken: (nmToken: string, version: number, edition: number) => {
         return nmToken === 'good' && version === 1 && edition === 3;
      },
   };
});

describe('nmTokenCheck()', () => {
   let ec: ErrorCollector;
   let errorId: string;
   let confVerV1R5: ConformanceVersion;
   let confVerV1R3: ConformanceVersion;

   beforeEach(() => {
      ec = new MockErrorCollector();
      errorId = WellFormedError.ID.ELEMENT_NAME_INVALID;
      confVerV1R3 = new ConformanceVersion(1.0, 3);
      confVerV1R5 = new ConformanceVersion(1.0, 5);
   });

   it('accepts an empty SToken', () => {
      nmTokenCheck(undefined, ec, confVerV1R5, errorId);

      expect(ec.errors).toEqual([]);
   });

   it('reports no error if isNmToken() returns true', () => {
      nmTokenCheck(toSToken('good'), ec, confVerV1R3, errorId);

      expect(ec.errors).toEqual([]);
   });

   it('reports an error if isNmToken() returns false', () => {
      nmTokenCheck(toSToken('foo'), ec, confVerV1R5, errorId);

      expect(ec.errors).toEqual([
         {
            id: errorId,
            lastPosition: undefined,
            params: ['foo'],
            position: toSToken('foo'),
         },
      ]);
   });
});
