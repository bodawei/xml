/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

import base from './base';
import { strOrBlank, STokenSource } from 'sToken';
import { EntityMetaData } from 'basic';
import { ErrorCollector } from 'error';

const SPACE = 'SPACE';
const SPACE_XTOKEN = 'SPACE_XTOKEN';

/**********************************************************************\
 The comment namespace contains the usual tools for processing XML
 comments
\**********************************************************************/

class Space extends base.XToken {
   public text: string;

   /* istanbul ignore next */ // Istanbul is confused by node transpilation
   constructor(text: string, pToken?: SpacePToken) {
      super(SPACE_XTOKEN, pToken);

      this.text = text;
   }

}

class SpacePToken extends base.PToken {
   /* istanbul ignore next */ // Istanbul is confused by node transpilation
   constructor(props?: Object) {
      super(SPACE, props);
   }

   getSTokenArray() {
      /* istanbul ignore next */ // Istanbul is confused by node transpilation
      const results = super.getSTokenArray();

      results.pushSTokens(this.text);

      return results;
   }
}

/**********************************************************************\
 parse() extracts a space.

 PARAM
 source: A STokenSource to read from
 deliverPToken: Callback to deliver the PToken

 SYNTAX
   [15] Comment ::= '<!--' ((Char - '-') | ('-' (Char - '-')))* '-->'
\**********************************************************************/

function parse(source: STokenSource, deliverPToken: (result: SpacePToken) => void) {
   const pToken = new SpacePToken();

   source.extract('space', undefined, (sToken) => {
      pToken.text = sToken;
      deliverPToken(pToken);
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

// eslint-disable-next-line no-unused-vars
function checkWellFormed(pToken: SpacePToken, ec: ErrorCollector, emd: EntityMetaData) {
   ec.setPos(pToken.text);
}

/**********************************************************************\
 pTokenToXToken() converts a PToken into an XToken.
\**********************************************************************/

function pTokenToXToken(pToken: SpacePToken) {
   return new Space(strOrBlank(pToken.text), pToken);
}

export {
   SPACE as PTYPE,
   SPACE_XTOKEN as XTYPE,
   Space as XToken,
   SpacePToken as PToken,
   parse,
   checkWellFormed,
   pTokenToXToken,

   Space,
   SpacePToken,
};
