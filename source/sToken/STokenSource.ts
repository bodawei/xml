/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, EntityId, Offset, Range } from 'basic';
import {
   Extractor,
   PSEUDO_SPACE,
   PseudoSpace,
   Segment,
   ExtractorConstructor,
   ExtractorMap,
} from 'extractor';
import { SegmentInfo } from '../extractor/Extractor'; // typeHack

import SToken from './SToken';

type DeliverSToken = (stoken?: SToken) => void;

type Params = string | Array<string | undefined> | undefined | number;

interface ExtractorContext {
   extractor: Extractor;
   startIndex?: number;
   callback: DeliverSToken;
}

// This dummy extractor is used only to support .check().
// This sets the state as failure simply to keep the processing engine
// from trying to build an SToken.
// This is a weird solution to the problem that should be revisited if
// the SToken implementation is revised.
class NoopExtractor extends Extractor {
   process(segment: Segment): void {
      const info = this.makeInfo(segment);
      this.segInfo.push(info);

      this.state = Extractor.STATE.FAILURE;
   }

   finish() {
      return this.innerFinish();
   }
}

/**********************************************************************\
 A STokenSource combines three things, and returns SToken using them.

 1. A hash of extractor definitions (see below) which
    define what this can respond to.
 2. a series of 1 or more strings (with addText()) each of which will
    be turned into a Segment.
 3. A series of calls to extract(), which will used the specified
    extractor to carve off an SToken from the current segment.

 Text and extract calls can be made independently of one another (e.g.
 you can call extract() multipled times before providing any text).
 The text or calls will be queued until they can be used.

 Text can come from different entities. When ever text comes from a
 new entity, a Range must be provided to addText() so it can
 continue to build the correct ranges in the STokens that are produced.

 Extractor protocol:
 Crucially, this defines a very strict pattern of interaction with
 each extractor:
   * Extractor.process() will never be passed a zero-length segment.
   * Extractor.process() will never be passed the same segment twice.
   * Extractor.finish() will be called once Extractor.state is no
     longer WORKING, or when end of input is reached.
   * Extractors must update Extractor.state after each call to
     process() so this can determine whether to keep feeding it
     segments or call finish()
   * finish() must return a data structure containing:
       str : The final text extracted
       originalStr: The text extracted, before newline normalization
       segments: An array of information about each segment that this
          had been passed.  Each entry must have:
             chars: The number of characters consumed from this segment
             rows:  The number of newlines encountered
             columns: The number of chars after the last newline
             segment: Either the segment this had been passed, if this
                did not fully consume it, OR a simple hash with just
                the range from the segment that was fully consumed.

 Extractor definitions:
 There are three ways to specify an extractor:
   name: An extractor constructor function
   name: {
      extractorConstructor: An Extractor constructor,
      params: A value to be passed to the extractorConstructor
         (this overrides whatever might be passed to the
         extract functions)
   }
   name: {
      extractorConstructor: An Extractor constructor,
      params: {
         extractorConstructor: : An Extractor constructor which
            will receive the params passed to the extract function
   }

 The second is used to provide a predefined way of calling an
 extractor like MultiMatchExtractor.
 The third is primarily for use where the first extractorConstructor
 is the PeekExtractor, which simply wraps the next extractor.
\**********************************************************************/

class STokenSource {
   public errors: Array<Error>;

   private confVer: ConformanceVersion;

   private entityId: EntityId;

   private _extractorInfo: ExtractorMap;

   public _segments: Array<Segment | PseudoSpace>;

   public _extractors: Array<ExtractorContext>;

   private _lastOffset?: Offset;

   private _allTextAdded = false;

   private _orphanedRange?: Range;

   private _resuming?: boolean;

   constructor(extractorInfo: ExtractorMap, entityId?: EntityId) {
      this.errors = [];
      this.entityId = entityId || new EntityId();
      this.confVer = new ConformanceVersion();
      this._extractorInfo = extractorInfo;

      this._segments = [];
      this._extractors = [];

      this._lastOffset = undefined;
   }

   setConfVer(version: ConformanceVersion): void {
      this.confVer = version;
   }

   addPseudoSpace(): void {
      const pseudoSpace = new PseudoSpace();
      this._segments.push(pseudoSpace);

      if (!this._lastOffset) {
         this._lastOffset = new Offset(pseudoSpace.range!.entityId, 0, 0, 0);
      }
   }

   addText(text: string, range?: Range): void {
      if (this._allTextAdded) {
         throw new Error('Can not add text after endText() has been called.');
      }

      if (text.length === 0) {
         this._orphanedRange = range;
         return;
      }

      const rangeToUse = range || this._orphanedRange;
      delete this._orphanedRange;

      // If this is the first segment we are adding, then make sure lastOffset contains
      // the starting offset which will either be the start of the range associated
      // with this first segment, or a default offset that starts at 0
      if (this._segments.length === 0) {
         if (rangeToUse) {
            this._lastOffset = rangeToUse.getStartOffset();
         } else {
            this._lastOffset = new Offset(this.entityId, 0, 0, 0);
         }
      }

      this._segments.push(new Segment(text, rangeToUse));

      this.resumeOperation();
   }

   endText(): void {
      this._allTextAdded = true;
      this.resumeOperation();
   }

   extractToObjectNoParams(type: string, obj: Record<string, any>, name: string): void {
      this.extractToObject(type, undefined, obj, name);
   }

   extractToObject(type: string, obj: Record<string, any>, name: string): void;
   extractToObject(type: string, params: Params, obj: Record<string, any>, name: string): void;
   extractToObject(
      type: string,
      paramsOrObj: Params | any | Record<string, any>,
      objOrName: Record<string, any> | string,
      nameOnly?: string,
   ): void {
      let params: Params | any;
      let obj: Record<string, any>;
      let name: string;

      if (nameOnly !== undefined) {
         params = paramsOrObj;
         obj = objOrName as Record<string, any>;
         name = nameOnly;
      } else {
         params = undefined;
         obj = paramsOrObj;
         name = objOrName as string;
      }

      this.extract(type, params, (sToken) => {
         obj[name] = sToken; // typeHack
      });
   }

   extractNoParams(type: string, deliverSToken: DeliverSToken): void {
      this.extract(type, undefined, deliverSToken);
   }

   extract(type: string, deliverSToken: DeliverSToken): void;
   extract(type: string, params: Params, deliverSToken: DeliverSToken): void;
   extract(
      type: string,
      paramsOrDeliver: Params | DeliverSToken,
      deliverSToken?: DeliverSToken,
   ): void {
      let params: Params;
      let deliver: DeliverSToken;

      if (typeof paramsOrDeliver === 'function') {
         params = undefined;
         deliver = paramsOrDeliver;
      } else {
         params = paramsOrDeliver;
         deliver = deliverSToken!;
      }

      const extractorDefinition = this._extractorInfo[type];
      let extractorConstructor: ExtractorConstructor;
      let paramsToUse = params;

      if (typeof extractorDefinition === 'object') {
         extractorConstructor = extractorDefinition.extractorConstructor;

         // @ts-expect-error fixme
         if (extractorDefinition.params.extractorConstructor) {
            // @ts-expect-error fixme
            paramsToUse = new extractorDefinition.params.extractorConstructor(
               this.confVer.version,
               params,
            );
         } else {
            // @ts-expect-error fixme
            paramsToUse = extractorDefinition.params;
         }
      } else {
         // put this check here to make code coverage happier. babel turns typeof object into a check for undef.
         if (!extractorDefinition) {
            throw new Error(`"${type}" is not a known extractor type.`);
         }
         extractorConstructor = extractorDefinition;
      }

      const typeHack = extractorConstructor as any;
      const instance = new typeHack(this.confVer.version, paramsToUse);

      this._extractors.push({
         extractor: instance,
         callback: deliver,
      });

      this.resumeOperation();
   }

   check(callback: () => void): void {
      const noopExtractor = new NoopExtractor(1);

      this._extractors.push({
         extractor: noopExtractor,
         callback,
      });

      this.resumeOperation();
   }

   private resumeOperation(): void {
      // There are two alternate ways of running this routine.
      // - A is faster, but allows some callers to get "synchronous" returns.
      // - B is much slower, but forces asynchronous returns.
      // A
      if (this._resuming === true) {
         return;
      }
      this._resuming = true;
      // B
      //

      while ((this._segments.length !== 0 || this._allTextAdded) && this._extractors.length > 0) {
         const extContext = this._extractors[0];
         const extractor = extContext.extractor;
         const nextSegment = this._segments.shift();

         if (nextSegment) {
            if (extContext.startIndex === undefined && nextSegment.type !== PSEUDO_SPACE) {
               extContext.startIndex = nextSegment.index;
            }
            extractor.process(nextSegment);

            if (extractor.state === Extractor.STATE.WORKING) {
               continue;
            }
         }

         // Extractor has finished extraction (either through SUCCESS or FAILURE)
         this._extractors.shift();
         const results = extractor.finish();
         const ranges = this.computeRanges(results.segments);

         this._restorePartiallyAndUnusedSegments(results.segments);

         // Store where we left off, unless we got no ranges, or we didn't actually consume any segments
         if (
            results.segments.length > 0 &&
            (results.segments[0].segment as Segment).index !== extContext.startIndex
         ) {
            // typeHack
            this._lastOffset = ranges[ranges.length - 1].getEndOffset();
         }

         // A
         this._reportResults(extContext, results.text, results.original, ranges);
         /*
          * B:
          * Ultimately, we probably do not want to doing a setTimeout here, as
          * there's no reason callers should not be able to deal with what turns
          * out to be a synchronous return of values.  However, it is better for
          * development purposes, at least, to do this to make sure the layers of
          * our system are not dependent on the sometimes synchronous behavior.
          */
         // setTimeout(() => {
         // this._reportResults(extContext, results.text, results.original, ranges);
         // }, 0);
         // break;
      }
      // A
      this._resuming = false;
   }

   _restorePartiallyAndUnusedSegments(segInfos: Array<SegmentInfo>): void {
      const returnedSegments = [];

      for (let index = 0; index < segInfos.length; index++) {
         const info = segInfos[index];

         if ((info.segment as Segment).text || info.segment.type === PSEUDO_SPACE) {
            // typeHack
            returnedSegments.push(info.segment);
         }
      }

      this._segments = returnedSegments.concat(this._segments) as Array<Segment>; // typeHack
   }

   private computeRanges(segInfos: Array<SegmentInfo>): Array<Range> {
      if (segInfos.length === 0) {
         return [];
      }

      const ranges = [];
      // this._lastOffset can't be undefined, since it is set as soon as text is added,
      // and we won't have ranges to compute if no text has been adde
      let currentRange = new Range(this._lastOffset!); // start off where we left off

      // Just iterate through the segInfos, and accumulate the chars consumed
      for (let index = 0; index < segInfos.length; index++) {
         const info = segInfos[index];
         const segment = info.segment;

         // If we seem to have changed which entity we are reading from, create a new range.
         if (
            segment.range &&
            !(
               currentRange.entityId.systemId === segment.range.entityId.systemId &&
               currentRange.entityId.publicId === segment.range.entityId.publicId
            )
         ) {
            // store the range if it actually has changed
            ranges.push(currentRange);

            currentRange = new Range(
               segment.range.entityId,
               segment.range.startIndex,
               segment.range.startRow,
               segment.range.startColumn,
               segment.range.startIndex,
               segment.range.startRow,
               segment.range.startColumn,
            );
         }

         currentRange = new Range(
            currentRange.entityId,
            currentRange.startIndex,
            currentRange.startRow,
            currentRange.startColumn,
            currentRange.endIndex + info.chars,
            currentRange.endRow + info.rows,
            // NEED A test for the following.
            info.rows === 0 ? currentRange.endColumn + info.columns : info.columns,
         );
      }

      ranges.push(currentRange);

      return ranges;
   }

   _reportResults(
      extractorContext: ExtractorContext,
      str: string,
      originalStr: string,
      ranges: Array<Range>,
   ): void {
      if (extractorContext.extractor.state === Extractor.STATE.SUCCESS) {
         extractorContext.callback(new SToken(str, originalStr, ranges));
      } else {
         extractorContext.callback();
      }
   }
}

export default STokenSource;
export { ExtractorMap };
