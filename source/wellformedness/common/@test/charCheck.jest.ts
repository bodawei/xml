/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { toSToken } from 'basic';
import { ParamCollector } from 'basic-test';

import { warningCodes } from '../../error/warningCodes';
import { wellFormedErrorCodes } from '../../error/wellFormedError';
import { charCheck } from '../charCheck';

const WFEID = wellFormedErrorCodes.id;
const WID = warningCodes.id;

describe('charCheck()', () => {
   let collector: ParamCollector;

   beforeEach(() => {
      collector = new ParamCollector();
   });

   it('adds no errors if an SToken is not passed in', () => {
      charCheck(undefined, collector, new ConformanceVersion(), false);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports no errors if the SToken has no bad errors', () => {
      charCheck(toSToken('foo'), collector, new ConformanceVersion(), false);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports an error if the SToken has bad characters', () => {
      const sToken = toSToken('b\u0001x\u0000x\uFDD1x\uFDD2xx');

      charCheck(sToken, collector, new ConformanceVersion(), false);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.CHARDATA_INVALID_CHAR,
         params: ['1, 3'],
         position: undefined,
      });
   });

   it('reports an error if the 1.1 SToken has bad characters that are only bad in version 1.1', () => {
      const sToken = toSToken('bad\u007F');

      charCheck(sToken, collector, new ConformanceVersion(1.1, 2), false);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.CHARDATA_INVALID_CHAR,
         params: ['3'],
         position: undefined,
      });
   });

   it('reports no error on a second pass token if the 1.1 SToken has characters that are only bad in the first pass', () => {
      const sToken = toSToken('bad\u007F');

      charCheck(sToken, collector, new ConformanceVersion(1.1, 2), true);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports an error on a second pass token if the 1.1 SToken has has characters that are not valid on a second pass', () => {
      const sToken = toSToken('bad\u0000');

      charCheck(sToken, collector, new ConformanceVersion(1.1, 2), true);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.CHARDATA_INVALID_CHAR,
         params: ['3'],
         position: undefined,
      });
   });

   it('reports no error if the 1.0 SToken has bad characters that are only bad in version 1.1', () => {
      const sToken = toSToken('bad\u007F');

      charCheck(sToken, collector, new ConformanceVersion(1.0, 5), false);

      expect(collector.getParams().length).toEqual(1);
      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveProblem(WFEID.CHARDATA_INVALID_CHAR);
   });

   it('reports a warning if the SToken has discouraged characters', () => {
      const sToken = toSToken('b\u0001x\u0000x\uFDD1x\uFDD2xx');

      charCheck(sToken, collector, new ConformanceVersion(), false);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWFWarning({
         id: WID.CHARDATA_DISCOURAGED_CHAR,
         params: ['5, 7'],
         position: undefined,
      });
   });

   it('reports a warning if the 1.0/1 SToken has chars that are only discouraged in version 1.0/>2', () => {
      const sToken = toSToken('bad\u007F');

      charCheck(sToken, collector, new ConformanceVersion(1.0, 1), false);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports a warning if the 1.0/2 SToken has chars that are only discouraged in version 1.0/>2', () => {
      const sToken = toSToken('bad\u007F');

      charCheck(sToken, collector, new ConformanceVersion(1.0, 2), false);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports no warning if the 1.0/3 SToken has chars that are only discouraged in version 1.0/5', () => {
      const sToken = toSToken('bad\uFDEF');

      charCheck(sToken, collector, new ConformanceVersion(1.0, 3), false);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports a warning if the 1.0/5 SToken has chars that are only discouraged in version 1.0/5', () => {
      const sToken = toSToken('bad\uFDEF');

      charCheck(sToken, collector, new ConformanceVersion(1.0, 5), false);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWFWarning({
         id: WID.CHARDATA_DISCOURAGED_CHAR,
         params: ['3'],
         position: undefined,
      });
   });

   it('reports a warning if the 1.0 SToken has chars that are only discouraged in version 1.0', () => {
      const sToken = toSToken('bad\u007F');

      charCheck(sToken, collector, new ConformanceVersion(1.0, 5), false);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWFWarning({
         id: WID.CHARDATA_DISCOURAGED_CHAR,
         params: ['3'],
         position: undefined,
      });
   });

   it('reports a warning if the 1.1 SToken has chars that are only discouraged in version 1.0', () => {
      const sToken = toSToken('bad\u007F');

      charCheck(sToken, collector, new ConformanceVersion(1.1, 2), false);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveProblem(WFEID.CHARDATA_INVALID_CHAR);
   });

   it('reports an error if there is a lone surrogate character in the input string', () => {
      const sToken = toSToken('bad\uD801x');

      charCheck(sToken, collector, new ConformanceVersion(1.1, 2), false);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveProblem(WFEID.CHARDATA_INVALID_CHAR);
   });

   it('reports an error if the input string consists of a single longe surrogate', () => {
      const sToken = toSToken('\uD801');

      charCheck(sToken, collector, new ConformanceVersion(1.1, 2), false);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveProblem(WFEID.CHARDATA_INVALID_CHAR);
   });
});
