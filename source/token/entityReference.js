/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { WellFormedError } from '../error';

import * as base from './base.js';
import {
   textOrBlank,
 } from './common/misc.js';

/**********************************************************************\
 The entityReference namespace has routines for processing general
 and parameter entity reference.
\**********************************************************************/

const ENTITYREF = 'ENTITYREF';
const PARAMETERENTITYREF = 'PARAMETERENTITYREF';
const WFEID = WellFormedError.ID;

class EntityReference extends base.XToken {

   constructor(name, sTokens) {
      super(sTokens);

      this.name = name;
   }

}

class ParameterEntityReference extends EntityReference {
}

class EntityReferencePToken extends base.PToken {
   constructor(props) {
      super(ENTITYREF, props);
   }

   getSTokenArray() {
      const results = super.getSTokenArray();

      results.pushSTokens(this.open,
         this.postOpenSpace,
         this.name,
         this.postNameSpace,
         this.close);

      return results;
   }
}

class ParameterEntityReferencePToken extends base.PToken {
   constructor(props) {
      super(PARAMETERENTITYREF, props);
   }

   getSTokenArray() {
      const results = super.getSTokenArray();

      results.pushSTokens(this.open,
         this.postOpenSpace,
         this.name,
         this.postNameSpace,
         this.close);

      return results;
   }
}

/**********************************************************************\
 parse() extracts the SToken's that make up a general entity reference.

 This assumes that the initial & has not been extracted yet.

 PARAM
 source: An STokenSource to read from
 deliverPToken: Callback to deliver the PToken

 SYNTAX
    [67] Reference   ::= EntityRef | CharRef
    [68] EntityRef   ::= '&' Name ';'
\**********************************************************************/

function parse(source, deliverPToken) {
   const pToken = new EntityReferencePToken();

   source.extractToObject('match', '&', pToken, 'open');
   parseRef(source, pToken, deliverPToken);
}

/**********************************************************************\
 paramParse() extracts the SToken's that make up a parameter entity ref.

 This assumes that the initial % has not been extracted yet.

 PARAM
 source: An STokenSource to read from
 deliverPToken: Callback to deliver the PTokens

 SYNTAX
    [69] PEReference ::= '%' Name ';'
\**********************************************************************/

function paramParse(source, deliverPToken) {
   const pToken = new ParameterEntityReferencePToken();

   source.extractToObject('match', '%', pToken, 'open');
   parseRef(source, pToken, deliverPToken);
}

function parseRef(source, pToken, deliverPToken) {
   source.extractToObject('space', pToken, 'postOpenSpace');
   source.extractToObject('word', [ ';' ], pToken, 'name');
   source.extractToObject('space', pToken, 'postNameSpace');
   source.extract('match', ';', (sToken) => {
      pToken.close = sToken;
      deliverPToken(pToken);
   });
}

/**********************************************************************\
 checkWellFormed() does a well formed check on the PToken value.
\**********************************************************************/

function checkWellFormed(pToken, ec) {
   const entityName = textOrBlank(pToken.name);

   ec.setPos(pToken.open);
   ec.setPos(pToken.postOpenSpace);
   ec.check(pToken.postOpenSpace, WFEID.REFERENCE_XTRA_SPACE, [ entityName ]);

   ec.setPos(pToken.name);
   ec.check(!pToken.name, WFEID.REFERENCE_NO_NAME);

   ec.setPos(pToken.postNameSpace);
   ec.check(pToken.postNameSpace, WFEID.REFERENCE_XTRA_TRAILING_SPACE, [ entityName ]);

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.REFERENCE_NO_SEMICOLON, [ entityName ]);
}

/**********************************************************************\
 pTokenToXToken() converts a PToken into a token.
\**********************************************************************/

function pTokenToXToken(pToken) {
   let refClass = EntityReference;

   if (pToken.open && pToken.open.text === '%') {
      refClass = ParameterEntityReference;
   }

   return new refClass(textOrBlank(pToken.name), pToken);
}

export {
   ENTITYREF as PTYPE,
   PARAMETERENTITYREF as PARAM_PTYPE,
   EntityReferencePToken as PToken,
   ParameterEntityReferencePToken as ParamPToken,
   EntityReference as XToken,
   ParameterEntityReference as ParamXToken,
   parse,
   paramParse,
   checkWellFormed,
   pTokenToXToken,
};
