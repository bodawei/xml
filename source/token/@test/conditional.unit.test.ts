/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { EntityMetaData } from 'basic';
import { WellFormedError } from 'error';
import { MockErrorCollector } from'error-test';
import { SToken } from 'sToken';
import { makeSTokenMaker, MockSTokenSource } from 'sToken-test';

import misc from '../common/misc';
import { SectionStart } from '../bridge/section';
import { ConditionalPToken, parseConditional } from '../conditional';

const { fromString } = SToken;

describe('conditional (unit)', () => {
   let sectionStart: SectionStart;
   let conditionalPToken: ConditionalPToken;

   beforeEach(() => {
      sectionStart = {
         open: fromString('<!['),
         sectionType: fromString('IGNORE'),
      };
      conditionalPToken = new ConditionalPToken({
         open: fromString('<!['),
         sectionType: fromString('IGNORE'),
         bracket: fromString('['),
         ignored: [ fromString('test text') ],
         close: fromString(']]>'),
         incomplete: false,
      });
   });

   describe('parseConditional()', () => {
      let callback: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('returns simple values if type is IGNORE', () => {
         const mockSource = new MockSTokenSource([
            [ '[', 'match', '[' ],
            [ 'test text', 'all', [ '<![', ']]>' ] ],
            [ MockSTokenSource.PEEK(']'), 'peekChar' ],
            [ ']]>', 'match', ']]>' ],
         ]);

         parseConditional(mockSource, sectionStart, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless(conditionalPToken);
      });

      it('returns an incomplete parsing if type is INCLUDE', () => {
         sectionStart.sectionType = fromString('INCLUDE');
         const mockSource = new MockSTokenSource([
            [ '[', 'match', '[' ],
         ]);
         conditionalPToken = new ConditionalPToken({
            open: fromString('<!['),
            sectionType: fromString('INCLUDE'),
            bracket: fromString('['),
            incomplete: true,
         });

         parseConditional(mockSource, sectionStart, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless(conditionalPToken);
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector: MockErrorCollector;
      let emd: EntityMetaData;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         emd = new EntityMetaData();
      });

      it('reports an error if an unknown type is provided', () => {
         (conditionalPToken.sectionType as any) = fromString('bogus'); // typehack

         conditionalPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CONDITIONAL_UNKNOWN,
            params: [ 'bogus' ],
            position: conditionalPToken.sectionType,
            lastPosition: undefined,
         });
      });

      it('reports an error if a type is the wrong case', () => {
         (conditionalPToken.sectionType as any) = fromString('ignore'); // typehack

         conditionalPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CONDITIONAL_INVALID_CASE,
            params: [ 'ignore', 'IGNORE' ],
            position: conditionalPToken.sectionType,
            lastPosition: undefined,
         });
      });

   });
});
