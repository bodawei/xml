/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ErrorCollector } from 'basic';
import { strOrBlank } from 'sToken';
import { WordListPToken } from 'token';

import { ValidateState } from '../validateState';
import { validityConstraint } from '../error/validityConstraint';

const VID = validityConstraint.id;

function notationValidate(
   enumeration: WordListPToken | undefined,
   elName: string,
   attName: string,
   state: ValidateState,
   ec: ErrorCollector,
): void {
   if (!enumeration) {
      return;
   }

   for (const wordEntry of enumeration.words) {
      const wordStr = strOrBlank(wordEntry.word);

      // §3.3.1: Notation Attributes
      //    ...all notation names in the declaration must be declared.
      ec.check(
         !state.notationDeclarations[wordStr],
         VID.ATTLISTDECL_BAD_NOTATION,
         [elName, attName, wordStr],
         wordEntry.word,
      );
   }
}

function attListValidate(state: ValidateState, ec: ErrorCollector): void {
   const attlists = Object.entries(state.attributeDefs);
   const isVer1Ed1 = state.confVer.version !== 1.1 && state.confVer.edition === 1;

   for (const [elName, allAtts] of attlists) {
      const elementDetails = state.elementDeclarations[elName];
      const elType = strOrBlank(elementDetails?.token.contentSpec);
      const elementIsEmpty = elType.toLocaleLowerCase() === 'empty';
      let seenNotationAttr = false;

      if (!allAtts) {
         continue;
      }

      for (const [attName, attInfo] of Object.entries(allAtts)) {
         const isNotation = strOrBlank(attInfo?.def.type).toLowerCase() === 'notation';

         if (isNotation) {
            notationValidate(attInfo?.def.enumeration, elName, attName, state, ec);

            // §3.3.1 (1.0/2+): Validity constraint: One Notation Per Element Type
            //    An element type must not have more than one NOTATION attribute specified
            ec.check(
               seenNotationAttr && !isVer1Ed1,
               VID.ATTLISTDECL_EXTRA_NOTATION,
               [elName, attName],
               attInfo?.def.type,
            );

            seenNotationAttr = true;
         }

         // §3.3.1 (1.0/2+): Validity constraint: No Notation on Empty Element
         //    For compatibility, an attribute of type NOTATION must
         //    not be declared on an element declared EMPTY.
         ec.check(
            elementIsEmpty && isNotation && !isVer1Ed1,
            VID.ATTLISTDECL_EMPTY_NOTATION,
            [elName, attName],
            attInfo?.def.type,
         );
      }
   }
}

function dtdEndValidate(state: ValidateState, ec: ErrorCollector): void {
   attListValidate(state, ec);

   const generalEntityDetails = Object.entries(state.generalEntities);

   for (const [geDeclName, info] of generalEntityDetails) {
      const nDataName = strOrBlank(info?.token.nDataName);

      if (nDataName !== '') {
         const notationDeclared = state.notationDeclarations[nDataName];

         ec.setPos(info?.token.name);
         ec.setPos(info?.token.nDataName);

         /*
          * §4.2.2: Validity constraint: Notation Declared
          *    The Name must match the declared name of a notation.
          */
         ec.check(!notationDeclared, VID.ENTITYDECL_UNDECLARED_NOTATION, [geDeclName, nDataName]);
      }
   }
}

export { dtdEndValidate };
