/* Copyright ® 2017 by David John Burrowes. All rights reserved. */

'use strict';

const AllExtractor = require('./AllExtractor.js');
const CharExtractor = require('./CharExtractor.js');
const DigitExtractor = require('./DigitExtractor.js');
const MatchExtractor = require('./MatchExtractor.js');
const MultiMatchExtractor = require('./MultiMatchExtractor.js');
const PeekExtractor = require('./PeekExtractor.js');
const SpaceExtractor = require('./SpaceExtractor.js');
const WordExtractor = require('./WordExtractor.js');

const defaultExtractors = {
   all: AllExtractor,
   char: CharExtractor,
   digit: DigitExtractor,
   match: MatchExtractor,
   multi: MultiMatchExtractor,
   space: SpaceExtractor,
   word: WordExtractor,
   markup: {
      extractorConstructor: MultiMatchExtractor,
      params: [ '<!--', '<?', '<!', '</', '&', '<' ]
   },
   close: {
      extractorConstructor: MultiMatchExtractor,
      params: [ ']]>', ']' ]
   },
   peekChar: {
      extractorConstructor: PeekExtractor,
      params: {
         extractorConstructor: CharExtractor
      }
   },
   peekSpace: {
      extractorConstructor: PeekExtractor,
      params: {
         extractorConstructor: SpaceExtractor
      }
   }
};

module.exports = defaultExtractors;
