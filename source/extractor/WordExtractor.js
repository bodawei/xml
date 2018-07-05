/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import AllExtractor from './AllExtractor';

const SPACE_TERMINATOR_10 = [ ' ', '\t', '\n', '\r' ];
const SPACE_TERMINATOR_11 = [ ' ', '\t', '\n', '\r', '\u0085', '\u2028' ];

/**********************************************************************\
 A WordExtractor extracts a word, which is a series of characters
 terminated by spaces and/or any of the specified terminators.
\**********************************************************************/

class WordExtractor extends AllExtractor {

   constructor(version, terminators) {
      /* istanbul ignore next */ // Poor istanbul is confused by something
      super(version, buildFullTerminators(version, terminators));
   }

}

function buildFullTerminators(version, terminators) {
   const someTerminators = terminators || [];

   if (version === 1.0) {
      return SPACE_TERMINATOR_10.concat(someTerminators);
   } else {
      return SPACE_TERMINATOR_11.concat(someTerminators);
   }
}

export default WordExtractor;
