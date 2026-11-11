/* Copyright ® 2016-2026 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { toSToken } from 'basic';
import { ParamCollector } from 'basic-test';
import { describe, expect, it, vi } from 'vitest';

import { wellFormedErrorCodes } from '../../error/wellFormedError';
import { nmTokenCheck } from '../nmTokenCheck';

vi.mock('basic', async () => {
   const realBasic = (await vi.importActual('basic')) as Record<string, unknown>;
   return {
      ...realBasic,
      isNmToken: (nmToken: string, version: number, edition: number) => {
         return nmToken === 'good' && version === 1 && edition === 3;
      },
   };
});

const WFEID = wellFormedErrorCodes.id;

describe('nmTokenCheck()', () => {
   let collector: ParamCollector;
   let errorId: string;
   let confVerV1R5: ConformanceVersion;
   let confVerV1R3: ConformanceVersion;

   beforeEach(() => {
      collector = new ParamCollector();
      errorId = WFEID.ELEMENT_NAME_INVALID;
      confVerV1R3 = new ConformanceVersion(1.0, 3);
      confVerV1R5 = new ConformanceVersion(1.0, 5);
   });

   it('accepts an empty SToken', () => {
      nmTokenCheck(undefined, collector, confVerV1R5, errorId);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports no error if isNmToken() returns true', () => {
      nmTokenCheck(toSToken('good'), collector, confVerV1R3, errorId);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports an error if isNmToken() returns false', () => {
      nmTokenCheck(toSToken('foo'), collector, confVerV1R5, errorId);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: errorId,
         lastPosition: undefined,
         params: ['foo'],
         position: toSToken('foo'),
      });
   });
});
