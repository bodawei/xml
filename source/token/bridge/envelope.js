/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { WellFormedError } from '../../error';

import misc from '../common/misc.js';
import base from '../base';

/**********************************************************************\
 The enveloper namespace contains a "bridge" parser which will
 start parsing an enveloper (<![ ... [ ... ]]>) far enough to determine
 what kind it is. The caller can then call a more specific handler.
\**********************************************************************/

const UNKNOWNENVELOPE = 'UNKNOWNENVELOPE';
const UNKNOWNENVELOPE_XTOKEN = 'UNKNOWNENVELOPE_XTOKEN';
const WFEID = WellFormedError.ID;

class UnknownEnvelope extends base.XToken {
   constructor() {
      super(UNKNOWNENVELOPE_XTOKEN, {});
   }
}

class EnvelopePToken extends base.PToken {
   /* istanbul ignore next */ // Istanbul is confused by node transpilation
   constructor(type, props) {
      super(type || UNKNOWNENVELOPE, props);
   }

   getSTokenArray() {
      const results = super.getSTokenArray();

      results.pushSTokens(this.open,
         this.postOpenSpace,
         this.envelopeType,
         this.postEnvelopeTypeSpace,
         this.bracket);

      return results;
   }
}

/**********************************************************************\
 parse() starts extracting an enveloper and then returns that.

 PARAM
 source: A STokenSource to read from
 openSToken: the SToken for <![
 deliverPToken: Callback to deliver the PToken

 SYNTAX
   enveloper ::= '<![' S name S '['
\**********************************************************************/

function parse(source, openSToken, deliverPToken) {
   const pToken = {
      type: UNKNOWNENVELOPE,
      open: openSToken,
   };
   source.extractToObject('space', pToken, 'postOpenSpace');
   source.extractToObject('word', [ '[', '>' ], pToken, 'envelopeType');
   source.extractToObject('space', pToken, 'postEnvelopeTypeSpace');

   source.extract('match', '[', (sToken) => {
      pToken.bracket = sToken;

      deliverPToken(pToken);
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(pToken, allowSpaces, ec, entityMetaData) {
   const typeText = misc.textOrBlank(pToken.envelopeType);

   ec.setPos(pToken.open);

   ec.setPos(pToken.postOpenSpace);

   if (!allowSpaces) {
      ec.check(pToken.postOpenSpace, WFEID.ENVELOPE_XTRA_SPACE_AFTER_OPEN, [ typeText ]);
   }

   ec.setPos(pToken.envelopeType);

   if (pToken.envelopeType) {
      const upperType = typeText.toLocaleUpperCase();

      misc.checkWellFormedText(pToken.envelopeType, ec, entityMetaData);
      ec.check(typeText !== upperType, WFEID.ENVELOPE_INVALID_CASE, [ upperType, typeText ]);
   } else {
      ec.report(WFEID.ENVELOPE_NO_TYPE);
   }

   ec.check(pToken.envelopeType && pToken.type === UNKNOWNENVELOPE, WFEID.ENVELOPE_UNKNOWN, [ typeText ]);

   ec.setPos(pToken.postEnvelopeTypeSpace);

   if (!allowSpaces) {
      ec.check(pToken.postEnvelopeTypeSpace, WFEID.ENVELOPE_XTRA_SPACE_AFTER_TYPE, [ typeText ]);
   }

   ec.setPos(pToken.bracket);
   ec.check(!pToken.bracket, WFEID.ENVELOPE_NO_SECOND_BRACKET, [ typeText ]);

   return ec;
}

/**********************************************************************\
 pTokenToXToken() converts a PToken into an Xoken.
\**********************************************************************/

function pTokenToXToken(pToken) {
   const result = new UnknownEnvelope([]);
   result.pToken = pToken;
   return result;
}

export {
   UNKNOWNENVELOPE as PTYPE,
   UNKNOWNENVELOPE_XTOKEN as XTYPE,
   UnknownEnvelope as XToken,
   EnvelopePToken as PToken,
   parse,
   checkWellFormed,
   pTokenToXToken,
};
