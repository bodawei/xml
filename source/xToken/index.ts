/* Copyright ® 2020-2021 by 柏大衛. All rights reserved. */

export { AttributeX } from './common/attributeX';
export {
   ContentModelX,
   ContentNameX,
   CpRepeat,
   CpType,
   isContentNameX,
} from './common/contentModelX';
export { ExntityValueX } from './common/entityValueX';
export { ExternalIdX } from './common/externalIdX';
export { LiteralValueX } from './common/literalValueX';

export { GENERAL_ENTITY_END_XTOKEN, GeneralEntityEndXToken } from './marker/generalEntityEndXToken';
export {
   GENERAL_ENTITY_START_XTOKEN,
   GeneralEntityStartXToken,
} from './marker/generalEntityStartXToken';
export {
   PARAMETER_ENTITY_END_XTOKEN,
   ParameterEntityEndXToken,
} from './marker/parameterEntityEndXToken';
export {
   PARAMETER_ENTITY_START_XTOKEN,
   ParameterEntityStartXToken,
} from './marker/parameterEntityStartXToken';

export {
   ATTLIST_DECLARATION_XTOKEN,
   AttDefinitionType,
   AttDefaultType,
   AttListDeclarationXToken,
   AttDefinitionXToken,
} from './token/attListDeclarationXToken';
export { CHARDATA_XTOKEN, CharDataXToken } from './token/charDataXToken';
export { CHARREF_XTOKEN, CharRefXToken } from './token/charRefXToken';
export { CDATA_SECTION_XTOKEN, CdataXToken } from './token/cdataXToken';
export { COMMENT_XTOKEN, CommentXToken } from './token/commentXToken';
export { CONDITIONAL_SECTION_END_XTOKEN, ConditionalEndXToken } from './token/conditionalEndXToken';
export {
   CONDITIONAL_SECTION_START_XTOKEN,
   ConditionalStartXToken,
} from './token/conditionalStartXToken';
export { DOCTYPE_END_XTOKEN, DocTypeEndXToken } from './token/docTypeEndXToken';
export { DOCTYPE_START_XTOKEN, DocTypeStartXToken } from './token/docTypeStartXToken';
export {
   ELEMENT_DECLARATION_XTOKEN,
   ContentSpecType,
   ElementDeclarationXToken,
} from './token/elementDeclarationXToken';
export { ELEMENT_EMPTY_XTOKEN, ElementEmptyXToken } from './token/elementEmptyXToken';
export { ELEMENT_END_XTOKEN, ElementEndXToken } from './token/elementEndXToken';
export { ELEMENT_START_XTOKEN, ElementStartXToken } from './token/elementStartXToken';
export {
   GENERAL_ENTITY_DECLARATION_XTOKEN,
   GeneralEntityDeclarationXToken,
} from './token/generalEntityDeclarationXToken';
export {
   GENERAL_ENTITY_REFERENCE_XTOKEN,
   GeneralEntityReferenceXToken,
} from './token/generalEntityReferenceXToken';

export {
   NOTATION_DECLARATION_XTOKEN,
   NotationDeclarationXToken,
} from './token/notationDeclarationXToken';
export {
   PARAMETER_ENTITY_DECLARATION_XTOKEN,
   ParameterEntityDeclarationXToken,
} from './token/parameterEntityDeclarationXToken';
export {
   PARAMETER_ENTITY_REFERENCE_XTOKEN,
   ParameterEntityReferenceXToken,
} from './token/parameterEntityReferenceXToken';
export {
   PROCESSING_INSTRUCTION_XTOKEN,
   ProcessingInstructionXToken,
} from './token/processingInstructionXToken';
export { SPACE_XTOKEN, SpaceXToken } from './token/spaceXtoken';
export { TEXT_XTOKEN, TextXToken, isTextXToken } from './token/textXToken';
export { TEXTDECL_XTOKEN, TextDeclarationXToken } from './token/textDeclarationXToken';
export {
   UNKNOWN_DECLARATION_XTOKEN,
   UnknownDeclarationXToken,
} from './token/unknownDeclarationXToken';
export { XMLDECL_XTOKEN, XmlDeclarationXToken } from './token/xmlDeclarationXToken';

export { XToken } from './types';

export { convertPTokenToXToken } from './convertPTokenToXToken';
