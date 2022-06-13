/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { Collector, strOrBlank } from 'basic';
import { WordListPToken } from 'token';

import { ValidityState } from '../common/validityState';
import { validityErrorCodes } from '../error/validityErrorCodes';

const VID = validityErrorCodes.id;

function notationValidate(
   enumeration: WordListPToken | undefined,
   elName: string,
   attName: string,
   state: ValidityState,
   ec: Collector,
): void {
   if (!enumeration) {
      return;
   }

   for (const wordEntry of enumeration.words) {
      const wordStr = strOrBlank(wordEntry.word);

      // §3.3.1: Notation Attributes
      //    ...all notation names in the declaration must be declared.
      ec.check(
         !state.notations[wordStr],
         VID.ATTLISTDECL_ATT_NOTATION_NO_DECLARATION,
         [elName, attName, wordStr],
         wordEntry.word,
      );
   }
}

function attListValidate(state: ValidityState, ec: Collector): void {
   const attlists = Object.entries(state.attributes);
   const isVer1Ed1 = state.confVer.version !== 1.1 && state.confVer.edition === 1;

   for (const [elName, allAtts] of attlists) {
      const elementDetails = state.elements[elName];
      const elType = strOrBlank(elementDetails?.token?.contentSpec);
      const elementIsEmpty = elType.toLocaleLowerCase() === 'empty';
      let seenNotationAttr = false;
      let firstIdAtt: string | undefined;

      if (!allAtts) {
         continue;
      }

      for (const [attName, attInfo] of Object.entries(allAtts)) {
         const isNotation = strOrBlank(attInfo?.def.type).toLowerCase() === 'notation';
         const isId = strOrBlank(attInfo?.def.type).toLowerCase() === 'id';

         if (isNotation) {
            notationValidate(attInfo?.def.enumeration, elName, attName, state, ec);

            // §3.3.1 (1.0/2+): Validity constraint: One Notation Per Element Type
            //    An element type must not have more than one NOTATION attribute specified
            ec.check(
               seenNotationAttr && !isVer1Ed1,
               VID.ATTLISTDECL_ATT_XTRA_NOTATION,
               [elName, attName],
               attInfo?.def.type,
            );

            seenNotationAttr = true;
         }

         if (isId) {
            // §3.3.1: Validity constraint: One ID per Element Type
            //    An element type must not have more than one ID attribute specified.
            ec.check(
               firstIdAtt,
               VID.ATTLISTDECL_ATT_XTRA_ID,
               [elName, attName, firstIdAtt as string],
               attInfo?.def.type,
            );
            firstIdAtt = firstIdAtt ?? attName;
         }

         // §3.3.1 (1.0/2+): Validity constraint: No Notation on Empty Element
         //    For compatibility, an attribute of type NOTATION must
         //    not be declared on an element declared EMPTY.
         ec.check(
            elementIsEmpty && isNotation && !isVer1Ed1,
            VID.ATTLISTDECL_ATT_INVALID_NOTATION_ON_EMPTY,
            [elName, attName],
            attInfo?.def.type,
         );
      }
   }
}

function docTypeEndValidate(state: ValidityState, coll: Collector): void {
   attListValidate(state, coll);

   const generalEntityDetails = Object.entries(state.generalEntities);

   for (const [geDeclName, info] of generalEntityDetails) {
      const nDataName = strOrBlank(info?.token.nDataName);

      if (nDataName !== '') {
         const notationDeclared = state.notations[nDataName];

         coll.setPos(info?.token.name);
         coll.setPos(info?.token.nDataName);

         /*
          * §4.2.2: Validity constraint: Notation Declared
          *    The Name must match the declared name of a notation.
          */
         coll.check(!notationDeclared, VID.ENTITYDECL_NO_NOTATION_DECLARATION, [
            geDeclName,
            nDataName,
         ]);
      }
   }
}

export { docTypeEndValidate };
