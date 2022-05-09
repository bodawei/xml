import { XmlErrorToken, EntityId, ConformanceVersion } from 'basic';

import { PToken as PTokenClassic } from 'token';
import { ParameterEntityEndPToken, ParameterEntityStartPToken } from 'token';

import { TextPToken } from './token/text';
import { ParameterEntityReferencePToken } from './token/parameterEntityReference';
import { AttListDeclarationPToken } from './token/attListDeclaration';
import { CharRefPToken } from './token/charRef';
import { ElementDeclarationPToken } from './token/elementDeclaration';
import { GeneralEntityDeclarationPToken } from './token/generalEntityDeclaration';
import { GeneralEntityReferencePToken } from './token/generalEntityReference';
import { NotationDeclarationPToken } from './token/notationDeclaration';
import { ParameterEntityDeclarationPToken } from './token/parameterEntityDeclaration';
import { ProcessingInstructionPToken } from './token/processingInstruction';
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
   | XmlErrorToken
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
