/* Copyright ® 2017 by David John Burrowes. All rights reserved. */

'use strict';

const LINE_ENDING_10_REGEX = /(\r\n)|(\r)/g;
const LINE_ENDING_11_REGEX = /(\r[\u0085\n])|([\r\u0085\u2028])/g;

class Extractor {

   constructor(version) {
      this._version = version;
      this._text = [];
      this._normalizedText = [];
      this._segInfo = [];
      this.state = Extractor.STATE.WORKING;
   }

   process() {}

   done() {}

   _normalizeText(originalText, info) {
      const LINE_ENDING_REGEX = this._version === 1.0 ? LINE_ENDING_10_REGEX : LINE_ENDING_11_REGEX;
      const newText = originalText.replace(LINE_ENDING_REGEX, '\n');

      info.chars = originalText.length;
      info.columns = originalText.length;
      info.rows = 0;

      if (newText.indexOf('\n') !== -1) {
         let currentIndex = -1;
         let lastIndex = 0;
         let rowCount = -1;

         do {
            lastIndex = currentIndex + 1;
            rowCount++;
            currentIndex = newText.indexOf('\n', lastIndex);
         } while (currentIndex !== -1);

         info.rows = rowCount;
         info.columns = (newText.length - lastIndex);
      }

      return newText;
   }

   _makeInfo(segment) {
      return {
         chars: 0,
         rows: 0,
         columns: 0,
         segment
      };
   }

   getExtraction() {
      if (this.state === Extractor.STATE.WORKING) {
         return;
      }

      const originalText = this._text.join('');
      return {
         text: this._normalizedText.length > 0 ? this._normalizedText.join('') : originalText,
         original: originalText,
         segments: this._segInfo
      };
   }

}

Extractor.STATE = {
   WORKING: 'WORKING',
   SUCCESS: 'SUCCESS',
   FAILURE: 'FAILURE'
};

module.exports = Extractor;
