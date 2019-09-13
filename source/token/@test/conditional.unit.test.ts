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
      });
   });

   describe('parseConditional()', () => {
      let callback: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('returns simple values', () => {
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

   });

});
