/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { WellFormedError } from '../error';

import base from './base';
import {
   textOrBlank,
 } from './common/misc.js';

/**********************************************************************\
 The entityReference namespace has routines for processing general
 and parameter entity reference.
\**********************************************************************/

const ENTITYREF = 'ENTITYREF';
const ENTITYREF_XTOKEN = 'ENTITYREF_XTOKEN';
const PARAMETERENTITYREF = 'PARAMETERENTITYREF';
const PEREF_XTOKEN = 'PEREF_XTOKEN';
const WFEID = WellFormedError.ID;

class EntityReferenceXToken extends base.XToken {

   constructor(name, pToken) {
      super(ENTITYREF_XTOKEN, pToken);

      this.name = name;
   }

}

class ParameterEntityReferenceXToken extends EntityReferenceXToken {
   constructor(name, pToken) {
      /* istanbul ignore next */
      super(name, pToken);

      this.type = PEREF_XTOKEN;
   }
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

function parse(source, open, deliverPToken) {
   const pToken = new EntityReferencePToken();
   pToken.open = open;

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
   let refClass = EntityReferenceXToken;

   if (pToken.open && pToken.open.str === '%') {
      refClass = ParameterEntityReferenceXToken;
   }

   return new refClass(textOrBlank(pToken.name), pToken);
}

const entityReference = {
   PTYPE: ENTITYREF,
   PARAM_PTYPE: PARAMETERENTITYREF,
   XTYPE: ENTITYREF_XTOKEN,
   PEREF_XTYPE: PEREF_XTOKEN,
   PToken: EntityReferencePToken,
   ParamPToken: ParameterEntityReferencePToken,
   XToken: EntityReferenceXToken,
   ParamXToken: ParameterEntityReferenceXToken,
   parse,
   paramParse,
   checkWellFormed,
   pTokenToXToken,
};

export default entityReference;
export {
   EntityReferencePToken,
   EntityReferenceXToken,
   ParameterEntityReferencePToken,
   ParameterEntityReferenceXToken,
};
