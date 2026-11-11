/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion } from 'basic';
import { toSToken } from 'basic';
import { ParamCollector } from 'basic-test';

import { wellFormedErrorCodes } from '../../error/wellFormedError';
import { nameCheck } from '../nameCheck';

jest.mock('basic', () => {
   const realBasic: Record<string, unknown> = jest.requireActual('basic');
   return {
      ...realBasic,
      isName: (name: string, version: number, edition: number) => {
         return name === 'good' && version === 1 && edition === 3;
      },
   };
});

const WFEID = wellFormedErrorCodes.id;

describe('nameCheck()', () => {
   let collector: ParamCollector;
   let version: ConformanceVersion;

   beforeEach(() => {
      collector = new ParamCollector();
      version = new ConformanceVersion();
   });

   it('reports no errors if no token is provided', () => {
      nameCheck(undefined, collector, version, WFEID.EXTERNALID_EXTRA_TEXT);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports the provided error with one parameter ', () => {
      nameCheck(toSToken('$$$'), collector, version, WFEID.EXTERNALID_EXTRA_TEXT);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.EXTERNALID_EXTRA_TEXT,
         lastPosition: undefined,
         params: ['$$$'],
         position: toSToken('$$$'),
      });
   });

   it('reports the error when the version does not match', () => {
      nameCheck(toSToken('good'), collector, version, WFEID.EXTERNALID_EXTRA_TEXT);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.EXTERNALID_EXTRA_TEXT,
         lastPosition: undefined,
         params: ['good'],
         position: toSToken('good'),
      });
   });

   it('reports no error when the string is good for this version', () => {
      nameCheck(
         toSToken('good'),
         collector,
         new ConformanceVersion(1, 3),
         WFEID.EXTERNALID_EXTRA_TEXT,
      );

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });
});
