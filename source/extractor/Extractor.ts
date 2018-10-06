/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { Range } from '../basic';
import Segment from './Segment';

type DoneSegment = {
   range?: Range;
};

type SegmentInfo = {
   chars: number;
   rows: number;
   columns: number;
   segment: Segment | DoneSegment;
};

type ExtractResult = {
   text: string;
   original: string;
   segments: Array<SegmentInfo>
}

const LINE_ENDING_10_REGEX = /(\r\n)|(\r)/g;
const LINE_ENDING_11_REGEX = /(\r[\u0085\n])|([\r\u0085\u2028])/g;

/**********************************************************************\
  Extractor defines some common code for all Extractors.
  Most notably, it provides a routine which will, given some text
  extracted from a segment, compute the number of chars, rows and
  columns, do text normalization, and store this for eventual return.
\**********************************************************************/

class Extractor {
   protected _version: number;
   protected _text: Array<string>;
   protected _normalizedText: Array<string>;
   protected _segInfo: Array<SegmentInfo>;
   protected _lastProcessSawCr: boolean = false;
   public state: string;

   public static STATE = {
      WORKING: 'WORKING',
      SUCCESS: 'SUCCESS',
      FAILURE: 'FAILURE',
   };

   constructor(version: number) {
      this._version = version;
      this._text = [];
      this._normalizedText = [];
      this._segInfo = [];
      this.state = Extractor.STATE.WORKING;
   }

   process(segment: Segment): void {
      let typeHack = segment;
      typeHack = typeHack;
   }

   finish(): ExtractResult {
      return {
         segments: [],
         text: '',
         original: '',
      };
   };

   _processText(originalText: string, info: SegmentInfo) {
      // §2.11 This section does converson of line endings of various
      // sorts into a single \n.
      const LINE_ENDING_REGEX = this._version === 1.0 ? LINE_ENDING_10_REGEX : LINE_ENDING_11_REGEX;
      let newText = originalText.replace(LINE_ENDING_REGEX, '\n');

      if (this._lastProcessSawCr) {
         if (originalText[0] === '\n' ||
            (this._version === 1.1 && originalText[0] === '\u0085')) {
            newText = newText.substring(1);
         }
      }

      this._lastProcessSawCr = false;
      const newChars = originalText.length;
      let newColumns = originalText.length;
      let newRows = 0;

      if (newText.indexOf('\n') !== -1) {
         let currentIndex = -1;
         let lastIndex = 0;
         let rowCount = -1;

         do {
            lastIndex = currentIndex + 1;
            rowCount++;
            currentIndex = newText.indexOf('\n', lastIndex);
         } while (currentIndex !== -1);

         newRows = rowCount;
         newColumns = (newText.length - lastIndex);
      }

      this._text.push(originalText);
      this._normalizedText.push(newText);

      if (originalText[originalText.length - 1] === '\r') {
         this._lastProcessSawCr = true;
      }

      info.chars += newChars;
      info.rows += newRows;
      info.columns += newColumns;
   }

   _makeInfo(segment: Segment): SegmentInfo {
      return {
         chars: 0,
         rows: 0,
         columns: 0,
         segment,
      };
   }

   _finish(): ExtractResult {
      return {
         text: this._normalizedText.join(''),
         original: this._text.join(''),
         segments: this._segInfo,
      };
   }

}

export default Extractor;
export { ExtractResult, SegmentInfo, DoneSegment };
