/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityKind, EntityLocation, EntityMetaData, Range } from 'basic';
import { Extractor, Segment, ExtractorMap } from '../../extractor';

import SToken from '../SToken.js';
import STokenSource from '../STokenSource.js';
import { SegmentInfo } from 'source/extractor/Extractor';

describe('STokenSource (unit)', () => {
   let sTokenSpy: jasmine.Spy;
   let source: STokenSource;
   let defaultLoc: EntityLocation;
   let entityMetaData1dot0: EntityMetaData;
   let entityMetaData1dot1: EntityMetaData;
   let testExtractors: ExtractorMap;

   class AllExtractor extends Extractor {
      process(segment: Segment) {
         this._text.push(segment.text.substring(segment.index));
         segment.index = segment.text.length;
         this._segInfo.push({
            chars: segment.text.length,
            rows: 0,
            columns: segment.text.length,
            segment: {
               range: segment.range,
            },
         });
      }

      finish() {
         if (this._text.length > 0) {
            this.state = Extractor.STATE.SUCCESS;
         } else {
            this.state = Extractor.STATE.FAILURE;
         }

         const combinedText = this._text.join('');
         return {
            text: combinedText,
            original: combinedText,
            segments: this._segInfo,
         };
      }
   }

   class ToXExtractor extends Extractor {
      public param: string;

      constructor(version: number, param: string) {
         super(version);
         this.param = param || 'x';
      }

      process(segment: Segment) {
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
         } as SegmentInfo; // typeHack

         segment.index = str.length;

         this._text.push(str);
         this._segInfo.push(info);

         if (!segment.atEnd()) {
            info.segment = segment;
         } else {
            info.segment = {
               range: segment.range,
            };
         }
      }

      finish() {
         if (this.state !== Extractor.STATE.SUCCESS) {
            this._text = [];
            this.state = Extractor.STATE.FAILURE;
            return {
               segments: [],
               text: '',
               original: '',
            };
         }

         const combinedText = this._text.join('');
         return {
            text: combinedText,
            original: combinedText,
            segments: this._segInfo,
         };
      }
   }

   class PassThrough extends Extractor {
      public sub: Extractor;

      constructor(version: number, sub: Extractor) {
         super(version);
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
      defaultLoc = new EntityLocation();
      entityMetaData1dot0 = new EntityMetaData(EntityKind.DOCUMENT, 1.0, 5, defaultLoc);
      entityMetaData1dot1 = new EntityMetaData(EntityKind.DOCUMENT, 1.1, 2, defaultLoc);
      testExtractors = {
         foo: Extractor,
         all: AllExtractor,
         tox: ToXExtractor,
      };

      source = new STokenSource(testExtractors, entityMetaData1dot1);
      sTokenSpy = jasmine.createSpy('sTokenSpy');
   });

   describe('metadata', () => {

      it('exposes the EntityMetaData it was passed as a metaData property', () => {
         expect(source.metaData).toEqual(entityMetaData1dot1);
      });

   });

   describe('extractor definitions', () => {

      it('calls an extractor with a pre-defined parameter', () => {
         const testExtractors = {
            toy: {
               extractorConstructor: ToXExtractor,
               params: 'y',
            },
         };

         source = new STokenSource(testExtractors, entityMetaData1dot0);
         source.addText('this is yours');
         source.extractNoParams('toy', (sToken) => {
            expect(sToken!.str).toEqual('this is ');
         });
      });

      it('calls an extractor that wraps another', () => {
         const testExtractors = {
            pass: {
               extractorConstructor: PassThrough,
               params: {
                  extractorConstructor: ToXExtractor,
               },
            },
         };

         source = new STokenSource(testExtractors, entityMetaData1dot0);
         source.addText('the lorax');
         source.extractNoParams('pass', (sToken) => {
            expect(sToken!.str).toEqual('the lora');
         });
      });

   });

   describe('communication with extractors', () => {

      it('passes a version to the extractors', () => {
         let version: number;
         testExtractors = {
            test: class testExtractor extends Extractor {
               public _infos: Array<any>;
               constructor (constructedVersion: number) {
                  super(constructedVersion);
                  this._infos = [];
                  version = constructedVersion;
                  this.state = Extractor.STATE.SUCCESS;
                  this.process = (segment) => { this._infos.push({ segment }); };
                  this.finish = () => {
                     return {
                        segments: this._infos,
                        text: '',
                        original: '',
                     };
                  };
               }
            },
         };

         source = new STokenSource(testExtractors, entityMetaData1dot0);
         source.addText('1');
         source.extractNoParams('test', () => {});

         expect(version!).toEqual(1.0);
      });

      it('passes a version and parameters through a "peek"-like extractor', () => {
         let version: number;
         let params: string;
         class testExtractor extends Extractor {
            public _infos: Array<any> = [];

            constructor(version: number) {
               super(version);
               this.state = Extractor.STATE.SUCCESS;
            }

            process(segment: Segment) { this._infos.push({ segment }); }
            finish() {
               return {
                  segments: this._infos,
                  text: '',
                  original: '',
               };
            }
         }

         class SubExtractor extends ToXExtractor {
            public _infos: Array<any> = [];

            constructor(theVersion: number, theParam: string) {
               super(version, theParam);
               version = theVersion;
               params = theParam;
            }
         }

         testExtractors = {
            peek: {
               extractorConstructor: testExtractor,
               params: {
                  extractorConstructor: SubExtractor,
               },
            },
         };

         source = new STokenSource(testExtractors, entityMetaData1dot0);
         source.addText('1');
         source.extract('peek', [ 'toXParam' ], () => {});

         expect(version!).toEqual(1.0);
         expect(params!).toEqual([ 'toXParam' ]);
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

         expect(source._segments.length).toEqual(2);
      });

      it('throws an error if called after endText()', () => {
         source.addText('1');
         source.endText();

         expect(() => {
            source.addText('2');
         }).toThrowError('Can not add text after endText() has been called.');
      });

      it('carries a range passed on an empty value to the next if it has no range (whitebox)', () => {
         const testRange = new Range(defaultLoc);
         source.addText('1');
         source.addText('', testRange);
         source.addText('333');

         expect(source._segments[1].range).toEqual(testRange);
      });

      it('ignores the range on an empty value if the next has a range (whitebox)', () => {
         const testRange1 = new Range(defaultLoc);
         const testRange2 = new Range(defaultLoc, 5, 6, 7);
         source.addText('1');
         source.addText('', testRange1);
         source.addText('333', testRange2);

         expect(source._segments[1].range).toEqual(testRange2);
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
         const obj: { [propName: string]: any } = {};
         source.addText('1');
         source.endText();

         source.extractToObject('all', [], obj, 'propName');
         source.extractNoParams('all', () => {
            expect(obj.propName.str).toEqual('1');
            done();
         });
      });

      it('allows the properties to be omitted', (done) => {
         const obj: { [propName: string]: any } = {};
         source.addText('1');
         source.endText();

         source.extractToObjectNoParams('all', obj, 'propName');
         source.extractNoParams('all', () => {
            expect(obj.propName.str).toEqual('1');
            done();
         });
      });

   });

   describe('extract()', () => {

      it('throws an error if type is not known', () => {
         expect(() => {
            source.extractNoParams('bogus', () => {});
         }).toThrowError('"bogus" is not a known extractor type.');
      });

      it('passes a version and arbitrary params to the extractor', () => {
         spyOn(testExtractors, 'foo');

         source.extract('foo', 55, () => {});

         expect(testExtractors.foo).toHaveBeenCalledWith(1.1, 55);
      });

      it('enqueues the specified extractors (whitebox)', () => {
         class FooExtractor extends Extractor {
            public params: any;
            constructor(version: number, params: any) {
               super(version);
               this.params = params;
            }
         }
         testExtractors.foo = FooExtractor;

         source.extract('foo', 1, () => {});
         source.extract('foo', 2, () => {});

         expect((source._extractors[0].extractor as any).params).toEqual(1);
         expect((source._extractors[1].extractor as any).params).toEqual(2);
      });

      it('can be called multiple times before any text added', (done) => {
         let first: SToken | void;
         source.extractNoParams('tox', (sToken) => first = sToken)
         source.extractNoParams('all', (sToken) => {
            expect([(first as any).str, sToken!.str ]).toEqual([ ' 123', 'xTest' ]); // EXPECT
            done();
         });

         source.addText(' 123xTest');
         source.endText();
      });

      it('can be called multiple times after text added', (done) => {
         let first: SToken | void;
         source.addText(' 456xTest');
         source.endText();

         source.extractNoParams('tox', (sToken) => first = sToken)
         source.extractNoParams('all', (sToken) => {
            expect([(first as any).str, sToken!.str ]).toEqual([ ' 456', 'xTest' ]); // EXPECT
            done();
         });
      });

   });

   describe('SToken generation system', () => {

      it('returns a SToken with text from all the segments', (done) => {
         source.addText('1');
         source.addText('22');
         source.addText('333');
         source.endText();
         source.extractNoParams('all', (sToken) => {
            expect(sToken).toEqual(new SToken('122333', '122333',
               new Range(defaultLoc, 0, 0, 0, 6, 0, 6)));
            done();
         });
      });

      it('returns undefined when nothing was retrieved', (done) => {
         source.endText();
         source.extractNoParams('all', (sToken) => {
            expect(sToken).toBeUndefined();
            done();
         });

      });

      it('returns no STokens when the finish criteria for the specified extractor has not been met', () => {
         source.addText('these are letters without the terminating one');
         source.extractNoParams('tox', sTokenSpy);

         expect(sTokenSpy).not.toHaveBeenCalled();
      });

      it('returns a STokens as soon as the finish criteria for the specified extractor has not been met', (done) => {
         source.addText('these are letters with an x');
         source.extractNoParams('tox', done); // EXPECTATION
      });

      describe('ranges', () => {

         it('delivers a default range across multiple segments', (done) => {
            source.addText('1');
            source.addText('22');
            source.addText('333');
            source.endText();

            source.extractNoParams('all', (sToken) => {
               expect(sToken!.ranges).toEqual([
                  new Range(defaultLoc, 0, 0, 0, 6, 0, 6),
               ]);
               done();
            });
         });

         it('returns a SToken with ranges for the segments', (done) => {
            const loc2 = new EntityLocation('sys2', 'pub2');
            const loc3 = new EntityLocation('sys3', 'pub3');
            source.addText('9', new Range(defaultLoc, 3, 2, 1, 9, 9, 9));
            source.addText('88', new Range(loc2, 100, 100, 100, 9, 9, 9));
            source.addText('77777', new Range(loc3, 200, 200, 200, 9, 9, 9));
            source.endText();

            source.extractNoParams('all', (sToken) => {
               expect(sToken!.ranges).toEqual([
                  new Range(defaultLoc, 3, 2, 1, 4, 2, 2),
                  new Range(loc2, 100, 100, 100, 102, 100, 102),
                  new Range(loc3, 200, 200, 200, 205, 200, 205),
               ]);
               done();
            });
         });

         it('delivers a default range to a segment without a range', (done) => {
            const loc2 = new EntityLocation('sys2', 'pub2');

            source.addText('9', new Range(defaultLoc, 3, 2, 1, 9, 9, 9));
            source.addText('88', new Range(loc2, 100, 100, 100, 9, 9, 9));
            source.addText('77777');
            source.endText();

            source.extractNoParams('all', (sToken) => {
               expect(sToken!.ranges).toEqual([
                  new Range(defaultLoc, 3, 2, 1, 4, 2, 2),
                  new Range(loc2, 100, 100, 100, 107, 100, 107),
               ]);
               done();
            });
         });

         it('treats equal locations, that are different instances, as the same', (done) => {
            const loc2 = new EntityLocation();  // same location as the defaultLoc

            source.addText('9', new Range(defaultLoc, 3, 2, 1, 4, 2, 2));
            source.addText('88', new Range(loc2, 4, 2, 2, 6, 2, 4));
            source.addText('77777');
            source.endText();

            source.extractNoParams('all', (sToken) => {
               expect(sToken!.ranges).toEqual([ new Range(defaultLoc, 3, 2, 1, 11, 2, 9) ]);
               done();
            });
         });

         it('correctly computes range when retrieving multiple STokens from a ranged segment', (done) => {
            source.addText('a]b', new Range(defaultLoc, 3, 2, 1, 9, 9, 9));
            source.endText();

            source.extract('tox', ']', sTokenSpy);
            source.extract('tox', 'b', (sToken) => {
               expect(sTokenSpy.calls.argsFor(0)[0].firstRange).toEqual(new Range(defaultLoc, 3, 2, 1, 4, 2, 2));
               expect(sToken!.firstRange).toEqual(new Range(defaultLoc, 4, 2, 2, 5, 2, 3));
               done();
            });
         });

      });

   });

});
