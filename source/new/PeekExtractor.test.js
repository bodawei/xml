/* Copyright ® 2017 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const Extractor = require('./Extractor.js');
const PeekExtractor = require('./PeekExtractor.js');
const Segment = require('./Segment.js');

describe('PeekExtractor', () => {
   let extractor;
   let sub;

   beforeEach(() => {
      sub = jasmine.createSpyObj('subSpy', [ 'process', 'finish' ]);
      sub.state = Extractor.STATE.WORKING;

      extractor = new PeekExtractor(1.0, sub);
   });

   describe('constructor', () => {

      it('throws an error if it is not called with a ducktyped extractor', () => {
         expect(() => {
            new PeekExtractor(1.0, {});
         }).toThrowError('Must pass an object with process() and finish() methods.');
      });

      it('has a state of working by default', () => {
         expect(extractor.state).toEqual(Extractor.STATE.WORKING);
      });

   });

   describe('process', () => {

      it('calls process in subExtractor when called', () => {
         const segment = new Segment('xy');
         extractor.process(segment);

         expect(sub.process).toHaveBeenCalledWith(segment);
      });

      it('sets state to success if sub is success', () => {
         sub.state = Extractor.STATE.SUCCESS;
         extractor.process(new Segment('xy'));

         expect(extractor.state).toEqual(Extractor.STATE.SUCCESS);
      });

      it('sets state to failure if sub is failure', () => {
         sub.state = Extractor.STATE.FAILURE;
         extractor.process(new Segment('xy'));

         expect(extractor.state).toEqual(Extractor.STATE.FAILURE);
      });

   });

   describe('finish()', () => {

      it('calls done() in subExtractor when called', () => {
         sub.finish.and.returnValue({
            segments: []
         });
         extractor.finish();

         expect(sub.finish).toHaveBeenCalledWith();
      });

      it('sets state to success if sub is success', () => {
         sub.finish.and.returnValue({
            segments: []
         });
         sub.state = Extractor.STATE.SUCCESS;
         extractor.finish();

         expect(extractor.state).toEqual(Extractor.STATE.SUCCESS);
      });

      it('sets state to failure if sub is failure', () => {
         sub.finish.and.returnValue({
            segments: []
         });
         sub.state = Extractor.STATE.FAILURE;
         extractor.finish();

         expect(extractor.state).toEqual(Extractor.STATE.FAILURE);
      });

   });

   describe('extraction', () => {

      it('returns the text from the subExtractor', () => {
         sub.process = function process(segment) {
            this._text = this._text || [];
            this._text.push(segment.text + 'normal');
         };
         sub.finish = function finish() {
            return {
               text: this._text.join(''),
               segments: [ {
                  chars: 0,   // just giving some dummy data so it doesn't get sick
                  rows: 0,
                  columns: 0,
                  segment: undefined
               }, {
                  chars: 0,
                  rows: 0,
                  columns: 0,
                  segment: undefined
               } ]
            };
         };
         sub.state = Extractor.STATE.SUCCESS;
         extractor.process(new Segment('one'));
         extractor.process(new Segment('two'));

         expect(extractor.finish().text).toEqual('onenormaltwonormal');
      });

      it('returns the original from the subExtractor', () => {
         sub.process = function process(segment) {
            this._text = this._text || [];
            this._text.push(segment.text + 'xx');
         };
         sub.finish = function finish() {
            return {
               original: this._text.join(''),
               segments: [ {
                  chars: 0,   // just giving some dummy data so it doesn't get sick
                  rows: 0,
                  columns: 0,
                  segment: undefined
               }, {
                  chars: 0,
                  rows: 0,
                  columns: 0,
                  segment: undefined
               } ]
            };
         };
         sub.state = Extractor.STATE.SUCCESS;
         extractor.process(new Segment('one'));
         extractor.process(new Segment('two'));

         expect(extractor.finish().original).toEqual('onexxtwoxx');
      });

      it('returns the text from the subExtractor after finish() and failure', () => {
         sub.finish = function finish() {
            return {
               text: 'done'
            };
         };
         sub.state = Extractor.STATE.FAILURE;
         const result = extractor.finish();

         expect(result.text).toEqual('done');
      });

      it('resets all segments to starting index (on success in process)', () => {
         const segment1 = new Segment('aa');
         const segment2 = new Segment('bb');
         const segment3 = new Segment('cc');
         segment1.index = 1;
         sub.process = function process(segment) {
            this._segments = this._segments || [];
            this._segments.push(segment);
         };
         sub.finish = function finish() {
            return {
               segments: this._segments
            };
         };

         extractor.process(segment1);
         extractor.process(segment2);
         sub.state = Extractor.STATE.SUCCESS;
         extractor.process(segment3);

         const result = extractor.finish();
         expect(result.segments[0].segment).toEqual(segment1);
         expect(result.segments[1].segment).toEqual(segment2);
         expect(result.segments[2].segment).toEqual(segment3);
      });

      it('returns the original from the subExtractor', () => {
         sub.process = function process(segment) {
            this._text = this._text || [];
            this._text.push(segment.text + 'xx');
            segment.index = segment.text.length;
         };
         sub.finish = function finish() {
            return {
               text:  this._text.join(''),
               original: this._text.join(''),
               segments: [ {
                  chars: 3,
                  rows: 0,
                  columns: 3,
                  segment: {
                     range: undefined
                  }
               }, {
                  chars: 5,
                  rows: 0,
                  columns: 5,
                  segment: {
                     range: undefined
                  }
               } ]
            };
         };
         sub.state = Extractor.STATE.SUCCESS;
         const segment1 = new Segment('one');
         const segment2 = new Segment('three');
         extractor.process(segment1);
         extractor.process(segment2);

         expect(extractor.finish()).toEqual({
            text: 'onexxthreexx',
            original: 'onexxthreexx',
            segments: [ {
               chars: 3,
               rows: 0,
               columns: 3,
               segment: new Segment('one')
            }, {
               chars: 5,
               rows: 0,
               columns: 5,
               segment: new Segment('three')
            } ]
         });
      });

   });

});
