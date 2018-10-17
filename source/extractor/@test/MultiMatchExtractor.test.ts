/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, Range} from '../../basic';

import Extractor from '../Extractor';
import MultiMatchExtractor from '../MultiMatchExtractor';
import Segment from '../Segment';

describe('MultiMatchExtractor', () => {
   let extractor: Extractor;
   let defaultLoc: EntityLocation;
   let segmentRange: Range;

   beforeEach(() => {
      defaultLoc = new EntityLocation();
      segmentRange = new Range(defaultLoc);
   });

   describe('construction', () => {

      it('throws an error if called with the same candidate twice', () => {
         expect(() => {
            new MultiMatchExtractor(1.0, [ 'w', 'w' ]);
         }).toThrowError('"w" was specified twice.');
      });

   });

   describe('basic behavior', () => {

      it('reports success when it has found one of the desired matches', () => {
         extractor = new MultiMatchExtractor(1.0, [ 'x', 'y' ]);
         extractor.process(new Segment('yw '));

         expect(extractor.state).toEqual(Extractor.STATE.SUCCESS);
      });

      it('reports failure when it has not found the match at the current point', () => {
         extractor = new MultiMatchExtractor(1.0, [ 'x', 'w' ]);
         extractor.process(new Segment('yx'));

         expect(extractor.state).toEqual(Extractor.STATE.FAILURE);
      });

      it('delivers the match text with the right offsets and range', () => {
         extractor = new MultiMatchExtractor(1.0, [ 'noise', 'xyzzy' ]);
         const segment = new Segment('xyzzyfoo', segmentRange);
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: 'xyzzy',
            original: 'xyzzy',
            segments: [ {
               chars: 5,
               rows: 0,
               columns: 5,
               segment: segment,
            } ],
         });
      });

   });

   describe('finish()', () => {

      it('returns the match, if fully found at end of segment', () => {
         extractor = new MultiMatchExtractor(1.0, [ 'w', 'x' ]);
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
         extractor = new MultiMatchExtractor(1.0, [ 'one', 'two' ]);
         const segment = new Segment('onetwo');
         extractor.process(segment);
         extractor.finish();

         expect(segment.index).toEqual(3);
      });

      it('does not change segment index when no match found', () => {
         const segment = new Segment('hi there');
         extractor.process(segment);
         extractor.finish();

         expect(segment.index).toEqual(0);
      });

   });

   describe('segment spanning', () => {

      it('reports failure state if no segments provided', () => {
         extractor = new MultiMatchExtractor(1.0, [ 'one' ]);
         extractor.finish();

         expect(extractor.state).toEqual(Extractor.STATE.FAILURE);
      });

      it('reports working state when the part of match has been matched', () => {
         extractor = new MultiMatchExtractor(1.0, [ 'one' ]);
         extractor.process(new Segment('on'));

         expect(extractor.state).toEqual(Extractor.STATE.WORKING);
      });

      it('returns no data when a only given eof', () => {
         extractor = new MultiMatchExtractor(1.0, [ 'x' ]);

         expect(extractor.finish()).toEqual({
            text: '',
            original: '',
            segments: [],
         });
      });

      it('returns a complete match across multiple segments', () => {
         extractor = new MultiMatchExtractor(1.0, [ 'abcdef' ]);
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
         extractor = new MultiMatchExtractor(1.0, [ 'lukesky' ]);
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
         extractor = new MultiMatchExtractor(1.0, [ 'foo', 'hansel' ]);
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
         extractor = new MultiMatchExtractor(1.0, [ 'trunp', 'xy' ]);
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

   describe('multiple matches', () => {

      it('returns the first candidate when that matches', () => {
         extractor = new MultiMatchExtractor(1.0, [ '<', '!', '>' ]);
         extractor.process(new Segment('<'));

         expect(extractor.finish()).toEqual({
            text: '<',
            original: '<',
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

      it('returns the second candidate when that matches', () => {
         extractor = new MultiMatchExtractor(1.0, [ '<', '!', '>' ]);
         extractor.process(new Segment('!'));

         expect(extractor.finish()).toEqual({
            text: '!',
            original: '!',
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

      it('returns the longest match', () => {
         extractor = new MultiMatchExtractor(1.0, [ '<!', '<!--', '<!-' ]);
         extractor.process(new Segment('<'));
         expect(extractor.state).toEqual(Extractor.STATE.WORKING);
         extractor.process(new Segment('!'));
         expect(extractor.state).toEqual(Extractor.STATE.WORKING);
         const segment = new Segment('--c');
         extractor.process(segment);
         expect(extractor.state).toEqual(Extractor.STATE.SUCCESS);

         expect(extractor.finish()).toEqual({
            text: '<!--',
            original: '<!--',
            segments: [ {
               chars: 1,
               rows: 0,
               columns: 1,
               segment: {
                  range: undefined,
               },
            }, {
               chars: 1,
               rows: 0,
               columns: 1,
               segment: {
                  range: undefined,
               },
            }, {
               chars: 2,
               rows: 0,
               columns: 2,
               segment: segment,
            } ],
         });
      });

      it('returns the a shorter match when the longest candidate can not be matched', () => {
         extractor = new MultiMatchExtractor(1.0, [ '<!', '<!--', '<--' ]);

         extractor.process(new Segment('<'));
         expect(extractor.state).toEqual(Extractor.STATE.WORKING);
         extractor.process(new Segment('!'));
         expect(extractor.state).toEqual(Extractor.STATE.WORKING);
         const segment = new Segment('-xc');
         extractor.process(segment);
         expect(extractor.state).toEqual(Extractor.STATE.SUCCESS);

         expect(extractor.finish()).toEqual({
            text: '<!',
            original: '<!',
            segments: [ {
               chars: 1,
               rows: 0,
               columns: 1,
               segment: {
                  range: undefined,
               },
            }, {
               chars: 1,
               rows: 0,
               columns: 1,
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

      });

      it('returns a shorter match when EOF is encountered and that shorter is fully matched', () => {
         extractor = new MultiMatchExtractor(1.0, [ '<!', '<!--', '<--' ]);

         extractor.process(new Segment('<!'));

         expect(extractor.finish()).toEqual({
            text: '<!',
            original: '<!',
            segments: [ {
               chars: 2,
               rows: 0,
               columns: 2,
               segment: {
                  range: undefined,
               },
            } ],
         });
      });

      it('sets a success state when there is a shorter match at EOF', () => {
         extractor = new MultiMatchExtractor(1.0, [ '<!', '<!--', '<--' ]);

         extractor.process(new Segment('<!'));
         extractor.finish();

         expect(extractor.state).toEqual(Extractor.STATE.SUCCESS);
      });

   });

});
