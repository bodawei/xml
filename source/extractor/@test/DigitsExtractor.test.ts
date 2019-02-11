/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, Range } from 'basic';

import Extractor from '../Extractor';
import DigitExtractor from '../DigitExtractor';
import Segment from '../Segment';

describe('DigitExtractor', () => {
   let extractor: Extractor;
   let defaultLoc: EntityLocation;
   let segmentRange: Range;

   beforeEach(() => {
      defaultLoc = new EntityLocation();
      segmentRange = new Range(defaultLoc);

      extractor = new DigitExtractor(1.0, 10);
   });

   describe('basic behavior', () => {

      it('reports success when it has found a complete run of digits', () => {
         extractor.process(new Segment('012345x', segmentRange));

         expect(extractor.state).toEqual(Extractor.STATE.SUCCESS);
      });

      it('reports failure when it has not found a complete run of digits', () => {
         extractor.process(new Segment('x99999', segmentRange));

         expect(extractor.state).toEqual(Extractor.STATE.FAILURE);
      });

      it('delivers a set of decimal digits from the provided segment', () => {
         extractor.process(new Segment('012345', segmentRange));

         expect(extractor.finish()).toEqual({
            text: '012345',
            original: '012345',
            segments: [ {
               chars: 6,
               rows: 0,
               columns: 6,
               segment: {
                  range: segmentRange,
               },
            } ],
         });
      });

      it('delivers a set of hexidecimal digits from the provided segment', () => {
         extractor = new DigitExtractor(1.0, 16);
         extractor.process(new Segment('012345ABcdef', segmentRange));

         expect(extractor.finish()).toEqual({
            text: '012345ABcdef',
            original: '012345ABcdef',
            segments: [ {
               chars: 12,
               rows: 0,
               columns: 12,
               segment: {
                  range: segmentRange,
               },
            } ],
         });
      });

      it('delivers only the decimal digits when presented with a possibly ambiguous number', () => {
         const segment = new Segment('012345ABcdef', segmentRange);
         const expected = new Segment('012345ABcdef', segmentRange);
         expected.index = 6;

         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: '012345',
            original: '012345',
            segments: [ {
               chars: 6,
               rows: 0,
               columns: 6,
               segment: expected,
            } ],
         });
      });

   });

   describe('finish()', () => {

      it('returns whatever has been found when called at end', () => {
         const segment = new Segment('123', segmentRange);
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: '123',
            original: '123',
            segments: [ {
               chars: 3,
               rows: 0,
               columns: 3,
               segment: {
                  range: segmentRange,
               },
            } ],
         });
      });

   });

   describe('segment treatment', () => {

      it('correctly changes segment index after processing', () => {
         const segment = new Segment('123xy', segmentRange);
         extractor.process(segment);
         extractor.finish();

         expect(segment.index).toEqual(3);
      });

      it('does not change segment index when no digits found', () => {
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

      it('reports working state when the segment contains digits to the end of the segment', () => {
         extractor.process(new Segment('1', segmentRange));

         expect(extractor.state).toEqual(Extractor.STATE.WORKING);
      });

      it('returns all digits and ranges across multiple segments', () => {
         extractor.process(new Segment('123', segmentRange));
         extractor.process(new Segment('9876'));

         expect(extractor.finish()).toEqual({
            text: '1239876',
            original: '1239876',
            segments: [ {
               chars: 3,
               rows: 0,
               columns: 3,
               segment: {
                  range: segmentRange,
               },
            }, {
               chars: 4,
               rows: 0,
               columns: 4,
               segment: {
                  range: undefined,
               },
            } ],
         });
      });

      it('returns all digits and ranges across multiple segments, when digits end on a segment boundary', () => {
         extractor.process(new Segment('123', segmentRange));
         extractor.process(new Segment('9876'));
         extractor.process(new Segment('x'));

         expect(extractor.finish()).toEqual({
            text: '1239876',
            original: '1239876',
            segments: [ {
               chars: 3,
               rows: 0,
               columns: 3,
               segment: {
                  range: segmentRange,
               },
            }, {
               chars: 4,
               rows: 0,
               columns: 4,
               segment: {
                  range: undefined,
               },
            }, {
               chars: 0,
               rows: 0,
               columns: 0,
               segment: new Segment('x'),
            } ],
         });
      });

      it('sets state to success, when digits end on a segment boundary', () => {
         extractor.process(new Segment('123', segmentRange));
         extractor.process(new Segment('9876'));
         extractor.process(new Segment('x'));

         expect(extractor.state).toEqual(Extractor.STATE.SUCCESS);
      });

      it('returns a partially used segument', () => {
         const segment = new Segment('123xyz', segmentRange);
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: '123',
            original: '123',
            segments: [ {
               chars: 3,
               rows: 0,
               columns: 3,
               segment: segment,
            } ],
         });
      });

      it('returns all digits when picking up in mid-segment', () => {
         const segment = new Segment('xy123', segmentRange);
         segment.index = 2;
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: '123',
            original: '123',
            segments: [ {
               chars: 3,
               rows: 0,
               columns: 3,
               segment: {
                  range: segmentRange,
               },
            } ],
         });
      });

   });

});
