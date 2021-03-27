/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { EntityId, Range } from 'basic';

import PeekDecl from '../PeekDecl';
import Extractor from '../Extractor';
import {DONE_SEGMENT, PseudoSpace, Segment} from '../Segment';

describe('PeekDecl', () => {
   let segmentRange: Range;

   beforeEach(() => {
      segmentRange = new Range(new EntityId());
   });

   describe('process()', () => {

      it('reports success when it has found the declaration', () => {
         const extractor = new PeekDecl(1.1, true);
         extractor.process(new Segment('<?xml version="1.1" ?>', segmentRange));
         extractor.finish();

         expect(extractor.state).toEqual(Extractor.STATE.SUCCESS);
      });

      it('reports failure when a pseudo space is found', () => {
         const extractor = new PeekDecl(1.1, true);
         extractor.process(new PseudoSpace());
         extractor.process(new Segment('<?xml version="1.1" ?>', segmentRange));
         extractor.finish();

         expect(extractor.state).toEqual(Extractor.STATE.FAILURE);
      });

      it('reports failure when it has not found the "<?" in the first 5 chars', () => {
         const extractor = new PeekDecl(1.1, true);
         extractor.process(new Segment('      <?xml version="1.1" ?>', segmentRange));
         extractor.finish();

         expect(extractor.state).toEqual(Extractor.STATE.FAILURE);
      });

      it('reports failure when it was given no segments', () => {
         const extractor = new PeekDecl(1.1, true);
         extractor.finish();

         expect(extractor.state).toEqual(Extractor.STATE.FAILURE);
      });

      it('reports failure when it does not find the declaration within 1000 chars', () => {
         let text = '';

         for (let index = 0; index < 100; index++) {
            text += '          ';
         }

         text += '<?xml version="1.1" ?>';

         const extractor = new PeekDecl(1.1, true);
         extractor.process(new Segment(text, segmentRange));
         extractor.finish();

         expect(extractor.state).toEqual(Extractor.STATE.FAILURE);
      });

      it('reports success when it finds the declaration', () => {
         const extractor = new PeekDecl(1.1, true);
         extractor.process(new Segment('<?xml version="1.1" ?>', segmentRange));

         expect(extractor.state).toEqual(Extractor.STATE.SUCCESS);
      });
   });

   describe('finish()', () => {
      it('delivers the desired string and the segment when data fits in a single segment', () => {
         const extractor = new PeekDecl(1.1, true);
         extractor.process(new Segment('<?xml version="1.1" ?>', new Range(new EntityId(), 0, 0, 0, 0, 22, 0)));

         expect(extractor.finish()).toEqual({
            text: '<?xml version="1.1" ?>',
            original: '<?xml version="1.1" ?>',
            segments: [
               {
                  chars: 0,
                  rows: 0,
                  columns: 0,
                  segment: new Segment('<?xml version="1.1" ?>', new Range(new EntityId(), 0, 0, 0, 0, 22, 0)),
               },
            ],
         });
      });

      it('delivers the desired string and no more and the segment when data fits in a single segment', () => {
         const extractor = new PeekDecl(1.1, true);
         extractor.process(new Segment('<?xml version="1.1" ?>x', new Range(new EntityId(), 0, 0, 0, 0, 23, 0)));

         expect(extractor.finish()).toEqual({
            text: '<?xml version="1.1" ?>',
            original: '<?xml version="1.1" ?>',
            segments: [
               {
                  chars: 0,
                  rows: 0,
                  columns: 0,
                  segment: new Segment('<?xml version="1.1" ?>x', new Range(new EntityId(), 0, 0, 0, 0, 23, 0)),
               },
            ],
         });
      });

      it('delivers nothing and unchanged segments on failure', () => {
         const extractor = new PeekDecl(1.1, true);
         extractor.process(new Segment('         <?xml version="1.1" ?>', new Range(new EntityId(), 0, 0, 0, 0, 30, 0)));

         expect(extractor.finish()).toEqual({
            text: '',
            original: '',
            segments: [
               {
                  chars: 0,
                  rows: 0,
                  columns: 0,
                  segment: new Segment('         <?xml version="1.1" ?>', new Range(new EntityId(), 0, 0, 0, 0, 30, 0)),
               },
            ],
         });
      });

      describe('segment spanning', () => {
         it('delivers the desired string and all segments, unchanged, on success', () => {
            const extractor = new PeekDecl(1.1, true);
            extractor.process(new Segment('<?xml vers', new Range(new EntityId(), 0, 0, 0, 0, 10, 0)));
            extractor.process(new Segment('ion="1.1" ?>', new Range(new EntityId(), 0, 10, 0, 0, 22, 0)));

            expect(extractor.finish()).toEqual({
               text: '<?xml version="1.1" ?>',
               original: '<?xml version="1.1" ?>',
               segments: [
                  {
                     chars: 0,
                     rows: 0,
                     columns: 0,
                     segment: new Segment('<?xml vers', new Range(new EntityId(), 0, 0, 0, 0, 10, 0)),
                  },
                  {
                     chars: 0,
                     rows: 0,
                     columns: 0,
                     segment: new Segment('ion="1.1" ?>', new Range(new EntityId(), 0, 10, 0, 0, 22, 0)),
                  },               
               ],
            });
         });

         it('delivers only the declaration, and no text that comes after it', () => {
            const extractor = new PeekDecl(1.1, true);
            extractor.process(new Segment('<?xml vers', new Range(new EntityId(), 0, 0, 0, 0, 10, 0)));
            extractor.process(new Segment('ion="1.1" ?> Hello', new Range(new EntityId(), 0, 10, 0, 0, 28, 0)));

            expect(extractor.finish()).toEqual({
               text: '<?xml version="1.1" ?>',
               original: '<?xml version="1.1" ?>',
               segments: [
                  {
                     chars: 0,
                     rows: 0,
                     columns: 0,
                     segment: new Segment('<?xml vers', new Range(new EntityId(), 0, 0, 0, 0, 10, 0)),
                  },
                  {
                     chars: 0,
                     rows: 0,
                     columns: 0,
                     segment: new Segment('ion="1.1" ?> Hello', new Range(new EntityId(), 0, 10, 0, 0, 28, 0)),
                  },               
               ],
            });
         });
      });

      describe('newlines', () => {

         it('adjusts line breaks and counts', () => {
            const extractor = new PeekDecl(1.1, true);
            const segment = new Segment('<?xml\n \rversion="1.1"\r\n ?>');
            extractor.process(segment);

            expect(extractor.finish()).toEqual({
               text: '<?xml\n \nversion="1.1"\n ?>',
               original: '<?xml\n \rversion="1.1"\r\n ?>',
               segments: [ {
                  chars: 0,
                  rows: 0,
                  columns: 0,
                  segment: segment,
               } ],
            });
         });

         it('copes with CR/LF on segment boundaries', () => {
            const extractor = new PeekDecl(1.1, true);
            const segment1 = new Segment('<?xml\n \rversion="1.1"\r');
            const segment2 = new Segment('\n ?>');
            extractor.process(segment1);
            extractor.process(segment2);

            expect(extractor.finish()).toEqual({
               text: '<?xml\n \nversion="1.1"\n ?>',
               original: '<?xml\n \rversion="1.1"\r\n ?>',
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

         it('copes with CR/\\u0085 on segment boundaries in 1.1', () => {
            const extractor = new PeekDecl(1.1, true);
            const segment1 = new Segment('<?xml\n \rversion="1.1"\r');
            const segment2 = new Segment('\u0085 ?>');
            extractor.process(segment1);
            extractor.process(segment2);

            expect(extractor.finish()).toEqual({
               text: '<?xml\n \nversion="1.1"\n ?>',
               original: '<?xml\n \rversion="1.1"\r\u0085 ?>',
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

         it('ignores \\u0085 in 1.0', () => {
            const extractor = new PeekDecl(1.0);
            const segment1 = new Segment('<?xml\n \rversion="1.1"\r');
            const segment2 = new Segment('\u0085 ?>');
            extractor.process(segment1);
            extractor.process(segment2);

            expect(extractor.finish()).toEqual({
               text: '<?xml\n \nversion="1.1"\n\u0085 ?>',
               original: '<?xml\n \rversion="1.1"\r\u0085 ?>',
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
      });
   });
});
