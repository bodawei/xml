/*Copyright ® 2017 by David John Burrowes. All rights reserved. */

'use strict';

const SyntaxError = require('./error/SyntaxError.js');
const XmlTokenStreamMisc = require('./XmlTokenStream-misc.js');

const SEID = SyntaxError.ID;

function textOrBlank(chunk) {
   return chunk ? chunk.text : '';
}

/**********************************************************************\
 Utilities related to references
\**********************************************************************/

const XmlReference = {

   validateCharReference(parsed, reporter) {
      reporter._checkSyntax(!parsed.postStartSpaceChunk, SEID.REFERENCE_XTRA_SPACE);
      reporter._checkSyntax(!parsed.postHashSpaceChunk, SEID.CHARREF_XTRA_SPACE);

      if (parsed.hexMarkerChunk && parsed.hexMarkerChunk.text.toLocaleLowerCase() === 'x') {
         reporter._checkSyntax(parsed.hexMarkerChunk.text === 'x', SEID.CHARREF_INVALID_HEX_CASE);
      }

      reporter._checkSyntax(!parsed.postHexSpaceChunk, SEID.CHARREF_XTRA_SPACE_BEFORE_DIGITS);

      if (!parsed.digitsChunk) {
         reporter._report(SEID.CHARREF_NO_DIGITS);
      } else if (!parsed.hexMarkerChunk && !XmlTokenStreamMisc.isDecimal(parsed.digitsChunk)) {
         reporter._report(SEID.CHARREF_INVALID_BASE, [ parsed.digitsChunk.text ]);
      }

      reporter._checkSyntax(!parsed.postDigitsSpaceChunk, SEID.CHARREF_XTRA_SPACE_AFTER_DIGITS);
      reporter._checkSyntax(parsed.semicolonChunk, SEID.CHARREF_NO_SEMICOLON);
   },

   validateEntityReference(parsed, reporter) {
      reporter._checkSyntax(!parsed.postStartSpaceChunk, SEID.REFERENCE_XTRA_SPACE);
      const entityName = textOrBlank(parsed.nameChunk);

      if (!entityName) {
         reporter._report(SEID.REFERENCE_NO_NAME);
      }

      reporter._checkSyntax(!parsed.postNameSpaceChunk, SEID.REFERENCE_XTRA_TRAILING_SPACE, [ entityName ]);
      reporter._checkSyntax(parsed.semicolonChunk, SEID.REFERENCE_NO_SEMICOLON, [ entityName ]);
   }

};

module.exports = XmlReference;
