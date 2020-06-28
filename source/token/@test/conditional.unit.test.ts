/* Copyright ® 2020 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { toSToken } from 'sToken';
import { MockSTokenSource } from 'sToken-test';

import { SectionStart } from '../bridge/section';
import { ConditionalPToken, parseConditional } from '../conditional';

describe('conditional (unit)', () => {
   let sectionStart: SectionStart;
   let conditionalPToken: ConditionalPToken;

   beforeEach(() => {
      sectionStart = {
         open: toSToken('<!['),
         sectionType: toSToken('IGNORE'),
      };
   });

   describe('ConditionalPToken()', () => {
      it('populates values with undefined when not specified', () => {
         expect(new ConditionalPToken({
            open: toSToken('<!['),
         })).toEqualRangeless(new ConditionalPToken({
            open: toSToken('<!['),
            sectionType: undefined,
            bracket: undefined,
         }));
      });

      it('populates values with a combination of the base value and the lose values', () => {
         expect(new ConditionalPToken({
            open: toSToken('<!['),
         }, {
            sectionType: toSToken('FROG'),
         })).toEqualRangeless(new ConditionalPToken({
            open: toSToken('<!['),
            sectionType: toSToken('FROG'),
            bracket: undefined,
         }));
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

         expect(callback).toEqualRangeless(new ConditionalPToken({
            open: toSToken('<!['),
            sectionType: toSToken('IGNORE'),
            bracket: toSToken('['),
         }));
      });

      it('returns an incomplete parsing if type is INCLUDE', () => {
         sectionStart.sectionType = toSToken('INCLUDE');
         const mockSource = new MockSTokenSource([
            [ '[', 'match', '[' ],
         ]);

         parseConditional(mockSource, sectionStart, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless(new ConditionalPToken({
            open: toSToken('<!['),
            sectionType: toSToken('INCLUDE'),
            bracket: toSToken('['),
         }));
      });

   });

});
