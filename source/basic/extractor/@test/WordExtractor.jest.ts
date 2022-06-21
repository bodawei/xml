/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { describe, it, expect } from '@jest/globals';
import { Range, EntityId } from 'basic';

import { DONE_SEGMENT, Segment } from '../Segment';
import { WordExtractor } from '../WordExtractor';

describe('WordExtractor', () => {
   let segmentRange: Range;

   beforeEach(() => {
      segmentRange = new Range(new EntityId());
   });

   describe('basic behavior', () => {
      it('extracts to end of last segment if no other terminators', () => {
         const extractor = new WordExtractor(1.0, true, []);
         extractor.process(new Segment('onetwothree', segmentRange));

         expect(extractor.finish()).toEqual({
            text: 'onetwothree',
            original: 'onetwothree',
            segments: [
               {
                  chars: 11,
                  rows: 0,
                  columns: 11,
                  segment: {
                     type: DONE_SEGMENT,
                     range: segmentRange,
                  },
               },
            ],
         });
      });

      it('can omit terminators if no added needed', () => {
         const extractor = new WordExtractor(1.0, true);
         extractor.process(new Segment('noterm', segmentRange));

         expect(extractor.finish()).toEqual({
            text: 'noterm',
            original: 'noterm',
            segments: [
               {
                  chars: 6,
                  rows: 0,
                  columns: 6,
                  segment: {
                     type: DONE_SEGMENT,
                     range: segmentRange,
                  },
               },
            ],
         });
      });

      it('will stop at a provided terminator', () => {
         const extractor = new WordExtractor(1.0, true, ['xyzzy']);
         const segment = new Segment('txtxyzzy', segmentRange);
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: 'txt',
            original: 'txt',
            segments: [
               {
                  chars: 3,
                  rows: 0,
                  columns: 3,
                  segment: segment,
               },
            ],
         });
      });
   });

   describe('whitspace terminator', () => {
      it('extracts to the first space', () => {
         const extractor = new WordExtractor(1.0, true, []);
         const segment = new Segment('space    ', segmentRange);
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: 'space',
            original: 'space',
            segments: [
               {
                  chars: 5,
                  rows: 0,
                  columns: 5,
                  segment: segment,
               },
            ],
         });
      });

      it('extracts to the first tab', () => {
         const extractor = new WordExtractor(1.0, true, []);
         const segment = new Segment('tab\t  ', segmentRange);
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: 'tab',
            original: 'tab',
            segments: [
               {
                  chars: 3,
                  rows: 0,
                  columns: 3,
                  segment: segment,
               },
            ],
         });
      });

      it('extracts to the first newline', () => {
         const extractor = new WordExtractor(1.0, true, []);
         const segment = new Segment('newline\n\t  ', segmentRange);
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: 'newline',
            original: 'newline',
            segments: [
               {
                  chars: 7,
                  rows: 0,
                  columns: 7,
                  segment: segment,
               },
            ],
         });
      });

      it('extracts to the first carriage return', () => {
         const extractor = new WordExtractor(1.0, true, []);
         const segment = new Segment('cr\r  ', segmentRange);
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: 'cr',
            original: 'cr',
            segments: [
               {
                  chars: 2,
                  rows: 0,
                  columns: 2,
                  segment: segment,
               },
            ],
         });
      });

      it('ignores \\u0085 in 1.0', () => {
         const extractor = new WordExtractor(1.0, true, []);
         const segment = new Segment('85\u0085foo  ', segmentRange);
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: '85\u0085foo',
            original: '85\u0085foo',
            segments: [
               {
                  chars: 6,
                  rows: 0,
                  columns: 6,
                  segment: segment,
               },
            ],
         });
      });

      it('stops at \\u0085 in 1.1', () => {
         const extractor = new WordExtractor(1.1, true, []);
         const segment = new Segment('85\u0085foo  ', segmentRange);
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: '85',
            original: '85',
            segments: [
               {
                  chars: 2,
                  rows: 0,
                  columns: 2,
                  segment: segment,
               },
            ],
         });
      });

      it('ignores \\u2028 in 1.0', () => {
         const extractor = new WordExtractor(1.0, true, []);
         const segment = new Segment('22\u2028foo  ', segmentRange);
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: '22\u2028foo',
            original: '22\u2028foo',
            segments: [
               {
                  chars: 6,
                  rows: 0,
                  columns: 6,
                  segment: segment,
               },
            ],
         });
      });

      it('stops at \\u2028 in 1.1', () => {
         const extractor = new WordExtractor(1.1, true, []);
         const segment = new Segment('22\u2028foo  ', segmentRange);
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: '22',
            original: '22',
            segments: [
               {
                  chars: 2,
                  rows: 0,
                  columns: 2,
                  segment: segment,
               },
            ],
         });
      });
   });
});
