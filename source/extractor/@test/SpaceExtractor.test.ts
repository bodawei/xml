/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityId, Range  } from 'basic';

import Extractor from '../Extractor';
import SpaceExtractor from '../SpaceExtractor';
import {DONE_SEGMENT, PseudoSpace, Segment} from '../Segment';

describe('SpaceExtractor', () => {
   let extractor: Extractor;
   let segmentRange: Range;

   beforeEach(() => {
      segmentRange = new Range(new EntityId());

      extractor = new SpaceExtractor(1.0, true);
   });

   describe('basic behavior', () => {

      it('reports success when it has found a complete run of spaces', () => {
         extractor.process(new Segment(' x', segmentRange));

         expect(extractor.state).toEqual(Extractor.STATE.SUCCESS);
      });

      it('reports failure when it has not found a any space at the current point', () => {
         extractor.process(new Segment('x', segmentRange));

         expect(extractor.state).toEqual(Extractor.STATE.FAILURE);
      });

      it('delivers a set of spaces and tabs from the current segment', () => {
         extractor.process(new Segment(' \t', segmentRange));

         expect(extractor.finish()).toEqual({
            text: ' \t',
            original: ' \t',
            segments: [ {
               chars: 2,
               rows: 0,
               columns: 2,
               segment: {
                  type: DONE_SEGMENT,
                  range: segmentRange,
               },
            } ],
         });
      });


      it('delivers a pseudo space', () => {
         extractor.process(new PseudoSpace());

         expect(extractor.finish()).toEqual({
            text: ' ',
            original: '',
            segments: [ {
               chars: 0,
               rows: 0,
               columns: 0,
               segment: {
                  type: DONE_SEGMENT,
               },
            } ],
         });
      });
   });

   describe('finish()', () => {

      it('returns whatever has been found when it is called', () => {
         const segment = new Segment(' ', segmentRange);
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: ' ',
            original: ' ',
            segments: [ {
               chars: 1,
               rows: 0,
               columns: 1,
               segment: {
                  type: DONE_SEGMENT,
                  range: segmentRange,
               },
            } ],
         });
      });

   });

   describe('segment treatment', () => {

      it('correctly changes segment index after processing', () => {
         const segment = new Segment('  xy', segmentRange);
         extractor.process(segment);
         extractor.finish();

         expect(segment.index).toEqual(2);
      });

      it('does not change segment index when no spaces found', () => {
         const segment = new Segment('hi there', segmentRange);
         extractor.process(segment);
         extractor.finish();

         expect(segment.index).toEqual(0);
      });

   });

   describe('segment spanning', () => {

      it('reports failure state if no segments provided', () => {
         extractor.finish();

         expect(extractor.state).toEqual(Extractor.STATE.FAILURE);
      });

      it('reports working state when the segment contains spaces to the end of the segment', () => {
         extractor.process(new Segment(' ', segmentRange));

         expect(extractor.state).toEqual(Extractor.STATE.WORKING);
      });

      it('returns all spaces and ranges across multiple segments', () => {
         extractor.process(new Segment('  ', segmentRange));
         extractor.process(new Segment('\t\t'));

         expect(extractor.finish()).toEqual({
            text: '  \t\t',
            original: '  \t\t',
            segments: [ {
               chars: 2,
               rows: 0,
               columns: 2,
               segment: {
                  type: DONE_SEGMENT,
                  range: segmentRange,
               },
            }, {
               chars: 2,
               rows: 0,
               columns: 2,
               segment: {
                  type: DONE_SEGMENT,
                  range: undefined,
               },
            } ],
         });
      });


      it('returns all spaces and ranges across multiple segments including pseudo spaces', () => {
         extractor.process(new Segment('  ', segmentRange));
         extractor.process(new PseudoSpace());
         extractor.process(new Segment('\t\t'));

         expect(extractor.finish()).toEqual({
            text: '   \t\t',
            original: '  \t\t',
            segments: [ {
               chars: 2,
               rows: 0,
               columns: 2,
               segment: {
                  type: DONE_SEGMENT,
                  range: segmentRange,
               },
            }, {
               chars: 0,
               rows: 0,
               columns: 0,
               segment: {
                  type: DONE_SEGMENT,
               },
            }, {
               chars: 2,
               rows: 0,
               columns: 2,
               segment: {
                  type: DONE_SEGMENT,
                  range: undefined,
               },
            } ],
         });
      });
            it('returns all spaces and ranges across multiple segments when spaces end on a segment boundary', () => {
         extractor.process(new Segment(' ', segmentRange));
         extractor.process(new Segment('"'));

         expect(extractor.finish()).toEqual({
            text: ' ',
            original: ' ',
            segments: [ {
               chars: 1,
               rows: 0,
               columns: 1,
               segment: {
                  type: DONE_SEGMENT,
                  range: segmentRange,
               },
            }, {
               chars: 0,
               rows: 0,
               columns: 0,
               segment: new Segment('"'),
            } ],
         });
      });

      it('returns all spaces and ranges across multiple segments and is terminated by non-space', () => {
         const segment = new Segment('\t\tstuff');
         extractor.process(new Segment('  ', segmentRange));
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: '  \t\t',
            original: '  \t\t',
            segments: [ {
               chars: 2,
               rows: 0,
               columns: 2,
               segment: {
                  type: DONE_SEGMENT,
                  range: segmentRange,
               },
            }, {
               chars: 2,
               rows: 0,
               columns: 2,
               segment: segment,
            } ],
         });
      });

      it('partially modifies the segment', () => {
         const segment = new Segment('   xyz', segmentRange);
         extractor.process(segment);
         extractor.finish();

         expect(segment.index).toEqual(3);
      });

      it('returns all spaces when picking up in mid-segment', () => {
         const segment = new Segment('xy ', segmentRange);
         segment.index = 2;
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: ' ',
            original: ' ',
            segments: [ {
               chars: 1,
               rows: 0,
               columns: 1,
               segment: {
                  type: DONE_SEGMENT,
                  range: segmentRange,
               },
            } ],
         });
      });

   });

   describe('space types', () => {

      it('returns a mixture of space and tabs', () => {
         const segment = new Segment(' \t \t x');
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: ' \t \t ',
            original: ' \t \t ',
            segments: [ {
               chars: 5,
               rows: 0,
               columns: 5,
               segment: segment,
            } ],
         });
      });

      it('extracts a newline', () => {
         const segment = new Segment(' \n x');
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: ' \n ',
            original: ' \n ',
            segments: [ {
               chars: 3,
               rows: 1,
               columns: 1,
               segment: segment,
            } ],
         });
      });

      it('extracts a newline with no following whitespace', () => {
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

      it('extracts a carriage return', () => {
         const segment = new Segment('\rx');
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: '\n',
            original: '\r',
            segments: [ {
               chars: 1,
               rows: 1,
               columns: 0,
               segment: segment,
            } ],
         });
      });

      it('extracts a carriage return/new line combination as a new line', () => {
         const segment = new Segment('\r\nx');
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: '\n',
            original: '\r\n',
            segments: [ {
               chars: 2,
               rows: 1,
               columns: 0,
               segment: segment,
            } ],
         });
      });

      it('extracts a \\r\\n as a newline', () => {
         const segment = new Segment('\r\nx');
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: '\n',
            original: '\r\n',
            segments: [ {
               chars: 2,
               rows: 1,
               columns: 0,
               segment: segment,
            } ],
         });
      });

      it('does not recognice a \\u0085 as a space in 1.0', () => {
         const segment = new Segment('\u0085x');
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: '',
            original: '',
            segments: [ {
               chars: 0,
               rows: 0,
               columns: 0,
               segment: segment,
            } ],
         });
      });

      it('does not recognice a \\u2028 as a space in 1.0', () => {
         const segment = new Segment('\u2028x');
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: '',
            original: '',
            segments: [ {
               chars: 0,
               rows: 0,
               columns: 0,
               segment: segment,
            } ],
         });
      });

      it('extracts a \\u0085 as a new line in 1.1', () => {
         extractor = new SpaceExtractor(1.1);
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

      it('extracts a \\u2028 as a new line in 1.1', () => {
         extractor = new SpaceExtractor(1.1);
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
         extractor = new SpaceExtractor(1.1);
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


      it('extracts a \\r\\n as a \\r\n when processLineEndings is false', () => {
         extractor = new SpaceExtractor(1.0, false);
         const segment = new Segment('\r\nx');

         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: '\r\n',
            original: '\r\n',
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
