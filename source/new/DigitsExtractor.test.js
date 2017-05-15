/* Copyright ® 2017 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const Extractor = require('./Extractor.js');
const DigitExtractor = require('./DigitExtractor.js');
const EntityLocation = require('../shared/EntityLocation.js');
const Range = require('./Range.js');
const Segment = require('./Segment.js');

describe('DigitExtractor', () => {
   let extractor;
   let defaultLoc;
   let segmentRange;

   beforeEach(() => {
      defaultLoc = new EntityLocation();
      segmentRange = new Range(defaultLoc);

      extractor = new DigitExtractor(1.0);
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
         extractor.done();

         expect(extractor.getExtraction()).toEqual({
            text: '012345',
            original: '012345',
            segments: [ {
               chars: 6,
               rows: 0,
               columns: 6,
               range: segmentRange
            } ]
         });
      });

      it('delivers a set of hexidecimal digits from the provided segment', () => {
         extractor.process(new Segment('012345ABcdef', segmentRange));
         extractor.done();

         expect(extractor.getExtraction()).toEqual({
            text: '012345ABcdef',
            original: '012345ABcdef',
            segments: [ {
               chars: 12,
               rows: 0,
               columns: 12,
               range: segmentRange
            } ]
         });
      });

   });

   describe('getExtraction()', () => {

      it('returns nothing when not in a complete state', () => {
         const segment = new Segment('123', segmentRange);
         extractor.process(segment);

         expect(extractor.getExtraction()).toBeUndefined();
      });

   });

   describe('segment treatment', () => {

      it('correctly changes segment index after processing', () => {
         const segment = new Segment('123xy', segmentRange);
         extractor.process(segment);
         extractor.done();

         expect(segment.index).toEqual(3);
      });

      it('does not change segment index when no digits found', () => {
         const segment = new Segment('hi there', segmentRange);
         extractor.process(segment);
         extractor.done();

         expect(segment.index).toEqual(0);
      });

   });

   describe('segment spanning', () => {

      it('reports failure state if no segments provided', () => {
         extractor.done();

         expect(extractor.state).toEqual(Extractor.STATE.FAILURE);
      });

      it('reports working state when the segment contains digits to the end of the segment', () => {
         extractor.process(new Segment('1', segmentRange));

         expect(extractor.state).toEqual(Extractor.STATE.WORKING);
      });

      it('returns all digits and ranges across multiple segments', () => {
         extractor.process(new Segment('123', segmentRange));
         extractor.process(new Segment('abcd'));
         extractor.done();

         expect(extractor.getExtraction()).toEqual({
            text: '123abcd',
            original: '123abcd',
            segments: [ {
               chars: 3,
               rows: 0,
               columns: 3,
               range: segmentRange
            }, {
               chars: 4,
               rows: 0,
               columns: 4,
               range: undefined
            } ]
         });
      });

      it('returns a partially used segument', () => {
         const segment = new Segment('123xyz', segmentRange);
         extractor.process(segment);
         extractor.done();

         expect(extractor.getExtraction()).toEqual({
            text: '123',
            original: '123',
            segments: [ {
               chars: 3,
               rows: 0,
               columns: 3,
               segment: segment
            } ]
         });
      });

      it('returns all digits when picking up in mid-segment', () => {
         const segment = new Segment('xy123', segmentRange);
         segment.index = 2;
         extractor.process(segment);
         extractor.done();

         expect(extractor.getExtraction()).toEqual({
            text: '123',
            original: '123',
            segments: [ {
               chars: 3,
               rows: 0,
               columns: 3,
               range: segmentRange
            } ]
         });
      });

   });

});
