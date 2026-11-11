import { Problem, EntityId, ConformanceVersion } from 'basic';
import { PToken as PTokenClassic } from 'token';
import { ParameterEntityEndPToken, ParameterEntityStartPToken } from 'token';

import { AttListDeclarationPToken } from './token/attListDeclaration';
import { CharRefPToken } from './token/charRef';
import { ElementDeclarationPToken } from './token/elementDeclaration';
import { GeneralEntityDeclarationPToken } from './token/generalEntityDeclaration';
import { GeneralEntityReferencePToken } from './token/generalEntityReference';
import { NotationDeclarationPToken } from './token/notationDeclaration';
import { ParameterEntityDeclarationPToken } from './token/parameterEntityDeclaration';
import { ParameterEntityReferencePToken } from './token/parameterEntityReference';
import { ProcessingInstructionPToken } from './token/processingInstruction';
import { TextPToken } from './token/text';
import { TextDeclarationPToken } from './token/textDeclaration';
import { XmlDeclarationPToken } from './token/xmlDeclaration';

type UnexpandedMarkupToken = TextPToken | ParameterEntityReferencePToken;
type ExpandedMarkupToken =
   | TextPToken
   | ParameterEntityReferencePToken
   | ParameterEntityStartPToken
   | ParameterEntityEndPToken;

interface UnexpandedMarkupDetails {
   tokens: ReadonlyArray<UnexpandedMarkupToken>;
   propName: string;
}

type PToken = PTokenClassic;
type ParseToken =
   | Problem
   | EntityId
   | ConformanceVersion
   | PToken
   | CharRefPToken
   | AttListDeclarationPToken
   | ElementDeclarationPToken
   | GeneralEntityDeclarationPToken
   | GeneralEntityReferencePToken
   | NotationDeclarationPToken
   | ParameterEntityDeclarationPToken
   | ParameterEntityReferencePToken
   | ProcessingInstructionPToken
   | TextDeclarationPToken
   | TextPToken
   | XmlDeclarationPToken;

enum ParseType {
   DOCUMENT,
   EXTERNAL_SUBSET,
   PARAMETER_ENTITY,
   GENERAL_ENTITY,
}

export {
   ExpandedMarkupToken,
   ParseToken,
   ParseType,
   UnexpandedMarkupDetails,
   UnexpandedMarkupToken,
};
