/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector } from 'basic';
import { strOrBlank, STokenArrayBuilder, SToken, STokenSource } from 'sToken';
import {  WellFormedError } from '../wellformedness/error/WellFormedError';

import { ExternalId, parseExternalId, checkExternalIdWellFormed, getSTokens } from './common/externalId';
import declaration, { DeclarationPToken } from './bridge/baseDeclaration';
import misc from './common/misc';
import { ExternalIdX } from 'xToken';

const WFEID = WellFormedError.ID;
const DOCTYPE_START_PTOKEN = 'DOCTYPE_START_PTOKEN';
const DOCTYPE_START_XTOKEN = 'DOCTYPE_START_XTOKEN';

/**********************************************************************\
 The docTypeStart namespace contains the Token class, parser, validator
 and tokenizer for the start of a DOCTYPE token.

 The overall architecture of the system is that because the DOCTYPE
 declaration could be megabytes long (if there is a big internal
 subset) it makes some sense to treat the start of the DOCTYPE as one
 token and the end as a separate. This also makes "streaming" the
 internal subset easier since this does not need to worry about
 whether the end of the declaration is sound before the start of the
 internal subset can be delivered.

 Because of this, the items in this namespace merely process up to the
 "[" that opens the internal subset, or at least up to where that would
 be in the case that there is no internal subset.
\**********************************************************************/

type PreToken = { open: SToken; [ other: string ]: any };

class DocTypeStartXToken {
   public readonly type: typeof DOCTYPE_START_XTOKEN = DOCTYPE_START_XTOKEN;
   public readonly name: string;
   public readonly externalId: ExternalIdX | undefined;
   public readonly hasInternalSubset: boolean;
   public pToken?: DocTypeStartPToken;

   constructor(name: string, externalId: ExternalIdX | undefined, hasInternalSubset: boolean, pToken?: DocTypeStartPToken) {
      this.name = name;
      this.externalId = externalId;
      this.hasInternalSubset = hasInternalSubset;
      this.pToken = pToken;
   }

}

class DocTypeStartPToken {
   public readonly type: typeof DOCTYPE_START_PTOKEN = DOCTYPE_START_PTOKEN;
   public readonly open: SToken;
   public readonly postOpenSpace?: SToken;
   public readonly declType?: SToken;
   public readonly postDeclTypeSpace?: SToken;
   public readonly name?: SToken;
   public readonly nameSpace?: SToken;
   public readonly externalId?: ExternalId;
   public readonly externalIdSpace?: SToken;
   public readonly openSubset?: SToken;

   constructor(basePToken: DocTypeStartPToken|PreToken) {
      Object.assign(this, basePToken);

      this.type = DOCTYPE_START_PTOKEN;
      this.open = basePToken.open; // Make sure type system knows we always assign open
   }

   checkWellFormed(ec: ErrorCollector, confVer: ConformanceVersion) {
      return checkWellFormed(this, ec, confVer);
   }

   toXToken() {
      return pTokenToXToken(this);
   }

   toSTokenArray() {
      return sTokensFromPToken(this);
   }
}

/**********************************************************************\
 parseDocTypeStart() extracts the pieces of a doctypedecl up to the start of
 an internal subset start.

 This assumes that the "<!DOCTYPE S" has already been processed,
 and those STokens are passed in through declarationStart.

 PARAM
 source: A STokenSource to read from
 declarationPToken: A declaration PToken
 deliverPToken: Callback to deliver the PToken

 SYNTAX
   [28] doctypedecl ::= '<!DOCTYPE' S Name (S ExternalID)? S?
      ('[' intSubset ']' S?)? '>'
\**********************************************************************/

function parseDocTypeStart(source: STokenSource, declarationPToken: DeclarationPToken, deliverPToken: (result: DocTypeStartPToken) => void) {
   const pToken: PreToken = Object.assign({}, declarationPToken) as any; // typeHack

   source.extractToObject('word', [ '[', '>' ], pToken, 'name'); // look for quotes?
   source.extractToObject('space', undefined, pToken, 'nameSpace');

   parseExternalId(source, [ '[', '>' ], false, (parseResult) => {
      pToken.externalId = parseResult.externalId;

      source.extractToObject('space', undefined, pToken, 'externalIdSpace');

      source.extract('match', '[', (sToken) => {
         pToken.openSubset = sToken;
         deliverPToken(new DocTypeStartPToken(pToken));
      });
   });
}

/**********************************************************************\
 checkWellFormed() does check on validity
\**********************************************************************/

function checkWellFormed(pToken: DocTypeStartPToken, ec: ErrorCollector, confVer: ConformanceVersion) {
   declaration.checkWellFormed(pToken as any, ec, confVer); // typeHack

   ec.setPos(pToken.name);
   ec.check(!pToken.name, WFEID.DOCTYPE_NO_NAME);
   misc.checkName(pToken.name, ec, confVer, WFEID.DOCTYPE_NAME_INVALID);

   checkExternalIdWellFormed(pToken.externalId, ec, confVer);

   ec.setPos(pToken.openSubset);
}

/**********************************************************************\
 pTokenToXToken() converts a PToken into an XToken.
\**********************************************************************/

function pTokenToXToken(pToken: DocTypeStartPToken) {
   return new DocTypeStartXToken(strOrBlank(pToken.name),
      pToken.externalId ? new ExternalIdX(pToken.externalId) : undefined,
      !!pToken.openSubset,
      pToken);
}

/**********************************************************************\
 sTokensFromPToken() Returns the ordered array of the component STokens
\**********************************************************************/

function sTokensFromPToken(pToken: DocTypeStartPToken): Array<SToken> {
   const builder = new STokenArrayBuilder();
   const externalTokens = getSTokens(pToken.externalId);

   builder.add(
      pToken.open,
      pToken.postOpenSpace,
      pToken.declType,
      pToken.postDeclTypeSpace,
      pToken.name,
      pToken.nameSpace,
      externalTokens,
      pToken.externalIdSpace,
      pToken.openSubset,
   );

   return builder.sTokenArray;
}

export {
   DOCTYPE_START_PTOKEN,
   DOCTYPE_START_XTOKEN,
   DocTypeStartXToken,
   DocTypeStartPToken,

   parseDocTypeStart,
};
