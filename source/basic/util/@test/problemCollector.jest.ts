/* Copyright ® 2017-2022 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { toSToken, SToken } from 'basic';

import { EntityId } from '../../token/entityId';
import { ERROR_SEVERITY, WARNING_SEVERITY, ProblemPosition, Problem } from '../../token/problem';
import { Offset } from '../offset';
import { ProblemCodes } from '../problemCodes';
import { ProblemCollector } from '../problemCollector';
import { Range } from '../range';
import { rangeEndOffset } from '../rangeEndOffset';

class TestError extends Problem {
   constructor(
      id: string,
      params?: ReadonlyArray<string | number | boolean>,
      place?: ProblemPosition,
      context?: ProblemPosition,
   ) {
      super(new ProblemCodes({}), WARNING_SEVERITY, 'testing', id, params, place, context);
   }
}

class OtherError extends Problem {
   constructor(
      id: string,
      params?: ReadonlyArray<string | number | boolean>,
      place?: ProblemPosition,
      context?: ProblemPosition,
   ) {
      super(new ProblemCodes({}), ERROR_SEVERITY, 'second', id, params, place, context);
   }
}

describe('ProblemCollector', () => {
   let pc: ProblemCollector;
   let errorId: string;
   let loc: EntityId;
   let contextStart: SToken;
   let startPos: SToken;

   beforeEach(() => {
      errorId = 'ELEMENT_NAME_XML_RESERVED';
      loc = new EntityId();
      contextStart = new SToken('<', '<', new Range(loc, 0, 0, 0, 1, 0, 1));
      startPos = new SToken('$name', '$name', new Range(loc, 1, 0, 1, 6, 0, 6));
      pc = new ProblemCollector(contextStart, TestError);
   });

   describe('construction', () => {
      it('can be constructed without error', () => {
         expect(() => {
            new ProblemCollector(toSToken('foo'), TestError);
         }).not.toThrow();
      });
   });

   describe('check', () => {
      it('calls report if condition is truthy', () => {
         pc = new ProblemCollector(toSToken('foo'), TestError);

         pc.check(true, 'foo', [], toSToken('x'));

         expect(pc.getProblems()).toEqual([
            new TestError('foo', undefined, toSToken('x'), toSToken('x')),
         ]);
      });

      it('does not call report if condition is falsy', () => {
         pc = new ProblemCollector(toSToken('foo'), TestError);

         pc.check(false, 'foo', [], toSToken('x'));

         expect(pc.getProblems()).toEqual([]);
      });
   });

   describe('report', () => {
      it('adds a problem instance to the set of errors', () => {
         pc.report(errorId, ['name'], startPos);

         expect(pc.getProblems()).toEqual([
            new TestError(
               errorId,
               undefined,
               new SToken('$name', '$name', new Range(loc, 1, 0, 1, 6, 0, 6)),
               new SToken('<', '<', new Range(loc, 0, 0, 0, 1, 0, 1)),
            ),
         ]);
      });
   });

   describe('reportProblem()', () => {
      it('uses the specified constructor instead of the default', () => {
         pc.reportProblem(OtherError, 'FOO', ['name'], startPos);

         expect(pc.getProblems()).toEqual([
            new OtherError('FOO', undefined, startPos, toSToken('x')),
         ]);
      });

      it('accepts an offset as the position', () => {
         pc.reportProblem(TestError, 'FOO', ['name'], new Offset(loc, 5, 5, 5));

         expect(pc.getProblems()).toEqual([
            new TestError('FOO', undefined, new Offset(loc, 5, 5, 5), toSToken('x')),
         ]);
      });

      it('uses the start position from the last setPos if no position passed', () => {
         pc.setPos(startPos);
         pc.reportProblem(TestError, 'FOO', ['name']);

         expect(pc.getProblems()).toEqual([
            new TestError('FOO', undefined, startPos, toSToken('x')),
         ]);
      });

      it('uses the end position from setPos() if no position passed and setPos() was last called with nothing', () => {
         pc.setPos(startPos);
         pc.setPos();
         pc.reportProblem(TestError, 'FOO', ['name']);

         expect(pc.getProblems()).toEqual([
            new TestError('FOO', undefined, rangeEndOffset(startPos.ranges[0]), contextStart),
         ]);
      });

      it('allows no parameters to be passed', () => {
         pc.reportProblem(TestError, 'FOO');

         expect(pc.getProblems()).toEqual([
            new TestError('FOO', undefined, contextStart, contextStart),
         ]);
      });
   });

   describe('appendFrom()', () => {
      it('combines both the current and new errors', () => {
         pc.reportProblem(TestError, 'FOO', ['name'], startPos);
         const ec2 = new ProblemCollector(toSToken('x'), TestError);
         ec2.reportProblem(TestError, 'FOO2', ['name'], startPos);

         pc.appendFrom(ec2);

         expect(pc.getProblems()).toEqual([
            new TestError(
               'FOO',
               undefined,
               new SToken('$name', '$name', new Range(loc, 1, 0, 1, 6, 0, 6)),
               new SToken('<', '<', new Range(loc, 0, 0, 0, 1, 0, 1)),
            ),
            new TestError(
               'FOO2',
               undefined,
               new SToken('$name', '$name', new Range(loc, 1, 0, 1, 6, 0, 6)),
               new SToken('<', '<', new Range(loc, 0, 0, 0, 1, 0, 1)),
            ),
         ]);
      });
   });
});
