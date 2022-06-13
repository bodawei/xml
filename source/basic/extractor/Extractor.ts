/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import {DoneSegment, PseudoSpace, PSEUDO_SPACE, Segment} from './Segment';

type SegmentInfo = {
   chars: number;
   rows: number;
   columns: number;
   segment: Segment | DoneSegment | PseudoSpace;
};

type ExtractResult = {
   text: string;
   original: string;
   segments: Array<SegmentInfo>;
}

const LINE_ENDING_10_REGEX = /(\r\n)|(\r)/g;
const LINE_ENDING_11_REGEX = /(\r[\u0085\n])|([\r\u0085\u2028])/g;

enum ExtractorState {
   WORKING = 'WORKING',
   SUCCESS = 'SUCCESS',
   FAILURE = 'FAILURE',
}

/**********************************************************************\
  Extractor defines some common code for all Extractors.
  Most notably, it provides a routine which will, given some text
  extracted from a segment, compute the number of chars, rows and
  columns, do text normalization, and store this for eventual return.
\**********************************************************************/

class Extractor {
   private lastProcessSawCr = false;
   protected version: number;
   protected processLineEndings: boolean;
   protected text: Array<string>;
   protected normalizedText: Array<string>;
   protected segInfo: Array<SegmentInfo>;
   public state: ExtractorState;

   public static STATE = ExtractorState;

   constructor(version: number, processLineEndings: boolean = true) {
      this.version = version;
      this.processLineEndings = processLineEndings;
      this.text = [];
      this.normalizedText = [];
      this.segInfo = [];
      this.state = Extractor.STATE.WORKING;
   }

   process(segment: Segment | PseudoSpace): void {
      let typeHack = segment;
      typeHack = typeHack;
   }

   finish(): ExtractResult {
      return {
         segments: [],
         text: '',
         original: '',
      };
   }

   protected processPseudoText(): void {
      this.text.push('');
      this.normalizedText.push(' ');
   }

   protected processText(originalText: string, info: SegmentInfo) {
      let newText = originalText;

      // §2.11 This section does converson of line endings of various
      // sorts into a single \n.
      const LINE_ENDING_REGEX = this.version === 1.0 ? LINE_ENDING_10_REGEX : LINE_ENDING_11_REGEX;
      newText = originalText.replace(LINE_ENDING_REGEX, '\n');

      if (this.lastProcessSawCr) {
         if (originalText[0] === '\n' ||
            (this.version === 1.1 && originalText[0] === '\u0085')) {
            newText = newText.substring(1);
         }
      }

      this.lastProcessSawCr = false;

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

      this.text.push(originalText);

      if (this.processLineEndings) {
         this.normalizedText.push(newText);
      } else {
         this.normalizedText.push(originalText);
      }

      if (originalText[originalText.length - 1] === '\r') {
         this.lastProcessSawCr = true;
      }

      info.chars += newChars;
      info.rows += newRows;
      info.columns += newColumns;
   }

   protected makeInfo(segment: Segment | PseudoSpace): SegmentInfo {
      return {
         chars: 0,
         rows: 0,
         columns: 0,
         segment,
      };
   }

   protected innerFinish(): ExtractResult {
      return {
         text: this.normalizedText.join(''),
         original: this.text.join(''),
         segments: this.segInfo,
      };
   }

}

export default Extractor;
export {
   Extractor,
   ExtractResult,
   SegmentInfo,
   DoneSegment,
   ExtractorState,
};
