/* Copyright ® 2018-202 by 柏大衛. All rights reserved. */

import { SToken, STokenSource } from 'sToken';

const PARAMETER_ENTITY_REFERENCE_PTOKEN = 'PARAMETER_ENTITY_REFERENCE_PTOKEN';

type DeliverPToken = (pToken: ParameterEntityReferencePToken | undefined) => void;

type MutableParameterEntityReference = {
   open: SToken;
   openSpace?: SToken;
   name?: SToken;
   nameSpace?: SToken;
   close?: SToken;
};

class ParameterEntityReferencePToken {
   public readonly type: typeof PARAMETER_ENTITY_REFERENCE_PTOKEN = PARAMETER_ENTITY_REFERENCE_PTOKEN;
   public readonly open: SToken;
   public readonly openSpace?: SToken;
   public readonly name?: SToken;
   public readonly nameSpace?: SToken;
   public readonly close?: SToken;

   constructor(param: ParameterEntityReferencePToken | MutableParameterEntityReference, extras?: MutableParameterEntityReference) {
      this.open = extras?.open || param.open;
      this.openSpace = extras?.openSpace || param.openSpace;
      this.name = extras?.name || param.name;
      this.nameSpace = extras?.nameSpace || param.nameSpace;
      this.close = extras?.close || param.close;
   }
}

/**********************************************************************\
 parseParameterEntityReference() extracts a parameter entity reference.

 PARAM
 source: An STokenSource to read from
 deliverPToken: Callback to deliver the PToken

 SYNTAX
   §4.1.0
      [69] PEReference ::= '%' Name ';'
   Lax
      [69] PEReference ::= '%' S? Name? S? ';'?
\**********************************************************************/

function parseParameterEntityReference(source: STokenSource, deliverPToken: DeliverPToken) {

   source.extract('match', '%', (result) => {
      if (!result) {
         deliverPToken(undefined);
         return;
      }

      const props: MutableParameterEntityReference = {
         open: result,
      };

      source.extractToObjectNoParams('space', props, 'openSpace');
      source.extractToObject('word', [ ';' ], props, 'name');
      source.extractToObjectNoParams('space', props, 'nameSpace');
      source.extract('match', ';', (sToken) => {
         props.close = sToken;
         deliverPToken(new ParameterEntityReferencePToken(props));
      });
   });
}

export {
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
   ParameterEntityReferencePToken,

   parseParameterEntityReference,
};
