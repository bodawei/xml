/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */

import { Problem } from 'basic';
import declaration, { DeclarationPToken } from './bridge/baseDeclaration';

import { AttributePToken, AttributesPToken, AttributeValuePToken, AttributeValueElement, parseAttribute } from './common/attribute';
import { LiteralPToken, parseLiteral } from './common/literal';
import literalValue, { LiteralValuePToken, parseLiteralValue } from './common/literalValue';
import { WordListPToken, WordListType, WordListEntryPToken, parseWordList, NOTATION_PTOKEN, ENUMERATION_PTOKEN } from './common/wordList';
import { ExternalSubsetStartToken } from './marker/externalSubsetStart';
import { ExternalSubsetEndToken } from './marker/externalSubsetEnd';
import { DocTypeEndPToken } from './docTypeEnd';
import { CdataPToken } from './cdata';
import { CharDataPToken } from './charData';
import { CommentPToken } from './comment';
import { ConditionalStartPToken } from './conditionalStart';
import { ConditionalEndPToken } from './conditionalEnd';
import { ElidedEntityDeclarationPToken } from './ElidedEntityDeclarationPToken';
import { GeneralEntityStartPToken } from './marker/generalEntityStart';
import { GeneralEntityEndPToken } from './marker/generalEntityEnd';
import { ParameterEntityStartPToken } from './marker/parameterEntityStart';
import { SpacePToken } from './space';
import { DocTypeStartPToken } from './docTypeStart';
import { ElementStartPToken, ElementEmptyPToken } from './elementStart';
import { ElementEndPToken } from './elementEnd';
import { ParameterEntityEndPToken } from './marker/parameterEntityEnd';
export { EntityValueElement, EntityValuePToken } from './EntityValuePToken';

export * from './bridge/declaration';
export * from './bridge/section';

export * from './marker/externalSubsetEnd';
export * from './marker/externalSubsetStart';
export * from './marker/generalEntityEnd';
export * from './marker/generalEntityStart';
export * from './marker/parameterEntityEnd';
export * from './marker/parameterEntityStart';
export * from './ElidedEntityDeclarationPToken';

export * from './cdata';
export * from './charData';
export * from './comment';
export * from './conditionalStart';
export * from './conditionalEnd';
export * from './docTypeEnd';
export * from './docTypeStart';
export * from './elementEnd';
export * from './elementStart';
export * from './space';

// type ErrorToken = {
//    type: 'ERROR_TYPE';
//    subtype?: string;
//    id: string;
//    message: string;
// }

type PToken =
   | Problem
   | CdataPToken
   | CharDataPToken
   | CommentPToken
   | ConditionalEndPToken
   | ConditionalStartPToken
   | DeclarationPToken
   | DocTypeStartPToken
   | DocTypeEndPToken
   | ElementEmptyPToken
   | ElementEndPToken
   | ElementStartPToken
   | ElidedEntityDeclarationPToken
   | ExternalSubsetStartToken
   | ExternalSubsetEndToken
   | GeneralEntityEndPToken
   | GeneralEntityStartPToken
   | ParameterEntityEndPToken
   | ParameterEntityStartPToken
   | SpacePToken
   ;

   export * from './getFirstSToken';

export {
   NOTATION_PTOKEN,
   ENUMERATION_PTOKEN,

   DeclarationPToken,
   AttributePToken,
   AttributesPToken,
   AttributeValueElement,
   LiteralPToken,
   LiteralValuePToken,
   WordListPToken,
   WordListType,
   WordListEntryPToken,
   parseAttribute,
   parseLiteral,
   parseLiteralValue,
   parseWordList,

   declaration,

   literalValue,
   AttributeValuePToken,
   PToken,
};
