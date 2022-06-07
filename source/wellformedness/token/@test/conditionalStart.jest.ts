import { ParamCollector } from 'basic-test';
import { toSToken } from 'sToken';
import { ConditionalStartPToken } from 'token';

import { wellFormedErrorCodes } from '../../error/wellFormedError';
import { conditionalStartCheck } from '../conditionalStartCheck';

const WFEID = wellFormedErrorCodes.id;

describe('checkWellFormed()', () => {
   let collector: ParamCollector;
   let conditionalPToken: ConditionalStartPToken;

   beforeEach(() => {
      collector = new ParamCollector();

      conditionalPToken = new ConditionalStartPToken({
         bracket: toSToken('['),
         open: toSToken('<!['),
         sectionType: toSToken('IGNORE'),
      });
   });

   it('reports no errors if no pToken is provided', () => {
      conditionalStartCheck(undefined, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports an error if an unknown type is provided', () => {
      conditionalPToken = new ConditionalStartPToken(conditionalPToken, {
         sectionType: toSToken('bogus'),
      });

      conditionalStartCheck(conditionalPToken, collector);

      // @ts-expect-error ts2339 types for matchers not right
      expect(collector).toHaveWellFormedError({
         id: WFEID.CONDITIONAL_UNKNOWN,
         lastPosition: undefined,
         params: ['bogus'],
         position: conditionalPToken.sectionType,
      });
   });

   it('reports an error if a type is the wrong case', () => {
      conditionalPToken = new ConditionalStartPToken(conditionalPToken, {
         sectionType: toSToken('ignore'),
      });

      conditionalStartCheck(conditionalPToken, collector);

      // @ts-expect-error ts2339 types for matchers not right
      expect(collector).toHaveWellFormedError({
         id: WFEID.CONDITIONAL_INVALID_CASE,
         lastPosition: undefined,
         params: ['ignore', 'IGNORE'],
         position: conditionalPToken.sectionType,
      });
   });
});
