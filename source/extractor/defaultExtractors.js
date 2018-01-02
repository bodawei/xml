/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import AllExtractor from './AllExtractor.js';
import CharExtractor from './CharExtractor.js';
import DigitExtractor from './DigitExtractor.js';
import MatchExtractor from './MatchExtractor.js';
import MultiMatchExtractor from './MultiMatchExtractor.js';
import PeekExtractor from './PeekExtractor.js';
import SpaceExtractor from './SpaceExtractor.js';
import WordExtractor from './WordExtractor.js';

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
      params: [ '<!--', '<?', '<!', '</', '&', '<', '<![' ],
   },
   close: {
      extractorConstructor: MultiMatchExtractor,
      params: [ ']]>', ']' ],
   },
   peekChar: {
      extractorConstructor: PeekExtractor,
      params: {
         extractorConstructor: CharExtractor,
      },
   },
   peekSpace: {
      extractorConstructor: PeekExtractor,
      params: {
         extractorConstructor: SpaceExtractor,
      },
   },
   peekWord: {
      extractorConstructor: PeekExtractor,
      params: {
         extractorConstructor: WordExtractor,
      },
   },
};

export default defaultExtractors;
