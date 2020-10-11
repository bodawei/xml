/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { STokenSource, SToken, strOrBlank } from 'sToken';

import literal, { LiteralPToken } from '../../token/common/literal';

const ALLOWED_TYPES = ['PUBLIC', 'SYSTEM'];
const TYPE_TERMINATORS = ['"', "'"];

interface RawExternalId {
   externalType?: SToken;
   externalTypeSpace?: SToken;
   public?: LiteralPToken;
   publicSpace?: SToken;
   system?: LiteralPToken;
}

class ExternalId {
   public readonly externalType?: SToken;

   public readonly externalTypeSpace?: SToken;

   public readonly public?: LiteralPToken;

   public readonly publicSpace?: SToken;

   public readonly system?: LiteralPToken;

   constructor(source: ExternalId | RawExternalId, other: RawExternalId = {}) {
      this.externalType = 'externalType' in other ? other.externalType : source.externalType;
      this.externalTypeSpace =
         'externalTypeSpace' in other ? other.externalTypeSpace : source.externalTypeSpace;
      this.public = 'public' in other ? other.public : source.public;
      this.publicSpace = 'publicSpace' in other ? other.publicSpace : source.publicSpace;
      this.system = 'system' in other ? other.system : source.system;
   }
}

interface ParsedExternalId {
   externalId?: ExternalId;
   nextPropName?: string;
}

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
   externalId: RawExternalId,
   deliverExtId: (result: ParsedExternalId) => void,
): void {
   source.extract('peekChar', allTerminators, (sToken) => {
      if (strOrBlank(sToken) === '%') {
         deliverExtId({ nextPropName: 'system', externalId: new ExternalId(externalId) });
         return;
      }

      literal.parse(source, undefined, (modifiedPToken) => {
         if (modifiedPToken) {
            externalId.system = modifiedPToken;
         }

         deliverExtId({ externalId: new ExternalId(externalId) });
      });
   });
}

function parsePublic(
   source: STokenSource,
   externalId: RawExternalId,
   allTerminators: Array<string>,
   deliverExtId: (result: ParsedExternalId) => void,
): void {
   source.extract('peekChar', allTerminators, (sToken) => {
      if (strOrBlank(sToken) === '%') {
         deliverExtId({ nextPropName: 'public', externalId: new ExternalId(externalId) });
         return;
      }

      literal.parse(source, undefined, (alternatePToken) => {
         if (!alternatePToken) {
            deliverExtId({ externalId: new ExternalId(externalId) });
            return;
         }

         externalId.public = alternatePToken;
         source.extractToObjectNoParams('space', externalId, 'publicSpace');

         parseSystem(source, allTerminators, externalId, deliverExtId);
      });
   });
}

function parseExternalId(
   source: STokenSource,
   terminators: Array<string>,
   allowPERefs: boolean,
   deliverExtId: (result: ParsedExternalId) => void,
): void {
   const allTerminators = TYPE_TERMINATORS.concat(terminators);
   const extIdPToken: RawExternalId = {};

   source.extract('peekChar', allTerminators, (sToken) => {
      if (strOrBlank(sToken) === '%') {
         deliverExtId({ nextPropName: 'externalType' });
         return;
      }

      source.extract('peekWord', allTerminators, (sToken) => {
         const capitalType = sToken && sToken.str.toUpperCase();

         if (!capitalType || ALLOWED_TYPES.indexOf(capitalType) === -1) {
            deliverExtId({});
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
   });
}

export { ExternalId, parseExternalId };
