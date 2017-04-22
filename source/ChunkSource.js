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

function State(extractor, callback, version, peek) {
   this.extractor = extractor;
   this.callback = callback;
   this.matches = [];
   this.originals = [];
   this.version = version;
   this.peek = peek;
}

class ChunkSource {

   constructor(info) {
//      if (!(info instanceof EntityMetaData)) {
//         throw new Error('Must pass an EntityMetaData, or something that can become one, into XmlStringCursor.');
//      }

      this._info = info;
      this._version = this._info.isVersion1dot0 ? 1.0 : 1.1;
      this._segments = [];
      this._peekedSegments = [];
      this._extractors = [];
      this._regexMemo = {};
   }

   peekChar(deliverChunk) {
      if (typeof deliverChunk !== 'function') {
         throw new Error('Must pass a callback function of the form function(chunk|undefined):void to peekChar().');
      }

      this._extractors.push(new State(extractChar, deliverChunk, this._version, true));

      this._resumeOperation();
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
      this._extractors.push(new State(extractChar, innerDeliver, this._version, true));

      this._resumeOperation();
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

      this._extractors.push(new State(extractDigits, deliverChunk, this._version));

      this._resumeOperation();
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

      this._extractors.push(new State(extractSpace, deliverChunk, this._version));

      this._resumeOperation();
   }

   getChar(deliverChunk) {
      if (typeof deliverChunk !== 'function') {
         throw new Error('Must pass a callback function of the form function(chunk|undefined):void to getChar().');
      }

      this._extractors.push(new State(extractChar, deliverChunk, this._version));

      this._resumeOperation();
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
      this._extractors.push(state);

      this._resumeOperation();
   }

   getToTerminator(terminators, deliverChunk) {
      if (typeof deliverChunk !== 'function') {
         throw new Error(
            'Must pass a callback function of the form function(chunk|undefined):void to getToTerminator().');
      }

      const state = new State(extractToTerminator, deliverChunk, this._version);
      state.spaceTerminators = [];
      state.terminators = terminators;
      this._extractors.push(state);

      this._resumeOperation();
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
      this._extractors.push(state);

      this._resumeOperation();
   }

   getMarkup(deliverChunk) {
      if (typeof deliverChunk !== 'function') {
         throw new Error('Must pass a callback function of the form function(chunk|undefined):void to getMarkup().');
      }

      const state = new State(searchMultipleMatch, deliverChunk, this._version);
      state.candidates = [ '<!--', '<?', '<!', '</', '&', '<' ];
      state.peek = false;
      this._extractors.push(state);

      this._resumeOperation();
   }

   getClose(deliverChunk) {
      if (typeof deliverChunk !== 'function') {
         throw new Error('Must pass a callback function of the form function(chunk|undefined):void to getClose().');
      }

      const state = new State(searchMultipleMatch, deliverChunk, this._version);
      state.candidates = [ ']]>', ']' ];
      state.peek = false;
      this._extractors.push(state);

      this._resumeOperation();
   }

   addSegment(text, last) {
      const segment = new Segment(text);
      this._segments.push(segment);
      this._segments.allSegments = last;
      segment.isLast = last;

      this._resumeOperation();
   }

   _resumeOperation() {
      while (this._segments.length !== 0 && this._extractors.length > 0) {
         const currentChunker = this._extractors[0];
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

         if (currentChunker.peek) {
            if (this._peekedSegments.length === 0) {
               this._firstPeekedSegment = nextSegment;
               this._firstPeekedIndex = nextSegment.index;
            }
            // Gotta be a better way of doing this.
            if (this._peekedSegments.indexOf(nextSegment) === -1) {
               this._peekedSegments.push(nextSegment);
            }
         }

         currentChunker.returnSegments = (segmentArray) => {
            this._segments = segmentArray.concat(this._segments);
         };
         const result = currentChunker.extractor(nextSegment, currentChunker, this._segments);
         if (result) {
            let chunk;
            if (currentChunker.matches.length !== 0) {
               const text = currentChunker.matches.join('');
               const originalText = text;

               chunk = new Chunk(text, originalText, nextSegment.startOffset, nextSegment.startOffset);
            }

            if (this._peekedSegments.length > 0) {
               while (this._peekedSegments.length > 0) {
                  const segment = this._peekedSegments.pop();

                  segment.index = 0;
                  this._segments.unshift(segment);
               }
               this._firstPeekedSegment.index = this._firstPeekedIndex;
               this._firstPeekedSegment = undefined;
            }

            currentChunker.callback(chunk);
            this._extractors.shift();
            this._peekedSegments = []; // ick
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

const regexMemo = {};

function extractToTerminator(segment, state) {
   if (state._subOp) {
      const subResult = state._subOp.extractor(segment, state._subOp);
      if (!subResult) {
         return;
      } else if (subResult.matches.length > 0) {
         return state;
      }
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
         const subState = new State(searchMultipleMatch, () => {}, state.version);
         subState.returnSegments = state.returnSegments;
         subState.candidates = terminatorArray;
         subState.peek = true;

         state._subOp = subState;
         const firstSub = state._subOp.extractor(segment, subState);
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

   if (state.seenSegments.indexOf(segment) === -1) {
      state.seenSegments.push(segment);
   }

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
            if (state.seenSegments[index].atEnd() && index === state.seenSegments.length - 1) {
               couldBePartial = !state.seenSegments[index].isLast;
            }

            if (result.matches.length !== 0 && !couldBePartial) {
               state.matches = state.subState.matches;
               state.originals = state.subState.originals;
               state.seenSegments.forEach((segment) => { segment.index = 0; });
               state.startSegment.index = state.startIndex;
               if (state.peek) {
                  state.returnSegments(state.seenSegments);
               }
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
      state.returnSegments(state.seenSegments);
      return state;
   }
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

