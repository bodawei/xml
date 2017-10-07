/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { WellFormedError } from '../error';

import * as misc from './common/misc.js';
import {
   textOrBlank,
} from './common/util.js';
import { Token as XmlToken } from './xmlToken.js';

/**********************************************************************\
 The enveloper namespace contains a "bridge" parser which will
 start parsing an enveloper (<![ ... [ ... ]]>) far enough to determine
 what kind it is. The caller can then call a more specific handler.
\**********************************************************************/

const UNKNOWNENVELOPE = 'UNKNOWNENVELOPE';
const WFEID = WellFormedError.ID;

class UnknownEnvelope extends XmlToken {
}

/**********************************************************************\
 parse() starts extracting an enveloper and then returns that.

 PARAM
 source: A LTokenSource to read from
 openLToken: the LToken for <![
 deliverParsed: Callback to deliver the parsed lTokens

 SYNTAX
   enveloper ::= '<![' S name S '['
\**********************************************************************/

function parse(source, openLToken, deliverParsed) {
   const results = {
      type: UNKNOWNENVELOPE,
      open: openLToken,
   };
   source.extractToObject('space', results, 'postOpenSpace');
   source.extractToObject('word', [ '[', '>' ], results, 'envelopeType');
   source.extractToObject('space', results, 'postEnvelopeTypeSpace');

   source.extract('match', '[', (lToken) => {
      results.bracket = lToken;

      deliverParsed(results);
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(parsed, allowSpaces, ec, entityMetaData) {
   const typeText = textOrBlank(parsed.envelopeType);

   ec.setPos(parsed.open);

   ec.setPos(parsed.postOpenSpace);

   if (!allowSpaces) {
      ec.check(parsed.postOpenSpace, WFEID.ENVELOPE_XTRA_SPACE_AFTER_OPEN, [ typeText ]);
   }

   ec.setPos(parsed.envelopeType);

   if (parsed.envelopeType) {
      const upperType = typeText.toLocaleUpperCase();

      misc.checkWellFormedText(parsed.envelopeType, ec, entityMetaData);
      ec.check(typeText !== upperType, WFEID.ENVELOPE_INVALID_CASE, [ upperType, typeText ]);
   } else {
      ec.report(WFEID.ENVELOPE_NO_TYPE);
   }

   ec.check(parsed.envelopeType && parsed.type === UNKNOWNENVELOPE, WFEID.ENVELOPE_UNKNOWN, [ typeText ]);

   ec.setPos(parsed.postEnvelopeTypeSpace);

   if (!allowSpaces) {
      ec.check(parsed.postEnvelopeTypeSpace, WFEID.ENVELOPE_XTRA_SPACE_AFTER_TYPE, [ typeText ]);
   }

   ec.setPos(parsed.bracket);
   ec.check(!parsed.bracket, WFEID.ENVELOPE_NO_SECOND_BRACKET, [ typeText ]);

   return ec;
}

/**********************************************************************\
 makeToken() converts a parsed into a token.
\**********************************************************************/

function makeToken(parsed) {
   const result = new UnknownEnvelope([]);
   result.parsed = parsed;
   return result;
}

/**********************************************************************\
 Converts the parsing returned by declaraction.parse() into another type.
\**********************************************************************/

function makeTypedEnvelope(type, envelopeParsing) {
   return {
      type: type,
      open: envelopeParsing.open,
      postOpenSpace: envelopeParsing.postOpenSpace,
      envelopeType: envelopeParsing.envelopeType,
      postEnvelopeTypeSpace: envelopeParsing.postEnvelopeTypeSpace,
      bracket: envelopeParsing.bracket,
   };
}

export {
   UNKNOWNENVELOPE as TYPE,
   UnknownEnvelope as Token,
   parse,
   checkWellFormed,
   makeToken,
   makeTypedEnvelope,
};
