/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { SToken, STokenSource } from 'basic';

import { ExternalIdP, parseExternalId } from '../pToken/common/externalId';
import { DeclarationPToken } from './bridge/baseDeclaration';

const DOCTYPE_START_PTOKEN = 'DOCTYPE_START_PTOKEN';

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

type PreToken = { open: SToken; [other: string]: any };

class DocTypeStartPToken {
   public readonly type: typeof DOCTYPE_START_PTOKEN = DOCTYPE_START_PTOKEN;
   public readonly open: SToken;
   public readonly postOpenSpace?: SToken;
   public readonly declType?: SToken;
   public readonly postDeclTypeSpace?: SToken;
   public readonly name?: SToken;
   public readonly nameSpace?: SToken;
   public readonly externalId?: ExternalIdP;
   public readonly externalIdSpace?: SToken;
   public readonly openSubset?: SToken;

   constructor(basePToken: DocTypeStartPToken | PreToken) {
      Object.assign(this, basePToken);

      this.type = DOCTYPE_START_PTOKEN;
      this.open = basePToken.open; // Make sure type system knows we always assign open
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

function parseDocTypeStart(
   source: STokenSource,
   declarationPToken: DeclarationPToken,
   deliverPToken: (result: DocTypeStartPToken) => void,
) {
   const pToken: PreToken = Object.assign({}, declarationPToken) as any; // typeHack

   source.extractToObject('word', ['[', '>'], pToken, 'name'); // look for quotes?
   source.extractToObject('space', undefined, pToken, 'nameSpace');

   parseExternalId(source, ['[', '>'], (parseResult) => {
      pToken.externalId = parseResult?.externalId;

      source.extractToObject('space', undefined, pToken, 'externalIdSpace');

      source.extract('match', '[', (sToken) => {
         pToken.openSubset = sToken;
         deliverPToken(new DocTypeStartPToken(pToken));
      });
   });
}

export { DOCTYPE_START_PTOKEN, DocTypeStartPToken, parseDocTypeStart };
