/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, Range } from '../basic';

import LToken from './LToken.js';
import LTokenSource from './LTokenSource.js';
import Extractor from './Extractor.js';

describe('LTokenSource', () => {
   let lTokenSpy;
   let source;
   let defaultLoc;
   let entityMetaData1dot0;
   let entityMetaData1dot1;
   let testExtractors;

   class AllExtractor extends Extractor {
      process(segment) {
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
      constructor(version, param) {
         super(version);
         this.param = param || 'x';
      }

      process(segment) {
         const index = segment.text.indexOf(this.param);
         let str;

         if (index === -1) {
            str = segment.text;
         } else {
            str = segment.text.substr(0, index);
            this.state = Extractor.STATE.SUCCESS;
         }

         const info = {
            chars: str.length,
            rows: 0,
            columns: str.length,
         };

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
            return;
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
      constructor(version, sub) {
         super(version);
         this.sub = sub;
      }

      process(segment) {
         this.sub.process(segment);
         this.state = this.sub.state;
      }

      finish() {
         return this.sub.finish();
      }
   }

   beforeEach(() => {
      defaultLoc = new EntityLocation();
      entityMetaData1dot0 = new EntityMetaData(EntityMetaData.TYPE.DOCUMENT, 1.0, 5, defaultLoc);
      entityMetaData1dot1 = new EntityMetaData(EntityMetaData.TYPE.DOCUMENT, 1.1, 2, defaultLoc);
      testExtractors = {
         foo: () => {},
         all: AllExtractor,
         tox: ToXExtractor,
      };

      source = new LTokenSource(testExtractors, entityMetaData1dot1);
      lTokenSpy = jasmine.createSpy('lTokenSpy');
   });

   describe('construction', () => {

      it('throws an error if called without a hash of extractors', () => {
         expect(() => {
            new LTokenSource();
         }).toThrowError('Must pass a hash of extractor types to constructor functions to LTokenSource().');
      });

      it('throws an error if called without an entity meta data', () => {
         expect(() => {
            new LTokenSource({});
         }).toThrowError('Must pass an EntityMetaData, or something that can become one, into LTokenSource.');
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

         source = new LTokenSource(testExtractors, entityMetaData1dot0);
         source.addText('this is yours');
         source.extract('toy', lTokenSpy);

         expect(lTokenSpy.calls.allArgs()).toEqualLTokenTexts([ 'this is ' ]);
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

         source = new LTokenSource(testExtractors, entityMetaData1dot0);
         source.addText('the lorax');
         source.extract('pass', lTokenSpy);

         expect(lTokenSpy.calls.allArgs()).toEqualLTokenTexts([ 'the lora' ]);
      });

   });

   describe('communication with extractors', () => {

      it('passes a version to the extractors', () => {
         let version;
         testExtractors = {
            test: function testExtractor(constructedVersion) {
               version = constructedVersion;
               this._infos = [];
               this.state = Extractor.STATE.SUCCESS;
               this.process = (segment) => { this._infos.push({ segment }); };
               this.finish = () => {
                  return { segments: this._infos };
               };
            },
         };

         source = new LTokenSource(testExtractors, entityMetaData1dot0);
         source.addText('1');
         source.extract('test', () => {});

         expect(version).toEqual(1.0);
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

   describe('extract()', () => {

      it('throws an error if type is not known', () => {
         expect(() => {
            source.extract('bogus', () => {});
         }).toThrowError('"bogus" is not a known extractor type.');
      });

      it('throws an error if no callback is provided', () => {
         expect(() => {
            source.extract('foo');
         }).toThrowError('Must pass a callback function of the form function(lToken|undefined):void to extract().');
      });

      it('passes a version and arbitrary params to the extractor', () => {
         spyOn(testExtractors, 'foo');

         source.extract('foo', 55, () => {});

         expect(testExtractors.foo).toHaveBeenCalledWith(1.1, 55);
      });

      it('enqueues the specified extractors (whitebox)', () => {
         testExtractors.foo = function FooExtractor(version, params) {
            this.params = params;
         };

         source.extract('foo', 1, () => {});
         source.extract('foo', 2, () => {});

         expect(source._extractors[0].extractor.params).toEqual(1);
         expect(source._extractors[1].extractor.params).toEqual(2);
      });

      it('can be called multiple times before any text added', () => {
         source.extract('tox', lTokenSpy);
         source.extract('all', lTokenSpy);

         source.addText(' 123xTest');
         source.endText();

         expect(lTokenSpy.calls.allArgs()).toEqualLTokenTexts([ ' 123', 'xTest' ]);
      });

      it('can be called multiple times after text added', () => {
         source.addText(' 456xTest');
         source.endText();

         source.extract('tox', lTokenSpy);
         source.extract('all', lTokenSpy);

         expect(lTokenSpy.calls.allArgs()).toEqualLTokenTexts([ ' 456', 'xTest' ]);
      });

   });

   describe('lToken generation system', () => {

      it('returns a lToken with text from all the segments', () => {
         source.addText('1');
         source.addText('22');
         source.addText('333');
         source.endText();
         source.extract('all', lTokenSpy);

         expect(lTokenSpy).toHaveBeenCalledWith(new LToken('122333', '122333',
            new Range(defaultLoc, 0, 0, 0, 6, 0, 6)));
      });

      it('returns undefined when nothing was retrieved', () => {
         source.endText();
         source.extract('all', lTokenSpy);

         expect(lTokenSpy).toHaveBeenCalledWith();
      });

      it('returns no lTokens when the finish criteria for the specified extractor has not been met', () => {
         source.addText('these are letters without the terminating one');
         source.extract('tox', lTokenSpy);

         expect(lTokenSpy).not.toHaveBeenCalled();
      });

      it('returns a lTokens as soon as the finish criteria for the specified extractor has not been met', () => {
         source.addText('these are letters with an x');
         source.extract('tox', lTokenSpy);

         expect(lTokenSpy).toHaveBeenCalled();
      });

      describe('ranges', () => {

         it('delivers a default range across multiple segments', () => {
            source.addText('1');
            source.addText('22');
            source.addText('333');
            source.endText();

            source.extract('all', lTokenSpy);

            expect(lTokenSpy.calls.argsFor(0)[0]).toEqualLTokenRange(new Range(defaultLoc, 0, 0, 0, 6, 0, 6));
         });

         it('returns a lToken with ranges for the segments', () => {
            const loc2 = new EntityLocation();
            const loc3 = new EntityLocation();
            source.addText('9', new Range(defaultLoc, 3, 2, 1, 9, 9, 9));
            source.addText('88', new Range(loc2, 100, 100, 100, 9, 9, 9));
            source.addText('77777', new Range(loc3, 200, 200, 200, 9, 9, 9));
            source.endText();

            source.extract('all', lTokenSpy);

            // cleanup todo: fix this testing
            expect(lTokenSpy.calls.argsFor(0)[0].range[0]).toEqual(new Range(defaultLoc, 3, 2, 1, 4, 2, 2));
            expect(lTokenSpy.calls.argsFor(0)[0].range[1]).toEqual(new Range(loc2, 100, 100, 100, 102, 100, 102));
            expect(lTokenSpy.calls.argsFor(0)[0].range[2]).toEqual(new Range(loc3, 200, 200, 200, 205, 200, 205));
         });

         it('delivers a default range to a segment without a range', () => {
            const loc2 = new EntityLocation();

            source.addText('9', new Range(defaultLoc, 3, 2, 1, 9, 9, 9));
            source.addText('88', new Range(loc2, 100, 100, 100, 9, 9, 9));
            source.addText('77777');
            source.endText();

            source.extract('all', lTokenSpy);

            expect(lTokenSpy.calls.argsFor(0)[0].range[0]).toEqual(new Range(defaultLoc, 3, 2, 1, 4, 2, 2));
            expect(lTokenSpy.calls.argsFor(0)[0].range[1]).toEqual(new Range(loc2, 100, 100, 100, 107, 100, 107));
         });

      });

   });

});
