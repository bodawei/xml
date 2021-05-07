/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */

import declaration, { DeclarationPToken } from './bridge/baseDeclaration';

import { AttributePToken, AttributeValuePToken, AttributeValueElement, parseAttribute } from './common/attribute';
import { LiteralPToken, parseLiteral } from './common/literal';
import literalValue, { LiteralValuePToken, parseLiteralValue } from './common/literalValue';
import { WordListPToken, WordListType, WordListEntryPToken, parseWordList } from './common/wordList';
import { InternalSubsetStartToken } from './marker/internalSubsetStart';
import { InternalSubsetEndToken } from './marker/internalSubsetEnd';
import { ExternalSubsetStartToken } from './marker/externalSubsetStart';
import { ExternalSubsetEndToken } from './marker/externalSubsetEnd';
import { DocTypeEndPToken } from './docTypeEnd';
import { CdataPToken } from './cdata';
import { CharDataPToken } from './charData';
import { CommentPToken } from './comment';
import { ConditionalPToken } from './conditional';
import { ConditionalClosePToken } from './conditionalClose';
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
export * from './marker/internalSubsetEnd';
export * from './marker/internalSubsetStart';
export * from './marker/parameterEntityEnd';
export * from './marker/parameterEntityStart';
export * from './ElidedEntityDeclarationPToken';

export * from './cdata';
export * from './charData';
export * from './comment';
export * from './conditional';
export * from './conditionalClose';
export * from './docTypeEnd';
export * from './docTypeStart';
export * from './elementEnd';
export * from './elementStart';
export * from './space';

const ERROR_TYPE = 'ERROR_TYPE';

type ErrorToken = {
   type: 'ERROR_TYPE';
   subtype?: string;
   id: string;
   message: string;
}

type PToken =
   | ErrorToken
   | CdataPToken
   | CharDataPToken
   | CommentPToken
   | ConditionalClosePToken
   | ConditionalPToken
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
   | InternalSubsetStartToken
   | InternalSubsetEndToken
   | ParameterEntityEndPToken
   | ParameterEntityStartPToken
   | SpacePToken
   ;

   export * from './getFirstSToken';

export {
   ERROR_TYPE,

   DeclarationPToken,
   AttributePToken,
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
   ErrorToken,
};
