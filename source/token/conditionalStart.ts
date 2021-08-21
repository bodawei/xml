/* Copyright ® 2019-2021 by 柏大衛. All rights reserved. */

import { parseParameterEntityReference, ParameterEntityReferencePToken } from 'pToken';
import { combineSTokens, SToken, STokenSource } from 'sToken';

import { SectionStart } from './bridge/section';

const CONDITIONAL_START_PTOKEN = 'CONDITIONAL_START_PTOKEN';

type DeliverPToken = (pToken: ConditionalStartPToken) => void;

/**********************************************************************\
 The cdata namespace contains the usual tools for processing
 a Conditional Section element
\**********************************************************************/

interface ConditionalProps {
   open?: SToken;
   openSpace?: SToken;
   sectionType?: SToken;
   unexpanded?: {
      peRef: ParameterEntityReferencePToken;
      propName: string;
      secondPropName?: string;
      includedBracket?: boolean;
   };
   sectionTypeSpace?: SToken;
   bracket?: SToken;
}

type ConditionalCore = ConditionalProps & {
   open: SToken;
};

function isUnexpanded(
   candidate: ConditionalStartPToken | SectionStart | ConditionalCore,
): candidate is ConditionalCore {
   return 'unexpanded' in candidate;
}

class ConditionalStartPToken {
   public readonly type: typeof CONDITIONAL_START_PTOKEN = CONDITIONAL_START_PTOKEN;

   public readonly open: SToken;

   public readonly openSpace: SToken | undefined;

   public readonly sectionType: SToken | undefined;

   public readonly unexpanded?: {
      readonly peRef: ParameterEntityReferencePToken;
      readonly propName: string;
      readonly secondPropName?: string;
      readonly includedBracket?: boolean;
   };

   public readonly sectionTypeSpace: SToken | undefined;

   public readonly bracket: SToken | undefined;

   constructor(
      param: ConditionalStartPToken | SectionStart | ConditionalCore,
      other: ConditionalProps | undefined = {},
   ) {
      const start = other.open && other.open instanceof SToken ? other.open : undefined;
      this.open = start ? start : param.open;
      this.openSpace = other.openSpace instanceof SToken ? other.openSpace : param.openSpace;
      this.sectionType =
         other.sectionType instanceof SToken ? other.sectionType : param.sectionType;

      if (isUnexpanded(param)) {
         this.unexpanded = other.unexpanded || param.unexpanded;
      } else {
         this.unexpanded = other.unexpanded;
      }

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

   source.extractNoParams('peekChar', (charSToken) => {
      if (charSToken && charSToken.str === '%') {
         parseParameterEntityReference(source, (result) => {
            const extra = !result
               ? {}
               : {
                    unexpanded: {
                       peRef: result,
                       propName: 'bracket',
                    },
                 };

            deliverPToken(new ConditionalStartPToken(sectionStart, extra));
         });
      } else {
         source.extract('match', '[', (sToken) => {
            otherProps.bracket = sToken;
            deliverPToken(new ConditionalStartPToken(sectionStart, otherProps));
         });
      }
   });
}

function resumeParseConditional(
   source: STokenSource,
   oldConditional: ConditionalStartPToken,
   deliverPToken: DeliverPToken,
): void {
   const newCond: ConditionalProps = {
      ...oldConditional,
   };

   if (!oldConditional.unexpanded) {
      deliverPToken(new ConditionalStartPToken(oldConditional));
      return;
   }
   const peRef = oldConditional.unexpanded.peRef;

   if (
      oldConditional.unexpanded.propName === 'sectionType' &&
      !oldConditional.unexpanded.secondPropName
   ) {
      source.extractNoParams('space', (openSpace) => {
         source.extractToObject('word', ['[', '>'], newCond, 'sectionType');
         source.extractToObject('space', newCond, 'sectionTypeSpace');
         source.extract('match', '[', (sToken) => {
            newCond.unexpanded = {
               peRef,
               propName: 'sectionType',
            };
            if (!sToken) {
               newCond.unexpanded.secondPropName = 'bracket';
            }
            newCond.openSpace = combineSTokens(newCond.openSpace, openSpace);
            newCond.bracket = sToken;
            deliverPToken(new ConditionalStartPToken(oldConditional, newCond));
         });
      });
   } else if (
      oldConditional.unexpanded.propName === 'bracket' ||
      oldConditional.unexpanded.secondPropName === 'bracket'
   ) {
      source.extractNoParams('space', (sectionTypeSpace) => {
         source.extract('match', '[', (sToken) => {
            newCond.sectionTypeSpace = combineSTokens(newCond.sectionTypeSpace, sectionTypeSpace);
            newCond.bracket = sToken;
            deliverPToken(new ConditionalStartPToken(oldConditional, newCond));
         });
      });
   }
}

export {
   CONDITIONAL_START_PTOKEN,
   ConditionalStartPToken,
   parseConditional,
   resumeParseConditional,
};
