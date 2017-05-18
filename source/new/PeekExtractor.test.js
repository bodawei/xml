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
      sub = jasmine.createSpyObj('subSpy', [ 'process', 'done', 'getExtraction' ]);
      sub.state = Extractor.STATE.WORKING;

      extractor = new PeekExtractor(1.0, sub);
   });

   describe('constructor', () => {

      it('throws an error if it is not called with a ducktyped extractor', () => {
         expect(() => {
            new PeekExtractor(1.0, {});
         }).toThrowError('Must pass an object with process(), done() and getExtract() methods.');
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

   describe('done', () => {

      it('calls done() in subExtractor when called', () => {
         extractor.done();

         expect(sub.done).toHaveBeenCalledWith();
      });

      it('sets state to success if sub is success', () => {
         sub.state = Extractor.STATE.SUCCESS;
         extractor.done();

         expect(extractor.state).toEqual(Extractor.STATE.SUCCESS);
      });

      it('sets state to failure if sub is failure', () => {
         sub.state = Extractor.STATE.FAILURE;
         extractor.done();

         expect(extractor.state).toEqual(Extractor.STATE.FAILURE);
      });

   });

   describe('getExtraction()', () => {

      it('returns the text from the subExtractor', () => {
         sub.process = function process(segment) {
            this._text = this._text || [];
            this._normalizedText = this._normalizedText || [];
            this._normalizedText.push(segment.text + 'normal');
         };
         sub.state = Extractor.STATE.SUCCESS;
         extractor.process(new Segment('one'));
         extractor.process(new Segment('two'));

         expect(extractor.getExtraction().text).toEqual('onenormaltwonormal');
      });

      it('returns the originalText from the subExtractor', () => {
         sub.process = function process(segment) {
            this._text = this._text || [];
            this._normalizedText = this._normalizedText || [];
            this._text.push(segment.text + 'xx');
         };
         sub.state = Extractor.STATE.SUCCESS;
         extractor.process(new Segment('one'));
         extractor.process(new Segment('two'));

         expect(extractor.getExtraction().original).toEqual('onexxtwoxx');
      });

      it('returns the text and original text from the subExtractor after done()', () => {
         sub.done = function done() {
            this._text = [ 'done' ];
            this._normalizedText = [ 'done2' ];
         };
         sub.state = Extractor.STATE.SUCCESS;
         extractor.done();

         expect(extractor.getExtraction().text).toEqual('done2');
         expect(extractor.getExtraction().original).toEqual('done');
      });

      it('returns the text and original text from the subExtractor after done() and failure', () => {
         sub.done = function done() {
            this._text = [ 'done' ];
            this._normalizedText = [ 'done2' ];
         };
         sub.state = Extractor.STATE.FAILURE;
         extractor.done();

         expect(extractor.getExtraction().text).toEqual('done2');
         expect(extractor.getExtraction().original).toEqual('done');
      });

      it('resets all segments to starting index (on success in process)', () => {
         const segment1 = new Segment('aa');
         const segment2 = new Segment('bb');
         const segment3 = new Segment('cc');
         segment1.index = 1;
         sub.process = function process(segment) {
            segment.index = segment.text.length;
            this._text = this._text || [];
            this._normalizedText = this._normalizedText || [];
         };

         extractor.process(segment1);
         extractor.process(segment2);
         expect(segment1.index).toEqual(2);
         sub.state = Extractor.STATE.SUCCESS;
         extractor.process(segment3);

         expect(extractor.getExtraction().segments[0].segment.index).toEqual(1);
         expect(extractor.getExtraction().segments[1].segment.index).toEqual(0);
         expect(extractor.getExtraction().segments[2].segment.index).toEqual(0);
      });

   });

});
