/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { Range, EntityId, CONFORMANCE_VERSION } from 'basic';

import {
   DONE_SEGMENT,
   Extractor,
   Segment,
   ExtractorMap,
   SegmentInfo,
   PseudoSpace,
   PSEUDO_SPACE,
   PSEUDO_SYSTEMID,
} from '../../extractor';
import { SToken } from '../sToken';
import { STokenSource } from '../STokenSource';

describe('STokenSource (unit)', () => {
   let sTokenSpy: jest.Mock;
   let source: STokenSource;
   let testExtractors: ExtractorMap;

   class AllExtractor extends Extractor {
      process(segment: Segment | PseudoSpace) {
         if (segment.type === PSEUDO_SPACE) {
            this.text.push('');
            this.normalizedText.push(' ');
            this.segInfo.push({
               chars: 0,
               rows: 0,
               columns: 0,
               segment: {
                  type: DONE_SEGMENT,
                  range: segment.range,
               },
            });
            return;
         }

         const content = segment.text.substring(segment.index);
         this.text.push(content);
         this.normalizedText.push(content);
         segment.index = segment.text.length;
         this.segInfo.push({
            chars: segment.text.length,
            rows: 0,
            columns: segment.text.length,
            segment: {
               type: DONE_SEGMENT,
               range: segment.range,
            },
         });
      }

      finish() {
         if (this.text.length > 0) {
            this.state = Extractor.STATE.SUCCESS;
         } else {
            this.state = Extractor.STATE.FAILURE;
         }

         return {
            text: this.normalizedText.join(''),
            original: this.text.join(''),
            segments: this.segInfo,
         };
      }
   }

   class ToXExtractor extends Extractor {
      public param: string;

      constructor(version: number, processLineEndings: boolean, param: string) {
         super(version, processLineEndings);

         this.param = param || 'x';
         this.normalizedText = [];

         if (this.param.startsWith(' ')) {
            throw new Error('not prepared to handle this');
         }
      }

      process(segment: Segment | PseudoSpace) {
         if (segment.type === PSEUDO_SPACE) {
            this.text.push('');
            this.normalizedText.push(' ');
            this.segInfo.push({
               chars: 0,
               rows: 0,
               columns: 0,
               segment: {
                  type: DONE_SEGMENT,
                  range: segment.range,
               },
            });
            return;
         }

         const index = segment.text.indexOf(this.param, segment.index + 1);
         let str;

         if (index === -1) {
            str = segment.text;
         } else {
            str = segment.text.substring(segment.index, index);
            this.state = Extractor.STATE.SUCCESS;
         }

         const info: SegmentInfo = {
            chars: str.length,
            rows: 0,
            columns: str.length,
            segment: new Segment(''),
         };

         segment.index = str.length;

         this.text.push(str);
         this.normalizedText.push(str);
         this.segInfo.push(info);

         if (!segment.atEnd()) {
            info.segment = segment;
         } else {
            info.segment = {
               type: DONE_SEGMENT,
               range: segment.range,
            };
         }
      }

      finish() {
         if (this.state !== Extractor.STATE.SUCCESS) {
            this.text = [];
            this.state = Extractor.STATE.FAILURE;
            return {
               segments: [],
               text: '',
               original: '',
            };
         }

         return {
            text: this.normalizedText.join(''),
            original: this.text.join(''),
            segments: this.segInfo,
         };
      }
   }

   class PassThrough extends Extractor {
      public sub: Extractor;

      constructor(version: number, processLineEndings: boolean, sub: Extractor) {
         super(version, processLineEndings);
         this.sub = sub;
      }

      process(segment: Segment) {
         this.sub.process(segment);
         this.state = this.sub.state;
      }

      finish() {
         return this.sub.finish();
      }
   }

   beforeEach(() => {
      testExtractors = {
         foo: Extractor,
         all: AllExtractor,
         tox: ToXExtractor,
      };

      source = new STokenSource(undefined, undefined, testExtractors);
      sTokenSpy = jest.fn();
   });

   describe('extractor definitions', () => {
      it('calls an extractor with a pre-defined parameter', () => {
         testExtractors = {
            toy: {
               extractorConstructor: ToXExtractor,
               params: 'y',
            },
         };

         source = new STokenSource(undefined, undefined, testExtractors);
         source.addText('this is yours');
         source.extract('toy', (sToken) => {
            expect(sToken!.str).toEqual('this is ');
         });
      });

      it('calls an extractor that wraps another', () => {
         testExtractors = {
            pass: {
               extractorConstructor: PassThrough,
               params: {
                  extractorConstructor: ToXExtractor,
               },
            },
         };

         source = new STokenSource(undefined, undefined, testExtractors);
         source.addText('the lorax');
         source.extract('pass', (sToken) => {
            expect(sToken!.str).toEqual('the lora');
         });
      });
   });

   describe('communication with extractors', () => {
      it('passes a version to the extractors', () => {
         let version: number;
         testExtractors = {
            test: class TestExtractor extends Extractor {
               public infos: Array<SegmentInfo>;

               constructor(constructedVersion: number, processLineEndings: boolean) {
                  super(constructedVersion, processLineEndings);
                  this.infos = [];
                  version = constructedVersion;
                  this.state = Extractor.STATE.SUCCESS;
                  this.process = (segment) => {
                     this.infos.push({ chars: 0, rows: 0, columns: 0, segment });
                  };

                  this.process = () => {};
                  this.finish = () => {
                     return {
                        segments: this.infos,
                        text: '',
                        original: '',
                     };
                  };
               }
            },
         };

         source = new STokenSource(undefined, undefined, testExtractors);
         source.addText('1');
         source.extract('test', () => {});

         expect(version!).toEqual(1.0);
      });

      it('passes a version and parameters through a "peek"-like extractor', () => {
         let version: number;
         let params: string;
         class TestExtractor extends Extractor {
            public infos: Array<SegmentInfo> = [];

            constructor(ver: number, processLineEndings: boolean) {
               super(ver, processLineEndings);
               this.state = Extractor.STATE.SUCCESS;
            }

            process(segment: Segment) {
               this.infos.push({ segment, rows: 0, columns: 0, chars: 0 });
            }

            finish() {
               return {
                  segments: this.infos,
                  text: '',
                  original: '',
               };
            }
         }

         class SubExtractor extends ToXExtractor {
            public infos: Array<SegmentInfo> = [];

            constructor(theVersion: number, processLineEndings: boolean, theParam: string) {
               super(version, processLineEndings, theParam);
               version = theVersion;
               params = theParam;
            }
         }

         testExtractors = {
            peek: {
               extractorConstructor: TestExtractor,
               params: {
                  extractorConstructor: SubExtractor,
               },
            },
         };

         source = new STokenSource(undefined, undefined, testExtractors);
         source.addText('1');
         source.extract('peek', 'toXParam', () => {});

         expect(version!).toEqual(1.0);
         expect(params!).toEqual('toXParam');
      });
   });

   describe('addText()', () => {
      it('accepts multiple calls without any extractors invoked', () => {
         source.addText('1');
         source.addText('22');
         source.addText('333');

         // it does not hang!
      });

      it('populates internal array of segments, ignoring any empty segments (whitebox)', () => {
         source.addText('1');
         source.addText('');
         source.addText('333');

         expect(source.segments.length).toEqual(2);
      });

      it('throws an error if called after endText()', () => {
         source.addText('1');
         source.endText();

         expect(() => {
            source.addText('2');
         }).toThrowError('Can not add text after endText() has been called.');
      });

      it('carries a range passed on an empty value to the next if it has no range (whitebox)', () => {
         const testRange = new Range(new EntityId());
         source.addText('1');
         source.addText('', testRange);
         source.addText('333');

         expect(source.segments[1].range).toEqual(testRange);
      });

      it('ignores the range on an empty value if the next has a range (whitebox)', () => {
         const testRange1 = new Range(new EntityId());
         const testRange2 = new Range(new EntityId(), 5, 6, 7);
         source.addText('1');
         source.addText('', testRange1);
         source.addText('333', testRange2);

         expect(source.segments[1].range).toEqual(testRange2);
      });
   });

   describe('endText()', () => {
      it('can be invoked when no segments have been added', () => {
         source.endText();

         // it does not hang!
      });
   });

   describe('extractToObject()', () => {
      it('extracts an SToken to the property of the provided object', (done) => {
         const obj: { [propName: string]: SToken } = {};
         source.addText('1');
         source.endText();

         source.extractToObject('all', [], obj, 'propName');
         source.extract('all', () => {
            expect(obj.propName.str).toEqual('1');
            done();
         });
      });

      it('allows the properties to be omitted', (done) => {
         const obj: { [propName: string]: SToken } = {};
         source.addText('1');
         source.endText();

         source.extractToObject('all', obj, 'propName');
         source.extract('all', () => {
            expect(obj.propName.str).toEqual('1');
            done();
         });
      });
   });

   describe('extract()', () => {
      it('throws an error if type is not known', () => {
         expect(() => {
            source.extract('bogus', () => {});
         }).toThrowError('"bogus" is not a known extractor type.');
      });

      it('passes a version and arbitrary params to the extractor', () => {
         testExtractors.foo = jest.fn();
         source.setConfVer({
            type: CONFORMANCE_VERSION,
            version: 1.1,
            edition: 3,
         });

         source.extract('foo', 55, () => {});

         expect(testExtractors.foo).toHaveBeenCalledWith(1.1, true, 55);
      });

      it('enqueues the specified extractors (whitebox)', () => {
         class FooExtractor extends Extractor {
            public params: number;

            constructor(version: number, processLineEndings: boolean, params: number) {
               super(version, processLineEndings);
               this.params = params;
            }
         }
         testExtractors.foo = FooExtractor;

         source.extract('foo', 1, () => {});
         source.extract('foo', 2, () => {});

         expect((source.extractors[0].extractor as FooExtractor).params).toEqual(1);
         expect((source.extractors[1].extractor as FooExtractor).params).toEqual(2);
      });

      it('can be called multiple times before any text added', (done) => {
         let first: SToken | undefined;
         source.extract('tox', (sToken) => (first = sToken));
         source.extract('all', (sToken) => {
            expect([first?.str, sToken!.str]).toEqual([' 123', 'xTest']); // EXPECT
            done();
         });

         source.addText(' 123xTest');
         source.endText();
      });

      it('can be called multiple times after text added', (done) => {
         let first: SToken | undefined;
         source.addText(' 456xTest');
         source.endText();

         source.extract('tox', (sToken) => (first = sToken));
         source.extract('all', (sToken) => {
            expect([first?.str, sToken!.str]).toEqual([' 456', 'xTest']); // EXPECT
            done();
         });
      });
   });

   describe('check()', () => {
      it('passes no arguments to the callback', () => {
         let results: Array<unknown> | undefined;
         source.endText();

         source.check((...rest: Array<undefined>) => {
            results = rest;
         });

         expect(results?.length).toEqual(0);
      });

      it('calls the callback after doing earlier processing', () => {
         const obj: Record<string, SToken> = {};
         source.addText('1');
         source.endText();
         source.extractToObject('all', obj, 'propName');

         source.check(() => {
            expect(obj).toEqual({
               propName: new SToken('1', '1', new Range(new EntityId(), 0, 0, 0, 1, 0, 1)),
            });
         });
      });
   });

   describe('SToken generation system', () => {
      it('returns a SToken with text from all the segments', (done) => {
         source.addText('1');
         source.addText('22');
         source.addText('333');
         source.endText();
         source.extract('all', (sToken) => {
            expect(sToken).toEqual(
               new SToken('122333', '122333', new Range(new EntityId(), 0, 0, 0, 6, 0, 6)),
            );
            done();
         });
      });

      it('returns undefined when nothing was retrieved', (done) => {
         source.endText();
         source.extract('all', (sToken) => {
            expect(sToken).toBeUndefined();
            done();
         });
      });

      it('returns no STokens when the finish criteria for the specified extractor has not been met', () => {
         source.addText('these are letters without the terminating one');
         source.extract('tox', sTokenSpy);

         expect(sTokenSpy).not.toHaveBeenCalled();
      });

      it('returns a STokens as soon as the finish criteria for the specified extractor has not been met', (done) => {
         source.addText('these are letters with an x');
         source.extract('tox', () => {
            done();
         }); // EXPECTATION (simply that it calls back)
      });

      describe('ranges', () => {
         it('delivers a default range across multiple segments', (done) => {
            source.addText('1');
            source.addText('22');
            source.addText('333');
            source.endText();

            source.extract('all', (sToken) => {
               expect(sToken!.ranges).toEqual([new Range(new EntityId(), 0, 0, 0, 6, 0, 6)]);
               done();
            });
         });

         it('returns a SToken with ranges for the segments', (done) => {
            const loc2 = new EntityId('sys2', 'pub2');
            const loc3 = new EntityId('sys3', 'pub3');
            source.addText('9', new Range(new EntityId(), 3, 2, 1, 9, 9, 9));
            source.addText('88', new Range(loc2, 100, 100, 100, 9, 9, 9));
            source.addText('77777', new Range(loc3, 200, 200, 200, 9, 9, 9));
            source.endText();

            source.extract('all', (sToken) => {
               expect(sToken!.ranges).toEqual([
                  new Range(new EntityId(), 3, 2, 1, 4, 2, 2),
                  new Range(loc2, 100, 100, 100, 102, 100, 102),
                  new Range(loc3, 200, 200, 200, 205, 200, 205),
               ]);
               done();
            });
         });

         it('delivers a default range to a segment without a range', (done) => {
            const loc2 = new EntityId('sys2', 'pub2');

            source.addText('9', new Range(new EntityId(), 3, 2, 1, 9, 9, 9));
            source.addText('88', new Range(loc2, 100, 100, 100, 9, 9, 9));
            source.addText('77777');
            source.endText();

            source.extract('all', (sToken) => {
               expect(sToken!.ranges).toEqual([
                  new Range(new EntityId(), 3, 2, 1, 4, 2, 2),
                  new Range(loc2, 100, 100, 100, 107, 100, 107),
               ]);
               done();
            });
         });

         it('treats equal locations, that are different instances, as the same', (done) => {
            const loc2 = new EntityId(); // same location as the new EntityId()

            source.addText('9', new Range(new EntityId(), 3, 2, 1, 4, 2, 2));
            source.addText('88', new Range(loc2, 4, 2, 2, 6, 2, 4));
            source.addText('77777');
            source.endText();

            source.extract('all', (sToken) => {
               expect(sToken!.ranges).toEqual([new Range(new EntityId(), 3, 2, 1, 11, 2, 9)]);
               done();
            });
         });

         it('correctly computes range when retrieving multiple STokens from a ranged segment', (done) => {
            source.addText('a]b', new Range(new EntityId(), 3, 2, 1, 9, 9, 9));
            source.endText();

            source.extract('tox', ']', sTokenSpy);
            source.extract('tox', 'b', (sToken) => {
               // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
               expect(sTokenSpy.mock.calls[0][0].ranges[0]).toEqual(
                  new Range(new EntityId(), 3, 2, 1, 4, 2, 2),
               );
               expect(sToken!.ranges[0]).toEqual(new Range(new EntityId(), 4, 2, 2, 5, 2, 3));
               done();
            });
         });

         it('delivers a simple range when matching a pseudo space', (done) => {
            source.addPseudoSpace();
            source.endText();

            source.extract('all', (sToken) => {
               const expected = new SToken(' ', '', [
                  new Range(new EntityId(PSEUDO_SYSTEMID), 0, 0, 0, 0, 0, 0),
               ]);

               expect(sToken).toEqual(expected);
               done();
            });
         });

         it('delivers ranges including that of the pseudo space and a following segment', (done) => {
            source.addPseudoSpace();
            source.addText('123', new Range(new EntityId(), 3, 2, 1, 9, 9, 9));
            source.endText();

            source.extract('all', (sToken) => {
               const expected = new SToken(' 123', '123', [
                  new Range(new EntityId(PSEUDO_SYSTEMID), 0, 0, 0, 0, 0, 0),
                  new Range(new EntityId(), 3, 2, 1, 6, 2, 4),
               ]);

               expect(sToken).toEqual(expected);
               done();
            });
         });

         it('delivers ranges including that of a segment followed by a pseudo space', (done) => {
            source.addText('123', new Range(new EntityId(), 3, 2, 1, 9, 9, 9));
            source.addPseudoSpace();
            source.endText();

            source.extract('all', (sToken) => {
               const expected = new SToken('123 ', '123', [
                  new Range(new EntityId(), 3, 2, 1, 6, 2, 4),
                  new Range(new EntityId(PSEUDO_SYSTEMID), 0, 0, 0, 0, 0, 0),
               ]);

               expect(sToken).toEqual(expected);
               done();
            });
         });

         it('delivers ranges including that of a segment followed by a pseudo space', (done) => {
            source.addText('123', new Range(new EntityId(), 3, 2, 1, 9, 9, 9));
            source.addPseudoSpace();
            source.addText('123', new Range(new EntityId(), 3, 2, 1, 9, 9, 9));
            source.endText();

            source.extract('all', (sToken) => {
               const expected = new SToken('123 123', '123123', [
                  new Range(new EntityId(), 3, 2, 1, 6, 2, 4),
                  new Range(new EntityId(PSEUDO_SYSTEMID), 0, 0, 0, 0, 0, 0),
                  new Range(new EntityId(), 3, 2, 1, 6, 2, 4),
               ]);

               expect(sToken).toEqual(expected);
               done();
            });
         });
      });
   });
});
