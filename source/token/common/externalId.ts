/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { EntityLocation, EntityMetaData } from 'basic';
import { WellFormedError, ErrorCollector } from 'error';
import { strOrBlank, STokenSource, SToken } from 'sToken';

import literal, { LiteralPToken } from './literal';
import unassigned from './unassigned';
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
   deliverExtId: (result?: ProtoExternalId) => void,
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

function parse(
   source: STokenSource,
   terminators: Array<string>,
   deliverExtId: (result?: ExternalId) => void,
): void {
   const allTerminators = TYPE_TERMINATORS.concat(terminators);
   const extIdPToken: ExternalId = {
      type: EXTERNAL_ID,
      peRefPlus: [],
   };

   const callback = unassigned.makeCheckCallback(
      extIdPToken,
      'externalType',
      deliverExtId,
      (result?: ExternalId) => {
         source.extract('peekWord', allTerminators, (sToken) => {
            const capitalType = sToken && sToken.str.toLocaleUpperCase();

            if (!capitalType || ALLOWED_TYPES.indexOf(capitalType) === -1) {
               deliverExtId();
               return;
            }

            source.extractToObject('word', allTerminators, extIdPToken, 'externalType');
            source.extractToObjectNoParams('space', extIdPToken, 'externalTypeSpace');

            if (capitalType === 'PUBLIC') {
               parsePublic(source, extIdPToken, allTerminators, deliverExtId);
            } else {
               parseSystem(source, allTerminators, extIdPToken, deliverExtId);
            }
         });
      },
   );

   unassigned.checkForPERef(source, callback);
}
function assignUnassigned(
   externalId: ExternalId,
   prevContainer?: { [key: string]: any },
   prevSpacePropName?: string,
): void {
   const unValues = externalId.unassigned || [];
   const descriptors = [
      { name: 'externalType', type: 'word', allowed: /public|system/i },
      { name: 'externalTypeSpace', type: 'space' },
   ];

   if (!externalId.unassigned || unValues.length === 0) {
      delete externalId.unassigned;
      delete externalId.nextPropName;
      return;
   }

   const unexpandedRef = unValues.filter((item) => item.type === 'reference');

   if (unexpandedRef.length !== 0) {
      return;
   }

   if (prevContainer && prevSpacePropName) {
      descriptors.unshift({ name: '__bogusWorkaround', type: 'space' });
   }

   const nextPropName = externalId.nextPropName || 'externalType';
   unassigned.assignToProps(externalId.unassigned, externalId, nextPropName, descriptors);

   if (externalId.__bogusWorkaround) {
      if (prevContainer![prevSpacePropName!]) {
         prevContainer![prevSpacePropName!].merge(externalId.__bogusWorkaround);
      } else {
         prevContainer![prevSpacePropName!] = externalId.__bogusWorkaround;
      }
   }

   const externalType = externalId.externalType && externalId.externalType.str.toLocaleUpperCase();

   switch (externalType) {
      case 'SYSTEM':
         unassigned.assignToProps(externalId.unassigned, externalId, 'system', [
            { name: 'externalTypeSpace', type: 'space' },
            { name: 'system', type: 'literal' },
         ]);
         break;
      case 'PUBLIC':
         unassigned.assignToProps(externalId.unassigned, externalId, 'public', [
            { name: 'externalTypeSpace', type: 'space' },
            { name: 'public', type: 'literal' },
            { name: 'publicSpace', type: 'space' },
            { name: 'system', type: 'literal' },
         ]);
         break;
   }

   if (unValues.length !== 0) {
      externalId.extra = externalId.unassigned;
   }

   delete externalId.__bogusWorkaround;
   delete externalId.nextPropName;
   delete externalId.unassigned;
}

function assignUnassignedNew(
   unassigned: UnassignedArray,
   prevContainer: { [key: string]: any },
   prevSpacePropName?: string,
): void {
   const eId: ExternalId = (prevContainer && prevContainer.externalId) || { type: EXTERNAL_ID };

   eId.unassigned = unassigned;
   assignUnassigned(eId, prevContainer, prevSpacePropName);
   delete eId.unassigned;
   delete eId.extra;
   delete eId.type;

   if (Object.keys(eId).length > 1) {
      prevContainer.externalId = eId;
   }
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
   if (!pTokenPart || pTokenPart.unassigned) {
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

   unassigned.checkExtra(pTokenPart.extra, ec, WFEID.EXTERNALID_EXTRA_TEXT);
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

const externalId = {
   PTYPE: EXTERNAL_ID,
   parse,
   assignUnassigned,
   assignUnassignedNew,
   getSTokens,
   checkWellFormed,
   makeEntityLocation,
};

export default externalId;

export { EXTERNAL_ID, ExternalId };
