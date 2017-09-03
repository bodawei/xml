/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

const AllExtractor = require('./AllExtractor.js');

const SPACE_TERMINATOR_10 = [ ' ', '\t', '\n', '\r' ];
const SPACE_TERMINATOR_11 = [ ' ', '\t', '\n', '\r', '\u0085', '\u2028' ];

/**********************************************************************\
 A AllExtractor will look for the specified candidate string starting
\**********************************************************************/

class WordExtractor extends AllExtractor {

   constructor(version, terminators) {
      super(version, (version === 1.0 ? SPACE_TERMINATOR_10 : SPACE_TERMINATOR_11).concat(terminators || []));
   }

}

module.exports = WordExtractor;
