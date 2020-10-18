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

   constructor(base: ExternalId | RawExternalId, other: RawExternalId = {}) {
      this.externalType = 'externalType' in other ? other.externalType : base.externalType;
      this.externalTypeSpace =
         'externalTypeSpace' in other ? other.externalTypeSpace : base.externalTypeSpace;
      this.public = 'public' in other ? other.public : base.public;
      this.publicSpace = 'publicSpace' in other ? other.publicSpace : base.publicSpace;
      this.system = 'system' in other ? other.system : base.system;
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
   base: A STokenSource to read from
   terminators: An array of characters this should terminate parsing
      of the ID.
   deliverPTokenPart: Callback to deliver the PToken compatible version
\**********************************************************************/

function parseSystem(
   base: STokenSource,
   allTerminators: Array<string>,
   externalId: RawExternalId,
   deliverExtId: (result: ParsedExternalId) => void,
): void {
   base.extract('peekChar', allTerminators, (sToken) => {
      if (strOrBlank(sToken) === '%') {
         deliverExtId({ nextPropName: 'system', externalId: new ExternalId(externalId) });
         return;
      }

      literal.parse(base, undefined, (modifiedPToken) => {
         if (modifiedPToken) {
            externalId.system = modifiedPToken;
         }

         deliverExtId({ externalId: new ExternalId(externalId) });
      });
   });
}

function parsePublic(
   base: STokenSource,
   externalId: RawExternalId,
   allTerminators: Array<string>,
   deliverExtId: (result: ParsedExternalId) => void,
): void {
   base.extract('peekChar', allTerminators, (sToken) => {
      if (strOrBlank(sToken) === '%') {
         deliverExtId({ nextPropName: 'public', externalId: new ExternalId(externalId) });
         return;
      }

      literal.parse(base, undefined, (alternatePToken) => {
         if (!alternatePToken) {
            deliverExtId({ externalId: new ExternalId(externalId) });
            return;
         }

         externalId.public = alternatePToken;
         base.extractToObjectNoParams('space', externalId, 'publicSpace');

         parseSystem(base, allTerminators, externalId, deliverExtId);
      });
   });
}

function parseExternalId(
   base: STokenSource,
   terminators: Array<string>,
   allowPERefs: boolean,
   deliverExtId: (result: ParsedExternalId) => void,
): void {
   const allTerminators = TYPE_TERMINATORS.concat(terminators);
   const extIdPToken: RawExternalId = {};

   base.extract('peekChar', allTerminators, (sToken) => {
      if (strOrBlank(sToken) === '%') {
         deliverExtId({ nextPropName: 'externalType' });
         return;
      }

      base.extract('peekWord', allTerminators, (sToken) => {
         const capitalType = sToken && sToken.str.toUpperCase();

         if (!capitalType || ALLOWED_TYPES.indexOf(capitalType) === -1) {
            deliverExtId({});
            return;
         }

         base.extractToObject('word', allTerminators, extIdPToken, 'externalType');
         base.extractToObjectNoParams('space', extIdPToken, 'externalTypeSpace');

         if (capitalType === 'PUBLIC') {
            parsePublic(base, extIdPToken, allTerminators, deliverExtId);
         } else {
            parseSystem(base, allTerminators, extIdPToken, deliverExtId);
         }
      });
   });
}

export { ExternalId, parseExternalId };
