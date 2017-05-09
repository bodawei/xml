/* Copyright ® 2016–2017 by David John Burrowes. All rights reserved. */

'use strict';

const Chunk = require('./Chunk.js');
const EntityMetaData = require('../shared/EntityMetaData.js');
const Range = require('./Range.js');

const encodingUtils = require('./DefaultEncodingUtils.js');

const DIGITS_REGEX = /[0-9A-Fa-f]+/g;
const SPACE_10_REGEX = /[ \t\n\r]+/g;
const SPACE_11_REGEX = /[ \t\n\r\u0085\u2028]+/g;
const LINE_ENDING_10_REGEX = /(\r\n)|(\r)/g;
const LINE_ENDING_11_REGEX = /(\r[\u0085\n])|([\r\u0085\u2028])/g;
const SPACE_TERMINATORS_10 = [ ' ', '\\t', '\\n', '\\r' ];
const SPACE_TERMINATORS_11 = [ ' ', '\\t', '\\n', '\\r', '\u0085', '\u2028' ];
const SPACE_TERMINATOR_CHARS_10 = [ ' ', '\t', '\n', '\r' ];
const SPACE_TERMINATOR_CHARS_11 = [ ' ', '\t', '\n', '\r', '\u0085', '\u2028' ];

class Segment {
   constructor(text, isLast = false) {
      this.text = text;
      this.index = 0;
      this.isLast = isLast;
   }

   atEnd() {
      return this.index >= this.text.length;
   }
}

const regexMemo = {};

class ChunkSource {

   constructor(info, options = {}) {
      if (!(info instanceof EntityMetaData)) {
         throw new Error('Must pass an EntityMetaData, or something that can become one, into XmlStringCursor.');
      }

      this._info = info;
      this._startIndex = 0;
      this._startRow = 0;
      this._startColumn = 0;
      this.version = this._info.isVersion1dot0 ? 1.0 : 1.1;
      this._segments = [];
      this._extractors = [];
      this._encoding = options.encoding;
      this._encodingState = {};

      this.returnSegments = this._returnSegments.bind(this);

      this._addBomExtractor();
   }

   // Legacy support
   getDigits() {
      return this._doLegacy('digits');
   }

   getSpace() {
      return this._doLegacy('space');
   }

   peekIsSpace() {
      return this._doLegacy('peekIsSpace');
   }

   getChar() {
      return this._doLegacy('char');
   }

   peekChar() {
      return this._doLegacy('peekChar');
   }

   getWord(terminators) {
      return this._doLegacy('word', terminators);
   }

   getToTerminator(terminators) {
      return this._doLegacy('all', terminators);
   }

   getMatch(matchString) {
      return this._doLegacy('match', matchString);
   }

   getMarkup() {
      return this._doLegacy('markup');
   }

   getClose() {
      return this._doLegacy('close');
   }

   _doLegacy(type, param) {
      let chunk;
      this.extract(type, param, (result) => { chunk = result; });
      return chunk;
   }

   _addBomExtractor() {
      const self = this;
      function innerDeliver(result) {
         if (result) {
            self._foundBom = true;
         }
      }

      this._addExtractor(new Peek(this, new MatchExtractor(this, '\uFEFF'), true), innerDeliver);
   }

   extract(type, params, deliverChunk) {
      if (typeof deliverChunk !== 'function') {
         throw new Error('Must pass a callback function of the form function(chunk|undefined):void to extract().');
      }

      // check params?
      switch (type) {
         case 'digits':
            this._addExtractor(new DigitExtractor(), deliverChunk);
            break;
         case 'space':
            this._addExtractor(new SpaceExtractor(this), deliverChunk);
            break;
         case 'peekIsSpace':
            this._addExtractor(new Peek(this, new SpaceExtractor(this)), (result) => {
               deliverChunk(result !== undefined);
            });
            break;
         case 'char':
            this._addExtractor(new CharExtractor(this), deliverChunk);
            break;
         case 'peekChar':
            this._addExtractor(new Peek(this, new CharExtractor(this)), deliverChunk);
            break;
         case 'word':
            const spaceTerminators = this.version === 1.0 ? SPACE_TERMINATORS_10 : SPACE_TERMINATORS_11;
            this._addExtractor(new AllExtractor(this, params, spaceTerminators), deliverChunk);
            break;
         case 'all':
            this._addExtractor(new AllExtractor(this, params), deliverChunk);
            break;
         case 'match':
            this._addExtractor(new Peek(this, new MatchExtractor(this, params), true), deliverChunk);
            break;
         case 'markup':
            this._addExtractor(new MultiMatchExtractor(this, [ '<!--', '<?', '<!', '</', '&', '<' ]), deliverChunk);
            break;
         case 'close':
            this._addExtractor(new MultiMatchExtractor(this, [ ']]>', ']' ]), deliverChunk);
            break;

      }
   }

   undo(chunk) {
      if (!chunk) {
         return;
      }

      if (!(chunk instanceof Chunk)) {
         throw new Error('Must pass a Chunk or undefined to undo().');
      }

      const firstSegment = this._segments[0];
      let remainingChunkLength = chunk.originalText.length;

      if (firstSegment) {
         if (chunk.originalText.length < firstSegment.index) {
//            const newIndex = firstSegment.index -= chunk.originalText.length;

//            if (firstSegment.text.substr(newIndex, chunk.originalText.length) !== chunk.originalText) {
            throw new Error('Chunk does not match target location.');
//            }
//            firstSegment.index = newIndex;
//            return;
         }

//         if (chunk.originalText.length >= firstSegment.index) {
         const chunkIndex = chunk.originalText.length - firstSegment.index;
         if (chunk.originalText.substr(chunkIndex, chunk.originalText.length) !==
            firstSegment.text.substr(0, firstSegment.index)) {
            throw new Error('Chunk does not match target location.');
         }
         remainingChunkLength = chunkIndex;
         firstSegment.index = 0;
//         }
      }

      this._addToSegment(chunk.originalText.substr(0, remainingChunkLength), undefined, true);
   }

   addSegment(text, last) {
      this._addToSegment(text, last);
   }

   _addToSegment(text, last, putBefore) {
      const segment = new Segment(text);

      if (!putBefore) {
         if (this._encoding && this._encoding !== encodingUtils.ENCODING.UNENCODED) {
            encodingUtils.decodeSegment(segment, this._encoding);
         }
         segment.offset = new Range(this._info.location);
         this._segments.push(segment);
         this._segments.allSegments = last;
         segment.isLast = last;
      } else {
         this._segments.unshift(segment);
      }

      if (!this._encoding) {
         this._encoding = encodingUtils.identifyEncoding(segment, this._encodingState);

         if (this._encoding) {
            const existing = this._segments;
            this._segments = [];

            existing.forEach((segment) => {
               segment.index = 0;
               this.addSegment(segment.text, segment.isLast);
            });
         } else {
            return;
         }
      }

      this._resumeOperation();
   }

   _addExtractor(extractor, callback) {
      this._extractors.push({
         extractor: extractor,
         callback: callback
      });

      this._resumeOperation();
   }

   _returnSegments(segmentArray) {
      const isAtEnd = this._segments.allSegments;
      if (segmentArray[segmentArray.length - 1] === this._segments[0]) {
         this._segments.shift();
      }
      this._segments = segmentArray.concat(this._segments);
      this._segments.allSegments = isAtEnd;
   }

   _resumeOperation() {
      if (!this._encoding) {
         return;
      }

      while ((this._segments.length !== 0 || this._segments.allSegments) && this._extractors.length > 0) {
         const extractor = this._extractors[0];

         let nextSegment;

         if (this._segments.length === 0) {
            nextSegment = new Segment('');
            nextSegment.isLast = true;
         } else {
            nextSegment = this._segments[0];
         }

         while (nextSegment.atEnd()) {
            this._segments.shift();
            nextSegment = this._segments[0];

            if (!nextSegment) {
               if (this._segments.allSegments) {
                  nextSegment = new Segment('');
                  nextSegment.isLast = true;
                  break;
               }
               return;
            }
         }
         // reset range if location changes

         let result;
         result = extractor.extractor.process(nextSegment);
         if (result) {
            let chunk;
            if (result.matches.length !== 0) {
               const text = result.matches.join('');
               const originalText = text;

               const endIndex = this._startIndex + result.endIndex;
               const endRow = this._startRow + result.endRow;
               const endColumn = result.endRow > 0 ? result.endColumn : this._startColumn + result.endColumn;

               const range = new Range(this._info.location, this._startIndex, this._startRow, this._startColumn,
                  endIndex, endRow, endColumn);
               chunk = new Chunk(text, originalText, range);
               this._startIndex = endIndex;
               this._startRow = endRow;
               this._startColumn = endColumn;
            }

            extractor.callback(chunk);
            this._extractors.shift();
         }
      }
   }
}

/**********************************************************************\
  If decimal or hexadecimal digits are to be found from the current
  location in the current segment, consume as many digits across as
  many segments as available, and call back with the results.
  Do not finish searching and doing the callback until either
  a non-digit is found or the end of the input is found.
\**********************************************************************/

class Extractor {
   constructor(context) {
      this.matches = [];
      this.originals = [];
      this.endIndex = 0;
      this.endRow = 0;
      this.endColumn = 0;

      this.context = context;
   }
}

class Peek extends Extractor {
   constructor(context, subExtractor, consumeOnSuccess = false) {
      super(context);
      this._subExtractor = subExtractor;
      this._consumeOnSuccess = consumeOnSuccess;
      this._seenSegments = [];
   }

   process(segment) {
      this._startSegment = this._startSegment || segment;

      if (this._startIndex === undefined) {
         this._startIndex = segment.index;
      }

      // Protect against possible duplicate.
      if (this._seenSegments[this._seenSegments.length - 1] !== segment) {
         this._seenSegments.push(segment);
      }

      const result = this._subExtractor.process(segment);
      const successful = result && (result.matches.length > 0);
      const failed = result && (result.matches.length === 0);

      if ((successful && !this._consumeOnSuccess) || failed) {
         this._seenSegments.forEach((segment) => { segment.index = 0; });
         this._startSegment.index = this._startIndex;
         this.context.returnSegments(this._seenSegments);
      }

      return result;
   }
}

class DigitExtractor extends Extractor {
   process(segment) {
      DIGITS_REGEX.lastIndex = segment.index;
      const result = DIGITS_REGEX.exec(segment.text);
      const foundDigits = result && result.index === segment.index;

      if (foundDigits) {
         this.matches.push(result[0]);

         segment.index += result[0].length;
         this.endIndex += result[0].length;
         this.endColumn += result[0].length;
      }

      // @@@ change the end state
      if (!foundDigits || !segment.atEnd() || segment.atEnd() && segment.isLast) {
         return this;
      }
   }
}

// [3] S ::= (#x20 | #x9 | #xD | #xA)+
class SpaceExtractor extends Extractor {
   process(segment) {
      const SPACE_REGEX = this.context.version === 1.0 ? SPACE_10_REGEX : SPACE_11_REGEX;
      const LINE_ENDING_REGEX = this.context.version === 1.0 ? LINE_ENDING_10_REGEX : LINE_ENDING_11_REGEX;

      SPACE_REGEX.lastIndex = segment.index;
      const result = SPACE_REGEX.exec(segment.text);
      const foundSpace = result && result.index === segment.index;

      if (foundSpace) {
         this.matches.push(result[0].replace(LINE_ENDING_REGEX, '\n'));
         this.originals.push(result[0]);

         segment.index += result[0].length;
      }

      // @@@ deal with this
      if (!foundSpace || !segment.atEnd() || segment.atEnd() && segment.isLast) {
         return this;
      }
   }
}

class CharExtractor extends Extractor {
   process(segment) {
      const LINE_ENDING_REGEX = this.context.version === 1.0 ? LINE_ENDING_10_REGEX : LINE_ENDING_11_REGEX;

      if (segment.atEnd() && segment.isLast) {
         return this;
      }

      const currentChar = segment.text[segment.index];

      if (this.foundCR) {
         if (currentChar === '\n' || (currentChar === '\u0085' && this.context.version === 1.1)) {
            this.originals.push(currentChar);
            segment.index ++;
         }

         return this;
      }

      if (currentChar === '\r') {
         this.matches.push('\n');
         this.originals.push('\r');
         segment.index ++;
         this.foundCR = true;
         return;
      }

      LINE_ENDING_REGEX.lastIndex = segment.index;
      const result = LINE_ENDING_REGEX.exec(segment.text);
      const haveLineEnding = result && result.index === segment.index;

      if (haveLineEnding) {
         this.matches.push(result[0].replace(LINE_ENDING_REGEX, '\n'));
         this.originals.push(result[0]);

         segment.index += result[0].length;
      } else {
         this.matches.push(currentChar);
         this.originals.push(currentChar);
         segment.index ++;
      }

      return this;
   }
}

class MatchExtractor extends Extractor {
   constructor(context, candidate) {
      super(context);
      this.candidate = candidate;
      this.candidateIndex = 0;
   }

   process(segment) {
      const candidate = this.candidate;
      const segmentRemainder = segment.text.length - segment.index;
      const candidateRemainder = candidate.length - this.candidateIndex;
      const lengthToCompare = Math.min(segmentRemainder, candidateRemainder);
      const segmentText = segment.text.substr(segment.index, lengthToCompare);
      const candidateText = candidate.substr(this.candidateIndex, lengthToCompare);

      if (segmentText === candidateText) {
         this.matches.push(segmentText);
         this.candidateIndex += lengthToCompare;
         segment.index += lengthToCompare;

         if (this.candidateIndex >= candidate.length) {
            this.candidateIndex = 0;
            return this;
         } else if (segment.atEnd() && segment.isLast) {
            this.candidateIndex = 0;
            this.matches = [];
            this.originals = [];
            return this;
         }
      } else {
         this.candidateIndex = 0;
         this.matches = [];
         this.originals = [];
         // need to test spanning multiple segments

         return this;
      }
   }
}

// This needs documentation.
class MultiMatchExtractor extends Extractor {
   constructor(context, candidates) {
      super(context);

      this.items = candidates.reduce((items, candidate) => {
         items[candidate] = new MatchExtractor(this.context, candidate);
         return items;
      }, {});
      this.match;
      this.longestMatch = 0;

      this.candidates = Object.keys(this.items); // if any duplicate terminators, this removes them
      this.segments = [];
   }

   process(segment) {
      const startIndex = segment.index;
      let unresolved = 0;

      this.segments.push(segment);

      for (let candidate in this.items) {
         const item = this.items[candidate];
         if (!item) {
            continue;
         }

         const result = item.process(segment);

         if (!result) {
            unresolved ++;
         } else {
            if (result.matches.length > 0) {
               //  Can probably move this up to the beginning of the forloop!
               if (this.longestMatch < candidate.length) {
                  this.longestMatch = candidate.length;
                  item._lastSegment = segment;
                  item._lastIndex = segment.index;
                  this.match = item;
               }
            }

            delete this.items[candidate];
         }

         segment.index = startIndex;
      }

      if (unresolved !== 0) {
         segment.index = segment.text.length;
      } else {
         if (!this.match) {
            return this;
         }

         while (this.segments[0] !== this.match._lastSegment) {
            this.segments.shift();
         }

         this.segments[0].index = this.match._lastIndex;
         this.context.returnSegments(this.segments);
         return this.match;
      }

      return;
   }
}

class AllExtractor extends Extractor {
   constructor(context, terminators, spaceTerminators = []) {
      super(context);
      this.spaceTerminators = spaceTerminators;
      this.terminators = terminators;

      const terminatorCharsArray = this.spaceTerminators.concat(this.terminators.map((term) => (term[0])));
      const terminatorChars = terminatorCharsArray.join('');
      this.terminatorRegEx = regexMemo[terminatorChars];

      if (!this.terminatorRegEx) {
         const regexString = '[^' + terminatorChars + ']*';
         this.terminatorRegEx = new RegExp(regexString, 'g');
         regexMemo[terminatorChars] = this.terminatorRegEx;
      }

      const spaceTerminatorChars = this.context.version === 1.0 ? SPACE_TERMINATOR_CHARS_10 :
         SPACE_TERMINATOR_CHARS_11;

      this.terminatorArray = this.terminators;
      if (this.spaceTerminators.length > 0) {
         this.terminatorArray = spaceTerminatorChars.concat(this.terminators);  // ick
      }
   }

   _processSubExtractor(segment) {
      const result = this.subExtractor.process(segment);
      if (!result) {
         return;
      }

      // Reminder: Since Peek() is used, the first segment is always reset back to its initial index
      const origSegment = this.subExtractor._firstSegment;
      delete this.subExtractor;

      if (result.matches.length > 0) {
         this.matches = [ adjustTextAndOffset(this.originals.join(''), this, this.context.version) ];
         return this;
      } else {
         this.matches.push(origSegment.text[origSegment.index]);
         this.originals.push(origSegment.text[origSegment.index]);
         origSegment.index ++;
      }
   }

   process(segment) {
      if (this.subExtractor) {
         const result = this._processSubExtractor(segment);
         if (result) {
            return result;
         }
         return;
      }

      this.terminatorRegEx.lastIndex = segment.index;
      const result = this.terminatorRegEx.exec(segment.text);

      if (result[0].length > 0) {
         this.originals.push(result[0]);
         segment.index += result[0].length;

         if (!segment.atEnd()) {

            this.subExtractor = new Peek(this.context, new MultiMatchExtractor(this.context, this.terminatorArray));
            this.subExtractor._firstSegment = segment;

            const result = this._processSubExtractor(segment);
            if (result) {
               return result;
            }
            return;
         }
      }

      if (!segment.atEnd() || segment.atEnd() && segment.isLast) {
         if (this.originals.length > 0) {
            this.matches = [ adjustTextAndOffset(this.originals.join(''), this, this.context.version) ];
         }
         return this;
      }
   }
}

function adjustTextAndOffset(originalText, state, version) {
   const LINE_ENDING_REGEX = version === 1.0 ? LINE_ENDING_10_REGEX : LINE_ENDING_11_REGEX;
   const newText = originalText.replace(LINE_ENDING_REGEX, '\n');

   state.endIndex += newText.length;

   if (newText.indexOf('\n') === -1) {
      state.endColumn += newText.length;
   } else {
      let currentIndex = -1;
      let lastIndex = 0;
      let rowCount = -1;

      do {
         lastIndex = currentIndex + 1;
         rowCount++;
         currentIndex = newText.indexOf('\n', lastIndex);
      } while (currentIndex !== -1);

      state.endRow += rowCount;
      state.endColumn += (newText.length - lastIndex);
   }

   return newText;
}

module.exports = ChunkSource;
