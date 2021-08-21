import { MockErrorCollector } from 'basic-test';
import { toSToken } from 'sToken';
import { ConditionalStartPToken } from 'token';

import { WellFormedError } from '../../error/WellFormedError';
import { conditionalStartCheck } from '../conditionalStartCheck';

describe('checkWellFormed()', () => {
   let mockErrorCollector: MockErrorCollector;
   let conditionalPToken: ConditionalStartPToken;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();

      conditionalPToken = new ConditionalStartPToken({
         open: toSToken('<!['),
         sectionType: toSToken('IGNORE'),
         bracket: toSToken('['),
      });
   });

   it('reports no errors if no pToken is provided', () => {
      conditionalStartCheck(undefined, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports an error if an unknown type is provided', () => {
      conditionalPToken = new ConditionalStartPToken(conditionalPToken, {
         sectionType: toSToken('bogus'),
      });

      conditionalStartCheck(conditionalPToken, mockErrorCollector);

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.CONDITIONAL_UNKNOWN,
         params: ['bogus'],
         position: conditionalPToken.sectionType,
         lastPosition: undefined,
      });
   });

   it('reports an error if a type is the wrong case', () => {
      conditionalPToken = new ConditionalStartPToken(conditionalPToken, {
         sectionType: toSToken('ignore'),
      });

      conditionalStartCheck(conditionalPToken, mockErrorCollector);

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.CONDITIONAL_INVALID_CASE,
         params: ['ignore', 'IGNORE'],
         position: conditionalPToken.sectionType,
         lastPosition: undefined,
      });
   });
});
