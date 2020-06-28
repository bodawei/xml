/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { EntityLocation, EntityMetaData } from 'basic';
import { WellFormedError, ErrorCollector } from 'error';
import { strOrBlank, STokenSource, SToken } from 'sToken';

import literal, { LiteralPToken } from './literal';
import unassigned, { UnassignedType } from './unassigned';
import { UnassignedArray } from './unassigned';
import { TEXT_PTOKEN } from '../text';

/**********************************************************************\
 The externalId namespace has routines for processing external ID's
 as found in ENTITY, DOCTYPE, and NOTATION declarations.

 This include parsing, validating and turning into a form ready for
 insertion into a token.
\**********************************************************************/

const WFEID = WellFormedError.ID;
const EXTERNAL_ID = 'EXTERNAL_ID';
const ALLOWED_TYPES = ['PUBLIC', 'SYSTEM'];
const TYPE_TERMINATORS = ['"', "'"];
const PUBID_CHARS = /^[- \n'()+,./:=?;!*#@$_%a-zA-Z0-9]*/;

type ProtoExternalId = {
   type: string;
   externalType?: SToken;
   externalTypeSpace?: SToken;
   public?: LiteralPToken;
   publicSpace?: SToken;
   system?: LiteralPToken;

   peRefPlus: UnassignedArray;
   unassigned?: UnassignedArray;
   extra?: UnassignedArray;
   nextPropName?: string;
   __bogusWorkaround?: SToken;
};

type ExternalId = ProtoExternalId;

type ParsedExternalId = {
   externalId?: ExternalId;
   peRefPlus: UnassignedArray;
   nextPropName?: string;
};

type AssignResult = {
   preSpace?: SToken;
   externalId?: ExternalId;
   unassigned: UnassignedArray;
};

/**********************************************************************\
 parse() tries to extract an ExternalID or a PublicID from
 the current position in the STokenSource.

 SYNTAX
   [75] ExternalID    ::= 'SYSTEM' S SystemLiteral |
                           'PUBLIC' S PubidLiteral S SystemLiteral
   [83] PublicID      ::= 'PUBLIC' S PubidLiteral
   [11] SystemLiteral ::= ('"' [^"]* '"') | ("'" [^']* "'")
   [12] PubidLiteral  ::= '"' PubidChar* '"' |
                           "'" (PubidChar - "'")* "'"
   [13] PubidChar     ::= #x20 | #xD | #xA | [a-zA-Z0-9] |
                           [-'()+,./:=?;!*#@$_%]
 PARAM
   source: A STokenSource to read from
   terminators: An array of characters this should terminate parsing
      of the ID.
   deliverPTokenPart: Callback to deliver the PToken compatible version
\**********************************************************************/

function parseSystem(
   source: STokenSource,
   allTerminators: Array<string>,
   extIdPToken: ProtoExternalId,
   deliverExtId: (result?: ExternalId) => void,
): void {
   const callback = unassigned.makeCheckCallback(extIdPToken, 'system', deliverExtId, () => {
      source.extract('peekWord', allTerminators, (nData) => {
         if (nData && nData.str.toLocaleUpperCase() === 'NDATA') {
            deliverExtId(extIdPToken);
            return;
         }

         const temp: LiteralPToken = {
            value: [],
         };
         literal.parse(
            source,
            {
               pToken: temp,
            },
            (modifiedPToken) => {
               if (modifiedPToken) {
                  extIdPToken.system = temp;
               }

               deliverExtId(extIdPToken);
            },
         );
      });
   });

   unassigned.checkForPERef(source, callback);
}

function parsePublic(
   source: STokenSource,
   extIdPToken: ExternalId,
   allTerminators: Array<string>,
   deliverExtId: (result?: ExternalId) => void,
): void {
   const callback = unassigned.makeCheckCallback(extIdPToken, 'public', deliverExtId, () => {
      const temp: LiteralPToken = {
         value: [],
      };

      literal.parse(
         source,
         {
            pToken: temp,
         },
         (alternatePToken) => {
            if (!alternatePToken) {
               deliverExtId(extIdPToken);
               return;
            }

            extIdPToken.public = temp;
            source.extractToObjectNoParams('space', extIdPToken, 'publicSpace');

            parseSystem(source, allTerminators, extIdPToken, deliverExtId);
         },
      );
   });

   unassigned.checkForPERef(source, callback);
}

function parseExternalId(
   source: STokenSource,
   terminators: Array<string>,
   allowPERefs: boolean,
   deliverExtId: (result: ParsedExternalId) => void,
): void {
   const allTerminators = TYPE_TERMINATORS.concat(terminators);
   const extIdPToken: ExternalId = {
      type: EXTERNAL_ID,
      peRefPlus: [],
   };

   function convertReturn(externalId?: ExternalId): void {
      if (!externalId) {
         return deliverExtId({ peRefPlus: [] });
      }

      const result: ParsedExternalId = {
         externalId: externalId,
         peRefPlus: externalId.peRefPlus,
      };

      if (externalId.nextPropName) {
         result.nextPropName = externalId.nextPropName;
      }

      deliverExtId(result);
   }

   const callback = unassigned.makeCheckCallback(extIdPToken, 'externalType', convertReturn, () => {
      source.extract('peekWord', allTerminators, (sToken) => {
         const capitalType = sToken && sToken.str.toLocaleUpperCase();

         if (!capitalType || ALLOWED_TYPES.indexOf(capitalType) === -1) {
            deliverExtId({ peRefPlus: [] });
            return;
         }

         source.extractToObject('word', allTerminators, extIdPToken, 'externalType');
         source.extractToObjectNoParams('space', extIdPToken, 'externalTypeSpace');

         if (capitalType === 'PUBLIC') {
            parsePublic(source, extIdPToken, allTerminators, convertReturn);
         } else {
            parseSystem(source, allTerminators, extIdPToken, convertReturn);
         }
      });
   });

   unassigned.checkForPERef(source, callback);
}

function assignExternalIdUnssigned(
   externalId: ExternalId | undefined,
   unassignedValues: UnassignedArray,
   nextPropName: string | undefined = 'externalType',
): AssignResult {
   const newExternalId: ProtoExternalId = { type: EXTERNAL_ID, peRefPlus: [], ...externalId };
   const descriptors = [
      { name: 'externalType', type: 'word', allowed: /public|system/i },
      { name: 'externalTypeSpace', type: 'space' },
   ];

   // Do not continue processing if we have no values, or there are unexpanded references.
   if (unassignedValues.length === 0) {
      return { unassigned: unassignedValues };
   }

   for (const value of unassignedValues) {
      if (value.type === UnassignedType.REFERENCE) {
         return { unassigned: unassignedValues };
      }
   }

   if (nextPropName === 'externalType') {
      descriptors.unshift({ name: 'preSpace', type: 'space' });
   }

   unassigned.assignToProps(unassignedValues, newExternalId, nextPropName, descriptors);

   const externalType = strOrBlank(newExternalId.externalType).toLocaleUpperCase();

   switch (externalType) {
      case 'SYSTEM':
         unassigned.assignToProps(unassignedValues, newExternalId, 'system', [
            { name: 'externalTypeSpace', type: 'space' },
            { name: 'system', type: 'literal' },
         ]);
         break;
      case 'PUBLIC':
         unassigned.assignToProps(unassignedValues, newExternalId, 'public', [
            { name: 'externalTypeSpace', type: 'space' },
            { name: 'public', type: 'literal' },
            { name: 'publicSpace', type: 'space' },
            { name: 'system', type: 'literal' },
         ]);
         break;
   }

   const result = {
      externalId: newExternalId,
      unassigned: unassignedValues,
   };

   if ((newExternalId as any).preSpace) {
      (result as any).preSpace = (newExternalId as any).preSpace;
   }

   delete (newExternalId as any).preSpace;

   return result;
}

/**********************************************************************\
 checkWellFormed() does a well formed check on the pTokenPart value, and
 reports any error through the error collector.

 PARAM
   pTokenPart: A PToken-compatible externalId as produced, above
   ec: An ErrorCollector instance.
\**********************************************************************/

function checkWellFormed(
   pTokenPart: ExternalId | void,
   ec: ErrorCollector,
   entityMetaData: EntityMetaData,
): void {
   if (!pTokenPart) {
      return;
   }

   ec.setPos(pTokenPart.externalType);
   const typeText = strOrBlank(pTokenPart.externalType);
   const capitalType = typeText.toLocaleUpperCase();
   ec.check(ALLOWED_TYPES.indexOf(capitalType) === -1, WFEID.EXTERNALID_UNKNOWN, [typeText]);
   ec.check(typeText !== capitalType, WFEID.EXTERNALID_INVALID_CASE, [capitalType, typeText]);

   ec.setPos(pTokenPart.externalTypeSpace);
   ec.check(!pTokenPart.externalTypeSpace, WFEID.EXTERNALID_EXTERNALTYPE_NO_SPACE);

   if (capitalType === 'PUBLIC') {
      // This is very fragile if there is no value.
      literal.checkWellFormed(
         pTokenPart.public,
         ec,
         entityMetaData,
         WFEID.NOUN_EXTERNALID_PUBLIC,
         () => {
            if (!pTokenPart.public || !pTokenPart.public.value) {
               return;
            }
            let sToken;

            // we are so confused
            if (pTokenPart.public.value.length > 0) {
               if (pTokenPart.public.value[0].type === TEXT_PTOKEN) {
                  sToken = (pTokenPart.public.value[0] as any).text; //typeHack
               } else {
                  sToken = (pTokenPart.public.value[0] as any).str;
               }

               const match = PUBID_CHARS.exec(sToken.str);

               ec.check(!match || match[0] !== sToken.str, WFEID.EXTERNALID_PUBLIC_INVALID_CHARS, [
                  sToken.str[match![0].length],
               ]);
            }
         },
      );
   }

   if (capitalType === 'SYSTEM' || pTokenPart.system) {
      if (pTokenPart.public && pTokenPart.public.value) {
         ec.setPos(pTokenPart.publicSpace);
         ec.check(!pTokenPart.publicSpace, WFEID.EXTERNALID_SYSTEM_NO_LEADING_SPACE);
      }

      literal.checkWellFormed(pTokenPart.system, ec, entityMetaData, WFEID.NOUN_EXTERNALID_SYSTEM);
   }
}

/**********************************************************************\
 makeEntityLocation() converts a pTokenPart value into a form that
 can be inserted into a token.
\**********************************************************************/

function makeEntityLocation(pTokenPart: ExternalId | void): EntityLocation | undefined {
   if (!pTokenPart || pTokenPart.unassigned) {
      return;
   }

   const value =
      pTokenPart.system && pTokenPart.system.value && pTokenPart.system.value.length > 0
         ? (pTokenPart.system.value[0] as any).text.str
         : undefined; // typeHack
   const publicValue =
      pTokenPart.public && pTokenPart.public.value && pTokenPart.public.value.length > 0
         ? (pTokenPart.public.value[0] as any).text.str
         : undefined; // typeHack

   return new EntityLocation(value, publicValue);
}

function getSTokens(pTokenPart?: ExternalId): Array<SToken> {
   let results: Array<SToken | undefined> = [];
   if (!pTokenPart) {
      return [];
   }

   results.push(pTokenPart.externalType);
   results.push(pTokenPart.externalTypeSpace);

   results = results.concat(literal.getSTokens(pTokenPart.public));
   results.push(pTokenPart.publicSpace);
   results = results.concat(literal.getSTokens(pTokenPart.system));

   return results.filter((item) => item) as any;
}

const checkExternalIdWellFormed = checkWellFormed;

export {
   EXTERNAL_ID,
   ExternalId,
   parseExternalId,
   assignExternalIdUnssigned,
   getSTokens,
   checkExternalIdWellFormed,
   makeEntityLocation,
};
