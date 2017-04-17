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

class ChunkSource {

   constructor(info) {
//      if (!(info instanceof EntityMetaData)) {
//         throw new Error('Must pass an EntityMetaData, or something that can become one, into XmlStringCursor.');
//      }

      this._info = info;
      this._segments = [];
      this._chunkers = [];
      this._regexMemo = {};
      this._finished = this._finished.bind(this);
   }

   peekChar(deliverChunk) {
      if (typeof deliverChunk !== 'function') {
         throw new Error('Must pass a callback function of the form function(chunk|undefined):void to peekChar().');
      }

      this._chunkers.push({
         chunker: new CharOperation(false, this._info, this._segments, this._finished),
         callback: deliverChunk
      });

      this._resumeOperation();
   }

   peekIsSpace(deliverBoolean) {
      const SPACE_REGEX = this._info.isVersion1dot0 ? SPACE_10_REGEX : SPACE_11_REGEX;

      if (typeof deliverBoolean !== 'function') {
         throw new Error('Must pass a callback function of the form function(boolean):void to peekIsSpace().');
      }

      this._chunkers.push({
         chunker: new CharOperation(false, this._info, this._segments, this._finished),
         callback: (result) => {
            const chunkText = result ? result.text : '';

            SPACE_REGEX.lastIndex = 0;
            deliverBoolean(SPACE_REGEX.exec(chunkText) !== null);
         }
      });

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

      this._chunkers.push({
         chunker: new DigitsOperation(this._segments, this._finished),
         callback: deliverChunk
      });

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

      this._chunkers.push({
         chunker: new SpaceOperation(this._info, this._segments, this._finished),
         callback: deliverChunk
      });

      this._resumeOperation();
   }

   getChar(deliverChunk) {
      if (typeof deliverChunk !== 'function') {
         throw new Error('Must pass a callback function of the form function(chunk|undefined):void to getChar().');
      }

      this._chunkers.push({
         chunker: new CharOperation(true, this._info, this._segments, this._finished),
         callback: deliverChunk
      });

      this._resumeOperation();
   }

   // could make terminators optional.
   getWord(terminators, deliverChunk) {
      if (typeof deliverChunk !== 'function') {
         throw new Error('Must pass a callback function of the form function(chunk|undefined):void to getWord().');
      }

      const spaceTerminators = this._info.isVersion1dot0 ? SPACE_TERMINATORS_10 : SPACE_TERMINATORS_11;

      this._chunkers.push({
         chunker: new ToTerminatorOperation(this._info, spaceTerminators, terminators, this._segments, this._finished),
         callback: deliverChunk
      });

      this._resumeOperation();
   }

   getToTerminator(terminators, deliverChunk) {
      if (typeof deliverChunk !== 'function') {
         throw new Error(
            'Must pass a callback function of the form function(chunk|undefined):void to getToTerminator().');
      }

      this._chunkers.push({
         chunker: new ToTerminatorOperation(this._info, [], terminators, this._segments, this._finished),
         callback: deliverChunk
      });

      this._resumeOperation();
   }

   getMatch(matchString, deliverChunk) {
      if (typeof matchString !== 'string') {
         throw new Error('Must pass a string to match to getMatch().');
      }
      if (typeof deliverChunk !== 'function') {
         throw new Error('Must pass a callback function of the form function(chunk|undefined):void to getMatch().');
      }

      this._chunkers.push({
         chunker: new MatchOperation([ matchString ], true, this._segments, this._finished),
         callback: deliverChunk
      });

      this._resumeOperation();
   }

   addSegment(text, last) {
      const segment = new Segment(text);
      this._segments.push(segment);
      segment.isLast = last;

      this._resumeOperation();
   }

   _finished(chunk) {
      const chunkerInfo = this._chunkers.shift();

      chunkerInfo.callback(chunk);
   }

   _resumeOperation() {
      while (this._segments.length !== 0 && this._chunkers.length !== 0) {
         const currentChunker = this._chunkers[0];

         currentChunker.chunker.scan();
      }
   }

}

class GeneralOperation {
   constructor(segmentSource, deliverChunk) {
      this._segmentSource = segmentSource;
      this._deliverChunk = deliverChunk;
      this._segments = [];
      this._matchStrings = [];
   }

   _getCurrentSegment() {
      if (!this._currentSegment || this._currentSegment.atEnd()) {
         this._currentSegment = this._segmentSource.shift();
         this._segments.push(this._currentSegment);

         if (!this._startOffset) {
            this._startOffset = this._currentSegment.startOffset.clone();
         }
      }

      return this._currentSegment;
   }

   _extractChunk() {
      if (this._matchStrings.length === 0) {
         return;
      }

      const lastSegment = this._segments[this._segments.length - 1];

      if (lastSegment && !lastSegment.atEnd()) {
         this._segmentSource.unshift(lastSegment);
      }

      const text = this._matchStrings.join('');
      const originalText = text;

      return new Chunk(text, originalText, this._startOffset, lastSegment && lastSegment.offset);
   }

}

/**********************************************************************\
  If decimal or hexadecimal digits are to be found from the current
  location in the current segment, consume as many digits across as
  many segments as available, and call back with the results.
  Do not finish searching and doing the callback until either
  a non-digit is found or the end of the input is found.
\**********************************************************************/

class DigitsOperation extends GeneralOperation {
   scan() {
      while (this._segmentSource.length > 0) {
         const segment = this._getCurrentSegment();

         DIGITS_REGEX.lastIndex = segment.index;
         const result = DIGITS_REGEX.exec(segment.text);
         const haveMatch = result && result.index === segment.index;

         if (haveMatch) {
            this._matchStrings.push(result[0]);

            segment.index += result[0].length;
         }

         if (!haveMatch || !segment.atEnd() || segment.atEnd() && segment.isLast) {
            this._deliverChunk(this._extractChunk());
            return;
         }
      }
   }
}

class SpaceOperation extends GeneralOperation {
   constructor(info, segmentSource, onDone) {
      super(segmentSource, onDone);

      this._info = info;
      this._originalStrings = [];
   }

   scan() {
      const SPACE_REGEX = this._info.isVersion1dot0 ? SPACE_10_REGEX : SPACE_11_REGEX;
      const LINE_ENDING_REGEX = this._info.isVersion1dot0 ? LINE_ENDING_10_REGEX : LINE_ENDING_11_REGEX;

      while (this._segmentSource.length > 0) {
         const segment = this._getCurrentSegment();

         SPACE_REGEX.lastIndex = segment.index;
         const result = SPACE_REGEX.exec(segment.text);
         const haveMatch = result && result.index === segment.index;

         if (haveMatch) {
            this._matchStrings.push(result[0].replace(LINE_ENDING_REGEX, '\n'));
            this._originalStrings.push(result[0]);

            segment.index += result[0].length;
         }

         if (!haveMatch || !segment.atEnd() || segment.atEnd() && segment.isLast) {
            this._deliverChunk(this._extractChunk());
            return;
         }
      }
   }
}

class CharOperation extends GeneralOperation {
   constructor(incrementIndex, info, segmentSource, onDone) {
      super(segmentSource, onDone);

      this._incrementIndex = incrementIndex;
      this._info = info;
      this._originalStrings = [];
   }

   _undoIndexChanges() {
      if (this._incrementIndex) {
         return;
      }

      for (let index = this._segments.length - 1; index >= 0; index--) {
         const segment = this._segments.pop();

         segment.index = 0;
         this._segmentSource.unshift(segment);
      }

      this._startSegment.index = this._startIndex;
   }

   scan() {
      const LINE_ENDING_REGEX = this._info.isVersion1dot0 ? LINE_ENDING_10_REGEX : LINE_ENDING_11_REGEX;

      while (this._segmentSource.length > 0) {
         const segment = this._getCurrentSegment();

         if (!this._startSegment) {
            this._startSegment = segment;
            this._startIndex = segment.index;
         }

         const currentChar = segment.text[segment.index];

         if (this._foundCR) {
            if (currentChar === '\n' || (currentChar === '\u0085' && this._info.isVersion1dot1)) {
               this._originalStrings.push(currentChar);
               segment.index ++;
            }

            this._undoIndexChanges();
            this._deliverChunk(this._extractChunk());
            return;
         }

         // this seems fragile since in theory we could be not at end. but getCurrentSegment seems to protect us
         if (segment.atEnd() && segment.isLast) {
            this._undoIndexChanges();
            if (!this._incrementIndex) {
               this._segmentSource.unshift(segment);
            }
            this._deliverChunk(undefined);
            return;
         }

         if (currentChar === undefined) {
            continue;
         }

         // Here terrible things happen
         if (currentChar === '\r') {
            this._matchStrings.push('\n');
            this._originalStrings.push('\r');
            segment.index ++;
            this._foundCR = true;

            if (!segment.atEnd()) {
               this._segmentSource.unshift(segment);
            } else if (segment.isLast) {
               this._undoIndexChanges();
               this._deliverChunk(this._extractChunk());
               return;
            }
            continue;
         }

         LINE_ENDING_REGEX.lastIndex = segment.index;
         const result = LINE_ENDING_REGEX.exec(segment.text);
         const haveLineEnding = result && result.index === segment.index;

         if (haveLineEnding) {
            this._matchStrings.push(result[0].replace(LINE_ENDING_REGEX, '\n'));
            this._originalStrings.push(result[0]);

            segment.index += result[0].length;
         } else {
            this._matchStrings.push(currentChar);
            this._originalStrings.push(currentChar);
            segment.index ++;
         }

         this._undoIndexChanges();
         this._deliverChunk(this._extractChunk());
         return;
      }
   }
}

class ToTerminatorOperation extends GeneralOperation {
   constructor(info, spaceTerminators, terminators, segmentSource, onDone) {
      super(segmentSource, onDone);

      this._info = info;
      this._originalStrings = [];
      this._spaceTerminators = spaceTerminators;
      this._terminators = terminators;
      this._regexMemo = {}; // ####
   }

   scan() {
      const self = this;
      if (this._subOp) {
         this._subOp.scan();
         return;
      }
      const LINE_ENDING_REGEX = this._info.isVersion1dot0 ? LINE_ENDING_10_REGEX : LINE_ENDING_11_REGEX;
      const terminatorCharsArray = this._spaceTerminators.concat(this._terminators.map((term) => (term[0])));
      const terminatorChars = terminatorCharsArray.join('');
      let terminatorRegex = this._regexMemo[terminatorChars];

      if (!terminatorRegex) {
         const regexString = '[^' + terminatorChars + ']*';
         terminatorRegex = new RegExp(regexString, 'g');
         this._regexMemo[terminatorChars] = terminatorRegex;
      }

      while (this._segmentSource.length > 0) {
         const segment = this._getCurrentSegment();

         while (!segment.atEnd()) {
            terminatorRegex.lastIndex = segment.index;
            const result = terminatorRegex.exec(segment.text);

            if (result[0].length > 0) {
               this._matchStrings.push(result[0].replace(LINE_ENDING_REGEX, '\n'));
               this._originalStrings.push(result[0]);
            }

            segment.index += result[0].length;

            const spaceTerminatorChars = this._info.isVersion1dot0 ? SPACE_TERMINATOR_CHARS_10 :
               SPACE_TERMINATOR_CHARS_11;

            const terminatorArray = spaceTerminatorChars.concat(this._terminators);  // ick
            this._segmentSource.unshift(segment);

            this._subOp = new MatchOperation(terminatorArray, false, this._segmentSource, (result) => {
               delete self._subOp;
               if (result) {
                  self._deliverChunk(this._extractChunk());
               } else {
                  self._matchStrings.push(segment.text[segment.index]);
                  self._originalStrings.push(segment.text[segment.index]);
                  segment.index ++;
                  self.scan();
               }
            });
            this._subOp.scan();
            return;
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
         }

         if (!segment.atEnd() || segment.atEnd() && segment.isLast) {
            this._deliverChunk(this._extractChunk());
            return;
         }
      }
   }
}

// Need to deal with newlines if whitespace in match value
class MatchOperation extends GeneralOperation {
   constructor(candidates, consumeMatch, segmentSource, onDone) {
      super(segmentSource, onDone);

      this._candidates = candidates;
      this._consumeMatch = consumeMatch;
      this._whichCandidate = 0;
      this._candidateIndex = 0;
   }

   scan() {
      while (this._segmentSource.length > 0) {
         const segment = this._getCurrentSegment();

         if (!this._startSegment) {
            this._startSegment = segment;
            this._startIndex = segment.index;
         }

         const candidate = this._candidates[this._whichCandidate];
         const segmentRemainder = segment.text.length - segment.index;
         const candidateRemainder = candidate.length - this._candidateIndex;
         const lengthToCompare = Math.min(segmentRemainder, candidateRemainder);
         const segmentText = segment.text.substr(segment.index, lengthToCompare);
         const candidateText = candidate.substr(this._candidateIndex, lengthToCompare);

         if (segmentText === candidateText) {
            this._matchStrings.push(segmentText);
            this._candidateIndex += lengthToCompare;
            segment.index += lengthToCompare;

            if (this._candidateIndex >= candidate.length) {
               const resultChunk = this._extractChunk();

               if (!this._consumeMatch) {
                  this._startSegment.index = this._startIndex;

                  for (let index = this._segments.length - 1; index >= 0; index--) {
                     // need to change their indexes
                     this._segmentSource.unshift(this._segments[index]);
                  }
               }

               this._deliverChunk(resultChunk);
               return;
            } else if (segment.atEnd() && segment.isLast) {
               // ick
               this._whichCandidate ++;
               this._candidateIndex = 0;
               this._segments = [ this._startSegment ];
               this._startSegment.index = this._startIndex;
               this._segmentSource.unshift(segment);

               if (this._whichCandidate >= this._candidates.length) {
                  this._deliverChunk(undefined);
                  return;
               }
            }
         } else {
            this._whichCandidate ++;
            this._candidateIndex = 0;
            this._segments = [ this._startSegment ];
            this._startSegment.index = this._startIndex;
            this._segmentSource.unshift(segment);
            // need to test spanning multiple segments

            if (this._whichCandidate >= this._candidates.length) {
               this._deliverChunk(undefined);
               return;
            }
         }
      }
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
