/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import { SToken, STokenSource } from 'basic';

const GENERAL_ENTITY_REFERENCE_PTOKEN = 'GENERAL_ENTITY_REFERENCE_PTOKEN';

interface RawGeneralEntityReferenceProps {
   open?: SToken;
   openSpace?: SToken;
   name?: SToken;
   nameSpace?: SToken;
   close?: SToken;
}

interface GeneralEntityReferenceProps extends RawGeneralEntityReferenceProps {
   open: SToken;
   openSpace?: SToken;
   name?: SToken;
   nameSpace?: SToken;
   close?: SToken;
}

class GeneralEntityReferencePToken {
   public readonly type: typeof GENERAL_ENTITY_REFERENCE_PTOKEN = GENERAL_ENTITY_REFERENCE_PTOKEN;

   public readonly open: SToken;

   public readonly openSpace?: SToken;

   public readonly name?: SToken;

   public readonly nameSpace?: SToken;

   public readonly close?: SToken;

   constructor(
      param: GeneralEntityReferencePToken | GeneralEntityReferenceProps,
      other: RawGeneralEntityReferenceProps = {},
   ) {
      this.open = other.open ?? param.open;
      this.openSpace = 'openSpace' in other ? other.openSpace : param.openSpace;
      this.name = 'name' in other ? other.name : param.name;
      this.nameSpace = 'nameSpace' in other ? other.nameSpace : param.nameSpace;
      this.close = 'close' in other ? other.close : param.close;
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

function parseGeneralEntityReference(
   source: STokenSource,
   open: SToken,
   deliverPToken: (pToken: GeneralEntityReferencePToken) => void,
): void {
   const props: GeneralEntityReferenceProps = {
      open,
   };

   source.extractToObject('space', props, 'openSpace');
   source.extractToObject('word', [';'], props, 'name');
   source.extractToObject('space', props, 'nameSpace');
   source.extractToObject('match', ';', props, 'close');
   source.check(() => {
      deliverPToken(new GeneralEntityReferencePToken(props));
   });
}

export {
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   GeneralEntityReferencePToken,
   parseGeneralEntityReference,
};
