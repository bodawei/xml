import { MockErrorCollector } from 'error-test';
import { ConditionalPToken } from 'token';
import { toSToken } from 'sToken';
import { EntityMetaData } from 'basic';

import checkConditionalStartWellFormed from '../conditionalStart';
import { WellFormedError } from 'error';

describe('checkWellFormed()', () => {
   let mockErrorCollector: MockErrorCollector;
   let emd: EntityMetaData;
   let conditionalPToken: ConditionalPToken;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();
      emd = new EntityMetaData();

      conditionalPToken = new ConditionalPToken({
         open: toSToken('<!['),
         sectionType: toSToken('IGNORE'),
         bracket: toSToken('['),
      });
   });

   it('reports an error if an unknown type is provided', () => {
      (conditionalPToken.sectionType as any) = toSToken('bogus'); // typehack

      checkConditionalStartWellFormed(conditionalPToken, mockErrorCollector, emd);

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.CONDITIONAL_UNKNOWN,
         params: ['bogus'],
         position: conditionalPToken.sectionType,
         lastPosition: undefined,
      });
   });

   it('reports an error if a type is the wrong case', () => {
      (conditionalPToken.sectionType as any) = toSToken('ignore'); // typehack

      checkConditionalStartWellFormed(conditionalPToken, mockErrorCollector, emd);

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.CONDITIONAL_INVALID_CASE,
         params: ['ignore', 'IGNORE'],
         position: conditionalPToken.sectionType,
         lastPosition: undefined,
      });
   });
});
