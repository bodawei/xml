/* Copyright ® 2018-202 by 柏大衛. All rights reserved. */

import { SToken, STokenSource } from 'sToken';

const GENERAL_ENTITY_REFERENCE_PTOKEN = 'GENERAL_ENTITY_REFERENCE_PTOKEN';

type DeliverPToken = (pToken: GeneralEntityReferencePToken) => void;

type MutableGeneralEntityReference = {
   open: SToken;
   openSpace?: SToken;
   name?: SToken;
   nameSpace?: SToken;
   close?: SToken;
};

class GeneralEntityReferencePToken {
   public readonly type: typeof GENERAL_ENTITY_REFERENCE_PTOKEN = GENERAL_ENTITY_REFERENCE_PTOKEN;
   public readonly open: SToken;
   public readonly openSpace?: SToken;
   public readonly name?: SToken;
   public readonly nameSpace?: SToken;
   public readonly close?: SToken;

   constructor(param: GeneralEntityReferencePToken | MutableGeneralEntityReference, extras?: MutableGeneralEntityReference) {
      this.open = extras?.open || param.open;
      this.openSpace = extras?.openSpace || param.openSpace;
      this.name = extras?.name || param.name;
      this.nameSpace = extras?.nameSpace || param.nameSpace;
      this.close = extras?.close || param.close;
   }
}

/**********************************************************************\
 parseGeneralEntityReference() extracts a parameter entity reference.

 PARAM
 source: An STokenSource to read from
 deliverPToken: Callback to deliver the PToken

 SYNTAX
   §4.1.0
      [68] EntityRef ::= '&' Name ';'
   Lax
      [68] EntityRef ::= '&' S? Name? S? ';'?
\**********************************************************************/

function parseGeneralEntityReference(source: STokenSource, open: SToken, deliverPToken: DeliverPToken) {
   const props: MutableGeneralEntityReference = {
      open,
   };

   source.extractToObjectNoParams('space', props, 'openSpace');
   source.extractToObject('word', [ ';' ], props, 'name');
   source.extractToObjectNoParams('space', props, 'nameSpace');
   source.extract('match', ';', (sToken) => {
      props.close = sToken;
      deliverPToken(new GeneralEntityReferencePToken(props));
   });
}

export {
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   GeneralEntityReferencePToken,

   parseGeneralEntityReference,
};
