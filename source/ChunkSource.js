/* Copyright ® 2016–2017 by David John Burrowes. All rights reserved. */

'use strict';

const Offset = require('./shared/Offset.js');
const Chunk = require('./shared/Chunk.js');

const DIGITS_REGEX = /[0-9A-Fa-f]+/g;
const SPACE_10_REGEX = /[ \t\n\r]+/g;
const SPACE_11_REGEX = /[ \t\n\r\u0085\u2028]+/g;
const LINE_ENDING_10_REGEX = /(\r\n)|(\r)/g;
const LINE_ENDING_11_REGEX = /(\r[\u0085\n])|([\r\u0085\u2028])/g;
const SPACE_TERMINATORS_10 = [ ' ', '\\t', '\\n', '\\r' ];
const SPACE_TERMINATORS_11 = [ ' ', '\\t', '\\n', '\\r', '\u0085', '\u2028' ];
const SPACE_TERMINATOR_CHARS_10 = [ ' ', '\t', '\n', '\r' ];
const SPACE_TERMINATOR_CHARS_11 = [ ' ', '\t', '\n', '\r', '\u0085', '\u2028' ];

const ENCODING_REGEXP = /<\?xml.*encoding[ ]*=[ ]*(?:"(.*)"|'(.*)').*?>/i;

const ENCODING = {
   UNENCODED: 'UNENCODED',
   UTF8: 'UTF-8',
   UTF8_BOM: 'UTF-8/BOM',
   UTF16BE: 'UTF-16BE',
   UTF16BE_BOM: 'UTF-16BE/BOM',
   UTF16LE: 'UTF-16LE',
   UTF16LE_BOM: 'UTF-16LE/BOM',
   UCS4BE: 'UCS-4BE',
   UCS4BE_BOM: 'UCS-4BE/BOM',
   UCS4LE: 'UCS-4LE',
   UCS4LE_BOM: 'UCS-4LE/BOM',
   UCS4UNUSUAL1: 'UCS-4UNUSUAL1',
   UCS4UNUSUAL1_BOM: 'UCS-4UNUSUAL1/BOM',
   UCS4UNUSUAL2: 'UCS-4UNUSUAL2',
   UCS4UNUSUAL2_BOM: 'UCS-4UNUSUAL2/BOM',
   EBCDIC: 'EBCDIC'
};

class Segment {
   constructor(text) {
      this.text = text;
      this.startOffset = new Offset(0, 0, 0);
      this.offset = new Offset(0, 0, 0);
      this.index = 0;
      this.isLast = false;
   }

   atEnd() {
      return this.index >= this.text.length;
   }
}

function State(extractor, callback, version) {
   this.extractor = extractor;
   this.callback = callback;
   this.matches = [];
   this.originals = [];
   this.version = version;
}

const regexMemo = {};

class ChunkSource {

   constructor(info, options = {}) {
//      if (!(info instanceof EntityMetaData)) {
//         throw new Error('Must pass an EntityMetaData, or something that can become one, into XmlStringCursor.');
//      }

      this._info = info;
      this._version = this._info.isVersion1dot0 ? 1.0 : 1.1;
      this._segments = [];
      this._extractors = [];
      this._encoding = options.encoding;
      this._returnSegments = this._returnSegments.bind(this);
   }

   peekChar(deliverChunk) {
      if (typeof deliverChunk !== 'function') {
         throw new Error('Must pass a callback function of the form function(chunk|undefined):void to peekChar().');
      }

      const peekState = new State(genericPeek, deliverChunk);
      peekState.subState = new State(extractChar, () => {}, this._version);

      this._addExtractor(peekState);
   }

   peekIsSpace(deliverBoolean) {
      const SPACE_REGEX = this._version === 1.0 ? SPACE_10_REGEX : SPACE_11_REGEX;

      if (typeof deliverBoolean !== 'function') {
         throw new Error('Must pass a callback function of the form function(boolean):void to peekIsSpace().');
      }

      function innerDeliver(result) {
         const chunkText = result ? result.text : '';

         SPACE_REGEX.lastIndex = 0;
         deliverBoolean(SPACE_REGEX.exec(chunkText) !== null);
      }
      const peekState = new State(genericPeek, innerDeliver);
      peekState.subState = new State(extractChar, () => {}, this._version);

      this._addExtractor(peekState);
   }

   /**********************************************************************\
     Extract a chunk of all the digits from the current point in the
     source and pass it to the callback.
     If no digits, pass back undefined.

     PARAM
     deliverChunk: receives the chunk of digits extracted from here.
         function(chunk:Chunk|undefined):void
   \**********************************************************************/

   getDigits(deliverChunk) {
      if (typeof deliverChunk !== 'function') {
         throw new Error('Must pass a callback function of the form function(chunk|undefined):void to getDigits().');
      }

      this._addExtractor(new State(extractDigits, deliverChunk, this._version));
   }

   /**********************************************************************\
     @@@

        [3] S ::= (#x20 | #x9 | #xD | #xA)+

     PARAM
     deliverChunk: receives the chunk of digits extracted from here.
         function(chunk:Chunk|undefined):void
   \**********************************************************************/

   getSpace(deliverChunk) {
      if (typeof deliverChunk !== 'function') {
         throw new Error('Must pass a callback function of the form function(chunk|undefined):void to getSpace().');
      }

      this._addExtractor(new State(extractSpace, deliverChunk, this._version));
   }

   getChar(deliverChunk) {
      if (typeof deliverChunk !== 'function') {
         throw new Error('Must pass a callback function of the form function(chunk|undefined):void to getChar().');
      }

      this._addExtractor(new State(extractChar, deliverChunk, this._version));
   }

   // could make terminators optional.
   getWord(terminators, deliverChunk) {
      if (typeof deliverChunk !== 'function') {
         throw new Error('Must pass a callback function of the form function(chunk|undefined):void to getWord().');
      }

      const spaceTerminators = this._version === 1.0 ? SPACE_TERMINATORS_10 : SPACE_TERMINATORS_11;

      const state = new State(extractToTerminator, deliverChunk, this._version);
      state.spaceTerminators = spaceTerminators;
      state.terminators = terminators;
      this._addExtractor(state);
   }

   getToTerminator(terminators, deliverChunk) {
      if (typeof deliverChunk !== 'function') {
         throw new Error(
            'Must pass a callback function of the form function(chunk|undefined):void to getToTerminator().');
      }

      const state = new State(extractToTerminator, deliverChunk, this._version);
      state.spaceTerminators = [];
      state.terminators = terminators;
      this._addExtractor(state);
   }

   getMatch(matchString, deliverChunk) {
      if (typeof matchString !== 'string') {
         throw new Error('Must pass a string to match to getMatch().');
      }
      if (typeof deliverChunk !== 'function') {
         throw new Error('Must pass a callback function of the form function(chunk|undefined):void to getMatch().');
      }

      const state = new State(extractMatch, deliverChunk, this._version);
      state.candidate = matchString;
      this._addExtractor(state);
   }

   getMarkup(deliverChunk) {
      if (typeof deliverChunk !== 'function') {
         throw new Error('Must pass a callback function of the form function(chunk|undefined):void to getMarkup().');
      }

      const state = new State(searchMultipleMatch, deliverChunk, this._version);
      state.candidates = [ '<!--', '<?', '<!', '</', '&', '<' ];
      this._addExtractor(state);
   }

   getClose(deliverChunk) {
      if (typeof deliverChunk !== 'function') {
         throw new Error('Must pass a callback function of the form function(chunk|undefined):void to getClose().');
      }

      const state = new State(searchMultipleMatch, deliverChunk, this._version);
      state.candidates = [ ']]>', ']' ];
      this._addExtractor(state);
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
            const newIndex = firstSegment.index -= chunk.originalText.length;

            if (firstSegment.text.substr(newIndex, chunk.originalText.length) !== chunk.originalText) {
               throw new Error('Chunk does not match target location.');
            }
            firstSegment.index = newIndex;
            return;
         }

         if (chunk.originalText.length >= firstSegment.index) {
            const chunkIndex = chunk.originalText.length - firstSegment.index;
            if (chunk.originalText.substr(chunkIndex, chunk.originalText.length) !== firstSegment.text.substr(0, firstSegment.index)) {
               throw new Error('Chunk does not match target location.');
            }
            remainingChunkLength = chunkIndex;
            firstSegment.index = 0;
         }
      }

      this._addToSegment(chunk.originalText.substr(0, remainingChunkLength), undefined, true);
   }

   addSegment(text, last) {
      this._addToSegment(text, last);
   }

   _addToSegment(text, last, putBefore) {
      const segment = new Segment(text);

      if (!putBefore) {
         if (this._encoding && this._encoding !== ENCODING.UNENCODED) {
            this._decodeSegment(segment);
         }
         this._segments.push(segment);
         this._segments.allSegments = last;
         segment.isLast = last;
      } else {
         this._segments.unshift(segment);
      }

      if (!this._encoding) {
         this._identifyEncoding(segment);

         if (this._encoding) {
            const existing = this._segments;
            this._segments = [];

            existing.forEach((segment) => {
               segment.index = 0;
               this.addSegment(segment.text, segment.isLast)
            });
         } else {
            return;
         }
      }

      this._resumeOperation();
   }

   _identifyEncoding(segment) {
      segment.index = segment.text.length;

      this._findingEncoding = this._findingEncoding || '';

      if (typeof segment.text[0] === 'number') {
         const maxExtract = Math.min(segment.text.length, 100);
         for (let index = 0; index < maxExtract; index++) {
            this._findingEncoding += String.fromCharCode(segment.text[index]);
         }
      } else {
         this._findingEncoding += segment.text.substr(0, 100);
      }

      const totalLength = this._findingEncoding.length;

      // If we haven't already done so, try to identify the encoding based on the first four bytes/characters
      if (totalLength >= 4 && !this._examinedFirstFour) {
         const firstFourCharBytes = this._findingEncoding.substr(0, 4);
         this._encoding = identifyEncodingFromFirstFourCharBytes(firstFourCharBytes);

         if (this._encoding) {
            return;
         }

         // If we can't find an xml or text declaration start, we won't ever be able to say more
         if (/\<\?xm/i.exec(firstFourCharBytes) === null) {
            this._encoding = ENCODING.UNENCODED;
            return;
         }

         this._examinedFirstFour = true;
      }

      // If we get this far see if we can find the end of the declaration and extract an encoding
      if (this._findingEncoding.indexOf('?>') >= 0) {
         this._encoding = getEncodingFromDeclaration(this._findingEncoding);
      }

      // If we've found nothing and we already have 100 charBytes or the segment is the end, then give up.
      if (totalLength >= 100 || segment.isLast) {
         this._encoding = ENCODING.UNENCODED;
         return;
      }
   }

   _decodeSegment(segment) {
      if (segment.text.length <= 0) {
         return;
      }

      const isInt = (typeof segment.text[0] === 'number');
      const orig = segment.text;
      segment.text = [];

      for (let index = 0; index < orig.length; index++) {
         switch (this._encoding) {
            case ENCODING.UTF8:
            case ENCODING.UTF8_BOM:
               // grab the 1 to N bytes.
               // combine as you go
               // if error...
               break;
            case ENCODING.UTF16BE:
            case ENCODING.UTF16BE_BOM:
               const upper = orig[index];
               index++;
               const lower = orig[index];
               const upperInt = isInt ? upper : upper.charCodeAt(0);
               const lowerInt = isInt ? lower : lower.charCodeAt(0);
               segment.text.push(String.fromCharCode((upperInt * 256) + lowerInt));
               break;
            case ENCODING.UTF16LE:
            case ENCODING.UTF16LE_BOM:
               // just grab every two bytes.  shift and add and make a char
               // if in string, extract two bytes and do the same
               break;
            default:
               // error
               break;
         }
      }
      segment.text = segment.text.join('');
   }

   _addExtractor(extractorState) {
      this._extractors.push(extractorState);

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

      while (this._segments.length !== 0 && this._extractors.length > 0) {
         const extractorState = this._extractors[0];
         let nextSegment = this._segments[0];

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

         extractorState.returnSegments = this._returnSegments;

         const result = extractorState.extractor(nextSegment, extractorState, this._segments);
         if (result) {
            let chunk;
            if (result.matches.length !== 0) {
               const text = result.matches.join('');
               const originalText = text;

               chunk = new Chunk(text, originalText, nextSegment.startOffset, nextSegment.startOffset);
            }

            extractorState.callback(chunk || result.result);   // eek
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

function extractDigits(segment, state) {
   DIGITS_REGEX.lastIndex = segment.index;
   const result = DIGITS_REGEX.exec(segment.text);
   const foundDigits = result && result.index === segment.index;

   if (foundDigits) {
      state.matches.push(result[0]);

      segment.index += result[0].length;
   }

   if (!foundDigits || !segment.atEnd() || segment.atEnd() && segment.isLast) {
      return state;
   }
}

function extractSpace(segment, state) {
   const SPACE_REGEX = state.version === 1.0 ? SPACE_10_REGEX : SPACE_11_REGEX;
   const LINE_ENDING_REGEX = state.version === 1.0 ? LINE_ENDING_10_REGEX : LINE_ENDING_11_REGEX;

   SPACE_REGEX.lastIndex = segment.index;
   const result = SPACE_REGEX.exec(segment.text);
   const foundSpace = result && result.index === segment.index;

   if (foundSpace) {
      state.matches.push(result[0].replace(LINE_ENDING_REGEX, '\n'));
      state.originals.push(result[0]);

      segment.index += result[0].length;
   }

   if (!foundSpace || !segment.atEnd() || segment.atEnd() && segment.isLast) {
      return state;
   }
}

function extractChar(segment, state) {
   const LINE_ENDING_REGEX = state.version === 1.0 ? LINE_ENDING_10_REGEX : LINE_ENDING_11_REGEX;

   if (segment.atEnd() && segment.isLast) {
      return state;
   }

   const currentChar = segment.text[segment.index];

   if (state.foundCR) {
      if (currentChar === '\n' || (currentChar === '\u0085' && state.version === 1.1)) {
         state.originals.push(currentChar);
         segment.index ++;
      }

      return state;
   }

   if (currentChar === '\r') {
      state.matches.push('\n');
      state.originals.push('\r');
      segment.index ++;
      state.foundCR = true;
      return;
   }

   LINE_ENDING_REGEX.lastIndex = segment.index;
   const result = LINE_ENDING_REGEX.exec(segment.text);
   const haveLineEnding = result && result.index === segment.index;

   if (haveLineEnding) {
      state.matches.push(result[0].replace(LINE_ENDING_REGEX, '\n'));
      state.originals.push(result[0]);

      segment.index += result[0].length;
   } else {
      state.matches.push(currentChar);
      state.originals.push(currentChar);
      segment.index ++;
   }

   return state;
}

function extractToTerminator(segment, state) {
   if (state._subOp) {
      const subResult = state._subOp.extractor(segment, state._subOp);
      if (!subResult) {
         return;
      } else if (subResult.matches.length > 0) {
         return state;
      }

      const hack = state._subOp.startSegment.text[state._subOp.startIndex];
      state.matches.push(hack);
      state.originals.push(hack);
      state._subOp.startSegment.index ++;
      state._subOp = undefined;
      return;
   }

   const LINE_ENDING_REGEX = state.version === 1.0 ? LINE_ENDING_10_REGEX : LINE_ENDING_11_REGEX;
   const terminatorCharsArray = state.spaceTerminators.concat(state.terminators.map((term) => (term[0])));
   const terminatorChars = terminatorCharsArray.join('');
   let terminatorRegex = regexMemo[terminatorChars];

   if (!terminatorRegex) {
      const regexString = '[^' + terminatorChars + ']*';
      terminatorRegex = new RegExp(regexString, 'g');
      regexMemo[terminatorChars] = terminatorRegex;
   }

   terminatorRegex.lastIndex = segment.index;
   const result = terminatorRegex.exec(segment.text);

   if (result[0].length > 0) {
      state.matches.push(result[0].replace(LINE_ENDING_REGEX, '\n'));
      state.originals.push(result[0]);

      segment.index += result[0].length;

      if (!segment.atEnd()) {
         const spaceTerminatorChars = state.version === 1.0 ? SPACE_TERMINATOR_CHARS_10 :
            SPACE_TERMINATOR_CHARS_11;

         let terminatorArray = this.terminators;
         if (state.spaceTerminators.length > 0) {
            terminatorArray = spaceTerminatorChars.concat(this.terminators);  // ick
         }

         const peekState = new State(genericPeek, () => {});
         peekState.subState = new State(searchMultipleMatch, () => {}, state.version);
         peekState.returnSegments = state.returnSegments;
         peekState.subState.candidates = terminatorArray;

         state._subOp = peekState;
         const firstSub = state._subOp.extractor(segment, peekState);
         if (firstSub) {
            state._subOp = undefined;
            if (firstSub.matches.length > 0) {
               return state;
            } else {
               state.matches.push(segment.text[segment.index]);
               state.originals.push(segment.text[segment.index]);
               segment.index ++;
               return;
            }
         }
      }
   }

   if (!segment.atEnd() || segment.atEnd() && segment.isLast) {
      return state;
   }
}

function extractMatch(segment, state) {
   if (!state.candidateIndex) {
      state.candidateIndex = 0;
   }

   const candidate = state.candidate;
   const segmentRemainder = segment.text.length - segment.index;
   const candidateRemainder = candidate.length - state.candidateIndex;
   const lengthToCompare = Math.min(segmentRemainder, candidateRemainder);
   const segmentText = segment.text.substr(segment.index, lengthToCompare);
   const candidateText = candidate.substr(state.candidateIndex, lengthToCompare);

   if (segmentText === candidateText) {
      state.matches.push(segmentText);
      state.candidateIndex += lengthToCompare;
      segment.index += lengthToCompare;

      if (state.candidateIndex >= candidate.length) {
         state.candidateIndex = 0;
         return state;
      } else if (segment.atEnd() && segment.isLast) {
         state.candidateIndex = 0;
         state.matches = [];
         state.originals = [];
         return state;
      }
   } else {
      state.candidateIndex = 0;
      state.matches = [];
      state.originals = [];
      // need to test spanning multiple segments

      return state;
   }
}

// Ultimately, should be smarter about recognizing a non-ambiguous terminator at end of segment
function searchMultipleMatch(segment, state) {
   state.seenSegments = state.seenSegments || [];
   state.candidateIndex = state.candidateIndex || 0;
   if (state.seenSegments.length === 0) {
      state.startIndex = state.startIndex = segment.index;
      state.startSegment = segment;
   }

   state.seenSegments.push(segment);

   let result;
   let candidatesUnmatched = state.candidates.length;

   state.candidateIndex = 0;
   while (state.candidateIndex < state.candidates.length) {

      state.seenSegments.forEach((segment) => { segment.index = 0; });
      state.startSegment.index = state.startIndex;
      state.subState = new State(extractMatch, () => {}, state.version);
      state.subState.candidate = state.candidates[state.candidateIndex];

      for (let index = 0; index < state.seenSegments.length; index++) {
         result = state.subState.extractor(state.seenSegments[index], state.subState);

         if (result) {
            let couldBePartial = false;
            // This is a little bit flawed. if we got a match and are no ambiguous candidates then too pessimistic.
            if (state.seenSegments[index].atEnd() && index === state.seenSegments.length - 1) {
               couldBePartial = !state.seenSegments[index].isLast;
            }

            if (result.matches.length !== 0 && !couldBePartial) {
               state.matches = state.subState.matches;
               state.originals = state.subState.originals;
               return state;
            } else {
               state.subState.matches = [];
               state.subState.originals = [];
               candidatesUnmatched--;
               break;
            }
         }
      }

      state.candidateIndex ++;
      state.subState.candidate = state.candidates[state.candidateIndex];
      state.seenSegments.forEach((segment) => { segment.index = 0; });
      state.startSegment.index = state.startIndex;
   }

   state.candidateIndex = 0;
   state.subState.candidate = state.candidates[state.candidateIndex];
   if (candidatesUnmatched > 0) {
      const lastSegment = state.seenSegments[state.seenSegments.length - 1];
      lastSegment.index = lastSegment.text.length;
      return;
   } else {
      return state;
   }
}

// State must include subState with an extractor in it
function genericPeek(segment, state) {
   state.seenSegments = state.seenSegments || [];
   state.startSegment = state.startSegment || segment;
   state.startIndex = state.startIndex;

   if (state.startIndex === undefined) {
      state.startIndex = segment.index;
   }

   // Protect against possible duplicate.
   if (state.seenSegments[state.seenSegments.length - 1] !== segment) {
      state.seenSegments.push(segment);
   }

   const result = state.subState.extractor(segment, state.subState);

   if (result) {
      state.seenSegments.forEach((segment) => { segment.index = 0; });
      state.startSegment.index = state.startIndex;
      state.returnSegments(state.seenSegments);
   }

   return result;
}

function identifyEncodingFromFirstFourCharBytes(firstFour) {
   switch (firstFour) {
      case '\u004C\u006F\u00A7\u0094':
         return ENCODING.EBCDIC;
      case '\u0000\u003C\u0000\u003F':
         return ENCODING.UTF16BE;
      case '\u003C\u0000\u003F\u0000':
         return ENCODING.UTF16LE;
      case '\u0000\u0000\u0000\u003C':
         return ENCODING.UCS4BE;
      case '\u003C\u0000\u0000\u0000':
         return ENCODING.UCS4LE;
      case '\u0000\u0000\u003C\u0000':
         return ENCODING.UCS4UNUSUAL1;
      case '\u0000\u003C\u0000\u0000':
         return ENCODING.UCS4UNUSUAL2;
      case '\u0000\u0000\u00FE\u00FF':
         return ENCODING.UCS4BE_BOM;
      case '\u0000\u0000\u00FF\u00FE':
         return ENCODING.UCS4UNUSUAL1_BOM;
   }

   if (firstFour[0] === '\u00FE' && firstFour[1] === '\u00FF') {
      if (firstFour[2] !== '\u0000' || firstFour[3] !== '\u0000') {
         return ENCODING.UTF16BE_BOM;
      } else { // both second bytes are 0
         return ENCODING.UCS4UNUSUAL2_BOM;
      }
   }

   if (firstFour[0] === '\u00FF' && firstFour[1] === '\u00FE') {
      if (firstFour[2] !== '\u0000' || firstFour[3] !== '\u0000') {
         return ENCODING.UTF16LE_BOM;
      } else {
         return ENCODING.UCS4LE_BOM;
      }
   }

   if (firstFour[0] === '\u00EF' && firstFour[1] === '\u00BB' && firstFour[2] === '\u00BF') {
      return ENCODING.UTF8_BOM;
   }
}

function getEncodingFromDeclaration(data) {
   const result = ENCODING_REGEXP.exec(data) || [];

   return result[1] || result[2];
}

module.exports = ChunkSource;

/**********************************************************************\
  An implementation of a cursor interface, where the source data for the
  cursor is a plain string.

  All getXxx() routines return either undefined or an XmlStringToken
  instance. An unknown return value means either that the specified item
  can not be retrieved, EOF or some other catastrophic read problem where
  reading can not procede.

  peekXxx() routines look ahead in the input stream by one character, but
  do not alter the position of the cursor.

  getToXxxx() routines return a descriptor including a possibly undefined
  token and additional meta data.
\**********************************************************************/

   /**********************************************************************\
    Constructs an instance with the specified source string and entity
    info.  Note that the second parameter ultimately turns into an
    EntityMetaData instance, but various alternate parameters can be provided
    (this is so construction is as easy as possible for the caller).
    If the paramter is
       - an EntityMetaData, it is used directly (not cloned).
       - an EntityLocation, it is passed to an otherwise default-valued
         EntityMetaData instance.
       - a String, it is assumed to be the URL locating the entity this
         is processing, so is passed to an EntityLocation and then an
         EntityMetaData
       - the undefined value, it is assumed we should use the default
         location for the entity, and that is passed to an EntityLocation
         and then EntityMetaData.

    Encodings
    Handling the encoding of the XML data can get to be complex.
    Note: An unencoded string in JavaScript here is a string where and 'a'
    is represented as an 'a' (or \u0061). In contrast, in UTF-16 it would
    get to us as \u0000\u0061.  You can get this if you get a sequence of
    bytes and read each byte into one string character.

    Factors to consider:
      1. The XML entity itself may specify its own encoding in the
         XML Declaration or Text Declaration (<?xml encoding="UTF-8"?>
      2. The cursor will try to examine the first few bytes of the
         entity to see if it can recognize at least an approximation
         of the encoding.
      3. The cursor has an option (called encoding) which you can pass
         that will let you explicitly state the encoding of the data in
         the string.
      4. The XmlTokenStream has an option, ignoreDocumentEncoding, which
         will tell it to not inform the cursor of the encoding specified
         in the entity data.

    Here are the most likely use cases:
      A. You have a string which you have already decoded (e.g. you got
         it as a UTF-16 encoded string or buffer, and you converted it
         into a plain unencoded string).
            In this case, pass it to the cursor, do NOT set the encoding
            option on the cursor, and set ignoreDocumentEncoding option
            on the stream.
      B. You have a string which is encoded, you know the encoding, and
         the XML document doesn't carry the encoding name in it.
         (e.g. it is ISO-8859-2, whose lower 128 characters look like
         ASCII so by #2 the cursor will conclude it is unencoded).
            Pass the string and encoding option to the cursor
      C. You have a string which is encoded but looks like ASCII, and
         the encoding is also stated in the XML or Text Declaration.
            Pass the encoded string to the cursor. Do nothing else.
      D. You have an encoded string that is in UTF-16 (either LE or BE)
         that has a byte order marker on it
            If the encoding is not there, you can do either B or C
               (the cursor can identify UTF-16 automatically)
            Note that if there is an XML or Text Declaration that is
            different, then you should set the ignoreDocumentEncoding
            option.
      E. Same as D, but no byte order mark
            Strictly, this is an error, since all UTF-16 must have a
            byte order mark (4.3.3).  However, a lax XmlTokenStream will
            continue.
            If there is an XML or Text Declaration, the cursor can
            auto-detect the character set and convert (if these specify
            another encoding, you should set ignoreDocumentEncoding)
            If there is no XML or Text Declaration, you must specify
            and encoding option as in B.
   Other notes:
      -  This uses iconv-lite to do the character decoding. This
         library is very forgiving of errors. So, if you have passed
         the wrong character set to convert, you will get gibberish
         and errors coming out of XmlTokenStream rather than errors
         at conversion time.
      -  The encoding option to the cursor (#3), if specified, takes
         precedence over the value specified in the document (#1).

    PARAM
    The string that this cursor should use.
    info: undefiend, a string (URL), EntityLocation, or an EntityMetaData
    options: An object with any one or more of the following
      encoding: The name of the encoding that the source string is in.
         Generally, you should be making sure that the string is already
         properly decoded to a normal JavaScript string. But if you have
         a string that actually contains encoded data, and you specify
         this encoding value with the name of that encoding, the cursor
         will try to decode the string before processing it.
   \**********************************************************************/

               // if no potential match, then whole segment should be added and we should continue

//            if (havePotentialMatch) {
//               // This could be a false positive. e.g., it matches the first char of a term. which doesn't overall
//               match
//               const remainingChars = segment.text.length - (result.index + result[0].length);
//
//               for (let tIndex = 0; tIndex < this._terminators.length; tIndex++) {
//                  const term = this._terminators[tIndex];
//
//                  if (term.length <= remainingChars) {
//                     if (segment.text.substr(result.index + result[0].length, term.length) === term) {
//                        this._terminagor = term;
//                        actualMatch = true;
//                        break;
//                     }
//                  } else {
//
//                  }
//               }
//
//               if (!actualMatch && this._spaceTerminators) {
//                  const SPACE_REGEX = this._info.isVersion1dot0 ? SPACE_10_REGEX : SPACE_11_REGEX;
//                  const matchChar = segment.text[result.index + result[0].length];
//                  SPACE_REGEX.lastIndex = 0;
//                  const haveMatch = SPACE_REGEX.exec(matchChar);
//                  if (haveMatch) {
//                     this._terminagor = matchChar;
//                     actualMatch = true;
//                  }
//               }
//
//               if (actualMatch) {
//                  if (result[0].length > 0) {
//                     this._matchStrings.push(result[0].replace(LINE_ENDING_REGEX, '\n'));
//                     this._originalStrings.push(result[0]);
//
//                     segment.index += result[0].length;
//                  }
//               } else {
//                  // copy over what we have so far, including the false-ly matching character
//
//                  // uncomfortable with line endings here
//                  this._matchStrings.push(result[0].replace(LINE_ENDING_REGEX, '\n'));
//                  this._originalStrings.push(result[0]);
//
//                  this._matchStrings.push(segment.text[result[0].length]);
//                  this._originalStrings.push(segment.text[result[0].length]);
//
//                  segment.index += result[0].length + 1;
//               }
//            }

