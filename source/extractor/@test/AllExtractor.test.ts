/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, Range } from '../../basic';

import AllExtractor from '../AllExtractor';
import Extractor from '../Extractor';
import Segment from '../Segment';

describe('AllExtractor', () => {
   let defaultLoc: EntityLocation;
   let segmentRange: Range;

   beforeEach(() => {
      defaultLoc = new EntityLocation();
      segmentRange = new Range(defaultLoc);
   });

   describe('basic behavior', () => {

      it('reports success when it has found a everything to end of input', () => {
         const extractor = new AllExtractor(1.0, []);
         extractor.process(new Segment('xx', segmentRange));
         extractor.finish();

         expect(extractor.state).toEqual(Extractor.STATE.SUCCESS);
      });

      it('reports failure when it has not found a any content by the end', () => {
         const extractor = new AllExtractor(1.0, []);
         extractor.finish();

         expect(extractor.state).toEqual(Extractor.STATE.FAILURE);
      });

      it('delivers a everything to the end of the segment', () => {
         const extractor = new AllExtractor(1.0, []);
         extractor.process(new Segment('testAll', segmentRange));

         expect(extractor.finish()).toEqual({
            text: 'testAll',
            original: 'testAll',
            segments: [ {
               chars: 7,
               rows: 0,
               columns: 7,
               segment: {
                  range: segmentRange,
               },
            } ],
         });
      });

      it('delivers a everything to the end of the segment when no terminators offered at all', () => {
         const extractor = new AllExtractor(1.0);
         extractor.process(new Segment('testAll', segmentRange));

         expect(extractor.finish()).toEqual({
            text: 'testAll',
            original: 'testAll',
            segments: [ {
               chars: 7,
               rows: 0,
               columns: 7,
               segment: {
                  range: segmentRange,
               },
            } ],
         });
      });

      it('delivers a everything to the terminator', () => {
         const extractor = new AllExtractor(1.0, [ 'x' ]);
         const segment = new Segment('testxAll');
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: 'test',
            original: 'test',
            segments: [ {
               chars: 4,
               rows: 0,
               columns: 4,
               segment: segment,
            } ],
         });
      });

      it('allows "]" as a terminator', () => {
         const extractor = new AllExtractor(1.0, [ 'x', 'y', ']' ]);
         const segment = new Segment('testxAll');
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: 'test',
            original: 'test',
            segments: [ {
               chars: 4,
               rows: 0,
               columns: 4,
               segment: segment,
            } ],
         });
      });

   });

   describe('finish()', () => {

      it('returns whatever has been found when it is called', () => {
         const extractor = new AllExtractor(1.0, []);
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
                  range: segmentRange,
               },
            } ],
         });
      });

   });

   describe('segment treatment', () => {

      it('correctly changes segment index after processing', () => {
         const extractor = new AllExtractor(1.0, []);
         const segment = new Segment('  xy');
         extractor.process(segment);
         extractor.finish();

         expect(segment.index).toEqual(4);
      });

      it('does not change segment index when terminator found immediately', () => {
         const extractor = new AllExtractor(1.0, [ 'h' ]);
         const segment = new Segment('hi there');
         extractor.process(segment);
         extractor.finish();

         expect(segment.index).toEqual(0);
      });

   });

   describe('segment spanning', () => {

      it('reports failure state if no segments provided', () => {
         const extractor = new AllExtractor(1.0, [ '<' ]);
         extractor.finish();

         expect(extractor.state).toEqual(Extractor.STATE.FAILURE);
      });

      it('reports working state when the segment is consumed but end not found', () => {
         const extractor = new AllExtractor(1.0, [ '<' ]);
         extractor.process(new Segment(' ', segmentRange));

         expect(extractor.state).toEqual(Extractor.STATE.WORKING);
      });

      it('returns text and ranges across multiple segments', () => {
         const extractor = new AllExtractor(1.0, [ 'x' ]);
         extractor.process(new Segment('sun', segmentRange));
         extractor.process(new Segment('funny'));

         expect(extractor.finish()).toEqual({
            text: 'sunfunny',
            original: 'sunfunny',
            segments: [ {
               chars: 3,
               rows: 0,
               columns: 3,
               segment: {
                  range: segmentRange,
               },
            }, {
               chars: 5,
               rows: 0,
               columns: 5,
               segment: {
                  range: undefined,
               },
            } ],
         });
      });

      it('returns all spaces and ranges across multiple segments and is terminated by a terminator', () => {
         const extractor = new AllExtractor(1.0, [ '<' ]);
         const segment = new Segment('two<isenough');
         extractor.process(new Segment('one,', segmentRange));
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: 'one,two',
            original: 'one,two',
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

      it('returns all text when picking up in mid-segment', () => {
         const extractor = new AllExtractor(1.0, [ '<' ]);
         const segment = new Segment('xyz', segmentRange);
         segment.index = 2;
         extractor.process(segment);

         expect(extractor.finish()).toEqual({
            text: 'z',
            original: 'z',
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

   describe('newlines', () => {

      it('adjusts line breaks and counts', () => {
         const extractor = new AllExtractor(1.0, [ '!' ]);
         const segment = new Segment('fox\r\nand\nfriends!');
         extractor.process(segment);
         extractor.finish();

         expect(extractor.finish()).toEqual({
            text: 'fox\nand\nfriends',
            original: 'fox\r\nand\nfriends',
            segments: [ {
               chars: 16,
               rows: 2,
               columns: 7,
               segment: segment,
            } ],
         });
      });

      it('copes with CR/LF on segment boundaries', () => {
         const extractor = new AllExtractor(1.0, [ '!' ]);
         const segment1 = new Segment('fox\r');
         const segment2 = new Segment('\nand\nfriends!');
         extractor.process(segment1);
         extractor.process(segment2);
         extractor.finish();

         expect(extractor.finish()).toEqual({
            text: 'fox\nand\nfriends',
            original: 'fox\r\nand\nfriends',
            segments: [ {
               chars: 4,
               rows: 1,
               columns: 0,
               segment: {
                  range: undefined,
               },
            }, {
               chars: 12,
               rows: 1,
               columns: 7,
               segment: segment2,
            } ],
         });
      });

      it('copes with CR/\\u0085 on segment boundaries', () => {
         const extractor = new AllExtractor(1.1, [ '!' ]);
         const segment1 = new Segment('fox\r');
         const segment2 = new Segment('\u0085and\nfriends!');
         extractor.process(segment1);
         extractor.process(segment2);
         extractor.finish();

         expect(extractor.finish()).toEqual({
            text: 'fox\nand\nfriends',
            original: 'fox\r\u0085and\nfriends',
            segments: [ {
               chars: 4,
               rows: 1,
               columns: 0,
               segment: {
                  range: undefined,
               },
            }, {
               chars: 12,
               rows: 1,
               columns: 7,
               segment: segment2,
            } ],
         });
      });

      it('copes with CR on segment boundaries', () => {
         const extractor = new AllExtractor(1.0, [ '!' ]);
         const segment1 = new Segment('fox\r');
         const segment2 = new Segment('\rand\nfriends!');
         extractor.process(segment1);
         extractor.process(segment2);
         extractor.finish();

         expect(extractor.finish()).toEqual({
            text: 'fox\n\nand\nfriends',
            original: 'fox\r\rand\nfriends',
            segments: [ {
               chars: 4,
               rows: 1,
               columns: 0,
               segment: {
                  range: undefined,
               },
            }, {
               chars: 12,
               rows: 2,
               columns: 7,
               segment: segment2,
            } ],
         });
      });

      it('counts rows correctly when a mismatch happens across segment boundaries', () => {
         const extractor = new AllExtractor(1.0, [ '<!--' ]);
         const segment1 = new Segment('fox<!');
         const segment2 = new Segment('-and\nfriends<!--');
         extractor.process(segment1);
         extractor.process(segment2);
         extractor.finish();

         expect(extractor.finish()).toEqual({
            text: 'fox<!-and\nfriends',
            original: 'fox<!-and\nfriends',
            segments: [ {
               chars: 5,
               rows: 0,
               columns: 5,
               segment: {
                  range: undefined,
               },
            }, {
               chars: 12,
               rows: 1,
               columns: 7,
               segment: segment2,
            } ],
         });
      });

      it('counts rows correctly when a newline is found after a mismatched terminator', () => {
         const extractor = new AllExtractor(1.0, [ '<!--' ]);
         const segment1 = new Segment('fox<!-\nand\nfriends<!--');
         extractor.process(segment1);
         extractor.finish();

         expect(extractor.finish()).toEqual({
            text: 'fox<!-\nand\nfriends',
            original: 'fox<!-\nand\nfriends',
            segments: [ {
               chars: 18,
               rows: 2,
               columns: 7,
               segment: segment1,
            } ],
         });
      });

   });

   describe('terminators', () => {

      it('can cross multiple ambiguous terminators and match one', () => {
         const extractor = new AllExtractor(1.0, [ '<!--', '<!-', '<!' ]);
         extractor.process(new Segment('Te'));
         extractor.process(new Segment('xt<'));
         extractor.process(new Segment('!'));
         extractor.process(new Segment('-'));
         extractor.process(new Segment('-'));

         expect(extractor.finish().text).toEqual('Text');
      });

      it('recognizes terminator across segments', () => {
         const extractor = new AllExtractor(1.0, [ '<!--' ]);
         extractor.process(new Segment('Te'));
         extractor.process(new Segment('xt<'));
         extractor.process(new Segment('!'));
         extractor.process(new Segment('-'));
         extractor.process(new Segment('-'));

         expect(extractor.finish().text).toEqual('Text');
      });

      it('returns text including a misleading almost-terminator across segment boundaries', () => {
         const extractor = new AllExtractor(1.0, [ '<!---' ]);
         extractor.process(new Segment('Te'));
         extractor.process(new Segment('xt<'));
         extractor.process(new Segment('!'));
         extractor.process(new Segment('-'));
         extractor.process(new Segment('-X'));

         expect(extractor.finish().text).toEqual('Text<!--X');
      });

      it('returns text matches second possible terminator', () => {
         const extractor = new AllExtractor(1.0, [ '0', '1' ]);
         extractor.process(new Segment('Text10'));

         expect(extractor.finish().text).toEqual('Text');
      });

      it('returns text including a misleading almost-terminator at input end', () => {
         const extractor = new AllExtractor(1.0, [ '<!--' ]);
         extractor.process(new Segment('Text<!-'));

         expect(extractor.finish().text).toEqual('Text<!-');
      });

      it('returns the value minus the terminator if the terminator is at the end', () => {
         const extractor = new AllExtractor(1.0, [ '<!--' ]);
         extractor.process(new Segment('Text<!--'));

         expect(extractor.finish().text).toEqual('Text');
      });

   });

});
