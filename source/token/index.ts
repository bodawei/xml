/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */

import declaration from './bridge/baseDeclaration';

import attListDeclaration, { AttDefPToken, AttListPToken, ATTLISTDECL_PTOKEN_TYPE, parseAttListDeclaration } from './attListDeclaration';
import elementDeclaration, { ElementDeclarationPToken, ELEMENT_DECLARATION_PTOKEN } from './elementDeclaration';

import { AttributeValuePToken, AttributeValueElement } from './common/attribute';
import unassigned from './common/unassigned';
import { parseAllUnassignedValues } from './common/unassigned';
import { UnassignedArray, UnassignedType, UnassignedValue, spaceFromSToken, wordFromSToken } from './common/unassigned';
import literalValue from './common/literalValue';
import { NamePToken, NameListPToken, ContentParticlePToken } from './contentspec/nameList';
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
import { ProcessingInstructionPToken } from './processingInstruction';
import { CharRefPToken } from './charRef';
import { ElidedEntityDeclarationPToken } from './ElidedEntityDeclarationPToken';
import { TextPToken } from './text';
import { GeneralEntityReferencePToken } from './generalEntityReference';
import { ParameterEntityReferencePToken } from './parameterEntityReference';
import { GeneralEntityStartPToken, GENERAL_ENTITY_START_PTOKEN } from './marker/generalEntityStart';
import { GeneralEntityEndPToken, GENERAL_ENTITY_END_PTOKEN } from './marker/generalEntityEnd';
import { NotationDeclarationPToken } from './notationDeclaration';
import { GeneralEntityDeclarationPToken } from './generalEntityDeclaration';
import { ParameterEntityDeclarationPToken } from './parameterEntityDeclaration';
import { ParameterEntityStartPToken, PARAMETER_ENTITY_START_PTOKEN } from './marker/parameterEntityStart';
import { SpacePToken } from './space';
import { ElementStartPToken, ElementEmptyPToken } from './elementStart';
import { ElementEndPToken } from './elementEnd';
import { SToken } from 'sToken';
import { ParameterEntityEndPToken } from './marker/parameterEntityEnd';
export * from './entityDeclaration';

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
export * from './charRef';
export * from './comment';
export * from './conditional';
export * from './conditionalClose';
export * from './docTypeEnd';
export * from './docTypeStart';
export * from './elementEnd';
export * from './elementStart';
export * from './generalEntityDeclaration';
export * from './generalEntityReference';
export * from './notationDeclaration';
export * from './parameterEntityDeclaration';
export * from './parameterEntityReference';
export * from './processingInstruction';
export * from './space';
export * from './text';

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
   | AttListPToken
   | CommentPToken
   | CdataPToken
   | CharDataPToken
   | CharRefPToken
   | ConditionalClosePToken
   | ConditionalPToken
   | DocTypeStartPToken
   | DocTypeEndPToken
   | ElementDeclarationPToken
   | ElementEmptyPToken
   | ElementEndPToken
   | ElementStartPToken
   | ElidedEntityDeclarationPToken
   | ExternalSubsetStartToken
   | ExternalSubsetEndToken
   | GeneralEntityDeclarationPToken
   | GeneralEntityEndPToken
   | GeneralEntityReferencePToken
   | GeneralEntityStartPToken
   | InternalSubsetStartToken
   | InternalSubsetEndToken
   | NotationDeclarationPToken
   | ParameterEntityDeclarationPToken
   | ParameterEntityEndPToken
   | ParameterEntityReferencePToken
   | ParameterEntityStartPToken
   | ProcessingInstructionPToken
   | SpacePToken
   | TextPToken
   ;

import { ParseValue } from 'pToken';

function getFirstSToken(pToken: ParseValue): SToken {
   let startContext;

   if (pToken.type === DOCTYPE_END_PTOKEN) {
      startContext = pToken.closeSubset; // eh?  And what if there is no close?
   } else if (pToken.type === PARAMETER_ENTITY_START_PTOKEN) {
      startContext = pToken.referencePToken.open;
   } else if (pToken.type === GENERAL_ENTITY_START_PTOKEN || pToken.type === GENERAL_ENTITY_END_PTOKEN) {
      startContext = pToken.referencePToken.open;
   } else {
      startContext = (pToken as any).open || (pToken as any).text;
   }

   return startContext;
}

export {
   ATTLISTDECL_PTOKEN_TYPE,
   ELEMENT_DECLARATION_PTOKEN,
   ERROR_TYPE,

   AttListPToken,
   AttDefPToken,
   AttributeValueElement,
   ElementDeclarationPToken,
   ContentParticlePToken,
   NamePToken,
   NameListPToken,
   UnassignedArray, UnassignedType,
   UnassignedValue,
   WordListPToken,
   WordListType,
   WordListEntryPToken,
   spaceFromSToken,
   wordFromSToken,
   parseExternalId,
   parseAllUnassignedValues,
   parseAttListDeclaration,
   parseWordList,

   declaration,

   attListDeclaration,
   elementDeclaration,

   unassigned,
   literalValue,
   AttributeValuePToken,
   EXTERNAL_ID,
   ExternalId,
   PToken,
   XmlError,

   getFirstSToken,
};
