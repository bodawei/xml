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

class Segment {
   constructor(text) {
      this.text = text;
      this.startOffset = new Offset(0, 0, 0);
      this.offset = new Offset(0, 0, 0);
      this.index = 0;
      this.isLast = false;
   }

//   incrementChar() {
//      // stop if too far
//      this.offset.index ++;
//      this.offset.column ++;
//   }

   atEnd() {
      return this.index >= this.text.length;
   }
}

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

class ChunkSource {

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

   constructor(info) {
//      if (!(info instanceof EntityMetaData)) {
//         throw new Error('Must pass an EntityMetaData, or something that can become one, into XmlStringCursor.');
//      }

      this._info = info;
      this._segments = [];
      this._currentOperation = undefined;
      this._regexMemo = {};
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

      this._currentOperation = {
         name: 'Digit',
         onPlucked: deliverChunk,
         match: [],
         segments: []
      };

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

      this._currentOperation = {
         name: 'Space',
         onPlucked: deliverChunk,
         match: [],
         original: [],
         segments: []
      };

      this._resumeOperation();
   }

   getWord(terminators, deliverChunk) {
      if (typeof deliverChunk !== 'function') {
         throw new Error('Must pass a callback function of the form function(chunk|undefined):void to getWord().');
      }

      this._currentOperation = {
         name: 'Word',
         onPlucked: deliverChunk,
         match: [],
         original: [],
         segments: [],
         terminators: terminators
      };

      this._resumeOperation();
   }

   addSegment(text, last) {
      const segment = new Segment(text);
      this._segments.push(segment);
      segment.isLast = last;

      this._resumeOperation();
   }

   /**********************************************************************\
     If decimal or hexadecimal digits are to be found from the current
     location in the current segment, consume as many digits across as
     many segments as available, and call back with the results.
     Do not finish searching and doing the callback until either
     a non-digit is found or the end of the input is found.
   \**********************************************************************/

   _innerDigit(op, segment) {
      while (segment) {
         DIGITS_REGEX.lastIndex = segment.index;
         const result = DIGITS_REGEX.exec(segment.text);
         const haveMatch = result && result.index === segment.index;

         if (haveMatch) {
            op.match.push(result[0]);

            segment.index += result[0].length;
            segment.offset.index += result[0].length;
            segment.offset.column += result[0].length;
         }

         if (!haveMatch || !segment.atEnd() || segment.atEnd() && segment.isLast) {
            this._currentOperation = undefined;
            op.onPlucked(this._pluckChunk(op));
            return;
         }

         segment = this._segments.shift();
         op.segments.push(segment);
      }
   }

   /**********************************************************************\
     @@@@
   \**********************************************************************/

   _innerSpace(op, segment) {
      const SPACE_REGEX = this._info.isVersion1dot0 ? SPACE_10_REGEX : SPACE_11_REGEX;
      const LINE_ENDING_REGEX = this._info.isVersion1dot0 ? LINE_ENDING_10_REGEX : LINE_ENDING_11_REGEX;

      while (segment) {
         SPACE_REGEX.lastIndex = segment.index;
         const result = SPACE_REGEX.exec(segment.text);
         const haveMatch = result && result.index === segment.index;

         if (haveMatch) {
            op.match.push(result[0].replace(LINE_ENDING_REGEX, '\n'));
            op.original.push(result[0]);

            segment.index += result[0].length;
            segment.offset.index += result[0].length;
            segment.offset.column += result[0].length;
         }

         if (!haveMatch || !segment.atEnd() || segment.atEnd() && segment.isLast) {
            this._currentOperation = undefined;
            op.onPlucked(this._pluckChunk(op));
            return;
         }

         segment = this._segments.shift();
         op.segments.push(segment);
      }
   }

   _innerWord(op, segment) {
      const spaceTerminators = this._info.isVersion1dot0 ? SPACE_TERMINATORS_10 : SPACE_TERMINATORS_11;

      this._followToTerminator(op, segment, spaceTerminators, op.terminators);
   }

   // note: do not need to try to replace newlines for wrod
   _followToTerminator(op, segment, spaceTerminators, terminators) {
      const LINE_ENDING_REGEX = this._info.isVersion1dot0 ? LINE_ENDING_10_REGEX : LINE_ENDING_11_REGEX;
      const terminatorCharsArray = spaceTerminators.concat(terminators.map((term) => (term[0])));
      const terminatorChars = terminatorCharsArray.join('');
      let terminatorRegex = this._regexMemo[terminatorChars];

      if (!terminatorRegex) {
         const regexString = '[^' + terminatorChars + ']*';
         terminatorRegex = new RegExp(regexString, 'g');
         this._regexMemo[terminatorChars] = terminatorRegex;
      }

      while (segment) {
         let actualMatch = false;

         while (!actualMatch && !segment.atEnd()) {
            terminatorRegex.lastIndex = segment.index;
            const result = terminatorRegex.exec(segment.text);
            const havePotentialMatch = result && result.index === segment.index;

            if (havePotentialMatch) {
               // This could be a false positive. e.g., it matches the first char of a term. which doesn't overall match
               const remainingChars = segment.text.length - (result.index + result[0].length);

               for (let tIndex = 0; tIndex < terminators.length; tIndex++) {
                  const term = terminators[tIndex];

                  if (term.length <= remainingChars) {
                     if (segment.text.substr(result.index + result[0].length, term.length) === term) {
                        op.terminagor = term;
                        actualMatch = true;
                        break;
                     }
                  } else {
                     // do doMatch
                  }
               }

               if (!actualMatch && spaceTerminators) {
                  const SPACE_REGEX = this._info.isVersion1dot0 ? SPACE_10_REGEX : SPACE_11_REGEX;
                  const matchChar = segment.text[result.index + result[0].length];
                  SPACE_REGEX.lastIndex = 0;
                  const haveMatch = SPACE_REGEX.exec(matchChar);
                  if (haveMatch) {
                     op.terminagor = matchChar;
                     actualMatch = true;
                  }
               }

               if (actualMatch) {
                  if (result[0].length > 0) {
                     op.match.push(result[0].replace(LINE_ENDING_REGEX, '\n'));
                     op.original.push(result[0]);

                     segment.index += result[0].length;
                  }
               } else {
                  // copy over what we have so far, including the false-ly matching character

                  // uncomfortable with line endings here
                  op.match.push(result[0].replace(LINE_ENDING_REGEX, '\n'));
                  op.original.push(result[0]);

                  op.match.push(segment.text[result[0].length]); // .replace(LINE_ENDING_REGEX, '\n')
                  op.original.push(segment.text[result[0].length]);

                  segment.index += result[0].length + 1;
               }
            }
         }

         if (actualMatch || !segment.atEnd() || segment.atEnd() && segment.isLast) {
            this._currentOperation = undefined;
            op.onPlucked(this._pluckChunk(op));
            return;
         }

         segment = this._segments.shift();
         op.segments.push(segment);
      }
   }

   _resumeOperation() {
      if (this._segments.length === 0 || !this._currentOperation) {
         return;
      }

      const operation = this._currentOperation;

      const segment = this._segments.shift();

      if (!operation.start) {
         operation.start = segment.offset.clone();
         operation.segments = [ segment ];
      } else {
         operation.segments.push(segment);
      }

      this['_inner' + operation.name](operation, segment);
   }

//   _innerMatch(op, segment) {
//
//      while (segment) {
//         while (segment.current() === op.param[op.paramOffset]) {
//            op.paramOffset ++;
//            segment.incrementChar();
//
//            if (op.paramOffset === op.param.length) {
//               break;
//            }
//         }
//
//         if (op.paramOffset === op.param.length) {
//            this._currentOperation = undefined;
//            op.onPlucked(this._pluckChunk(op));
//            return;
//         }
//         segment = this._segments.shift();
//      }
//   }

   _pluckChunk(operation) {
      if (operation.match.length === 0) {
         return;
      }

      const lastSegment = operation.segments[operation.segments.length - 1];

      if (!lastSegment.atEnd()) {
         this._segments.unshift(lastSegment);
      }

      const text = operation.match.join('');
      let originalText = text;
      if (operation.original) {
         originalText = operation.original.join('');
      }

      return new Chunk(text, originalText, operation.start, lastSegment.offset);

      // TODO: NEed to add offsets

//      const startSeg = operation.segments.shift();
//      const str = startSeg.text.substring(operation.start.index, startSeg.offset.index);
//
//      if (operation.segments.length === 0) {
//         if (!startSeg.atEnd()) {
//            this._segments.unshift(startSeg);
//         }
//
//         return new Chunk(str, operation.start, startSeg.offset);
//      }
//
//      const pieces = [ str ];
//      while (operation.segments.length > 1) {
//         const seg = operation.segments.shift();
//         pieces.push(seg.text);
//      }
//
//      const lastSegment = operation.segments.shift();
//
//      if (lastSegment.atEnd()) {
//         pieces.push(lastSegment.text);
//      } else {
//         pieces.push(lastSegment.text.substr(0, lastSegment.offset.index));
//         this._segments.unshift(lastSegment);
//      }
   }

}

module.exports = ChunkSource;
