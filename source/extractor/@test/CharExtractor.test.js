/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, Range } from '../../basic';

import CharExtractor from '../CharExtractor.js';
import Extractor from '../Extractor.js';
import Segment from '../Segment.js';

describe('CharExtractor', () => {
   let extractor;
   let defaultLoc;
   let segmentRange;

   beforeEach(() => {
      defaultLoc = new EntityLocation();
      segmentRange = new Range(defaultLoc);

      extractor = new CharExtractor(1.0);
   });

   describe('basic behavior', () => {

      it('reports success when it has found a character', () => {
         extractor.process(new Segment('a'));

         expect(extractor.state).toEqual(Extractor.STATE.SUCCESS);
      });

      it('reports failure when it has not found a any characters', () => {
         extractor.finish();

         expect(extractor.state).toEqual(Extractor.STATE.FAILURE);
      });

      it('delivers the nextcharacter from the segment', () => {
         extractor.process(new Segment('b', segmentRange));

         expect(extractor.finish()).toEqual({
            text: 'b',
            original: 'b',
            segments: [ {
               chars: 1,
               rows: 0,
               columns: 1,
               segment: {
                  range: segmentRange,
               },
            } ],
         });
      });

   });

   describe('finish()', () => {

      it('returns whatever has been found at the point it is called', () => {
         extractor.process(new Segment('\r'));

         expect(extractor.finish()).toEqual({
            text: '\n',
            original: '\r',
            segments: [ {
               chars: 1,
               rows: 1,
               columns: 0,
               segment: {
                  range: undefined,
               },
            } ],
         });
      });

   });

   describe('segment treatment', () => {

      it('correctly changes segment index after processing', () => {
         const segment = new Segment('c');
         extractor.process(segment);

         expect(segment.index).toEqual(1);
      });

   });

   describe('segment spanning', () => {

      it('reports failure state if no segments provided', () => {
         extractor.finish();

         expect(extractor.state).toEqual(Extractor.STATE.FAILURE);
      });

      it('returns the next character when picking up in mid-segment', () => {
         const segment = new Segment('xy ', segmentRange);
         segment.index = 1;
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: 'y',
            original: 'y',
            segments: [ {
               chars: 1,
               rows: 0,
               columns: 1,
               segment: segment,
            } ],
         });
      });

   });

   describe('newlines', () => {

      it('extracts a newline as a newline', () => {
         const segment = new Segment('\nx');
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: '\n',
            original: '\n',
            segments: [ {
               chars: 1,
               rows: 1,
               columns: 0,
               segment: segment,
            } ],
         });
      });

      it('extracts a CRLF in one segment as a newline', () => {
         const segment = new Segment('\r\n');
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: '\n',
            original: '\r\n',
            segments: [ {
               chars: 2,
               rows: 1,
               columns: 0,
               segment: {
                  range: segment.range,
               },
            } ],
         });
      });

      it('extracts a CRLF across segments as a newline', () => {
         extractor.process(new Segment('\r'));
         extractor.process(new Segment('\n'));

         expect(extractor.finish()).toEqual({
            text: '\n',
            original: '\r\n',
            segments: [ {
               chars: 1,
               rows: 1,
               columns: 0,
               segment: {
                  range: undefined,
               },
            }, {
               chars: 1,
               rows: 0,
               columns: 0,
               segment: {
                  range: undefined,
               },
            } ],
         });
      });

      it('extracts a CR on segment end as a newline', () => {
         extractor.process(new Segment('\r'));
         const segment = new Segment('x');
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: '\n',
            original: '\r',
            segments: [ {
               chars: 1,
               rows: 1,
               columns: 0,
               segment: {
                  range: undefined,
               },
            }, {
               chars: 0,
               rows: 0,
               columns: 0,
               segment: segment,
            } ],
         });
         expect(segment.index).toEqual(0);
      });

      it('extracts a CR on segment end as a newline even when next char is a CR', () => {
         extractor.process(new Segment('\r'));
         const segment = new Segment('\r');
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: '\n',
            original: '\r',
            segments: [ {
               chars: 1,
               rows: 1,
               columns: 0,
               segment: {
                  range: undefined,
               },
            }, {
               chars: 0,
               rows: 0,
               columns: 0,
               segment: segment,
            } ],
         });
         expect(segment.index).toEqual(0);
      });

      it('does not recognize a \\u0085 as a newline in 1.0', () => {
         const segment = new Segment('\u0085x');
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: '\u0085',
            original: '\u0085',
            segments: [ {
               chars: 1,
               rows: 0,
               columns: 1,
               segment: segment,
            } ],
         });
      });

      it('does not recognize a \\u2028 as a newline in 1.0', () => {
         const segment = new Segment('\u2028x');
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: '\u2028',
            original: '\u2028',
            segments: [ {
               chars: 1,
               rows: 0,
               columns: 1,
               segment: segment,
            } ],
         });
      });

      it('extracts a \\u0085 as a newline in 1.1', () => {
         extractor = new CharExtractor(1.1);
         const segment = new Segment('\u0085x');
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: '\n',
            original: '\u0085',
            segments: [ {
               chars: 1,
               rows: 1,
               columns: 0,
               segment: segment,
            } ],
         });
      });

      it('extracts a \\u2028 as a newline in 1.1', () => {
         extractor = new CharExtractor(1.1);
         const segment = new Segment('\u2028x');
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: '\n',
            original: '\u2028',
            segments: [ {
               chars: 1,
               rows: 1,
               columns: 0,
               segment: segment,
            } ],
         });
      });

      it('extracts a \\r\\u0085 as a newline in 1.1', () => {
         extractor = new CharExtractor(1.1);
         const segment = new Segment('\r\u0085x');
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: '\n',
            original: '\r\u0085',
            segments: [ {
               chars: 2,
               rows: 1,
               columns: 0,
               segment: segment,
            } ],
         });
      });

   });

});
