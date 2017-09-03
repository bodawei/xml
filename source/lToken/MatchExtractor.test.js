/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, Range } from '../basic';

import Extractor from './Extractor.js';
import MatchExtractor from './MatchExtractor.js';
import Segment from './Segment.js';

describe('MatchExtractor', () => {
   let extractor;
   let defaultLoc;
   let segmentRange;

   beforeEach(() => {
      defaultLoc = new EntityLocation();
      segmentRange = new Range(defaultLoc);
   });

   describe('basic behavior', () => {

      it('throws an error if given a non-string a sa parameter', () => {
         expect(() => {
            extractor = new MatchExtractor(1.0, [ 'x' ]);
         }).toThrowError('MatchExtractor expects a string as a parameter, but got ["x"]');
      });

      it('reports success when it has found the requested match', () => {
         extractor = new MatchExtractor(1.0, 'x');
         extractor.process(new Segment('xy '));

         expect(extractor.state).toEqual(Extractor.STATE.SUCCESS);
      });

      it('reports failure when it has not found the match at the current point', () => {
         extractor = new MatchExtractor(1.0, 'x');
         extractor.process(new Segment('wx'));

         expect(extractor.state).toEqual(Extractor.STATE.FAILURE);
      });

      it('delivers the match text with the right offsets and range', () => {
         extractor = new MatchExtractor(1.0, 'xyzzy');
         extractor.process(new Segment('xyzzy', segmentRange));

         expect(extractor.finish()).toEqual({
            text: 'xyzzy',
            original: 'xyzzy',
            segments: [ {
               chars: 5,
               rows: 0,
               columns: 5,
               segment: {
                  range: segmentRange,
               },
            } ],
         });
      });

   });

   describe('finish()', () => {

      it('returns the match, if fully found, while not yet done)', () => {
         extractor = new MatchExtractor(1.0, 'w');
         extractor.process(new Segment('w'));

         expect(extractor.finish()).toEqual({
            text: 'w',
            original: 'w',
            segments: [ {
               chars: 1,
               rows: 0,
               columns: 1,
               segment: {
                  range: undefined,
               },
            } ],
         });
      });

   });

   describe('segment treatment', () => {

      it('correctly changes segment index after processing', () => {
         extractor = new MatchExtractor(1.0, 'one');
         const segment = new Segment('onetwo');
         extractor.process(segment);

         expect(segment.index).toEqual(3);
      });

      it('does not change segment index when no match found', () => {
         const segment = new Segment('hi there');
         extractor.process(segment, 'xyzzy');

         expect(segment.index).toEqual(0);
      });

   });

   describe('segment spanning', () => {

      it('reports failure state if no segments provided', () => {
         extractor = new MatchExtractor(1.0, 'one');
         extractor.finish();

         expect(extractor.state).toEqual(Extractor.STATE.FAILURE);
      });

      it('reports working state when the part of match has been matched', () => {
         extractor = new MatchExtractor(1.0, 'one');
         extractor.process(new Segment('on'));

         expect(extractor.state).toEqual(Extractor.STATE.WORKING);
      });

      it('returns no data when a only given eof', () => {
         extractor = new MatchExtractor(1.0, 'x');

         expect(extractor.finish()).toEqual({
            text: '',
            original: '',
            segments: [],
         });
      });

      it('returns a complete match across multiple segments', () => {
         extractor = new MatchExtractor(1.0, 'abcdef');
         extractor.process(new Segment('ab', segmentRange));
         extractor.process(new Segment('cd'));
         extractor.process(new Segment('ef'));

         expect(extractor.finish()).toEqual({
            text: 'abcdef',
            original: 'abcdef',
            segments: [ {
               chars: 2,
               rows: 0,
               columns: 2,
               segment: {
                  range: segmentRange,
               },
            }, {
               chars: 2,
               rows: 0,
               columns: 2,
               segment: {
                  range: undefined,
               },
            }, {
               chars: 2,
               rows: 0,
               columns: 2,
               segment: {
                  range: undefined,
               },
            } ],
         });
      });

      it('returns match across multiple segments and is terminated by non-match char', () => {
         extractor = new MatchExtractor(1.0, 'lukesky');
         extractor.process(new Segment('luke', segmentRange));
         const segment = new Segment('skywalker');
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: 'lukesky',
            original: 'lukesky',
            segments: [ {
               chars: 4,
               rows: 0,
               columns: 4,
               segment: {
                  range: segmentRange,
               },
            }, {
               chars: 3,
               rows: 0,
               columns: 3,
               segment: segment,
            } ],
         });
      });

      it('returns no data when a match proves to not be true on a subsequent segment', () => {
         extractor = new MatchExtractor(1.0, 'hansel');
         const segment1 = new Segment('han');
         const segment2 = new Segment('solo');
         extractor.process(segment1);
         extractor.process(segment2);

         expect(extractor.finish()).toEqual({
            text: '',
            original: '',
            segments: [ {
               chars: 0,
               rows: 0,
               columns: 0,
               segment: segment1,
            }, {
               chars: 0,
               rows: 0,
               columns: 0,
               segment: segment2,
            } ],
         });
      });

      it('returns the match when picking up in mid-segment', () => {
         extractor = new MatchExtractor(1.0, 'xy');
         const segment = new Segment('wxyz', segmentRange);
         segment.index = 1;
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: 'xy',
            original: 'xy',
            segments: [ {
               chars: 2,
               rows: 0,
               columns: 2,
               segment: segment,
            } ],
         });
      });

   });

});
