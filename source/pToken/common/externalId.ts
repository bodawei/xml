/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { STokenSource, SToken, strOrBlank, combineSTokens } from 'sToken';

import literal, { LiteralPToken } from '../../token/common/literal';

const TYPE_TERMINATORS = ['"', "'"];

interface RawExternalId {
   externalType?: SToken;
   externalTypeSpace?: SToken;
   public?: LiteralPToken;
   publicSpace?: SToken;
   system?: LiteralPToken;
}

interface ResumeInternalResult {
   externalId: ExternalIdP | undefined;
   preSpace?: SToken | undefined;
}

class ExternalIdP {
   public readonly externalType?: SToken;

   public readonly externalTypeSpace?: SToken;

   public readonly public?: LiteralPToken;

   public readonly publicSpace?: SToken;

   public readonly system?: LiteralPToken;

   constructor(base: ExternalIdP | RawExternalId, other: RawExternalId = {}) {
      this.externalType = 'externalType' in other ? other.externalType : base.externalType;
      this.externalTypeSpace =
         'externalTypeSpace' in other ? other.externalTypeSpace : base.externalTypeSpace;
      this.public = 'public' in other ? other.public : base.public;
      this.publicSpace = 'publicSpace' in other ? other.publicSpace : base.publicSpace;
      this.system = 'system' in other ? other.system : base.system;

      this.public = !this.public
         ? undefined
         : {
              closeQuote: this.public.closeQuote,
              openQuote: this.public.openQuote,
              value: [...this.public.value],
           };

      this.system = !this.system
         ? undefined
         : {
              closeQuote: this.system.closeQuote,
              openQuote: this.system.openQuote,
              value: [...this.system.value],
           };
   }
}

interface ParsedExternalId {
   externalId?: ExternalIdP;
   nextPropName?: string;
}

function parseExternalType(
   base: STokenSource,
   terminators: Array<string>,
   externalId: ExternalIdP,
   deliverExternalType: (externalId?: ExternalIdP, externalType?: 'PUBLIC' | 'SYSTEM') => void,
): void {
   const newExtId = { ...externalId };
   base.extract('peekWord', terminators, (sToken) => {
      const capitalType = strOrBlank(sToken).toUpperCase();

      if (!capitalType || (capitalType !== 'PUBLIC' && capitalType !== 'SYSTEM')) {
         deliverExternalType();
         return;
      }

      base.extractToObject('word', terminators, newExtId, 'externalType');
      base.extractNoParams('space', (externalTypeSpace) => {
         newExtId.externalTypeSpace = externalTypeSpace;
         deliverExternalType(newExtId, capitalType);
      });
   });
}

function parsePublic(
   base: STokenSource,
   externalId: ExternalIdP,
   deliverPublic: (result: RawExternalId) => void,
): void {
   literal.parse(base, undefined, (publicValue) => {
      const result = { ...externalId, public: publicValue };

      if (!publicValue) {
         deliverPublic(result);
         return;
      }

      base.extractNoParams('space', (space) => {
         result.publicSpace = space;
         deliverPublic(result);
      });
   });
}

function parseSystem(
   base: STokenSource,
   externalId: ExternalIdP,
   deliverSystem: (result: RawExternalId) => void,
): void {
   literal.parse(base, undefined, (system) => {
      deliverSystem({ ...externalId, system });
   });
}

function resumeParse(
   base: STokenSource,
   propName: string,
   preSpace: SToken | undefined,
   externalId: ExternalIdP,
   isSystemType: boolean,
   deliverExtId: (result: ResumeInternalResult) => void,
): void {
   switch (propName) {
      case 'externalType':
         parseExternalType(base, TYPE_TERMINATORS, externalId, (withExtType, extType) => {
            if (!withExtType) {
               deliverExtId({
                  externalId: undefined,
                  preSpace,
               });
               return;
            }

            if (extType === 'PUBLIC') {
               resumeParse(base, 'public', undefined, withExtType, false, (withPublic) => {
                  deliverExtId({
                     externalId: withPublic.externalId,
                     preSpace,
                  });
               });
               return;
            }

            resumeParse(base, 'system', undefined, withExtType, true, (withSystem) => {
               deliverExtId({
                  externalId: withSystem.externalId,
                  preSpace,
               });
            });
         });
         break;
      case 'public':
         parsePublic(base, externalId, (withPublic) => {
            withPublic.externalTypeSpace = combineSTokens(withPublic.externalTypeSpace, preSpace);

            if (!withPublic.public) {
               deliverExtId({
                  externalId: withPublic,
               });
               return;
            }

            resumeParse(base, 'system', undefined, withPublic, false, deliverExtId);
         });
         break;
      case 'system':
         parseSystem(base, externalId, (withSys) => {
            if (isSystemType) {
               withSys.externalTypeSpace = combineSTokens(withSys.externalTypeSpace, preSpace);
            } else {
               withSys.publicSpace = combineSTokens(externalId.publicSpace, preSpace);
            }

            deliverExtId({ externalId: withSys });
         });
         break;
   }
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

function parseExternalId(
   base: STokenSource,
   terminators: Array<string>,
   deliverExtId: (result?: ParsedExternalId) => void,
): void {
   const allTerminators = TYPE_TERMINATORS.concat(terminators);
   const extIdPToken: RawExternalId = {};

   base.extract('peekChar', allTerminators, (sToken) => {
      if (strOrBlank(sToken) === '%') {
         deliverExtId({ nextPropName: 'externalType' });
         return;
      }

      parseExternalType(base, TYPE_TERMINATORS, extIdPToken, (withExtType, extType) => {
         if (!withExtType) {
            deliverExtId();
            return;
         }

         base.extract('peekChar', allTerminators, (sToken) => {
            if (strOrBlank(sToken) === '%') {
               deliverExtId({ nextPropName: extType?.toLowerCase(), externalId: withExtType });
               return;
            }

            if (extType === 'SYSTEM') {
               parseSystem(base, withExtType, (withSystem) => {
                  deliverExtId({ externalId: withSystem });
               });
               return;
            }

            parsePublic(base, withExtType, (withPublic) => {
               if (!withPublic.public) {
                  deliverExtId({ externalId: withPublic });
                  return;
               }

               base.extract('peekChar', allTerminators, (sToken) => {
                  if (strOrBlank(sToken) === '%') {
                     deliverExtId({ nextPropName: 'system', externalId: withPublic });
                     return;
                  }

                  parseSystem(base, withPublic, (withSystem) => {
                     deliverExtId({ externalId: withSystem });
                  });
               });
            });
         });
      });
   });
}

function resumeParseExternalId(
   base: STokenSource,
   propName: string,
   preSpace: SToken | undefined,
   externalId: ExternalIdP = {},
   deliverExtId: (result: ResumeInternalResult) => void,
): void {
   const isSystemType = strOrBlank(externalId.externalType).toUpperCase() === 'SYSTEM';

   resumeParse(base, propName, preSpace, externalId, isSystemType, (parsed) => {
      deliverExtId({
         externalId: parsed.externalId ? new ExternalIdP(parsed.externalId) : undefined,
         preSpace: parsed.preSpace,
      });
   });
}

export { ParsedExternalId, ExternalIdP, parseExternalId, resumeParseExternalId };
