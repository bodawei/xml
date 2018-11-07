/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { EntityLocation, EntityMetaData } from 'basic';
import { WellFormedError, ErrorCollector } from '../../error';

import entityReference from '../entityReference';
import unassigned from './unassigned';

import literal, { LiteralPToken } from './literal';
import { textOrBlank } from './misc';
import { STokenSource, SToken } from 'sToken';
import { UnassignedArray } from './unassigned';

/**********************************************************************\
 The externalId namespace has routines for processing external ID's
 as found in ENTITY, DOCTYPE, and NOTATION declarations.

 This include parsing, validating and turning into a form ready for
 insertion into a token.
\**********************************************************************/

const WFEID = WellFormedError.ID;
const EXTERNAL_ID = 'EXTERNAL_ID';
const ALLOWED_TYPES = [ 'PUBLIC', 'SYSTEM' ];
const TYPE_TERMINATORS = [ '"', '\'' ];
const PUBID_CHARS = /^[- \n\'\(\)\+,\.\/:=\?;!\*#@$_%a-zA-Z0-9]*/;

type ExternalId = {
   type: string,
   public?: LiteralPToken,
   system?: LiteralPToken,
   unassigned?: UnassignedArray,
   extra?: UnassignedArray,
   nextPropName?: string,
   idType?: SToken,
   __bogusWorkaround?: SToken,
   postIdTypeSpace?: SToken,
   postPublicSpace?: SToken,
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

function parse(source: STokenSource, terminators: Array<string>, deliverExtId: (result?: ExternalId) => void) {
   const allTerminators = TYPE_TERMINATORS.concat(terminators);
   const extIdPToken = {
      type: EXTERNAL_ID,
   };

   const callback = unassigned.makeCheckCallback(extIdPToken, 'idType', deliverExtId, (result?: ExternalId) => {
      source.extract('peekWord', allTerminators, (sToken) => {
         const capitalType = sToken && sToken.str.toLocaleUpperCase();

         if (!capitalType || ALLOWED_TYPES.indexOf(capitalType) === -1) {
            deliverExtId();
            return;
         }

         source.extractToObject('word', allTerminators, extIdPToken, 'idType');
         source.extractToObjectNoParams('space', extIdPToken, 'postIdTypeSpace');

         if (capitalType === 'PUBLIC') {
            parsePublic(source, extIdPToken, allTerminators, deliverExtId);
         } else {
            parseSystem(source, allTerminators, extIdPToken, deliverExtId);
         }
      });
   });

   unassigned.checkForPERef(source, callback);
}

function parsePublic(source: STokenSource, extIdPToken: ExternalId, allTerminators: Array<string>, deliverExtId: (result?: ExternalId) => void) {
   const callback = unassigned.makeCheckCallback(extIdPToken, 'public', deliverExtId, () => {
      const temp: LiteralPToken = {
         value: [],
      };

      literal.parse(source, {
         pToken: temp,
      }, (alternatePToken) => {
         if (!alternatePToken) {
            deliverExtId(extIdPToken);
            return;
         }

         extIdPToken.public = temp;
         source.extractToObjectNoParams('space', extIdPToken, 'postPublicSpace');

         parseSystem(source, allTerminators, extIdPToken, deliverExtId);
      });
   });

   unassigned.checkForPERef(source, callback);
}

function parseSystem(source: STokenSource, allTerminators: Array<string>, extIdPToken: ExternalId, deliverExtId: (result?: ExternalId) => void) {
   const callback = unassigned.makeCheckCallback(extIdPToken, 'system', deliverExtId, () => {
      source.extract('peekWord', allTerminators, (nData) => {
         if (nData && nData.str.toLocaleUpperCase() === 'NDATA') {
            deliverExtId(extIdPToken);
            return;
         }

         const temp: LiteralPToken = {
            value: [],
         };
         literal.parse(source, {
            pToken: temp,
         }, (modifiedPToken) => {
            if (modifiedPToken) {
               extIdPToken.system = temp;
            }

            deliverExtId(extIdPToken);
         });
      });
   });

   unassigned.checkForPERef(source, callback);
}

function assignUnassigned(externalId: ExternalId, prevContainer?: { [key: string]: any }, prevSpacePropName?: string) {
   const unValues = externalId.unassigned || [];
   const descriptors = [
      { name: 'idType', type: 'word', allowed: /public|system/i },
      { name: 'postIdTypeSpace', type: 'space' },
   ];

   if (!externalId.unassigned || unValues.length === 0) {
      delete externalId.unassigned;
      delete externalId.nextPropName;
      return;
   }

   const unexpandedRef = unValues.filter((item) => (item.type === 'reference'));

   if (unexpandedRef.length !== 0) {
      return;
   }

   if (prevContainer && prevSpacePropName) {
      descriptors.unshift({ name: '__bogusWorkaround', type: 'space' });
   }

   const nextPropName = externalId.nextPropName || 'idType';
   unassigned.assignToProps(externalId.unassigned, externalId, nextPropName, descriptors);

   if (externalId.__bogusWorkaround) {
      if (prevContainer![prevSpacePropName!]) {
         prevContainer![prevSpacePropName!].merge(externalId.__bogusWorkaround);
      } else {
         prevContainer![prevSpacePropName!] = externalId.__bogusWorkaround;
      }
   }

   const idType = externalId.idType && externalId.idType.str.toLocaleUpperCase();

   switch (idType) {
      case 'SYSTEM':
         unassigned.assignToProps(externalId.unassigned, externalId, 'system', [
            { name: 'postIdTypeSpace', type: 'space' },
            { name: 'system', type: 'literal' },
         ]);
         break;
      case 'PUBLIC':
         unassigned.assignToProps(externalId.unassigned, externalId, 'public', [
            { name: 'postIdTypeSpace', type: 'space' },
            { name: 'public', type: 'literal' },
            { name: 'postPublicSpace', type: 'space' },
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

/**********************************************************************\
 checkWellFormed() does a well formed check on the pTokenPart value, and
 reports any error through the error collector.

 PARAM
   pTokenPart: A PToken-compatible externalId as produced, above
   ec: An ErrorCollector instance.
\**********************************************************************/

function checkWellFormed(pTokenPart: ExternalId | void, ec: ErrorCollector, entityMetaData: EntityMetaData) {
   if (!pTokenPart || pTokenPart.unassigned) {
      return;
   }

   ec.setPos(pTokenPart.idType);
   const typeText = textOrBlank(pTokenPart.idType);
   const capitalType = typeText.toLocaleUpperCase();
   ec.check(ALLOWED_TYPES.indexOf(capitalType) === -1, WFEID.EXTERNALID_UNKNOWN, [ typeText ]);
   ec.check(typeText !== capitalType, WFEID.EXTERNALID_INVALID_CASE, [ capitalType, typeText ]);

   ec.setPos(pTokenPart.postIdTypeSpace);
   ec.check(!pTokenPart.postIdTypeSpace, WFEID.EXTERNALID_IDTYPE_NO_SPACE);

   if (capitalType === 'PUBLIC') {
      literal.checkWellFormed(pTokenPart.public, ec, entityMetaData, WFEID.NOUN_EXTERNALID_PUBLIC, () => {
         if (!pTokenPart.public || !pTokenPart.public.value) {
            return;
         }
         const match = PUBID_CHARS.exec(pTokenPart.public.value[0].str);
         ec.check(!match || match[0] !== pTokenPart.public.value[0].str, WFEID.EXTERNALID_PUBLIC_INVALID_CHARS,
                  [ pTokenPart.public.value[0].str[match![0].length] ]);
      });
   }

   if (capitalType === 'SYSTEM' || pTokenPart.system) {
      if (pTokenPart.public && pTokenPart.public.value) {
         ec.setPos(pTokenPart.postPublicSpace);
         ec.check(!pTokenPart.postPublicSpace, WFEID.EXTERNALID_SYSTEM_NO_LEADING_SPACE);
      }

      literal.checkWellFormed(pTokenPart.system, ec, entityMetaData, WFEID.NOUN_EXTERNALID_SYSTEM);
   }

   unassigned.checkExtra(pTokenPart.extra, ec, WFEID.EXTERNALID_EXTRA_TEXT);
}

/**********************************************************************\
 makeEntityLocation() converts a pTokenPart value into a form that
 can be inserted into a token.
\**********************************************************************/

function makeEntityLocation(pTokenPart: ExternalId | void) {
   if (!pTokenPart || pTokenPart.unassigned) {
      return;
   }

   const value = (pTokenPart.system && pTokenPart.system.value) ?
      pTokenPart.system.value[0].text.str : undefined;
   const publicValue = (pTokenPart.public && pTokenPart.public.value) ?
      pTokenPart.public.value[0].text.str : undefined;

   return new EntityLocation(value, publicValue);
}

function getSTokens(pTokenPart?: ExternalId) {
   let results = [];
   if (!pTokenPart) {
      return [];
   }

   results.push(pTokenPart.idType);
   results.push(pTokenPart.postIdTypeSpace);

   results = results.concat(literal.getSTokens(pTokenPart.public));
   results.push(pTokenPart.postPublicSpace);
   results = results.concat(literal.getSTokens(pTokenPart.system));

   return results.filter(item => item);
}

const externalId = {
   PTYPE: EXTERNAL_ID,
   parse,
   assignUnassigned,
   getSTokens,
   checkWellFormed,
   makeEntityLocation,
};

export default externalId;

export { 
   ExternalId,
};