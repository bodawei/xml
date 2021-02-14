/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import Extractor, { ExtractResult, SegmentInfo } from '../Extractor';
import PeekExtractor from '../PeekExtractor';
import {DONE_SEGMENT, PseudoSpace, PSEUDO_SPACE, Segment} from '../Segment';

describe('PeekExtractor', () => {
   let extractor: Extractor;
   let sub: Extractor;

   beforeEach(() => {
      sub = jasmine.createSpyObj('subSpy', [ 'process', 'finish' ]);
      sub.state = Extractor.STATE.WORKING;

      extractor = new PeekExtractor(1.0, sub);
   });

   describe('constructor', () => {

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
         (sub.finish as jasmine.Spy).and.returnValue({
            segments: [],
         });
         extractor.finish();

         expect(sub.finish).toHaveBeenCalledWith();
      });

      it('sets state to success if sub is success', () => {
         (sub.finish as jasmine.Spy).and.returnValue({
            segments: [],
         });
         sub.state = Extractor.STATE.SUCCESS;
         extractor.finish();

         expect(extractor.state).toEqual(Extractor.STATE.SUCCESS);
      });

      it('sets state to failure if sub is failure', () => {
         (sub.finish as jasmine.Spy).and.returnValue({
            segments: [],
         });
         sub.state = Extractor.STATE.FAILURE;
         extractor.finish();

         expect(extractor.state).toEqual(Extractor.STATE.FAILURE);
      });

   });

   describe('extraction', () => {

      it('returns the text from the subExtractor', () => {
         const dummySegInfo: SegmentInfo = {
            chars: 0,   // just giving some dummy data so it doesn't get sick
            rows: 0,
            columns: 0,
            segment: new Segment('foo'),
         };
         class TestExtractor extends Extractor {
            process(segment: Segment) {
               this.text = this.text || [];
               this.text.push(segment.text + 'normal');
            };
            finish(): ExtractResult {
               return {
                  text: this.text.join(''),
                  original: '',
                  segments: [ dummySegInfo, dummySegInfo ],
               };
            };
         }
         const testExtractor = new TestExtractor(1);
         testExtractor.state = Extractor.STATE.SUCCESS
         extractor = new PeekExtractor(1.0, testExtractor);

         extractor.process(new Segment('one'));
         extractor.process(new Segment('two'));

         expect(extractor.finish().text).toEqual('onenormaltwonormal');
      });

      it('returns the original text from the subExtractor', () => {
         const dummySegInfo: SegmentInfo = {
            chars: 0,   // just giving some dummy data so it doesn't get sick
            rows: 0,
            columns: 0,
            segment: new Segment('foo'),
         };
         class TestExtractor extends Extractor {
            process(segment: Segment) {
               this.text = this.text || [];
               this.text.push(segment.text + 'xx');
            };
            finish(): ExtractResult {
               return {
                  text: '',
                  original: this.text.join(''),
                  segments: [ dummySegInfo, dummySegInfo ],
               };
            };
         }
         const testExtractor = new TestExtractor(1);
         testExtractor.state = Extractor.STATE.SUCCESS
         extractor = new PeekExtractor(1.0, testExtractor);

         extractor.process(new Segment('one'));
         extractor.process(new Segment('two'));

         expect(extractor.finish().original).toEqual('onexxtwoxx');
      });

      it('returns the text from the subExtractor after finish() and failure', () => {
         sub.finish = function finish(): ExtractResult {
            return {
               text: 'done',
               original: 'done',
               segments: []
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
         const segments: Array<Segment | PseudoSpace > = [];
         sub.process = function process(segment) {
            segments.push(segment);
         };
         sub.finish = function finish(): ExtractResult {
            return {
               text: '',
               original: '',
               segments: segments.map((seg): SegmentInfo => {
                  return {
                     chars: 1,
                     rows: 1,
                     columns: 1,
                     segment: seg,
                  }
               }),
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

      it('returns the unchanged segments from the subExtractor', () => {
         const text: Array<string> = [];
         sub.process = function process(segment) {
            if (segment.type === PSEUDO_SPACE) {
               return;
            }
            text.push(segment.text + 'xx');
            segment.index = segment.text.length;
         };
         sub.finish = function finish() {
            return {
               text:  text.join(''),
               original: text.join(''),
               segments: [ {
                  chars: 3,
                  rows: 0,
                  columns: 3,
                  segment: {
                     type: DONE_SEGMENT,
                     range: undefined,
                  },
               }, {
                  chars: 5,
                  rows: 0,
                  columns: 5,
                  segment: {
                     type: DONE_SEGMENT,
                     range: undefined,
                  },
               } ],
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
               segment: new Segment('one'),
            }, {
               chars: 5,
               rows: 0,
               columns: 5,
               segment: new Segment('three'),
            } ],
         });
      });

   });

});
