import { MockErrorCollector } from 'error-test';
import { ConditionalPToken } from 'token';
import { toSToken } from 'sToken';
import { ConformanceVersion } from 'basic';

import checkConditionalStartWellFormed from '../conditionalStart';
import { WellFormedError } from 'error';

describe('checkWellFormed()', () => {
   let mockErrorCollector: MockErrorCollector;
   let confVer: ConformanceVersion;
   let conditionalPToken: ConditionalPToken;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();
      confVer = new ConformanceVersion();

      conditionalPToken = new ConditionalPToken({
         open: toSToken('<!['),
         sectionType: toSToken('IGNORE'),
         bracket: toSToken('['),
      });
   });

   it('reports an error if an unknown type is provided', () => {
      conditionalPToken = new ConditionalPToken(conditionalPToken, {
         sectionType: toSToken('bogus'),
      });

      checkConditionalStartWellFormed(conditionalPToken, mockErrorCollector);

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.CONDITIONAL_UNKNOWN,
         params: ['bogus'],
         position: conditionalPToken.sectionType,
         lastPosition: undefined,
      });
   });

   it('reports an error if a type is the wrong case', () => {
      conditionalPToken = new ConditionalPToken(conditionalPToken, {
         sectionType: toSToken('ignore'),
      });

      checkConditionalStartWellFormed(conditionalPToken, mockErrorCollector);

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.CONDITIONAL_INVALID_CASE,
         params: ['ignore', 'IGNORE'],
         position: conditionalPToken.sectionType,
         lastPosition: undefined,
      });
   });
});
