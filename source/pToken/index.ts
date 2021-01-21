/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { BaseToken } from 'basic';
import { PToken as PTokenClassic } from 'token';

import { InstructionStart } from './bridge/instruction';
import { AttListDeclarationPToken } from './token/attListDeclaration';
import { ElementDeclarationPToken } from './token/elementDeclaration';
import { GeneralEntityDeclarationPToken } from './token/generalEntityDeclaration';
import { NotationDeclarationPToken } from './token/notationDeclaration';
import { ParameterEntityDeclarationPToken } from './token/parameterEntityDeclaration';
import { ProcessingInstructionPToken } from './token/processingInstruction';
import { TextPToken } from './token/text';
import { TextDeclarationPToken } from './token/textDeclaration';
import { XmlDeclarationPToken } from './token/xmlDeclaration';
import { pTokenArrayToString } from './util/pTokenArrayToString';

export * from './bridge/instruction';
export * from './bridge/entityDeclaration';
export * from './common/contentModel';
export * from './common/externalId';
export * from './common/fieldedInstruction';
export * from './token/attListDeclaration';
export * from './token/elementDeclaration';
export * from './token/generalEntityDeclaration';
export * from './token/notationDeclaration';
export * from './token/parameterEntityDeclaration';
export * from './token/processingInstruction';
export * from './token/textDeclaration';
export * from './token/text';
export * from './token/xmlDeclaration';
export * from './util/externalIdToEntityId';
export * from './types';

type PToken = PTokenClassic;
type ParseToken =
   | BaseToken
   | PToken
   | AttListDeclarationPToken
   | ElementDeclarationPToken
   | GeneralEntityDeclarationPToken
   | NotationDeclarationPToken
   | ParameterEntityDeclarationPToken
   | ProcessingInstructionPToken
   | TextDeclarationPToken
   | TextPToken
   | XmlDeclarationPToken;

enum ContextType {
   DOCUMENT,
   EXTERNAL_SUBSET,
   PARAMETER_ENTITY,
   GENERAL_ENTITY,
}

export { InstructionStart, ContextType, ParseToken, PToken, pTokenArrayToString };
