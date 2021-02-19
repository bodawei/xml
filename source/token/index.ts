/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */

import declaration from './bridge/baseDeclaration';

import { AttributeValuePToken, AttributeValueElement } from './common/attribute';
import unassigned from './common/unassigned';
import { parseAllUnassignedValues } from './common/unassigned';
import { UnassignedArray, UnassignedType, UnassignedValue, spaceFromSToken, wordFromSToken } from './common/unassigned';
import literalValue from './common/literalValue';
import { WordListPToken, WordListType, WordListEntryPToken, parseWordList } from './common/wordList';
import { DocTypeStartPToken } from './docTypeStart';
import { InternalSubsetStartToken } from './marker/internalSubsetStart';
import { InternalSubsetEndToken } from './marker/internalSubsetEnd';
import { ExternalSubsetStartToken } from './marker/externalSubsetStart';
import { ExternalSubsetEndToken } from './marker/externalSubsetEnd';
import { DocTypeEndPToken, DOCTYPE_END_PTOKEN } from './docTypeEnd';
import { CdataPToken } from './cdata';
import { CharDataPToken } from './charData';
import { CommentPToken } from './comment';
import { ConditionalPToken } from './conditional';
import { ConditionalClosePToken } from './conditionalClose';
import { ElidedEntityDeclarationPToken } from './ElidedEntityDeclarationPToken';
import { GeneralEntityStartPToken, GENERAL_ENTITY_START_PTOKEN } from './marker/generalEntityStart';
import { GeneralEntityEndPToken, GENERAL_ENTITY_END_PTOKEN } from './marker/generalEntityEnd';
import { ParameterEntityStartPToken, PARAMETER_ENTITY_START_PTOKEN } from './marker/parameterEntityStart';
import { SpacePToken } from './space';
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

import { EXTERNAL_ID, ExternalId, parseExternalId } from './common/externalId';

const ERROR_TYPE = 'ERROR_TYPE';

type XmlError = {
   type: 'ERROR_TYPE';
   subtype?: string;
   id: string;
   message: string;
}

type PToken =
| XmlError
   | CommentPToken
   | CdataPToken
   | CharDataPToken
   | ConditionalClosePToken
   | ConditionalPToken
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

   AttributeValueElement,
   UnassignedArray, UnassignedType,
   UnassignedValue,
   WordListPToken,
   WordListType,
   WordListEntryPToken,
   spaceFromSToken,
   wordFromSToken,
   parseExternalId,
   parseAllUnassignedValues,
   parseWordList,

   declaration,

   unassigned,
   literalValue,
   AttributeValuePToken,
   EXTERNAL_ID,
   ExternalId,
   PToken,
   XmlError,
};
