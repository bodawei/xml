/* Copyright ® 2019-2020 by 柏大衛. All rights reserved. */

import { SToken, STokenSource } from 'sToken';

import { SectionStart } from './bridge/section';
import {
   ParameterEntityReferencePToken,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
} from './parameterEntityReference';

const CONDITIONAL_PTOKEN = 'CONDITIONAL_PTOKEN';

type DeliverPToken = (pToken: ConditionalPToken) => void;

/**********************************************************************\
 The cdata namespace contains the usual tools for processing
 a Conditional Section element
\**********************************************************************/

type ConditionalProps = {
   open?: SToken;
   openSpace?: SToken;
   sectionType?: SToken;
   peRef?: ParameterEntityReferencePToken;
   peRefPlus?: Array<ParameterEntityReferencePToken>;
   sectionTypeSpace?: SToken;
   bracket?: SToken;
};

type ConditionalCore = ConditionalProps & {
   open: SToken;
};

function arrayOfPERefs(
   candidate: Array<any> | undefined,
): Array<ParameterEntityReferencePToken> | undefined {
   let isGoodArray = true;

   if (!candidate || !Array.isArray(candidate)) {
      return undefined;
   }

   for (const element of candidate) {
      isGoodArray = isGoodArray && element.type === PARAMETER_ENTITY_REFERENCE_PTOKEN;
   }

   return isGoodArray ? candidate.slice(0) : undefined;
}

class ConditionalPToken {
   public readonly type: typeof CONDITIONAL_PTOKEN = CONDITIONAL_PTOKEN;
   public readonly open: SToken;
   public readonly openSpace: SToken | undefined;
   public readonly sectionType: SToken | undefined;
   public readonly peRef: ParameterEntityReferencePToken | undefined;
   public readonly peRefPlus: Array<ParameterEntityReferencePToken> | undefined;
   public readonly sectionTypeSpace: SToken | undefined;
   public readonly bracket: SToken | undefined;

   constructor(
      param: ConditionalPToken | SectionStart | ConditionalCore,
      other: ConditionalProps | undefined = {},
   ) {
      const start = other.open && other.open instanceof SToken ? other.open : undefined;
      this.open = start ? start : param.open;
      this.openSpace = other.openSpace instanceof SToken ? other.openSpace : param.openSpace;
      this.sectionType =
         other.sectionType instanceof SToken ? other.sectionType : param.sectionType;
      this.peRef =
         other.peRef && other.peRef.type === PARAMETER_ENTITY_REFERENCE_PTOKEN
            ? other.peRef
            : param.peRef;
      this.peRefPlus = arrayOfPERefs(other.peRefPlus) || param.peRefPlus;
      this.sectionTypeSpace =
         other.sectionTypeSpace instanceof SToken ? other.sectionTypeSpace : param.sectionTypeSpace;

      if ('bracket' in param && param.bracket instanceof SToken) {
         this.bracket = param.bracket;
      }

      this.bracket = other.bracket instanceof SToken ? other.bracket : this.bracket;
   }
}

/**********************************************************************\
 parseConditionalSection() extracts a conditional section.

 PARAM
 source: An STokenSource to read from
 sectionStart: The parsing up to and including the 'CDATA'
 deliverPToken: Callback to deliver the PToken

 SYNTAX
    [62]  includeSect        ::= '<![' S? 'INCLUDE' S? '[' 
    [63]  ignoreSect         ::= '<![' S? 'IGNORE' S? '[' 
    [63]  ignoreSect         ::= '<![' S? PEReference S? '[' 
\**********************************************************************/

function parseConditional(
   source: STokenSource,
   sectionStart: SectionStart,
   deliverPToken: DeliverPToken,
): void {
   const otherProps: ConditionalProps = {};

   source.extract('match', '[', (sToken) => {
      otherProps.bracket = sToken;
      deliverPToken(new ConditionalPToken(sectionStart, otherProps));
   });
}

export { CONDITIONAL_PTOKEN, ConditionalPToken, parseConditional };
